# Case Study 07: Global Streaming UPI AutoPay & The Grace Ledger

## 📝 Business Narrative

We are acting as the Lead Product Architect for **StreamFlow**, a global video streaming platform that has launched in India with a monthly subscription of **₹999**.

To preserve a frictionless renewal experience, StreamFlow uses **UPI AutoPay** for recurring collections. The CEO wants a **3-day Grace Period** if a monthly debit does not settle on the 1st of the month. The product team believes this will reduce involuntary churn and protect subscriber retention.

At first glance, this seems simple. A failed debit should just trigger `GRACE_ACTIVE` while the billing team retries later.

That thinking collapses the moment the system is exposed to the physical banking network:

- **Volume:** 1 million AutoPay pull requests fire on the same day.
- **Bank A:** The remitter bank is stuck in end-of-day processing. It accepts the request but does not complete the debit for four hours.
- **NPCI / PSP stack:** 50,000 pull requests return **timeout**. The platform cannot tell whether the user was actually debited, whether the debit is still in flight, or whether the request died before execution.
- **User behavior:** A customer sees a “Pending” debit and revokes the mandate in their banking app on **Day 2**.

This is not a payments-acceptance problem. This is a **recurring-revenue state synchronization problem**.

---

## 🏢 Stakeholders
- **User:** Wants uninterrupted streaming access and clear debit outcomes.
- **Issuer Bank / PSP / NPCI:** Executes the recurring pull and reports asynchronous status back to the merchant stack.
- **StreamFlow (Platform):** Must protect recurring revenue without double-debiting, false suspensions, or uncontrolled grace leakage.

## 💸 Revenue Flow (The ₹999 Reality)
- **₹999** to StreamFlow only after a successful recurring debit is confirmed.
- **₹0** collected while a timeout remains unresolved, even if access is still active.
- **₹999 exposure** recorded as at-risk recurring revenue while the platform grants provisional access.

---

## ⚡ The Challenge

The CEO's 3-day grace promise sounds like a customer experience feature. In reality, it creates three separate architectural problems:

1. **Timeout ambiguity:** A timeout is not proof of failure. If StreamFlow retries too early, it can cause a double-debit. If it grants grace too casually, it leaks paid service.
2. **Ledger drift:** If access is extended without a dedicated exposure ledger, the platform starts reporting active subscribers as if revenue were already earned.
3. **Hostile revocation:** The user is legally allowed to revoke the mandate. If they revoke during the grace window, the platform loses its silent recovery rail and must transition to a different recovery state immediately.

> [!WARNING]
> **Regulatory Trap:** RBI’s recurring-payment framework for UPI e-mandates requires pre-debit notification and allows mandate withdrawal. RBI’s failed-transaction framework separately governs timeout and auto-reversal windows for merchant payments. If the product team treats all debit failures as one generic “Grace” state, it will mix customer-fault, system-fault, and unresolved in-flight debits into a single broken ledger.

## 📜 Constraints
1. **UPI e-mandates are governed by the RBI e-mandate framework**, extended to UPI on **January 10, 2020**.
2. **Pre-debit notification must be sent at least 24 hours before the actual debit** under the e-mandate framework.
3. **Mandate withdrawal / revocation is a supported customer control**, so the system must assume revocation can happen mid-cycle.
4. **₹999 is below the standard ₹15,000 AFA-waiver threshold for subsequent recurring debits**; the later ₹1 lakh relaxation is category-specific and does not change this video-subscription flow.
5. **Timeouts cannot be retried blindly** while the original pull remains unresolved.
6. **Merchant-payment failure resolution follows RBI failed-transaction TAT rules**; for debit-confirmed merchant failures, the auto-reversal window can extend to `T+5`, so a system-pending debit may remain unresolved beyond the commercial 3-day grace promise.
7. **Access entitlement and payment truth must be decoupled** so subscribers are not suspended off raw PSP callback noise.

---

## 🏗️ The Architectural Pivot

We do **not** implement grace as “billing leniency.”

We implement a **Dual-Clock Grace Ledger Architecture**:

- **Clock 1 — Commercial Grace Clock (`D+3`)**
  Used only for deterministic customer-fault states like insufficient funds or explicit debit failure.
- **Clock 2 — RBI Resolution Clock**
  Used for unresolved timeout / auto-reversal cases where payment truth is still being determined under the failed-transaction framework.

The billing engine classifies every renewal attempt into one of four buckets:

| Bucket | Meaning | Access posture |
|---|---|---|
| `DEBIT_SUCCESS` | Debit confirmed and revenue earned | Keep service active as paid |
| `USER_FAILURE` | Deterministic failure such as insufficient funds | Grant fixed 3-day grace and start controlled recovery |
| `SYSTEM_PENDING` | Timeout or unresolved in-flight debit truth | Keep access active, but block duplicate pull attempts until resolution |
| `MANDATE_REVOKED` | User has withdrawn the silent recovery rail | Stop AutoPay retries and force re-consent or one-time payment |

The solution is the **Grace Ledger & Resolution Barrier**.
