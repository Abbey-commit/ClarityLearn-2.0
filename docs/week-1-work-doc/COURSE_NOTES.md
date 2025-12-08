# LearnWeb3 Course 3: DeFi on Stacks - Study Notes

## Course Overview
**Course:** LearnWeb3 - Building DeFi Applications on Stacks
**Level:** Intermediate
**Duration:** 4 weeks
**Application:** ClarityLearn 2.0 gamified staking platform

---

## LESSON 1: Multi-Signature Wallets (Week 1 Focus)

### Core Concepts

#### What is a Multi-Sig Wallet?
A multi-signature wallet requires **M-of-N** signatures to execute transactions:
- **N** = Total number of authorized signers
- **M** = Minimum signatures required (threshold)
- Example: 2-of-3 means 2 out of 3 admins must approve

**Why Use Multi-Sig?**
- ✅ Prevents single point of failure (no one person controls funds)
- ✅ Reduces risk of compromised keys
- ✅ Enables decentralized governance
- ✅ Required for DAOs and treasury management

---

### Clarity Implementation Pattern

#### Basic Structure
```clarity
;; 1. Define authorized signers
(define-constant ADMIN-1 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant ADMIN-2 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
(define-constant ADMIN-3 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC)

;; 2. Set approval threshold
(define-constant THRESHOLD u2) ;; 2-of-3

;; 3. Proposal data structure
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

;; 4. Proposal counter
(define-data-var proposal-nonce uint u0)
```

#### Key Functions

**Propose Action**
```clarity
(define-public (propose-action (action (string-ascii 20)) (param uint))
  (let ((proposal-id (+ (var-get proposal-nonce) u1)))
    ;; Only admins can propose
    (asserts! (is-admin tx-sender) ERR-NOT-ADMIN)
    
    ;; Create proposal
    (map-set proposals proposal-id {
      proposer: tx-sender,
      action: action,
      param: param,
      approvals: u1, ;; Proposer auto-approves
      approved-by: (list tx-sender),
      executed: false,
      created-at: block-height
    })
    
    (var-set proposal-nonce proposal-id)
    (ok proposal-id)
  )
)
```

**Approve Proposal**
```clarity
(define-public (approve-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) ERR-INVALID-PROPOSAL)))
    ;; Validate
    (asserts! (is-admin tx-sender) ERR-NOT-ADMIN)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (<= (- block-height (get created-at proposal)) u144) ERR-EXPIRED)
    (asserts! (is-none (index-of (get approved-by proposal) tx-sender)) ERR-ALREADY-APPROVED)
    
    ;; Add approval
    (let ((updated-approvals (+ (get approvals proposal) u1))
          (updated-list (unwrap! (as-max-len? 
                          (append (get approved-by proposal) tx-sender) 
                          u3) 
                        ERR-LIST-FULL)))
      
      (map-set proposals proposal-id (merge proposal {
        approvals: updated-approvals,
        approved-by: updated-list
      }))
      
      ;; Auto-execute if threshold met
      (if (>= updated-approvals THRESHOLD)
        (execute-proposal proposal-id)
        (ok true)
      )
    )
  )
)
```

**Execute Proposal** (Private)
```clarity
(define-private (execute-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) ERR-INVALID-PROPOSAL)))
    ;; Verify threshold
    (asserts! (>= (get approvals proposal) THRESHOLD) ERR-THRESHOLD-NOT-MET)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    
    ;; Mark as executed
    (map-set proposals proposal-id (merge proposal {executed: true}))
    
    ;; Execute action based on type
    (match (get action proposal)
      "fund-pool" (fund-reward-pool (get param proposal))
      "adjust-rate" (adjust-bonus-rate (get param proposal))
      "emergency-withdraw" (emergency-withdraw (get param proposal))
      ERR-INVALID-ACTION
    )
  )
)
```

---

### Security Best Practices

#### 1. Proposal Expiry
```clarity
;; Proposals expire after 144 blocks (~24 hours)
(define-constant PROPOSAL-EXPIRY u144)

(asserts! 
  (<= (- block-height (get created-at proposal)) PROPOSAL-EXPIRY) 
  ERR-EXPIRED
)
```

**Why?** Prevents stale proposals from being executed months later when conditions have changed.

#### 2. Duplicate Approval Prevention
```clarity
;; Check if admin already approved
(asserts! 
  (is-none (index-of (get approved-by proposal) tx-sender)) 
  ERR-ALREADY-APPROVED
)
```

**Why?** One admin shouldn't count as multiple approvals.

#### 3. Execution Lock
```clarity
(asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
```

**Why?** Prevents double-execution of proposals (e.g., withdrawing funds twice).

#### 4. Admin Verification Helper
```clarity
(define-private (is-admin (user principal))
  (or 
    (is-eq user ADMIN-1)
    (is-eq user ADMIN-2)
    (is-eq user ADMIN-3)
  )
)
```

---

### ClarityLearn 2.0 Application

#### Governance Actions We Need

**1. Fund Reward Pool**
```clarity
(define-public (fund-pool (amount uint))
  ;; Only executable via multi-sig
  (asserts! (is-authorized-call) ERR-NOT-AUTHORIZED)
  (stx-transfer? amount tx-sender (as-contract tx-sender))
)
```

**2. Adjust Bonus Rates**
```clarity
(define-data-var bonus-rate-tier1 uint u1000) ;; 10% in basis points

(define-public (adjust-rate (new-rate uint))
  (asserts! (is-authorized-call) ERR-NOT-AUTHORIZED)
  (asserts! (<= new-rate u2000) ERR-RATE-TOO-HIGH) ;; Max 20%
  (ok (var-set bonus-rate-tier1 new-rate))
)
```

**3. Emergency Withdraw**
```clarity
(define-public (emergency-withdraw (amount uint))
  ;; Only for critical bugs/exploits
  (asserts! (is-authorized-call) ERR-NOT-AUTHORIZED)
  (asserts! (>= (stx-get-balance (as-contract tx-sender)) amount) ERR-INSUFFICIENT-POOL)
  (as-contract (stx-transfer? amount tx-sender ADMIN-1))
)
```

---

### Key Learnings for ClarityLearn

**Lesson Applied:**
- ✅ Reward pool protected by 2-of-3 multi-sig
- ✅ Rate changes require consensus (prevents abuse)
- ✅ Emergency procedures have safeguards
- ✅ No single admin can drain funds

**Clarity-Specific Insights:**
- Use `(list 3 principal)` for fixed-size approval tracking
- `as-max-len?` prevents list overflow attacks
- `block-height` more reliable than timestamps
- `as-contract` needed for contract-owned STX transfers

---

### Common Pitfalls

❌ **Mistake 1:** Allowing self-approval to count multiple times
```clarity
;; BAD
(var-set approvals (+ approvals u1))

;; GOOD
(asserts! (is-none (index-of approved-by tx-sender)) ERR-ALREADY-APPROVED)
```

❌ **Mistake 2:** No expiry → stale proposals linger forever

❌ **Mistake 3:** Not validating threshold before execution

❌ **Mistake 4:** Forgetting to mark proposals as executed

---

### Testing Checklist

**Unit Tests Required:**
- [ ] Only admins can propose
- [ ] Non-admins rejected with ERR-NOT-ADMIN
- [ ] Single admin cannot execute (needs 2)
- [ ] 2 admins can execute successfully
- [ ] 3 admins can execute successfully
- [ ] Duplicate approvals prevented
- [ ] Expired proposals rejected
- [ ] Executed proposals cannot re-execute
- [ ] Invalid proposal IDs handled
- [ ] Action types validated

---

### Next Steps

**Week 1 Deliverables:**
1. ✅ Complete `clarity-learn-rewards.clar` with multi-sig
2. ✅ Write comprehensive unit tests
3. ✅ Deploy to testnet and verify
4. ✅ Test with 3 wallet addresses

**Week 2 Preview:**
- Lesson 2: Time-locked staking (lending protocol patterns)
- Implement `clarity-learn-staking.clar`
- Add lock period validation

---

## Questions to Revisit

1. Should we allow admin rotation? (Add/remove admins via multi-sig?)
2. What happens if 2 admins lose their keys? (Recovery mechanism?)
3. Should proposal expiry be adjustable? (144 blocks might be too short)

---

## Resources

- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [Stacks Multi-Sig Examples](https://github.com/clarity-lang/book)
- [LearnWeb3 Course Materials](https://learnweb3.io)

---

**Last Updated:** Week 1, Day 1
**Next Lesson:** Time-Locked Staking (Lending Protocols)