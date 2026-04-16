/**
 * FinTech Hub - Case Study 01: Food Delivery Marketplace
 * =====================================================
 * Full orchestration covering:
 *   - Happy Path: Multi-party fund splitting
 *   - Sad Path A: Pre-settlement Transfer Reversal
 *   - Sad Path B: Post-settlement Future Offsetting + Negative Ledger
 */

// ─── Mock PA (Payment Aggregator) API ────────────────────────────────────────

const PA = {
  capturePayment: (amount) => {
    console.log(`[PA] CAPTURE: ₹${amount} → Nodal Escrow`);
    return { payment_id: "pay_abc_1000", status: "captured", escrow_balance: amount };
  },

  createTransfers: (paymentId, splits) => {
    console.log(`[PA] TRANSFER: Splitting ${paymentId} into sub-buckets...`);
    return splits.map((s, i) => ({
      transfer_id: `trf_${s.account}_${i}`,
      account: s.account,
      amount: s.amount,
      settled: false
    }));
  },

  reverseTransfer: (transferId, amount) => {
    // Only works if settlement has NOT run; escrow must have balance.
    console.log(`[PA] REVERSAL: Pulling ₹${amount} back from ${transferId}`);
    return { reversal_id: `rev_${transferId}`, status: "reversed" };
  },

  issueRefund: (paymentId, amount) => {
    console.log(`[PA] REFUND: ₹${amount} → User UPI from ${paymentId}`);
    return { refund_id: `ref_${paymentId}`, status: "succeeded" };
  },

  // Post-settlement helpers
  getUnsettledBalance: (accountId) => {
    // Simulates whether restaurant has ongoing unsettled funds today
    const mockBalances = { "acc_RestaurantX": 650, "acc_ClosedRestaurant": 0 };
    return mockBalances[accountId] ?? 0;
  },

  deductFromUnsettled: (accountId, amount) => {
    console.log(`[PA] OFFSET: Deducting ₹${amount} from ${accountId}'s rolling balance`);
    return { status: "deducted" };
  },

  pullFromRefundReserve: (amount, reason) => {
    console.log(`[PA] RESERVE: Pulling ₹${amount} from Platform Refund Reserve — Reason: ${reason}`);
    return { status: "reserve_used" };
  }
};

// ─── Mock Internal Ledger (DB) ────────────────────────────────────────────────

const Ledger = {
  db: { "acc_RestaurantX": 0 },

  recordDebt: (accountId, amount) => {
    Ledger.db[accountId] = (Ledger.db[accountId] || 0) - amount;
    console.log(`[LEDGER] NEGATIVE BALANCE: ${accountId} → ₹${Ledger.db[accountId]}`);
  },

  checkDebt: (accountId) => Ledger.db[accountId] || 0,

  clearDebt: (accountId, amount) => {
    Ledger.db[accountId] = Math.min(0, (Ledger.db[accountId] || 0) + amount);
    console.log(`[LEDGER] DEBT CLEARED: ${accountId} → Balance: ₹${Ledger.db[accountId]}`);
  }
};

// ─── Orchestration ─────────────────────────────────────────────────────────────

async function happyPath() {
  console.log("\n════ HAPPY PATH: INITIAL FUND SPLIT ════");
  const payment = PA.capturePayment(1000);
  const transfers = PA.createTransfers(payment.payment_id, [
    { account: "acc_RestaurantX", amount: 800 },
    { account: "acc_DriverY",     amount: 100 },
    { account: "acc_PlatformTax", amount: 100 },
  ]);
  return { payment, transfers };
}

async function sadPathA_PreSettlement(payment, transfers) {
  console.log("\n════ SAD PATH A: REFUND REQUEST (T+0 - Escrow Still Holding) ════");
  const restTransfer = transfers.find(t => t.account === "acc_RestaurantX");

  // Step 1: Reverse the restaurant's specific allocation
  PA.reverseTransfer(restTransfer.transfer_id, 200);

  // Step 2: Refund user from now-rebalanced main transaction
  PA.issueRefund(payment.payment_id, 200);

  console.log("[RESULT] Restaurant: ₹600 | Driver: ₹100 | User Refunded: ₹200 ✅");
}

async function sadPathB_PostSettlement(restaurantAccountId) {
  console.log("\n════ SAD PATH B: REFUND REQUEST (T+2 - Escrow is EMPTY) ════");
  console.log("[ERROR] Transfer Reversal → INSUFFICIENT_ESCROW_BALANCE");

  // Branch 1: Check restaurant's unsettled rolling balance
  const unsettledBalance = PA.getUnsettledBalance(restaurantAccountId);
  console.log(`[CHECK] ${restaurantAccountId} unsettled balance: ₹${unsettledBalance}`);

  if (unsettledBalance >= 200) {
    // Intercept from tonight's settlement
    PA.deductFromUnsettled(restaurantAccountId, 200);
    console.log("[RESULT] Refunded from rolling balance. Restaurant settled ₹200 less tonight. ✅");
  } else {
    // Branch 2: Use Platform Refund Reserve (Nodal Buffer)
    console.log("[BRANCH 2] No unsettled funds. Using Platform Refund Reserve...");
    PA.pullFromRefundReserve(200, "DISPUTE_PARTIAL_REFUND");
    console.log("[RESULT] User refunded instantly from Nodal Reserve. ✅");

    // Branch 3: Write Negative Ledger entry
    Ledger.recordDebt(restaurantAccountId, 200);
    console.log("[ALERT] Restaurant flagged with negative balance. Debt auto-recovered on next sale.");
  }
}

async function simulateFutureOffsetRecovery(restaurantAccountId) {
  console.log("\n════ T+3: RESTAURANT OPENS - FUTURE OFFSET RECOVERY ════");
  const newSettlement = 500; // Restaurant sells a ₹500 pizza
  const debt = Math.abs(Ledger.checkDebt(restaurantAccountId));

  if (debt > 0) {
    console.log(`[LEDGER ENGINE] Detected -₹${debt} debt for ${restaurantAccountId}`);
    console.log(`[PA] INTERCEPT: Deducting ₹${debt} from ₹${newSettlement} settlement...`);
    Ledger.clearDebt(restaurantAccountId, debt);
    console.log(`[PA] RESERVE: ₹${debt} replenished to Platform Refund Reserve. ✅`);
    console.log(`[PA] Restaurant receives: ₹${newSettlement - debt} (wired to HDFC)`);
  }
}

// ─── Run Simulation ───────────────────────────────────────────────────────────

(async () => {
  const { payment, transfers } = await happyPath();

  // Uncomment to simulate Pre-Settlement refund:
  // await sadPathA_PreSettlement(payment, transfers);

  // Simulating Post-Settlement (T+2) refund on open restaurant:
  await sadPathB_PostSettlement("acc_RestaurantX");

  // Simulate the restaurant selling food three days later:
  await simulateFutureOffsetRecovery("acc_RestaurantX");
})();
