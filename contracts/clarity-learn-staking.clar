;; ClarityLearn 2.0 - Staking Contract (FIXED)
;; Week 2 - Day 1: Foundation with exact tier math
;; Implements time-locked learning commitments with rewards/penalties

;; ======================
;; CONSTANTS - Staking Tiers
;; ======================

;; Tier amounts in microSTX (1 STX = 1,000,000 microSTX)
(define-constant TIER-BASIC u1000000)        ;; 1 STX
(define-constant TIER-COMMITTED u5000000)    ;; 5 STX
(define-constant TIER-SERIOUS u10000000)     ;; 10 STX

;; Time-lock durations in Stacks blocks (144 blocks approx 1 day)
(define-constant WEEKLY-BLOCKS u1008)    ;; approx 7 days
(define-constant MONTHLY-BLOCKS u4320)   ;; approx 30 days

;; Bonus percentages (multiplied by 100 for precision)
(define-constant BONUS-BASIC u1000)      ;; 10% for 1 STX tier
(define-constant BONUS-COMMITTED u1200)  ;; 12% for 5 STX tier
(define-constant BONUS-SERIOUS u1500)    ;; 15% for 10 STX tier

;; Penalty percentages (multiplied by 100 for precision)
(define-constant PENALTY-BASIC u3000)      ;; 30% for 1 STX tier
(define-constant PENALTY-COMMITTED u2500)  ;; 25% for 5 STX tier
(define-constant PENALTY-SERIOUS u2000)    ;; 20% for 10 STX tier

;; Early withdrawal penalty (applies to all tiers)
(define-constant EARLY-WITHDRAWAL-PENALTY u2000)  ;; 20%

;; Goal targets
(define-constant WEEKLY-GOAL-BASIC u7)      ;; 7 terms for 1 STX
(define-constant WEEKLY-GOAL-COMMITTED u15) ;; 15 terms for 5 STX
(define-constant MONTHLY-GOAL-SERIOUS u30)  ;; 30 terms for 10 STX

;; Percentage thresholds
(define-constant FULL-COMPLETION u100)   ;; 100% completion
(define-constant PARTIAL-THRESHOLD u50)  ;; 50% minimum for partial rewards

;; ======================
;; ERROR CODES
;; ======================

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-INVALID-GOAL-TYPE (err u102))
(define-constant ERR-STAKE-NOT-FOUND (err u103))
(define-constant ERR-STAKE-ALREADY-COMPLETED (err u104))
(define-constant ERR-TIME-LOCK-NOT-EXPIRED (err u105))
(define-constant ERR-ALREADY-CLAIMED (err u106))
(define-constant ERR-INVALID-TERM-ID (err u107))
(define-constant ERR-TOO-MANY-STAKES (err u108))
(define-constant ERR-INSUFFICIENT-BALANCE (err u109))  ;; NEW ERROR CODE

;; ======================
;; DATA STRUCTURES
;; ======================

;; Counter for generating unique stake IDs
(define-data-var stake-id-counter uint u0)

;; Track total bonus pool (penalties collected)
(define-data-var bonus-pool uint u0)

;; Main stake data map
(define-map stakes
  { stake-id: uint }
  {
    user: principal,
    amount: uint,
    goal-type: (string-ascii 10),
    start-block: uint,
    end-block: uint,
    terms-learned: uint,
    goal-target: uint,
    status: (string-ascii 10),
    claimed: bool
  }
)

;; Track which terms a user has learned for a specific stake
(define-map stake-terms-learned
  { stake-id: uint, term-id: uint }
  { learned: bool }
)

;; User's active stakes (for quick lookup)
(define-map user-active-stakes
  { user: principal }
  { stake-ids: (list 10 uint) }
)

;; ======================
;; HELPER FUNCTIONS (Read-Only)
;; ======================

;; Get next stake ID
(define-read-only (get-next-stake-id)
  (var-get stake-id-counter)
)

;; Get stake details
(define-read-only (get-stake (stake-id uint))
  (map-get? stakes { stake-id: stake-id })
)

;; Check if a term has been learned for a stake
(define-read-only (has-learned-term (stake-id uint) (term-id uint))
  (default-to 
    false 
    (get learned (map-get? stake-terms-learned { stake-id: stake-id, term-id: term-id }))
  )
)

;; Get user's active stakes
(define-read-only (get-user-stakes (user principal))
  (default-to 
    (list) 
    (get stake-ids (map-get? user-active-stakes { user: user }))
  )
)

;; Get bonus pool balance
(define-read-only (get-bonus-pool)
  (var-get bonus-pool)
)

;; ======================
;; VALIDATION HELPERS
;; ======================

;; Validate stake amount matches a tier
(define-private (is-valid-tier (amount uint))
  (or 
    (is-eq amount TIER-BASIC)
    (or 
      (is-eq amount TIER-COMMITTED)
      (is-eq amount TIER-SERIOUS)
    )
  )
)

;; Validate goal type
(define-private (is-valid-goal-type (goal-type (string-ascii 10)))
  (or 
    (is-eq goal-type "weekly")
    (is-eq goal-type "monthly")
  )
)

;; Get goal target based on tier and goal type
(define-private (get-goal-target (amount uint) (goal-type (string-ascii 10)))
  (if (is-eq goal-type "weekly")
    (if (is-eq amount TIER-BASIC)
      WEEKLY-GOAL-BASIC
      (if (is-eq amount TIER-COMMITTED)
        WEEKLY-GOAL-COMMITTED
        u0
      )
    )
    (if (is-eq goal-type "monthly")
      (if (is-eq amount TIER-SERIOUS)
        MONTHLY-GOAL-SERIOUS
        u0
      )
      u0
    )
  )
)

;; Get lock duration based on goal type
(define-private (get-lock-duration (goal-type (string-ascii 10)))
  (if (is-eq goal-type "weekly")
    WEEKLY-BLOCKS
    MONTHLY-BLOCKS
  )
)

;; ======================
;; CALCULATION HELPERS
;; ======================

;; Get bonus percentage for a tier
(define-private (get-bonus-rate (amount uint))
  (if (is-eq amount TIER-BASIC)
    BONUS-BASIC
    (if (is-eq amount TIER-COMMITTED)
      BONUS-COMMITTED
      BONUS-SERIOUS
    )
  )
)

;; Get penalty percentage for a tier
(define-private (get-penalty-rate (amount uint))
  (if (is-eq amount TIER-BASIC)
    PENALTY-BASIC
    (if (is-eq amount TIER-COMMITTED)
      PENALTY-COMMITTED
      PENALTY-SERIOUS
    )
  )
)

;; Calculate completion percentage
(define-private (calculate-completion-rate (terms-learned uint) (goal-target uint))
  (if (is-eq goal-target u0)
    u0
    (/ (* terms-learned u100) goal-target)
  )
)

;; Calculate bonus amount
(define-private (calculate-bonus (amount uint) (bonus-rate uint))
  (/ (* amount bonus-rate) u10000)
)

;; Calculate penalty amount
(define-private (calculate-penalty (amount uint) (penalty-rate uint))
  (/ (* amount penalty-rate) u10000)
)

;; Calculate proportional bonus for partial completion (50-99%)
(define-private (calculate-proportional-bonus (bonus uint) (completion-rate uint))
  (/ (* bonus completion-rate) u100)
)

;; Calculate final amount based on completion
(define-read-only (calculate-final-amount (stake-id uint))
  (let
    (
      (stake (unwrap! (map-get? stakes { stake-id: stake-id }) ERR-STAKE-NOT-FOUND))
      (amount (get amount stake))
      (terms-learned (get terms-learned stake))
      (goal-target (get goal-target stake))
      (completion-rate (calculate-completion-rate terms-learned goal-target))
      (bonus-rate (get-bonus-rate amount))
      (penalty-rate (get-penalty-rate amount))
    )
    
    (if (>= completion-rate FULL-COMPLETION)
      (ok (+ amount (calculate-bonus amount bonus-rate)))
      (if (>= completion-rate PARTIAL-THRESHOLD)
        (let
          (
            (full-bonus (calculate-bonus amount bonus-rate))
            (proportional-bonus (calculate-proportional-bonus full-bonus completion-rate))
          )
          (ok (+ amount proportional-bonus))
        )
        (ok (- amount (calculate-penalty amount penalty-rate)))
      )
    )
  )
)

;; ======================
;; MAIN FUNCTIONS
;; ======================

;; Create a new stake
(define-public (create-stake (amount uint) (goal-type (string-ascii 10)))
  (let
    (
      (stake-id (var-get stake-id-counter))
      (current-block block-height)
      (lock-duration (get-lock-duration goal-type))
      (goal-target (get-goal-target amount goal-type))
      (user tx-sender)
    )
    
    ;; Validation checks
    (asserts! (is-valid-tier amount) ERR-INVALID-AMOUNT)
    (asserts! (is-valid-goal-type goal-type) ERR-INVALID-GOAL-TYPE)
    (asserts! (> goal-target u0) ERR-INVALID-GOAL-TYPE)
    
    ;; Transfer STX from user to contract
    (try! (stx-transfer? amount user (as-contract tx-sender)))
    
    ;; Create stake record
    (map-set stakes
      { stake-id: stake-id }
      {
        user: user,
        amount: amount,
        goal-type: goal-type,
        start-block: current-block,
        end-block: (+ current-block lock-duration),
        terms-learned: u0,
        goal-target: goal-target,
        status: "active",
        claimed: false
      }
    )
    
    ;; Add to user's active stakes
    (let
      (
        (current-stakes (default-to (list) (get stake-ids (map-get? user-active-stakes { user: user }))))
      )
      (map-set user-active-stakes
        { user: user }
        { stake-ids: (unwrap! (as-max-len? (append current-stakes stake-id) u10) ERR-TOO-MANY-STAKES) }
      )
    )
    
    ;; Increment counter for next stake
    (var-set stake-id-counter (+ stake-id u1))
    
    (ok stake-id)
  )
)

;; Mark a term as learned for a specific stake
(define-public (mark-term-learned (stake-id uint) (term-id uint))
  (let
    (
      (stake (unwrap! (map-get? stakes { stake-id: stake-id }) ERR-STAKE-NOT-FOUND))
      (user tx-sender)
    )
    
    ;; Validation checks
    (asserts! (is-eq (get user stake) user) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status stake) "active") ERR-STAKE-ALREADY-COMPLETED)
    (asserts! (not (has-learned-term stake-id term-id)) ERR-INVALID-TERM-ID)
    
    ;; Mark term as learned
    (map-set stake-terms-learned
      { stake-id: stake-id, term-id: term-id }
      { learned: true }
    )
    
    ;; Increment terms-learned counter
    (map-set stakes
      { stake-id: stake-id }
      (merge stake { terms-learned: (+ (get terms-learned stake) u1) })
    )
    
    (ok true)
  )
)

;; Claim stake after time-lock expires
;; KEY FIX: Separate logic for bonuses vs penalties
(define-public (claim-stake (stake-id uint))
  (let
    (
      (stake (unwrap! (map-get? stakes { stake-id: stake-id }) ERR-STAKE-NOT-FOUND))
      (user tx-sender)
      (current-block block-height)
      (amount (get amount stake))
      (terms-learned (get terms-learned stake))
      (goal-target (get goal-target stake))
      (completion-rate (calculate-completion-rate terms-learned goal-target))
      (bonus-rate (get-bonus-rate amount))
      (penalty-rate (get-penalty-rate amount))
    )
    
    ;; Validation checks
    (asserts! (is-eq (get user stake) user) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status stake) "active") ERR-STAKE-ALREADY-COMPLETED)
    (asserts! (not (get claimed stake)) ERR-ALREADY-CLAIMED)
    (asserts! (>= current-block (get end-block stake)) ERR-TIME-LOCK-NOT-EXPIRED)
    
    ;; Update stake status
    (map-set stakes
      { stake-id: stake-id }
      (merge stake { 
        status: "completed",
        claimed: true
      })
    )
    
    ;; Calculate and handle based on completion
    (if (>= completion-rate FULL-COMPLETION)
      ;; 100%+ completion: Return original + bonus from pool
      (let
        (
          (bonus-amount (calculate-bonus amount bonus-rate))
          (final-amount (+ amount bonus-amount))
        )
        ;; Check if bonus pool has enough
        (asserts! (>= (var-get bonus-pool) bonus-amount) ERR-INSUFFICIENT-BALANCE)
        
        ;; Deduct from bonus pool
        (var-set bonus-pool (- (var-get bonus-pool) bonus-amount))
        
        ;; Transfer full amount to user
        (try! (as-contract (stx-transfer? final-amount tx-sender user)))
        (ok final-amount)
      )
      
      (if (>= completion-rate PARTIAL-THRESHOLD)
        ;; 50-99% completion: Return original + proportional bonus
        (let
          (
            (full-bonus (calculate-bonus amount bonus-rate))
            (proportional-bonus (calculate-proportional-bonus full-bonus completion-rate))
            (final-amount (+ amount proportional-bonus))
          )
          ;; Check if bonus pool has enough
          (asserts! (>= (var-get bonus-pool) proportional-bonus) ERR-INSUFFICIENT-BALANCE)
          
          ;; Deduct from bonus pool
          (var-set bonus-pool (- (var-get bonus-pool) proportional-bonus))
          
          ;; Transfer full amount to user
          (try! (as-contract (stx-transfer? final-amount tx-sender user)))
          (ok final-amount)
        )
        
        ;; <50% completion: Return reduced amount, add penalty to pool
        (let
          (
            (penalty (calculate-penalty amount penalty-rate))
            (final-amount (- amount penalty))
          )
          ;; Add penalty to bonus pool
          (var-set bonus-pool (+ (var-get bonus-pool) penalty))
          
          ;; Transfer reduced amount to user (penalty stays in contract)
          (try! (as-contract (stx-transfer? final-amount tx-sender user)))
          (ok final-amount)
        )
      )
    )
  )
)

;; Emergency unstake - withdraw early with 20% penalty
(define-public (emergency-unstake (stake-id uint))
  (let
    (
      (stake (unwrap! (map-get? stakes { stake-id: stake-id }) ERR-STAKE-NOT-FOUND))
      (user tx-sender)
      (original-amount (get amount stake))
      (penalty (calculate-penalty original-amount EARLY-WITHDRAWAL-PENALTY))
      (amount-to-return (- original-amount penalty))
    )
    
    ;; Validation checks
    (asserts! (is-eq (get user stake) user) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status stake) "active") ERR-STAKE-ALREADY-COMPLETED)
    (asserts! (not (get claimed stake)) ERR-ALREADY-CLAIMED)
    
    ;; Update stake status to withdrawn
    (map-set stakes
      { stake-id: stake-id }
      (merge stake { 
        status: "withdrawn",
        claimed: true
      })
    )
    
    ;; Add penalty to bonus pool
    (var-set bonus-pool (+ (var-get bonus-pool) penalty))
    
    ;; Transfer penalized amount from contract to user
    (try! (as-contract (stx-transfer? amount-to-return tx-sender user)))
    
    (ok amount-to-return)
  )
)

;; ======================
;; ADDITIONAL READ-ONLY HELPERS
;; ======================

;; Get stake progress summary
(define-read-only (get-stake-progress (stake-id uint))
  (let
    (
      (stake (unwrap! (map-get? stakes { stake-id: stake-id }) ERR-STAKE-NOT-FOUND))
      (terms-learned (get terms-learned stake))
      (goal-target (get goal-target stake))
      (completion-rate (calculate-completion-rate terms-learned goal-target))
      (current-block block-height)
      (end-block (get end-block stake))
    )
    (ok {
      stake-id: stake-id,
      user: (get user stake),
      amount: (get amount stake),
      goal-type: (get goal-type stake),
      terms-learned: terms-learned,
      goal-target: goal-target,
      completion-rate: completion-rate,
      status: (get status stake),
      start-block: (get start-block stake),
      end-block: end-block,
      blocks-remaining: (if (> end-block current-block)
                          (- end-block current-block)
                          u0),
      can-claim: (and 
                   (is-eq (get status stake) "active")
                   (>= current-block end-block)
                   (not (get claimed stake)))
    })
  )
)

;; Check if stake is ready to claim
(define-read-only (is-claimable (stake-id uint))
  (match (map-get? stakes { stake-id: stake-id })
    stake (ok (and
                (is-eq (get status stake) "active")
                (>= block-height (get end-block stake))
                (not (get claimed stake))))
    ERR-STAKE-NOT-FOUND
  )
)

;; Contract initialization
(begin
  (var-set stake-id-counter u1)
  (var-set bonus-pool u0)
)