# Case Study 02: Embedded Finance (B2B BNPL Checkout)

<div style="background-color: #FDFBFF; padding: 20px; border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.04); border: 1px solid #E1E2EC; max-width: 850px; margin: 24px 0;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px;">
    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" src="https://www.youtube.com/embed/n2giIhc5OMY?rel=0" title="BNPL Checkout Saga Demo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
</div>

## 📝 Business Narrative
We are consulting for a massive B2B E-commerce platform. Small retailers frequently add ₹50,000 worth of wholesale inventory to their carts but abandon the purchase at checkout due to a lack of immediate working capital.

To combat this, the platform is introducing a **Checkout Credit (BNPL)** button.

### Regulatory Constraint: Digital Lending Guidelines (DLG)
Because the platform acts solely as a Loan Service Provider (LSP), **they cannot lend their own money or let the loan funds touch their corporate accounts**. They have partnered with a regulated NBFC (Non-Banking Financial Company) to supply the capital.

The CEO has issued a strict mandate: **The entire flow—from clicking BNPL, verifying bank data, completing AI underwriting, setting up repayment mandates, and confirming the order—must execute in under 30 seconds.**

## 🏢 Stakeholders
- **Retailer (User):** Needs ₹50,000 credit instantly at checkout.
- **B2B E-commerce Platform (LSP):** The frontend interface; must never touch the actual loan funds.
- **NBFC (Lender):** Provides the ₹50,000 capital and the AI underwriting engine.
- **Sponsor Bank:** The bank executing the final NEFT disbursal.
- **Supplier (Seller):** The merchant receiving the ₹50,000 for the goods.

---

## ⚡ The 30-Second API Pipeline (Happy Path)

### Step 1: The Instant Data Fetch (Seconds 0-10)
The user clicks BNPL. We instantly trigger the **Account Aggregator (AA)** SDK.
- **UI:** "Share 6 months of bank statements with our lending partner." User enters UPI PIN to approve the Consent Artefact.
- **Backend:** The user's bank encrypts the data and routes it via the AA. The NBFC decrypts it.

### Step 2: AI Underwriting (Seconds 10-15)
- **Backend:** The NBFC's AI engine parses the raw JSON bank statements, verifying average monthly balance, cheque bounce history, and business cash flow.
- **State:** The AI fires a `credit_approved: true` webhook to the Loan Origination System (LOS).

### Step 3: The Collection Mandate (Seconds 15-25)
- **UI:** "Approve a ₹10,000 EMI deduction for the 5th of every month." User approves via their preferred UPI App.
- **Backend:** The NPCI returns a `mandate.success` webhook containing the **UMRN (Unique Mandate Reference Number)**.

### Step 4: DLG-Compliant Disbursal (Seconds 25-30)
- **Backend:** The NBFC fires an API directly to their Sponsor Bank, wiring the ₹50,000 *directly* to the Supplier's account. This ensures strict DLG compliance.
- **UI:** "Order Confirmed!"

---

## 🔥 The Architect's Challenge: Disbursal Failure

You engineer a flawless 30-second Happy Path. But what happens during a severe bank outage?

**The Scenario:**
The retailer reaches Step 4. They have provided their data, passed underwriting, and **successfully registered an active UPI AutoPay mandate with the NPCI.**
However, the Sponsor Bank's core banking system experiences a severe timeout. The NEFT fails, returning: `DISBURSAL_FAILED_BENEFICIARY_BANK_OFFLINE`.

The order cannot be placed, and the goods will not ship.

### The Disaster Constraints
1. **The Active Mandate Liability:** The user's UPI mandated is locked and active. If the system does nothing, on the 5th of next month, the user's bank will automatically deduct a ₹10,000 EMI for a loan they never received. This is a severe compliance violation.
2. **Zero-Touch Rule:** You **cannot** ask the user to manually cancel the mandate inside their payment app. It is poor UX, and manual intervention risks lawsuits if forgotten.
3. **Automated Recovery:** The system must recognize the failure at the tail-end of the pipeline and programmatically reverse the state.
