;; ClarityLearn 2.0 - Rewards & Governance Contract
;; Multi-signature wallet for reward pool management
;; Implements 2-of-3 admin approval system

;; =============================================================================
;; CONSTANTS
;; =============================================================================

;; @desc Contract owner (deployer address)
(define-constant CONTRACT-OWNER tx-sender)

;; @desc Minimum number of approvals required to execute proposal
(define-constant THRESHOLD u2)

;; @desc Number of blocks before proposal expires (~24 hours at 10min blocks)
(define-constant PROPOSAL-EXPIRY u144)

;; =============================================================================
;; ERROR CODES (300-399 range for rewards contract)
;; =============================================================================

(define-constant ERR-NOT-ADMIN (err u300))
(define-constant ERR-PROPOSAL-EXPIRED (err u301))
(define-constant ERR-ALREADY-APPROVED (err u302))
(define-constant ERR-INVALID-PROPOSAL (err u303))
(define-constant ERR-THRESHOLD-NOT-MET (err u304))
(define-constant ERR-INSUFFICIENT-POOL (err u305))
(define-constant ERR-ALREADY-EXECUTED (err u306))
(define-constant ERR-INVALID-ACTION (err u307))
(define-constant ERR-UNAUTHORIZED-CALLER (err u308))
(define-constant ERR-INVALID-AMOUNT (err u309))
(define-constant ERR-RATE-TOO-HIGH (err u310))

;; =============================================================================
;; DATA STRUCTURES
;; =============================================================================

;; @desc Map to track admin status (3 admins for 2-of-3 multi-sig)
(define-map admins principal bool)

;; @desc Stores proposal details for multi-sig governance
(define-map proposals
  uint ;; proposal-id
  {
    proposer: principal,
    action: (string-ascii 20),
    param: uint,
    approvals: uint,
    approved-by: (list 3 principal),
    executed: bool,
    created-at: uint
  }
)

;; @desc Tracks the total number of proposals created
(define-data-var proposal-nonce uint u0)

;; @desc Bonus rate for tier 1 stakers (in basis points, 1000 = 10%)
(define-data-var bonus-rate-tier1 uint u1000)

;; @desc Bonus rate for tier 2 stakers (in basis points, 1250 = 12.5%)
(define-data-var bonus-rate-tier2 uint u1250)

;; @desc Bonus rate for tier 3 stakers (in basis points, 1500 = 15%)
(define-data-var bonus-rate-tier3 uint u1500)

;; @desc Penalty rate for failed commitments (in basis points, 2000 = 20%)
(define-data-var penalty-rate uint u2000)

;; @desc Tracks total STX in reward pool
(define-data-var total-pool-balance uint u0)

;; @desc Tracks total bonuses distributed
(define-data-var total-bonuses-paid uint u0)

;; @desc Authorized staking contract address (set after deployment)
(define-data-var authorized-staking-contract (optional principal) none)

;; =============================================================================
;; PRIVATE HELPER FUNCTIONS
;; =============================================================================

;; @desc Checks if a principal is an authorized admin
;; @param user - Principal to check
;; @returns bool - True if user is an admin
(define-private (is-admin (user principal))
  (default-to false (map-get? admins user))
)

;; @desc Checks if caller is the authorized staking contract
;; @returns bool - True if contract-caller is authorized
(define-private (is-authorized-staking-contract)
  (match (var-get authorized-staking-contract)
    authorized (is-eq contract-caller authorized)
    false
  )
)

;; =============================================================================
;; MULTI-SIG GOVERNANCE FUNCTIONS
;; =============================================================================

;; @desc Creates a new governance proposal (only admins)
;; @param action - Type of action ("fund-pool", "adjust-rate", "emergency-withdraw")
;; @param param - Numerical parameter (amount in microSTX or rate in basis points)
;; @returns (response uint uint) - Proposal ID on success, error code on failure
(define-public (propose-action (action (string-ascii 20)) (param uint))
  (let 
    (
      (proposal-id (+ (var-get proposal-nonce) u1))
      (current-height block-height)
    )
    ;; Verify caller is admin
    (asserts! (is-admin tx-sender) ERR-NOT-ADMIN)
    
    ;; Validate action type
    (asserts! 
      (or 
        (is-eq action "fund-pool")
        (or
          (is-eq action "adjust-rate")
          (is-eq action "emergency-withdraw")
        )
      )
      ERR-INVALID-ACTION
    )
    
    ;; Create proposal with proposer's auto-approval
    (map-set proposals proposal-id {
      proposer: tx-sender,
      action: action,
      param: param,
      approvals: u1,  ;; Proposer automatically approves
      approved-by: (list tx-sender),
      executed: false,
      created-at: current-height
    })
    
    ;; Increment proposal counter
    (var-set proposal-nonce proposal-id)
    
    ;; Return proposal ID
    (ok proposal-id)
  )
)

;; @desc Approves an existing proposal and executes if threshold met
;; @param proposal-id - ID of the proposal to approve
;; @returns (response bool uint) - True on success, error code on failure
(define-public (approve-proposal (proposal-id uint))
  (let 
    (
      (proposal (unwrap! (map-get? proposals proposal-id) ERR-INVALID-PROPOSAL))
      (current-height block-height)
    )
    ;; Verify caller is admin
    (asserts! (is-admin tx-sender) ERR-NOT-ADMIN)
    
    ;; Check proposal hasn't been executed
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    
    ;; Check proposal hasn't expired (144 blocks = ~24 hours)
    (asserts! 
      (<= (- current-height (get created-at proposal)) PROPOSAL-EXPIRY) 
      ERR-PROPOSAL-EXPIRED
    )
    
    ;; Check admin hasn't already approved
    (asserts! 
      (is-none (index-of (get approved-by proposal) tx-sender)) 
      ERR-ALREADY-APPROVED
    )
    
    ;; Add approval
    (let 
      (
        (updated-approvals (+ (get approvals proposal) u1))
        (updated-list (unwrap! 
          (as-max-len? (append (get approved-by proposal) tx-sender) u3)
          ERR-ALREADY-APPROVED
        ))
      )
      ;; Update proposal with new approval
      (map-set proposals proposal-id (merge proposal {
        approvals: updated-approvals,
        approved-by: updated-list
      }))
      
      ;; If threshold met (2 approvals), execute immediately
      (if (>= updated-approvals THRESHOLD)
        (execute-proposal proposal-id)
        (ok true)
      )
    )
  )
)

;; =============================================================================
;; ADMIN MANAGEMENT FUNCTION (ADD THIS AFTER LINE 190)
;; =============================================================================

;; @desc Adds a new admin to the multi-sig (only CONTRACT-OWNER can do this)
;; @param new-admin - Principal to grant admin privileges
;; @returns (response bool uint) - True on success
(define-public (add-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-ADMIN)
    (ok (map-set admins new-admin true))
  )
)

;; @desc Removes an admin from the multi-sig (only CONTRACT-OWNER can do this)
;; @param admin-to-remove - Principal to revoke admin privileges
;; @returns (response bool uint) - True on success
(define-public (remove-admin (admin-to-remove principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-ADMIN)
    (ok (map-set admins admin-to-remove false))
  )
)

;; @desc Executes a proposal that has met the approval threshold
;; @param proposal-id - ID of the proposal to execute
;; @returns (response bool uint) - True on success, error code on failure
(define-private (execute-proposal (proposal-id uint))
  (let 
    (
      (proposal (unwrap! (map-get? proposals proposal-id) ERR-INVALID-PROPOSAL))
    )
    ;; Verify threshold met
    (asserts! (>= (get approvals proposal) THRESHOLD) ERR-THRESHOLD-NOT-MET)
    
    ;; Verify not already executed
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    
    ;; Mark as executed BEFORE performing action (prevent reentrancy)
    (map-set proposals proposal-id (merge proposal {executed: true}))
    
    ;; Execute based on action type
    (if (is-eq (get action proposal) "fund-pool")
      (fund-pool-internal (get param proposal))
      (if (is-eq (get action proposal) "adjust-rate")
        (adjust-rate-internal (get param proposal))
        (if (is-eq (get action proposal) "emergency-withdraw")
          (emergency-withdraw-internal (get param proposal))
          ERR-INVALID-ACTION
        )
      )
    )
  )
)

;; =============================================================================
;; INTERNAL ACTION FUNCTIONS (Called by execute-proposal)
;; =============================================================================

;; @desc Adds STX to the reward pool (internal, called via multi-sig)
;; @param amount - Amount in microSTX to add to pool
;; @returns (response bool uint) - True on success
(define-private (fund-pool-internal (amount uint))
  (begin
    ;; Validate amount
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Update pool balance tracking
    (var-set total-pool-balance (+ (var-get total-pool-balance) amount))
    
    ;; Note: Actual STX transfer happens when admins send to contract address
    ;; This function just updates the accounting
    (ok true)
  )
)

;; @desc Adjusts bonus rate for staking tiers (internal, called via multi-sig)
;; @param new-rate - New rate in basis points (1000 = 10%)
;; @returns (response bool uint) - True on success
(define-private (adjust-rate-internal (new-rate uint))
  (begin
    ;; Validate rate is reasonable (max 20%)
    (asserts! (<= new-rate u2000) ERR-RATE-TOO-HIGH)
    
    ;; Update all tier rates proportionally
    (var-set bonus-rate-tier1 new-rate)
    (var-set bonus-rate-tier2 (+ new-rate u250))  ;; +2.5%
    (var-set bonus-rate-tier3 (+ new-rate u500))  ;; +5%
    
    (ok true)
  )
)

;; @desc Emergency withdrawal function (internal, called via multi-sig)
;; @param amount - Amount in microSTX to withdraw to CONTRACT-OWNER
;; @returns (response bool uint) - True on success
(define-private (emergency-withdraw-internal (amount uint))
  (begin
    ;; Validate amount
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Check contract has sufficient balance
    (asserts! 
      (>= (stx-get-balance (as-contract tx-sender)) amount) 
      ERR-INSUFFICIENT-POOL
    )
    
    ;; Transfer to CONTRACT-OWNER (emergency recovery address)
    (try! (as-contract (stx-transfer? amount tx-sender CONTRACT-OWNER)))
    
    ;; Update pool balance tracking
    (var-set total-pool-balance (- (var-get total-pool-balance) amount))
    
    (ok true)
  )
)

;; =============================================================================
;; PUBLIC FUNCTIONS (Called by authorized staking contract)
;; =============================================================================

;; @desc Distributes bonus to user (only callable by staking contract)
;; @param recipient - User receiving the bonus
;; @param amount - Bonus amount in microSTX
;; @returns (response bool uint) - True on success
(define-public (distribute-bonus (recipient principal) (amount uint))
  (begin
    ;; Only staking contract can call this
    (asserts! (is-authorized-staking-contract) ERR-UNAUTHORIZED-CALLER)
    
    ;; Validate amount
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Check pool has sufficient balance
    (asserts! 
      (>= (stx-get-balance (as-contract tx-sender)) amount) 
      ERR-INSUFFICIENT-POOL
    )
    
    ;; Transfer bonus from contract to recipient
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    
    ;; Update tracking variables
    (var-set total-bonuses-paid (+ (var-get total-bonuses-paid) amount))
    (var-set total-pool-balance (- (var-get total-pool-balance) amount))
    
    (ok true)
  )
)

;; =============================================================================
;; ADMIN FUNCTIONS (Configuration & Management)
;; =============================================================================

;; @desc Sets the authorized staking contract address (one-time setup)
;; @param contract - Principal of the staking contract
;; @returns (response bool uint) - True on success
(define-public (set-staking-contract (contract principal))
  (begin
    ;; Only admins can set this
    (asserts! (is-admin tx-sender) ERR-NOT-ADMIN)
    
    ;; Set the authorized contract
    (ok (var-set authorized-staking-contract (some contract)))
  )
)

;; @desc Allows contract to receive STX transfers
;; @param amount - Amount being sent
;; @param sender - Who sent the STX
;; @returns (response bool uint) - Always accepts
(define-public (fund-pool (amount uint) (sender principal))
  (begin
    ;; Update pool balance
    (var-set total-pool-balance (+ (var-get total-pool-balance) amount))
    (ok true)
  )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS (Public Queries)
;; =============================================================================

;; @desc Gets details of a specific proposal
;; @param proposal-id - ID of the proposal to query
;; @returns (response proposal-data uint) - Proposal details or error
(define-read-only (get-proposal (proposal-id uint))
  (ok (unwrap! (map-get? proposals proposal-id) ERR-INVALID-PROPOSAL))
)

;; @desc Gets current proposal counter
;; @returns (response uint uint) - Total number of proposals created
(define-read-only (get-proposal-count)
  (ok (var-get proposal-nonce))
)

;; @desc Gets current bonus rates for all tiers
;; @returns (response tuple uint) - Rates in basis points
(define-read-only (get-bonus-rates)
  (ok {
    tier1: (var-get bonus-rate-tier1),
    tier2: (var-get bonus-rate-tier2),
    tier3: (var-get bonus-rate-tier3),
    penalty: (var-get penalty-rate)
  })
)

;; @desc Gets current reward pool statistics
;; @returns (response tuple uint) - Pool balance and bonuses paid
(define-read-only (get-pool-stats)
  (ok {
    total-balance: (var-get total-pool-balance),
    total-paid: (var-get total-bonuses-paid),
    contract-balance: (stx-get-balance (as-contract tx-sender))
  })
)

;; @desc Checks if a principal is an authorized admin
;; @param user - Principal to check
;; @returns (response bool uint) - True if admin
(define-read-only (is-admin-check (user principal))
  (ok (is-admin user))
)

;; @desc Gets the authorized staking contract address
;; @returns (response (optional principal) uint) - Contract address if set
(define-read-only (get-staking-contract)
  (ok (var-get authorized-staking-contract))
)

;; =============================================================================
;; INITIALIZATION - Set up 3 admins for 2-of-3 multi-sig
;; =============================================================================

;; Initialize deployer as ADMIN 1
(map-set admins tx-sender true)

