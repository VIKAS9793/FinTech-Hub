# Case Study 03: Zero-Trust AI Reconciliation & The Batch Hold

<div align="center">
  <a href="https://www.youtube.com/watch?v=0pqeYgGcCb4"><img src="https://img.youtube.com/vi/0pqeYgGcCb4/maxresdefault.jpg" alt="Case Study Video" style="max-width: 850px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);"></a>
</div>


## 📝 Business Narrative

We are consulting for a massive Biller Operating Unit (BOU). Our system processes **1 million electricity bill payments a day** via Bharat Bill Payment System (BBPS).

Due to the 1990s legacy infrastructure of the State Electricity Boards (the Billers), about **1% of transactions (10,000 a day)** end up in the platform's **"Suspense Ledger"**. This happens because the Biller's API times out during the payment, leaving our platform unsure if the Biller actually registered the payment.

Currently, a team of 50 operations analysts downloads raw XML logs from the biller, JSON webhooks from NPCI, and CSVs from the database. They manually eyeball partial reference IDs, timestamps, and amounts to figure out if the money should be **Refunded to the user** or **Settled to the Biller**.

It is slow, prone to human error, and costs a fortune. The CEO wants you to replace this ops team with an AI Agent.

## 🏢 Stakeholders
- **User:** Just wants to pay their ₹10,000 commercial electricity bill.
- **BOU (Platform):** Us. We process the payment and run the Suspense Ledger.
- **State Electricity Board (Biller):** Uses legacy 1990s database systems with unreliable APIs.
- **NPCI (BBPS):** The central switch demanding a strict T+1 turnaround time (TAT) on resolving Suspense statuses.

## ⚡ The Zero-Trust AI Architecture

Junior PMs give an LLM direct API POST access. When the LLM hallucinates a ₹50,000 refund, the RBI revokes your license. 
A Senior PM builds a **Three-Layer Strict Zero-Trust** framework:

### Layer 1: The Mask (DPDP Privacy Compliance)
Before the LLM ever sees a log, a deterministic script intercepts the transaction. Using regex, it replaces Names, Phone Numbers, and Account Numbers with cryptographic hashes (e.g., `Rohit` -> `user_hash: 8f9a2b`). 
**Why?** Sending Personally Identifiable Information (PII) to an external LLM provider violates enterprise data residency laws. The AI only needs to see patterns, not identities.

### Layer 2: The Brain (LLM Reasoning Engine)
The anonymized NPCI JSON webhook and the messy Biller XML logs are fed into a Large Language Model.
**Instruction:** *Match the NPCI transaction to the Biller XML using timestamps and partial reference IDs. Output strict JSON: `{"match_found": true, "suggested_action": "SETTLE", "confidence_score": 0.98}`.*

### Layer 3: The Executioner
The AI does not execute API calls. It passes its JSON to a hardcoded State Machine.
Only if `confidence_score > 0.95` and `current_time < T+1` does the Executioner fire the `/settle` API.

---

## 🔥 The Architect's Challenge: "The Async Blind Spot"

You deploy the AI pipeline. It runs brilliantly—until you hit the legacy enterprise edge case.

**The Scenario:**
A user pays a ₹10,000 bill. The Biller's server times out. The money sits in Suspense.
The AI Agent looks at the logs, sees the Biller API has been returning `503 Service Unavailable` for 12 hours, and rightfully outputs: `{"suggested_action": "REFUND_TO_USER"}`.
The Executioner processes the refund.

**The Catastrophe:**
The next morning, the Biller emails you. Their API was down, but their internal legacy database ran an **offline batch script at midnight** that registered the user's ₹10,000 payment. The Biller considers the bill paid, and demands the settlement money.

But you have already refunded the user. You are now short ₹10,000. 

**The constraints:**
1. You cannot legally reverse a refund and pull money from the user's bank without a mandate.
2. The AI made a logical decision based on the available data (API logs). Prompt engineering will not fix this—the LLM is blind to the offline batch run.

How do you adapt the system architecture to prevent this ₹10,000 loss?
