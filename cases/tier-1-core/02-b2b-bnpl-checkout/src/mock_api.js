// Case 02: B2B BNPL Checkout — Distributed Saga Simulator
// All entities are generic. No third-party names used.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- STATE ---
const STATE = {
  loanStatus: "IDLE",
  mandateStatus: "INACTIVE",
  consentStatus: "INACTIVE",
  umrn: null,
  consentHandleId: null,
};

// --- LOGGER ---
function log(msg, type = "info") {
  if (typeof window !== "undefined" && window.termLog) {
    window.termLog(msg, type);
  }
}

// ============================================================
// STEP 1: Account Aggregator — Consent & Data Fetch
// ============================================================
async function fetchAAConsent() {
  log("AA SDK: Triggering consent request...", "api");
  await sleep(600);
  STATE.consentHandleId = "CH-" + Math.random().toString(36).substr(2, 12).toUpperCase();
  STATE.consentStatus = "ACTIVE";
  log(`AA: Consent Artefact generated. ID: ${STATE.consentHandleId}`, "success");
  await sleep(400);
  log("AA: Fetching 6-month bank statement via encrypted pipe...", "api");
  await sleep(800);
  log("AA: Bank data decrypted & delivered to NBFC underwriter.", "success");
}

// ============================================================
// STEP 2: AI Underwriting Engine
// ============================================================
async function runUnderwriting() {
  log("LOS: AI Underwriting Engine processing bank statement...", "api");
  await sleep(500);
  log("LOS Rule Engine: Avg balance ✓  |  Bounce rate ✓  |  Cash flow ✓", "info");
  await sleep(500);
  STATE.loanStatus = "APPROVED";
  log("LOS: credit_approved: true | Loan ID: LN-20260415-001", "success");
}

// ============================================================
// STEP 3: UPI AutoPay Mandate Registration
// ============================================================
async function registerMandate() {
  log("NPCI: Initiating UPI AutoPay mandate request (₹10,000/month)...", "api");
  await sleep(700);
  STATE.umrn = "NPCI" + Math.random().toString(36).substr(2, 16).toUpperCase();
  STATE.mandateStatus = "ACTIVE";
  log(`NPCI: mandate.success webhook received.`, "success");
  log(`NPCI: UMRN: ${STATE.umrn}`, "success");
}

// ============================================================
// STEP 4A: Disbursal — HAPPY PATH
// ============================================================
async function disburseHappy() {
  log("SPONSOR BANK: Firing NEFT transfer ₹50,000 to Supplier account...", "api");
  await sleep(1000);
  STATE.loanStatus = "DISBURSED";
  log("SPONSOR BANK: NEFT_SUCCESS. Funds received by Supplier.", "success");
  log("LSP: Order status → CONFIRMED.", "success");
}

// ============================================================
// STEP 4B: Disbursal — SAD PATH (Bank Outage)
// + 5-Step Compensating Saga Rollback
// ============================================================
async function disburseSadPath() {
  log("SPONSOR BANK: Firing NEFT transfer ₹50,000 to Supplier account...", "api");
  await sleep(1200);
  log("SPONSOR BANK: DISBURSAL_FAILED_BENEFICIARY_BANK_OFFLINE", "error");
  STATE.loanStatus = "DISBURSAL_FAILED";
  await sleep(500);

  // --- SAGA INITIATED ---
  log("--- SAGA ORCHESTRATOR: Cleanup Sequence Initiated ---", "warn");
  await sleep(500);

  // STEP 1: State interception
  log("STATE: loan → DISBURSAL_FAILED | mandate → REVOCATION_PENDING", "warn");

  // STEP 2: Mandate Revocation
  await sleep(700);
  log("NPCI: POST /v1/mandates/revoke { umrn, reason: LOAN_DISBURSAL_FAILURE }", "api");
  await sleep(800);
  STATE.mandateStatus = "REVOKED";
  log("NPCI: Mandate REVOKED. User SMS sent: 'AutoPay mandate cancelled.'", "success");

  // STEP 3: Consent Revocation
  await sleep(500);
  log(`AA: DELETE /v2/consents/${STATE.consentHandleId} { reason: LOAN_NOT_DISBURSED }`, "api");
  await sleep(700);
  STATE.consentStatus = "REVOKED";
  log("AA: Consent Artefact REVOKED. Data pipe severed. DPDP compliant.", "success");

  // STEP 4: NBFC LOS Reconciliation
  await sleep(500);
  log("NBFC LOS: Sending loan_cancelled_pre_disbursal webhook...", "api");
  await sleep(600);
  STATE.loanStatus = "CANCELLED_PRE_DISBURSAL";
  log("NBFC LOS: Loan ID voided. Ledger clean for RBI audit.", "success");

  // STEP 5: UX Recovery (handled by index.html)
  await sleep(400);
  log("LSP: Rendering graceful degradation UI for user.", "info");
  log("--- SAGA COMPLETE. Zero orphaned records. ---", "warn");
}

// --- EXPORTS ---
if (typeof module !== "undefined" && module.exports) {
  module.exports = { fetchAAConsent, runUnderwriting, registerMandate, disburseHappy, disburseSadPath, STATE, sleep };
}
