# 💳 Solution Study 01 — Partial Refund with Escrow Reversal & Future Offsetting

---

## 🏗️ Architectural Overview

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#EEF2FF"
    primaryTextColor: "#1E1B4B"
    primaryBorderColor: "#6366F1"
    lineColor: "#6366F1"
    secondaryColor: "#F0FDF4"
    tertiaryColor: "#FFFBEB"
    edgeLabelBackground: "#FFFFFF"
    fontSize: "15px"
    fontFamily: "'Segoe UI', system-ui, sans-serif"
---
flowchart LR
    U(["👤 User\n₹1,000 Payment"])
    PG(["🏦 Payment Gateway\nCapture"])
    N(["🔐 Nodal Account\nEscrow"])

    subgraph SPLIT ["📦 T+1 Fund Split"]
        direction TB
        R(["🍽️ Restaurant\n₹800"])
        D(["🚗 Driver\n₹100"])
        P(["🏢 Platform + Tax\n₹100"])
    end

    subgraph REFUND ["⚡ Challenge A — Pre-Settlement Refund"]
        direction LR
        REV(["↩️ Reverse ₹200\nfrom Restaurant"])
        RF(["💸 Refund ₹200\nto User"])
    end

    U -->|"₹1,000"| PG
    PG -->|"Captured"| N
    N --> R
    N --> D
    N --> P
    R --> REV
    REV --> RF
    RF -->|"₹200 back"| U

    style N fill:#FFFBEB,stroke:#F59E0B,color:#92400E,font-weight:bold
    style SPLIT fill:#F0FDF4,stroke:#86EFAC,stroke-dasharray:5 5
    style REFUND fill:#EEF2FF,stroke:#A5B4FC,stroke-dasharray:5 5
    style U fill:#EEF2FF,stroke:#6366F1,color:#1E1B4B
    style PG fill:#F0FDF4,stroke:#34D399,color:#064E3B
    style RF fill:#EEF2FF,stroke:#6366F1,color:#1E1B4B
    style REV fill:#FEF2F2,stroke:#FCA5A5,color:#7F1D1D
```

Two distinct architectural patterns are required depending on **when** the refund is requested relative to the settlement window:

| # | Challenge | Timing | Escrow State | Pattern |
|:-:|:----------|:-------|:-------------|:--------|
| **A** | Pre-Settlement Refund | Same day `T+0` | Funds still in Escrow | **Transfer Reversal** |
| **B** | Post-Settlement Refund | Two days later `T+2` | Escrow is empty | **Future Offsetting + Negative Ledger** |

---

## 🔄 API State Machine — Happy Path (`T+0`)

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#EEF2FF"
    primaryTextColor: "#1E1B4B"
    primaryBorderColor: "#6366F1"
    lineColor: "#6366F1"
    fontSize: "14px"
    fontFamily: "'Segoe UI', system-ui, sans-serif"
---
sequenceDiagram
    autonumber
    actor User
    participant PG as Payment Gateway
    participant N  as Nodal Escrow
    participant DB as Ledger DB
    participant SA as Split API

    User  ->> PG : POST /charges (₹1,000)
    PG    ->> N  : Capture → payment.captured webhook
    N     ->> DB : Record sub-ledger<br/>800 (Rest) · 100 (Driver) · 50 (Tax) · 50 (Platform)
    N     ->> SA : POST /transfers → Allocate into sub-buckets
    SA    -->> N : Sub-buckets confirmed ✅
```

| Step | Action | Endpoint | Logic |
|:----:|:-------|:---------|:------|
| **01** | **Capture** | `POST /charges` | ₹1k lands in Nodal Escrow. Trigger `payment.captured` webhook. |
| **02** | **Ledger** | `Local DB` | Record sub-ledger: 800 (Rest), 100 (Driver), 50 (Tax), 50 (Platform). |
| **03** | **Split** | `POST /transfers` | Fire split API. Funds allocated into Escrow sub-buckets. |

---

## ⚡ Challenge A — Transfer Reversal (Pre-Settlement)

> **Scenario:** Refund requested **before** `T+1` settlement. Escrow still holds all funds.  
> **Strategy:** Two-step **Atomic Rebalancing** — penalise the restaurant, shield everyone else.

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#EEF2FF"
    primaryTextColor: "#1E1B4B"
    primaryBorderColor: "#6366F1"
    lineColor: "#6366F1"
    fontSize: "14px"
    fontFamily: "'Segoe UI', system-ui, sans-serif"
---
flowchart TD
    A(["🔔 Refund Requested\nT+0"])
    B(["Step 1 · Transfer Reversal\nPOST /transfers/trf_RestaurantX_800/reversals\namount: ₹200"])
    C{"Reversal\nSuccessful?"}
    D(["Step 2 · Issue Refund\nPOST /payments/pay_order_123/refunds\namount: ₹200"])
    E(["✅ ₹200 → User UPI\nDriver · Platform · Tax\nunaffected"])
    F(["❌ Retry / Manual\nIntervention"])

    A --> B
    B --> C
    C -->|Yes| D
    D --> E
    C -->|No| F

    style A fill:#EEF2FF,stroke:#6366F1,color:#1E1B4B
    style B fill:#FFFBEB,stroke:#F59E0B,color:#78350F
    style C fill:#F0FDF4,stroke:#34D399,color:#064E3B
    style D fill:#FFFBEB,stroke:#F59E0B,color:#78350F
    style E fill:#F0FDF4,stroke:#34D399,color:#064E3B,font-weight:bold
    style F fill:#FEF2F2,stroke:#FCA5A5,color:#7F1D1D
```

### Step 1 · Targeted Reversal — Penalise the Restaurant

```json
POST /transfers/trf_RestaurantX_800/reversals
{
  "amount": 20000
}
```

> **Result:** Restaurant sub-bucket: `₹800 → ₹600`. The `₹200` returns to the _Unallocated_ pool of the main transaction. Driver's `₹100` remains **untouched**.

### Step 2 · Issue Refund from Rebalanced Main Transaction

```json
POST /payments/pay_order_123/refunds
{
  "amount": 20000
}
```

> **Result:** `₹200` flows back to the user's UPI. Driver, Platform, and Tax are fully shielded.

### T+1 Reconciliation Summary

| Party | Final Payout | Status |
|:------|:------------:|:------:|
| Restaurant | ₹600 | ✅ Wired |
| Driver | ₹100 | ✅ Wired |
| Platform + Tax | ₹100 | ✅ Wired |
| User | −₹200 | ✅ Refunded |
| **TOTAL** | **₹1,000** | ✅ **Balanced** |

---

## 🔥 Challenge B — Future Offsetting + Negative Ledger (Post-Settlement)

> **Scenario:** Two days have passed (`T+2`). Escrow is empty; the restaurant has `₹800` in their Partner Bank account.  
> A blind `Transfer Reversal` will throw `INSUFFICIENT_ESCROW_BALANCE`.

> [!WARNING]
> The Food Platform **cannot** use corporate funds to cover this refund. Wiring `₹200` from the Platform's own Partner Bank current account to the user is **illegal fund co-mingling** under RBI's Payment Aggregator guidelines.

---

### Full Three-Branch Decision Tree

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#EEF2FF"
    primaryTextColor: "#1E1B4B"
    primaryBorderColor: "#6366F1"
    lineColor: "#6366F1"
    fontSize: "14px"
    fontFamily: "'Segoe UI', system-ui, sans-serif"
---
flowchart TD
    START(["🔔 Refund Request\nT+2 · Escrow Empty"])
    CHECK{"GET /accounts/acc_RestaurantX/balance\nunsettled_balance ≥ ₹200?"}

    B1(["✅ Branch 1\nDeduct from rolling balance\nIntercept ₹200 tonight"])
    B1R(["💸 Instant Refund → User"])

    B2(["⚠️ Branch 2\nBalance = 0\nRestaurant closed"])
    B2P(["🏦 Pull ₹200 from\nPlatform Refund Reserve\n(Nodal Buffer — RBI Compliant)"])
    B2R(["💸 Instant Refund → User"])
    B2L(["📝 Write −₹200\nto Negative Ledger"])

    B3(["🔁 Branch 3\nAuto-Recovery on\nNext Restaurant Sale"])
    B3I(["⚙️ Intercept ₹200\nfrom Next Settlement"])
    B3REP(["✅ Replenish Refund Reserve\nWire Remaining to Restaurant"])

    START --> CHECK
    CHECK -->|"YES"| B1
    CHECK -->|"NO"| B2
    B1 --> B1R
    B2 --> B2P --> B2R
    B2R --> B2L
    B2L --> B3
    B3 --> B3I --> B3REP

    style START fill:#EEF2FF,stroke:#6366F1,color:#1E1B4B
    style CHECK fill:#FFFBEB,stroke:#F59E0B,color:#78350F
    style B1 fill:#F0FDF4,stroke:#34D399,color:#064E3B
    style B1R fill:#F0FDF4,stroke:#34D399,color:#064E3B,font-weight:bold
    style B2 fill:#FEF2F2,stroke:#FCA5A5,color:#7F1D1D
    style B2P fill:#FFFBEB,stroke:#F59E0B,color:#78350F
    style B2R fill:#F0FDF4,stroke:#34D399,color:#064E3B,font-weight:bold
    style B2L fill:#FEF2F2,stroke:#FCA5A5,color:#7F1D1D
    style B3 fill:#EEF2FF,stroke:#6366F1,color:#1E1B4B
    style B3I fill:#FFFBEB,stroke:#F59E0B,color:#78350F
    style B3REP fill:#F0FDF4,stroke:#34D399,color:#064E3B,font-weight:bold
```

---

### Branch 1 · Deduct from Restaurant's Unsettled Rolling Balance

```http
GET /accounts/acc_RestaurantX/balance
→ { "unsettled_balance": 650 }   // Restaurant sold food today
```

**If `unsettled_balance ≥ ₹200`** → Directly deduct from today's rolling balance. The PA intercepts `₹200` from tonight's settlement, moves it to the refund pool, and refunds the user instantly. ✅

---

### Branch 2 · Platform Refund Reserve (Nodal Buffer)

**Condition:** Restaurant has zero ongoing transactions — nothing to intercept.

> [!IMPORTANT]
> When the Food Platform onboarded with the PA, a **₹5 Crore Dispute & Refund Reserve** was pre-deposited into a _segregated compartment_ of the PA's Nodal Account.

**This is RBI-compliant because it is:**
- Pre-declared to the PA and RBI as a dispute buffer
- **Not co-mingled** with the Platform's operational treasury
- Legally classified as a _"Customer Funds Reserve"_, not corporate capital

```
PA.Refund.PullFromReserve(amount=200, reason="DISPUTE_PARTIAL_REFUND")
→ ₹200 instantly wired to user's UPI  ✅
```

---

### Branch 3 · Negative Ledger + Auto-Recovery Offset

**Record the debt immediately:**

```sql
UPDATE restaurant_ledger
SET    balance   = balance - 200,
       debt_flag = TRUE
WHERE  restaurant_id = 'rest_x';
-- New balance: -₹200
```

**Automated recovery on next sale** _(Restaurant X sells a ₹500 pizza three days later)_:

```
LedgerEngine: restaurant_x.balance = -200
→ Intercept ₹200 from tonight's settlement
→ Replenish Platform Nodal Refund Reserve
→ Wire remaining ₹300 to Restaurant Partner Bank
```

> [!TIP]
> The restaurant is automatically penalised on their **next** settlement. The Refund Reserve is **fully replenished**. The system is **self-healing**.

---

## 📊 Outcome Guarantee — All Branches

| Stakeholder | Outcome | Compliant? |
|:------------|:--------|:----------:|
| **User** | Receives `₹200` refund **instantly** in all scenarios | ✅ |
| **Driver** | Payout fully shielded — never touched | ✅ |
| **Platform + Tax** | Settled normally at `T+1` | ✅ |
| **Restaurant** | Penalised via reversal or next-settlement offset | ✅ |
| **RBI / PA Guidelines** | No fund co-mingling; reserve pre-declared | ✅ |