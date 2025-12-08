;; ClarityLearn 2.0 - Core Dictionary Contract
;; Enhanced from Level 1 with voting, categories, and contributor tracking
;; Week 2 - Day 4-5: Reusing and enhancing existing functionality

;; ======================
;; CONSTANTS
;; ======================

;; Voting costs
(define-constant FIRST-VOTE-FREE true)
(define-constant SUBSEQUENT-VOTE-COST u100000)  ;; 0.1 STX in microSTX

;; Contract owner for admin functions
(define-constant CONTRACT-OWNER tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-TERM-NOT-FOUND (err u201))
(define-constant ERR-INVALID-CATEGORY (err u202))
(define-constant ERR-ALREADY-VOTED (err u203))
(define-constant ERR-INSUFFICIENT-PAYMENT (err u204))
(define-constant ERR-TERM-ALREADY-EXISTS (err u205))

;; ======================
;; DATA STRUCTURES
;; ======================

;; Counter for generating unique term IDs
(define-data-var term-id-counter uint u0)

;; Main term dictionary (ENHANCED from Level 1)
(define-map terms 
  { term-id: uint }
  { 
    term: (string-ascii 50),
    definition: (string-utf8 500),
    contributor: principal,
    votes: uint,                      ;; NEW: Vote count for quality
    category: (string-ascii 20),      ;; NEW: DeFi, NFTs, Layer2, DAO, etc.
    timestamp: uint,                  ;; NEW: Block when term was added
    status: (string-ascii 10)         ;; NEW: "active", "flagged", "archived"
  }
)

;; Track user votes to prevent double voting
(define-map user-votes
  { user: principal, term-id: uint }
  { voted: bool, vote-timestamp: uint }
)

;; Track user's first vote (to give it free)
(define-map user-first-vote
  { user: principal }
  { has-voted-before: bool }
)

;; Contributor reputation tracking
(define-map contributor-stats
  { contributor: principal }
  {
    terms-contributed: uint,
    total-votes-received: uint,
    reputation-score: uint,
    join-timestamp: uint
  }
)

;; Category index for easy filtering (maps category to list of term IDs)
(define-map category-index
  { category: (string-ascii 20) }
  { term-ids: (list 100 uint) }  ;; Max 100 terms per category
)

;; Valid categories list
(define-data-var valid-categories (list 20 (string-ascii 20)) 
  (list 
    "DeFi"
    "NFTs" 
    "Layer2"
    "DAO"
    "Staking"
    "Bridges"
    "DEX"
    "Lending"
    "Governance"
    "Bitcoin"
    "General"
  )
)

;; ======================
;; VALIDATION HELPERS
;; ======================

;; Check if category is valid
(define-private (is-valid-category (category (string-ascii 20)))
  (is-some (index-of (var-get valid-categories) category))
)

;; Check if user has voted before (for any term)
(define-private (has-voted-before (user principal))
  (default-to 
    false 
    (get has-voted-before (map-get? user-first-vote { user: user }))
  )
)

;; Check if user already voted for specific term
(define-private (has-voted-for-term (user principal) (term-id uint))
  (default-to 
    false 
    (get voted (map-get? user-votes { user: user, term-id: term-id }))
  )
)

;; ======================
;; CORE FUNCTIONS (Enhanced from Level 1)
;; ======================

;; Store a new term (ENHANCED)
;; @param term: The cryptocurrency term (e.g., "DeFi")
;; @param definition: Explanation of the term
;; @param category: Category classification
;; @returns: (ok term-id) or error
;; Store a new term (ENHANCED)
;; @param term: The cryptocurrency term (e.g., "DeFi")
;; @param definition: Explanation of the term
;; @param category: Category classification
;; @returns: (ok term-id) or error
(define-public (store-term 
  (term (string-ascii 50)) 
  (definition (string-utf8 500))
  (category (string-ascii 20)))
  (let
    (
      (new-term-id (+ (var-get term-id-counter) u1))  ;; FIXED: Increment FIRST
      (contributor tx-sender)
      (current-block block-height)
    )
    
    ;; Validate category
    (asserts! (is-valid-category category) ERR-INVALID-CATEGORY)
    
    ;; Store term data with new ID
    (map-set terms
      { term-id: new-term-id }
      {
        term: term,
        definition: definition,
        contributor: contributor,
        votes: u0,
        category: category,
        timestamp: current-block,
        status: "active"
      }
    )
    
    ;; Update contributor stats
    (match (map-get? contributor-stats { contributor: contributor })
      existing-stats
        (map-set contributor-stats
          { contributor: contributor }
          (merge existing-stats {
            terms-contributed: (+ (get terms-contributed existing-stats) u1)
          })
        )
      ;; First contribution
      (map-set contributor-stats
        { contributor: contributor }
        {
          terms-contributed: u1,
          total-votes-received: u0,
          reputation-score: u0,
          join-timestamp: current-block
        }
      )
    )
    
    ;; Add to category index
    (let
      (
        (current-terms (default-to (list) 
          (get term-ids (map-get? category-index { category: category }))))
      )
      (map-set category-index
        { category: category }
        { term-ids: (unwrap! (as-max-len? (append current-terms new-term-id) u100) 
                    ERR-TERM-ALREADY-EXISTS) }
      )
    )
    
    ;; Increment counter AFTER using it
    (var-set term-id-counter new-term-id)
    
    (ok new-term-id)  ;; Return the new ID (which is now u1, u2, u3, etc.)
  )
)

;; Contract initialization
(begin
  (var-set term-id-counter u0)  ;; Start at 0, first term will be u1
)

;; Get term by ID (KEPT from Level 1)
(define-read-only (get-term (term-id uint))
  (map-get? terms { term-id: term-id })
)

;; ======================
;; NEW VOTING SYSTEM
;; ======================

;; Vote for a term (first vote free, subsequent votes cost 0.1 STX)
;; @param term-id: The term to vote for
;; @returns: (ok true) or error
;; FIXED VERSION - Lines 225-260 of clarity-learn-core.clar
;; Only the vote-term function fix is shown here

(define-public (vote-term (term-id uint))
  (let
    (
      (term (unwrap! (map-get? terms { term-id: term-id }) ERR-TERM-NOT-FOUND))
      (voter tx-sender)
      (contributor (get contributor term))
      (is-first-vote (not (has-voted-before voter)))
    )
    
    ;; Check if already voted for this term
    (asserts! (not (has-voted-for-term voter term-id)) ERR-ALREADY-VOTED)
    
    ;; Check if term is active
    (asserts! (is-eq (get status term) "active") ERR-NOT-AUTHORIZED)
    
    ;; Handle payment (first vote free, subsequent votes cost STX)
    (if is-first-vote
      ;; First vote is free - just mark as voted
      (map-set user-first-vote
        { user: voter }
        { has-voted-before: true }
      )
      ;; Subsequent votes cost 0.1 STX - transfer to contract
      (try! (stx-transfer? SUBSEQUENT-VOTE-COST voter (as-contract tx-sender)))
    )
    
    ;; Record the vote
    (map-set user-votes
      { user: voter, term-id: term-id }
      { voted: true, vote-timestamp: block-height }
    )
    
    ;; Increment vote count on term
    (map-set terms
      { term-id: term-id }
      (merge term { votes: (+ (get votes term) u1) })
    )
    
    ;; Update contributor reputation - FIX HERE
    (match (map-get? contributor-stats { contributor: contributor })
      stats
        (begin
          (map-set contributor-stats
            { contributor: contributor }
            (merge stats {
              total-votes-received: (+ (get total-votes-received stats) u1),
              reputation-score: (+ (get reputation-score stats) u1)
            })
          )
          (ok true)  ;; FIXED: Return ok instead of ERR
        )
      ;; If stats don't exist, this shouldn't happen (created in store-term)
      ;; But handle gracefully
      (ok false)  ;; FIXED: Return ok instead of ERR
    )
  )
)

;; ======================
;; QUERY FUNCTIONS
;; ======================

;; Get all terms in a category
(define-read-only (get-terms-by-category (category (string-ascii 20)))
  (map-get? category-index { category: category })
)

;; Get contributor statistics
(define-read-only (get-contributor-stats (user principal))
  (map-get? contributor-stats { contributor: user })
)

;; Check if user has voted for a term
(define-read-only (has-user-voted (user principal) (term-id uint))
  (has-voted-for-term user term-id)
)

;; Get user's vote status (first vote free or paid)
(define-read-only (get-user-vote-status (user principal))
  (ok {
    has-voted-before: (has-voted-before user),
    next-vote-cost: (if (has-voted-before user) 
                      SUBSEQUENT-VOTE-COST 
                      u0)
  })
)

;; Get top voted terms (simplified - returns IDs only)
;; Note: In production, you'd query externally and sort by votes
(define-read-only (get-term-details (term-id uint))
  (let
    (
      (term (unwrap! (map-get? terms { term-id: term-id }) ERR-TERM-NOT-FOUND))
      (contributor-info (map-get? contributor-stats { contributor: (get contributor term) }))
    )
    (ok {
      term-id: term-id,
      term: (get term term),
      definition: (get definition term),
      contributor: (get contributor term),
      votes: (get votes term),
      category: (get category term),
      timestamp: (get timestamp term),
      status: (get status term),
      contributor-reputation: (default-to u0 
        (get reputation-score contributor-info))
    })
  )
)

;; Get all valid categories
(define-read-only (get-valid-categories)
  (ok (var-get valid-categories))
)

;; Get total number of terms
(define-read-only (get-total-terms)
  (ok (var-get term-id-counter))
)

;; ======================
;; ADMIN FUNCTIONS (For moderation)
;; ======================

;; Flag a term for review (only contract owner)
(define-public (flag-term (term-id uint))
  (let
    (
      (term (unwrap! (map-get? terms { term-id: term-id }) ERR-TERM-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    (map-set terms
      { term-id: term-id }
      (merge term { status: "flagged" })
    )
    
    (ok true)
  )
)

;; Archive a term (only contract owner)
(define-public (archive-term (term-id uint))
  (let
    (
      (term (unwrap! (map-get? terms { term-id: term-id }) ERR-TERM-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    (map-set terms
      { term-id: term-id }
      (merge term { status: "archived" })
    )
    
    (ok true)
  )
)

;; Add a new valid category (only contract owner)
(define-public (add-category (new-category (string-ascii 20)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    (var-set valid-categories 
      (unwrap! (as-max-len? 
        (append (var-get valid-categories) new-category) 
        u20) 
      ERR-INVALID-CATEGORY)
    )
    
    (ok true)
  )
)

;; ======================
;; INTEGRATION WITH STAKING CONTRACT
;; ======================

;; This function is called by the staking contract when a user learns a term
;; It verifies the term exists and returns its data
(define-read-only (verify-term-for-staking (term-id uint))
  (match (map-get? terms { term-id: term-id })
    term (ok {
            term: (get term term),
            category: (get category term),
            status: (get status term)
          })
    ERR-TERM-NOT-FOUND
  )
)

;; Contract initialization
(begin
  (var-set term-id-counter u0)
  
  ;; Pre-populate with example terms (optional - remove in production)
  ;; (map-set terms
  ;;   { term-id: u0 }
  ;;   {
  ;;     term: "DeFi",
  ;;     definition: u"Decentralized Finance - Financial services built on blockchain without traditional intermediaries like banks",
  ;;     contributor: CONTRACT-OWNER,
  ;;     votes: u0,
  ;;     category: "DeFi",
  ;;     timestamp: block-height,
  ;;     status: "active"
  ;;   }
  ;; )
)


