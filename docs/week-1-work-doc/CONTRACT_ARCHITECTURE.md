# ClarityLearn 2.0 - Contract Architecture

## Contract Communication Strategy
Use contract-call not events (since Clarity does not have the same Etherum-Style events)

## Data Flow: Stake → Learn → Claim
**Data Flow Diagram:**
```
1. USER STAKES
   ↓
   [clarity-learn-staking.clar]
   - Lock STX (1/5/10 tokens)
   - Set commitment (7/15/30 terms)
   - Record start-block
   ↓
   [Store in stake-info map]

2. USER LEARNS
   ↓
   [clarity-learn-core.clar]
   - Add definition via add-term()
   - Vote on existing terms
   - Track progress in user-progress map
   ↓
   [Query progress periodically]

3. USER CLAIMS REWARD
   ↓
   [clarity-learn-staking.clar]
   - Check if lock-period expired
   - Call core to get completion %
   ↓
   [clarity-learn-core.clar]
   - Return terms-learned / terms-committed
   ↓
   [clarity-learn-staking.clar]
   - Calculate bonus/penalty
   - Call rewards contract
   ↓
   [clarity-learn-rewards.clar]
   - Verify multi-sig approval
   - Transfer bonus from pool
   ↓
   [Return STX to user]

## Security Considerations

**Security Risks:**
```
- Double-claiming rewards
  -Fix: Use claim-status flag in stake-info map
    - (stake-claimed bool)

- Reentrancy during reward distribution
    -Fix. Update state BEFORE transferring STX
        ;; BAD (vulnerable)
        (stx-transfer? amount pool-addr user)
        (map-set stakes user {claimed: true})
        
        ;; GOOD (safe)
        (map-set stakes user {claimed: true})
        (stx-transfer? amount pool-addr user)

- Time manipulation attacks

    - Fix: Use block-height instead of timestamps

        (define-data-var lock-blocks uint u1008) ;; ~7 days

- Unauthorized contract calls
    - Fix: Check tx-sender and contract-caller

(asserts! (is-eq tx-sender (var-get authorized-staking-contract)) ERR-NOT-AUTHORIZED)
```

5. **Reward pool drainage**
   - **Fix:** Multi-sig governance (what we're building!)

---

#### **Question 4: State transition structure**

**State Machine:**
```
INITIAL STATE
    ↓
    [User stakes STX]
    ↓
ACTIVE STAKE
    ↓
    [User adds terms/votes]
    ↓
LEARNING PHASE
    ↓
    [Lock period expires]
    ↓
CLAIMABLE
    ↓
    [User calls claim-reward]
    ↓
COMPLETED (if success ≥50%)
OR
SLASHED (if success <50%)

## Next Steps
- Implement multi-sig governance in clarity-learn-rewards.clar
- Add state validation in staking contract
- Write comprehensive unit tests


## Contract Interaction Diagram

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         USER WALLET                         │
│                    (Stacks Connect/Hiro)                    │
└────────────┬──────────────────────────┬─────────────────────┘
             │                          │
             │ Stakes STX               │ Votes/Adds Terms
             ↓                          ↓
┌────────────────────────┐    ┌─────────────────────────────┐
│ clarity-learn-staking  │◄───┤  clarity-learn-core.clar    │
│        .clar           │    │  (Dictionary Storage)       │
│                        │    │                             │
│ • create-stake()       │    │ • add-term()                │
│ • claim-reward()       │───►│ • vote-on-term()            │
│ • check-lock-period()  │    │ • get-user-progress()       │
│                        │    │ • get-term-details()        │
└────────┬───────────────┘    └─────────────────────────────┘
         │                              ▲
         │ Distributes                  │
         │ Bonus/Penalty                │ Verifies Learning
         ↓                              │
┌────────────────────────────────────────┐
│  clarity-learn-rewards.clar            │
│  (Multi-Sig Governance)                │
│                                        │
│ • propose-pool-action()                │
│ • approve-proposal()                   │
│ • execute-proposal()                   │
│ • distribute-bonus()                   │
│                                        │
│ Admins: ADMIN-1, ADMIN-2, ADMIN-3      │
│ Threshold: 2-of-3 signatures           │
└────────────────────────────────────────┘
```

### Detailed Function Call Flow

#### Scenario 1: User Creates Stake
```
USER → clarity-learn-staking.create-stake(10 STX, 30 terms)
  │
  ├─► Lock 10 STX in contract
  ├─► Record stake-info: {amount: 10, terms: 30, start-block: 12345}
  └─► Set state: STATE-ACTIVE
```

#### Scenario 2: User Learns (Adds Term)
```
USER → clarity-learn-core.add-term("DeFi", "Decentralized Finance")
  │
  ├─► Store in terms-map
  ├─► Increment user-contributions
  └─► Update user-progress map
```

#### Scenario 3: User Claims Reward
```
USER → clarity-learn-staking.claim-reward()
  │
  ├─► Check: (>= block-height (+ start-block lock-blocks))
  │
  ├─► contract-call? .clarity-learn-core.get-user-progress(tx-sender)
  │     └─► Returns: {terms-learned: 28, terms-committed: 30}
  │
  ├─► Calculate completion: (/ 28 30) = 93%
  │
  ├─► Calculate bonus: (* 10 STX 0.15) = 1.5 STX
  │
  ├─► contract-call? .clarity-learn-rewards.distribute-bonus(tx-sender, 1.5 STX)
  │     └─► Checks multi-sig approval
  │     └─► Transfers from reward pool
  │
  └─► Return: 11.5 STX to user (10 + 1.5 bonus)
```

#### Scenario 4: Admin Proposes Rate Change
```
ADMIN-1 → clarity-learn-rewards.propose-pool-action(
            action: "adjust-rates",
            new-rate: 20%
          )
  │
  ├─► Create proposal: {id: 1, proposer: ADMIN-1, approvals: 1, expires: block+144}
  │
ADMIN-2 → clarity-learn-rewards.approve-proposal(proposal-id: 1)
  │
  ├─► Increment approvals: 2
  ├─► Check threshold: (>= 2 THRESHOLD) ✓
  │
  └─► execute-proposal()
        └─► Update bonus-rate to 20%
```

### Cross-Contract Function Signatures

#### Core Contract (Read-Only)
```clarity
;; Called by staking contract
(define-read-only (get-user-progress (user principal))
  (response 
    {terms-learned: uint, terms-committed: uint} 
    uint
  )
)

(define-read-only (get-term-details (term-id uint))
  (response 
    {term: (string-ascii 50), definition: (string-utf8 500), votes: uint}
    uint
  )
)
```

#### Rewards Contract (Public)
```clarity
;; Called by staking contract
(define-public (distribute-bonus 
  (recipient principal) 
  (amount uint)
)
  ;; Validates multi-sig approval
  ;; Transfers from reward pool
  (response bool uint)
)
```

#### Staking Contract (Public)
```clarity
(define-public (create-stake 
  (amount uint) 
  (terms-committed uint)
)
  ;; Locks STX
  ;; Records commitment
  (response bool uint)
)

(define-public (claim-reward)
  ;; Checks lock period
  ;; Calculates bonus/penalty
  ;; Calls rewards contract
  (response uint uint)
)
```

### Error Code Registry

**Core Contract (100-199)**
- `ERR-TERM-EXISTS (u100)` - Term already in dictionary
- `ERR-INVALID-TERM (u101)` - Term too short/long
- `ERR-ALREADY-VOTED (u102)` - User already voted on term
- `ERR-VOTE-COST (u103)` - Insufficient payment for vote

**Staking Contract (200-299)**
- `ERR-INVALID-AMOUNT (u200)` - Stake amount not 1/5/10 STX
- `ERR-ACTIVE-STAKE (u201)` - User already has active stake
- `ERR-LOCK-ACTIVE (u202)` - Lock period not expired
- `ERR-NO-STAKE (u203)` - No stake found for user
- `ERR-ALREADY-CLAIMED (u204)` - Reward already claimed

**Rewards Contract (300-399)**
- `ERR-NOT-ADMIN (u300)` - Caller not authorized admin
- `ERR-PROPOSAL-EXPIRED (u301)` - Proposal past 144 block window
- `ERR-ALREADY-APPROVED (u302)` - Admin already approved proposal
- `ERR-INVALID-PROPOSAL (u303)` - Proposal ID not found
- `ERR-THRESHOLD-NOT-MET (u304)` - <2 approvals
- `ERR-INSUFFICIENT-POOL (u305)` - Reward pool empty

### Security Validation Checklist

**Before Contract Deployment:**
- [ ] All error codes documented
- [ ] Cross-contract calls use asserts! for authorization
- [ ] State updates happen BEFORE STX transfers
- [ ] No floating-point math (use basis points: 1500 = 15%)
- [ ] Block-height used for all time checks
- [ ] Maps have size limits to prevent bloat
- [ ] Read-only functions marked correctly
- [ ] All public functions have permission checks