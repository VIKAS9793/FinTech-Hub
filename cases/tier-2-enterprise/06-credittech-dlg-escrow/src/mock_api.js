(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
    return;
  }

  root.FinTechHubCase06 = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATE_CONSTANTS = {
    loanAmount: 20000,
    emiAmount: 2000,
    maxRetries: 2,
    lateFeeAmount: 250,
  };

  const SCENARIOS = {
    autopay_success: "autopay_success",
    fallback_paid: "fallback_paid",
    late_fee: "late_fee",
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      setTimeout(resolve, milliseconds);
    });
  }

  function calculateLateFee(overdueDays) {
    return overdueDays >= 3 ? STATE_CONSTANTS.lateFeeAmount : 0;
  }

  function createInitialState() {
    return {
      scenarioId: null,
      loanId: "loan9876",
      nbfcEscrowBalance: 1000000,
      studentBankBalance: 0,
      disbursalStatus: "PENDING",
      mandateStatus: "ACTIVE",
      collectionStatus: "PENDING",
      retriesRemaining: STATE_CONSTANTS.maxRetries,
      vpaStatus: "NOT_CREATED",
      vpaId: null,
      overdueDays: 0,
      lateFeeAmount: 0,
      finalStatus: "IDLE",
    };
  }

  function createLedgerSnapshot(state) {
    return {
      disbursalStatus: state.disbursalStatus,
      collectionStatus: state.collectionStatus,
      retriesRemaining: state.retriesRemaining,
      vpaStatus: state.vpaStatus,
      lateFeeAmount: state.lateFeeAmount,
      finalStatus: state.finalStatus,
    };
  }

  function createRuntime(state, hooks) {
    const events = [];
    const resolvedHooks = hooks || {};
    const sleepMs = typeof resolvedHooks.sleepMs === "number" ? resolvedHooks.sleepMs : 350;

    async function emit(event) {
      const enriched = Object.assign({ type: "info" }, event, {
        snapshot: clone(state),
        index: events.length,
      });

      events.push(enriched);

      if (typeof resolvedHooks.onEvent === "function") {
        resolvedHooks.onEvent(enriched);
      }

      if (enriched.message && typeof resolvedHooks.log === "function") {
        resolvedHooks.log(enriched);
      }

      return enriched;
    }

    async function pause(multiplier) {
      if (sleepMs <= 0) {
        return;
      }

      await sleep(sleepMs * (multiplier || 1));
    }

    return {
      state: state,
      emit: emit,
      pause: pause,
      result: function () {
        return {
          finalState: clone(state),
          ledgerSnapshot: createLedgerSnapshot(state),
          events: events.slice(),
        };
      },
    };
  }

  async function runScenario(scenarioId, hooks) {
    const state = createInitialState();
    const runtime = createRuntime(state, hooks);
    const resolvedScenario = SCENARIOS[scenarioId] ? scenarioId : SCENARIOS.autopay_success;

    state.scenarioId = resolvedScenario;

    await runtime.emit({
      stepId: "s1",
      stepState: "active-step",
      badgeText: "Disbursing",
    });
    await runtime.emit({
      type: "api",
      message: "Scoped payout key triggers IMPS directly from NBFC escrow to the borrower bank account.",
    });
    state.nbfcEscrowBalance -= STATE_CONSTANTS.loanAmount;
    state.studentBankBalance += STATE_CONSTANTS.loanAmount;
    state.disbursalStatus = "DISBURSED";
    await runtime.pause(2);
    await runtime.emit({
      type: "success",
      message: "Principal moved without ever touching the LSP operating account.",
    });
    await runtime.emit({
      stepId: "s1",
      stepState: "success",
      badgeText: "Done",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s2",
      stepState: "active-step",
      badgeText: "Pulling",
    });
    await runtime.emit({
      type: "api",
      message: "EMI due date arrived. NPCI pull request fired for Rs 2,000 under the active AutoPay mandate.",
    });
    await runtime.pause(2);

    if (resolvedScenario === SCENARIOS.autopay_success) {
      state.collectionStatus = "PAID";
      state.finalStatus = "COLLECTED_BY_AUTOPAY";
      state.nbfcEscrowBalance += STATE_CONSTANTS.emiAmount;
      await runtime.emit({
        type: "success",
        message: "mandate.success received. Funds settled straight into NBFC escrow and the loan row flipped to PAID.",
      });
      await runtime.emit({
        stepId: "s2",
        stepState: "success",
        badgeText: "Paid",
      });
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Closed",
        alert: {
          tone: "success",
          text: "Collections closed through AutoPay with no manual borrower action and no reconciliation ambiguity.",
        },
      });
      return runtime.result();
    }

    state.collectionStatus = "MANDATE_FAILED";
    await runtime.emit({
      type: "error",
      message: "mandate.failed returned insufficient funds on the borrower account.",
    });
    await runtime.emit({
      stepId: "s2",
      stepState: "error",
      badgeText: "Failed",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s3",
      stepState: "active-step",
      badgeText: "Retrying",
    });
    state.retriesRemaining = STATE_CONSTANTS.maxRetries - 1;
    await runtime.emit({
      type: "warn",
      message: "Collections engine schedules a retry before downgrading into the manual rail.",
    });
    await runtime.pause(2);

    if (resolvedScenario === SCENARIOS.fallback_paid) {
      await runtime.emit({
        type: "warn",
        message: "Retry still finds low balance, so the system pivots to Smart Collect instead of waiting indefinitely.",
      });
      await runtime.emit({
        stepId: "s3",
        stepState: "warn",
        badgeText: "Fallback",
      });
      await runtime.pause(1);

      await runtime.emit({
        stepId: "s4",
        stepState: "active-step",
        badgeText: "Issuing VPA",
      });
      state.vpaStatus = "GENERATED";
      state.vpaId = "swiftcred.loan9876@razorpay";
      await runtime.emit({
        type: "api",
        message:
          "Smart Collect generated " +
          state.vpaId +
          " locked to exactly Rs 2,000 for the missed EMI.",
      });
      await runtime.pause(2);
      await runtime.emit({
        type: "success",
        message: "Borrower pays the VPA and the webhook arrives with reference_id: loan9876.",
      });
      state.collectionStatus = "PAID";
      state.vpaStatus = "SETTLED";
      state.finalStatus = "COLLECTED_BY_VPA";
      state.nbfcEscrowBalance += STATE_CONSTANTS.emiAmount;
      await runtime.emit({
        stepId: "s4",
        stepState: "success",
        badgeText: "Webhook OK",
      });
      await runtime.emit({
        stepId: "s5",
        stepState: "success",
        badgeText: "Reconciled",
      });
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Closed",
        alert: {
          tone: "success",
          text: "The failed AutoPay rail fell back to a deterministic VPA and still reconciled without UTR guesswork.",
        },
      });
      return runtime.result();
    }

    state.retriesRemaining = 0;
    await runtime.emit({
      type: "error",
      message: "Retries exhausted. The loan now needs manual catch-up rails plus delinquency handling.",
    });
    await runtime.emit({
      stepId: "s3",
      stepState: "error",
      badgeText: "Exhausted",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s4",
      stepState: "active-step",
      badgeText: "VPA Open",
    });
    state.vpaStatus = "GENERATED";
    state.vpaId = "swiftcred.loan9876@razorpay";
    await runtime.emit({
      type: "warn",
      message: "Manual fallback VPA was generated, but the borrower still did not pay through the catch-up channel.",
    });
    await runtime.pause(2);
    await runtime.emit({
      stepId: "s4",
      stepState: "warn",
      badgeText: "Unpaid",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s5",
      stepState: "active-step",
      badgeText: "Assessing",
    });
    state.overdueDays = 4;
    state.lateFeeAmount = calculateLateFee(state.overdueDays);
    state.collectionStatus = "OVERDUE";
    state.finalStatus = "LATE_FEE_APPLIED";
    await runtime.emit({
      type: "error",
      message:
        "Loan crossed into " +
        state.overdueDays +
        " days past due, so late fee Rs " +
        state.lateFeeAmount +
        " was injected into the ledger.",
    });
    await runtime.pause(2);
    await runtime.emit({
      stepId: "s5",
      stepState: "error",
      badgeText: "Late Fee",
    });
    await runtime.emit({
      stepId: "s6",
      stepState: "warn",
      badgeText: "Overdue",
      alert: {
        tone: "error",
        text: "AutoPay failed, retries exhausted, VPA remained unpaid, and the loan moved into overdue collections with a late fee.",
      },
    });

    return runtime.result();
  }

  return {
    SCENARIOS: SCENARIOS,
    STATE_CONSTANTS: STATE_CONSTANTS,
    resetState: createInitialState,
    runScenario: runScenario,
    scenarioHelpers: {
      calculateLateFee: calculateLateFee,
    },
  };
});
