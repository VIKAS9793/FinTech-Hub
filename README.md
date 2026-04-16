# 💳 FinTech Hub

> **Architectural Patterns & Solution Blueprints for Complex Financial Systems**

<div align="center">
  <h3><b>VIKAS SAHANI</b></h3>
  <a href="https://www.linkedin.com/in/vikas-sahani-727420358"><img src="https://img.shields.io/badge/LinkedIn-Vikas%20Sahani-0077B5?style=for-the-badge&logo=linkedin" /></a>
  <a href="https://github.com/VIKAS9793"><img src="https://img.shields.io/badge/GitHub-VIKAS9793-181717?style=for-the-badge&logo=github" /></a>
  <a href="mailto:vikassahani17@gmail.com"><img src="https://img.shields.io/badge/Email-vikassahani17@gmail.com-EA4335?style=for-the-badge&logo=gmail" /></a>
  <br><br>
</div>

![Static Badge](https://img.shields.io/badge/Status-Project_Hub-blue?style=for-the-badge)
![Static Badge](https://img.shields.io/badge/Domain-FinTech-green?style=for-the-badge)
![Static Badge](https://img.shields.io/badge/Standards-RBI_Compliant-red?style=for-the-badge)
![Repo Visits](https://api.visitorbadge.io/api/VisitorHit?user=VIKAS9793&repo=FinTech-Hub&label=Repo%20Visits&countColor=%23f39c12&labelStyle=flat-square)

Welcome to the **FinTech Hub**. This repository documents real-world FinTech architectural patterns and payment solutions. From multi-party fund splitting to ledger reconciliation, we break down complex business requirements and translate them into practical, compliant technical blueprints.

> [!NOTE] 
> **Disclaimer**: All examples, narratives, code snippets, and diagrams in this repository use generic placeholder names (e.g., "Food Platform", "Partner Bank", "Payment Aggregator"). Any resemblance to actual companies, banks, or third-party organizations is purely coincidental. The concepts demonstrated are architectural patterns and do not represent the proprietary implementation of any specific entity.

---

## 🏗️ Repository Architecture

Every case in this hub follows a standardized structure to ensure clarity and scalability:

```text
/cases
├── tier-1-core/             # Foundational payment patterns (Cases 01–03)
│   ├── README.md            # Portfolio summary of all Tier 1 cases
│   └── [case-id-name]/
│       ├── case.md          # The business narrative and constraints
│       ├── solution.md      # Technical logic and API state machines
│       └── src/             # Code prototypes and mock implementations
├── tier-2-enterprise/       # Advanced B2B regulatory edge cases (Cases 04–06)
│   ├── README.md            # Portfolio summary of all Tier 2 cases
│   └── [case-id-name]/
│       ├── case.md
│       ├── solution.md
│       └── src/
└── _template/               # Blank scaffold for new cases
```

---

## 🏛️ The FinTech Architect's Non-Negotiables: The 5 Immutable Modalities

These 5 modalities form the core foundation of this repository. Regardless of the business problem or specific technology stack, these are the non-negotiable constraints of building financial systems.

### 1. The Fund Routing Modality *(The Physics of Capital)*
APIs move data; banks move money. Never listen to a feature request without tracing the physical flow of capital first.

> **The Prime Directive:** Who holds the capital, who is routing the capital, and who is the final beneficiary?
> 
> **The Absolute Constraint:** A technology platform cannot touch principal funds unless it holds an RBI banking/NBFC license.
> 
> **The Architect's Translation:** *"Does this flow require a Nodal Escrow account to prevent illegal fund co-mingling? Are we strictly adhering to the DLG Flow of Funds mandate?"*

---

### 2. The State Synchronization Modality *(The Ledger Reality)*
Assume the network will fail. A `200 OK` response is a luxury, not a guarantee. The database is the only truth.

> **The Prime Directive:** What happens when the request is sent, but the response is lost?
> 
> **The Absolute Constraint:** No state change can be assumed without a deterministic receipt. Every transaction must be uniquely trackable and verifiable.
> 
> **The Architect's Translation:** *"Are we passing Idempotency Keys to prevent double-charging? Do we have a background Status Polling job running to catch asynchronous timeouts (like UPI U19 errors) and map them to RBI T+1 auto-reversal mandates?"*

---

### 3. The Liability & Risk Modality *(The Cost of Failure)*
In finance, when a system breaks or fraud occurs, actual money is lost. The architecture must programmatically define who eats that loss.

> **The Prime Directive:** When this system fails, whose bank account is legally depleted?
> 
> **The Absolute Constraint:** Risk cannot be hidden; it must be quantified, legally bound, and capped.
> 
> **The Architect's Translation:** *"Who holds the default risk on this credit product? Have we enforced the 5% FLDG cap in our RE contracts? Are we using Transfer Reversals instead of generic refunds to protect innocent sub-merchants in our marketplace?"*

---

### 4. The Data Segregation Modality *(Zero-Trust Privacy)*
You cannot build a system where everyone sees everything. Data is a liability, not an asset.

> **The Prime Directive:** Does this component need to see the payload, or does it just need to route it?
> 
> **The Absolute Constraint:** Any system handling financial data must enforce Purpose Limitation and Data Blindness.
> 
> **The Architect's Translation:** *"Are we utilizing the Account Aggregator framework with End-to-End Encryption (E2EE) so we remain data-blind? Have we implemented a deterministic masking script to hash PII before sending logs to third-party LLMs?"*

---

### 5. The Graceful Degradation Modality *(The Automated Rollback)*
When a multi-step distributed process fails in the middle, you cannot leave the preceding steps active. Orphaned states cause regulatory audits.

> **The Prime Directive:** What is the exact sequence of the "Sad Path" cleanup?
> 
> **The Absolute Constraint:** Systems must revert to a safe, neutral state automatically without requiring human intervention or customer support tickets.
> 
> **The Architect's Translation:** *"If this disbursal webhook fails, do we have a Saga Pattern rollback in place? Does the system automatically fire a UMRN revocation to NPCI and a Consent revocation to the AA to prevent 'Zombie Mandates'?"*

---

## 📂 Case Index

### 🔵 Tier 1 — Core Payment Architecture (`cases/tier-1-core/`)
> Foundational patterns: fund splitting, mandate rollback, AI reconciliation.
> 📋 [View full Tier 1 portfolio overview →](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/README.md)

| ID | Case Study | Core Challenge | Status |
| :--- | :--- | :--- | :--- |
| **01** | [Marketplace Fund Splitting & Partial Refunds](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/01-food-delivery-split/case.md) | Multi-party split + atomic escrow reversal | ✅ Solved |
| **02** | [B2B BNPL Checkout & Zombie Mandate Cleanup](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/02-b2b-bnpl-checkout/case.md) | Saga rollback: Mandate + Consent + LOS reconciliation | ✅ Solved |
| **03** | [Zero-Trust AI Reconciliation & Batch Hold](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-1-core/03-bbps-recon-ai/case.md) | Legacy SFTP Batch synchronization & AI DPDP Masking | ✅ Solved |

### 🟣 Tier 2 — Enterprise B2B Regulatory Edge Cases (`cases/tier-2-enterprise/`)
> Advanced scenarios: nodal reserves, TDS reconciliation, DLG closed-loop ledgers.
> 📋 [View full Tier 2 portfolio overview →](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-2-enterprise/README.md)

| ID | Case Study | Core Challenge | Status |
| :--- | :--- | :--- | :--- |
| **04** | [EdTech B2B2C 100% Liquidity & Future Offsetting](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-2-enterprise/04-edtech-future-offsetting/case.md) | T0 PA Routing vs 7-Day Refund risk trap managed via e-NACH & Negative Ledgers | ✅ Solved |
| **05** | [B2B SaaS Aggregation & Automated TDS Reconciliation](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-2-enterprise/05-b2b-tds-reconciliation/case.md) | Solving the 10% Statutory Deduction mismatch via Smart Collect Rules & Forward Offsetting | ✅ Solved |
| **06** | [CreditTech LSP & The Two-Sided Ledger](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/tier-2-enterprise/06-credittech-dlg-escrow/case.md) | Eliminating co-mingling via RazorpayX Scoped Escrows & zero-touch Smart Collect VPAs | ✅ Solved |

---

## 🛠️ Infrastructure Overview

Most solutions here revolve around the integration of **Payment Aggregators (PA)**, **Nodal Escrow accounts**, and **Internal Ledgers**.

### Core Flow Loop
1. **Pay-In**: Capture funds in a regulated Escrow.
2. **Ledgers**: Calculate splits in internal database tables.
3. **Payouts**: Trigger Route APIs to move sub-allocations.
4. **Settlement**: Physical bank transfers completed at T+1.

---

## 🏗️ Adding a New Case

To add a new scenario, clone the [_template](https://github.com/VIKAS9793/FinTech-Hub/blob/main/cases/_template/case.md) folder into the appropriate tier subfolder (`tier-1-core/` or `tier-2-enterprise/`) and follow the documentation guidelines.

---

> [!CAUTION]
> ### Disclaimer
> The case studies, architectural designs, and business scenarios presented in this document are strictly for educational, demonstrative, and portfolio purposes.
> 
> Any references to real-world companies, financial institutions, payment gateways, or aggregators—including but not limited to Razorpay, ICICI Bank, SBI, or the National Payments Corporation of India (NPCI)—are used purely as illustrative examples to explain industry concepts and regulatory frameworks.
> 
> I am not affiliated with, sponsored by, or endorsed by any of these organizations. The technical solutions, state machines, and enterprise sales scenarios described herein are theoretical architectures designed independently to demonstrate system design and product management principles. They do not represent, expose, or reflect the actual proprietary internal architectures, codebase, enterprise sales processes, or official solutions of Razorpay or any other mentioned entity.
