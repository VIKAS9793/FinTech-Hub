# 🔵 Tier 1 — Core Payment Architecture

> **Foundational patterns: fund splitting, mandate rollback, and AI reconciliation.**
> These case studies form the bedrock of modern digital payment systems in India. They cover the essential building blocks: moving money to multiple parties (PPS Act), handling subscription failures (Mandate Cleanups), and managing zero-trust data (DPDP Act).

This document provides a high-level summary of the foundational Tier 1 Case Studies. Each section links to the full case and solution documentation.

---

## 📂 Tier 1 Case Navigation

| ID | Case Study | Full Case | Full Solution |
| :--- | :--- | :--- | :--- |
| **01** | Marketplace Fund Splitting & Partial Refunds | [case.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/01-food-delivery-split/case.md) | [solution.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/01-food-delivery-split/solution.md) |
| **02** | B2B BNPL Checkout & Zombie Mandate Cleanup | [case.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/02-b2b-bnpl-checkout/case.md) | [solution.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/02-b2b-bnpl-checkout/solution.md) |
| **03** | Zero-Trust AI Reconciliation & Batch Hold | [case.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/03-bbps-recon-ai/case.md) | [solution.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/03-bbps-recon-ai/solution.md) |

---

## Case Study 01: Food Delivery Marketplace Fund Splitting
**Domain:** Multi-vendor Marketplace, Nodal Escrow, Partial Refunds.

### 1. The Business Problem
A user pays ₹1,000 for a meal. This amount must be split between a Restaurant, a Delivery Rider, the Government (GST), and the Platform commission. The funds must never enter the platform's corporate account to stay compliant.

### 2. The Core Challenge
What happens when a user wants a partial refund (e.g., ₹200 for a missing item) **two days after settlement**? The Escrow is empty, and the restaurant already possesses the funds.

### 3. The Architecture
- **In-Window (T+0)**: Utilize `Transfer Reversal` APIs to pull funds from the restaurant's sub-bucket before settlement.
- **Out-of-Window (T+2)**: Use a **Nodal Refund Reserve** to refund the user instantly, while recording a **Negative Ledger** against the restaurant to auto-offset their NEXT sale.

→ **Full architecture & Solution:** [solution.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/01-food-delivery-split/solution.md)

---

## Case Study 02: B2B BNPL Checkout & Zombie Mandates
**Domain:** Buy Now Pay Later, e-NACH Mandates, Saga Patterns.

### 1. The Business Problem
A SME buys inventory for ₹50,000 using BNPL. The process involves multiple steps: authorizing a loan, creating a repayment mandate (e-NACH), and receiving user consent.

### 2. The Core Challenge
The "Broken Saga." What if the loan is approved and the mandate is created, but the final inventory settlement fails? We cannot leave a "Zombie Mandate" active on the user's bank account.

### 3. The Architecture
Implementation of a **Distributed Saga Pattern with Automated Poison Pill Cleanup**. If the final step fails, the system orchestrates an inverse flow: firing `POST /mandates/{id}/revoke` and `POST /consents/{id}/revoke` to return the user's financial state to neutral.

→ **Full architecture & Solution:** [solution.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/02-b2b-bnpl-checkout/solution.md)

---

## Case Study 03: AI Reconciliation & Zero-Trust Masks
**Domain:** BBPS, Legacy SFTP Batch Processing, DPDP Compliance.

### 1. The Business Problem
Processing millions of BBPS (Bharat Bill Pay System) utility payments via legacy bank SFTP batches. The reconciliation often fails due to mismatched Bill IDs or processing timeouts.

### 2. The Core Challenge
Using AI to reconcile complex batch failures while adhering to the **Digital Personal Data Protection (DPDP) Act**. We cannot send raw customer PII (phone numbers, addresses) to large language models (LLMs).

### 3. The Architecture
- **Stage 1**: Deterministic Masking Engine hashes all PII using HMAC-SHA256 before AI analysis.
- **Stage 2**: AI analyzes the "blind" structured logs to identify reconciliation gaps.
- **Stage 3**: Smart-Hold logic pauses settlement only for disputed entries while clearing the remaining batch.

→ **Full architecture & Solution:** [solution.md](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/03-bbps-recon-ai/solution.md)
