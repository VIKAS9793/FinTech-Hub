# Architectural Blueprint: 5-Step Compensating Saga Rollback

To meet the 30-second underwriting requirement while adhering to Digital Lending Guidelines (DLG), we architect our 4-step pipeline as a **Distributed Saga**. Traditional ACID transactions are impossible across decoupled ecosystems (AA, NPCI, Core Banking).

> [!IMPORTANT]
> **Key Architectural Decision: The Saga Pattern.** Traditional database transactions cannot span across external APIs (NPCI/AA). By using a **Compensating Saga**, we ensure that when any terminal step fails, the orchestrator fires inverse transactions backward through every previously succeeded step to maintain state integrity across all ecosystems.

---

## ⚡ The Danger State: The Zombie Mandate

> [!WARNING]
> When Step 4 (NEFT Disbursal) fails, the system holds three live liabilities that must be proactively killed. Failure to do so leads to "Zombie Mandates"—where a user is charged for a loan that was never successfully disbursed.

| Asset | Status | Risk if Ignored |
|:---|:---|:---|
| UPI AutoPay Mandate (UMRN) | **ACTIVE** | Illegal EMI deduction for a non-existent loan |
| AA Consent Artefact | **ACTIVE** | DPDP Act violation — Purpose Limitation principle |
| NBFC Loan Record | **PROCESSING** | Erroneous retry of disbursal; dirty audit books |

---

## 🔄 The 5-Step Compensating Rollback

### Step 1: State Interception (Internal)
The millisecond the `DISBURSAL_FAILED_BENEFICIARY_BANK_OFFLINE` webhook arrives from the Sponsor Bank, the internal LOS state machine decouples.

### Step 2: Mandate Revocation (NPCI via Payment Aggregator)

> [!IMPORTANT]
> **Mandate Revocation is Mandatory.** Leaving a mandate alive on a failed loan is a primary driver of RBI Ombudsman complaints. The system must kill the UMRN programmatically.

```json
POST /v1/mandates/revoke
{
  "umrn": "NPCI1234567890ABCD",
  "reason_code": "LOAN_DISBURSAL_FAILURE"
}
```

### Step 3: Consent Artefact Revocation (Account Aggregator)

> [!WARNING]
> **Regulatory Trap: DPDP Act Violation.** Retaining data access after a loan rejection violates the **Purpose Limitation** principle. Data-sharing must be severed the moment the transaction is void.

### Step 4: NBFC LOS Reconciliation (DLG Compliance)
The NBFC's Loan Origination System must be explicitly informed the entire deal is void—preventing any automated retry logic re-firing the NEFT disbursal.

---

## 🏗️ Why This Architecture Wins

### 4. The Nightmare Edge Case: The "Async Failure"

> [!CAUTION]
> **Nightmare Scenario:** The Disbursal fails, but the **Revocation Webhook itself fails or times out**. The user now has an active mandate but no loan. The system must implement a **Background Reconciliation Worker** that polls for "Orphaned Active Mandates" every 60 minutes and forces a retry of the revocation saga until a `REVOCATION_SUCCESS` receipt is logged.

This Saga rollback demonstrates:
1. **System Hygiene:** No orphaned database records.
2. **Regulatory Empathy:** Proactively protected the consumer via mandate and consent revocation.
3. **Ecosystem Breadth:** Orchestrated a clean rollback across **NPCI**, **Sahamati AA**, and the **NBFC LOS**.

