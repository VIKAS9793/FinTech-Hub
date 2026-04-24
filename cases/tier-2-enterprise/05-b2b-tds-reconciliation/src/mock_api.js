(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
    return;
  }

  root.FinTechHubCase05 = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATE_CONSTANTS = {
    expectedAmount: 50000,
    supportedTdsRates: [0.1, 0.02],
    quarterEndSweepDays: 90,
  };

  const SCENARIOS = {
    full_payment: "full_payment",
    tds_10: "tds_10",
    tds_2: "tds_2",
    tds_missing_certificate: "tds_missing_certificate",
    invalid_short_pay: "invalid_short_pay",
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      setTimeout(resolve, milliseconds);
    });
  }

  function detectTdsRate(receivedAmount, expectedAmount, supportedRates) {
    const rates = supportedRates || STATE_CONSTANTS.supportedTdsRates;

    return rates.find(function (rate) {
      return Math.round(expectedAmount * (1 - rate)) === receivedAmount;
    }) || null;
  }

  function createInitialState() {
    return {
      scenarioId: null,
      expectedAmount: STATE_CONSTANTS.expectedAmount,
      receivedAmount: 0,
      detectedTdsRate: null,
      invoiceStatus: "UNPAID",
      accessState: "PENDING",
      tdsReceivable: 0,
      arrearsAmount: 0,
      nextInvoiceAmount: STATE_CONSTANTS.expectedAmount,
      quarterSweepStatus: "NOT_STARTED",
      reviewReason: null,
      finalStatus: "IDLE",
    };
  }

  function createLedgerSnapshot(state) {
    return {
      invoiceStatus: state.invoiceStatus,
      accessState: state.accessState,
      tdsReceivable: state.tdsReceivable,
      arrearsAmount: state.arrearsAmount,
      nextInvoiceAmount: state.nextInvoiceAmount,
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

  function resolveReceivedAmount(scenarioId) {
    if (scenarioId === SCENARIOS.tds_10 || scenarioId === SCENARIOS.tds_missing_certificate) {
      return 45000;
    }

    if (scenarioId === SCENARIOS.tds_2) {
      return 49000;
    }

    if (scenarioId === SCENARIOS.invalid_short_pay) {
      return 43000;
    }

    return 50000;
  }

  async function runScenario(scenarioId, hooks) {
    const state = createInitialState();
    const runtime = createRuntime(state, hooks);
    const resolvedScenario = SCENARIOS[scenarioId] ? scenarioId : SCENARIOS.full_payment;

    state.scenarioId = resolvedScenario;

    await runtime.emit({
      stepId: "s1",
      stepState: "active-step",
      badgeText: "Issuing",
    });
    await runtime.emit({
      type: "api",
      message: "Invoice INV-Q3-194J is generated for Rs 50,000 with Smart Collect collection rails enabled.",
    });
    await runtime.pause(2);
    await runtime.emit({
      stepId: "s1",
      stepState: "success",
      badgeText: "Done",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s2",
      stepState: "active-step",
      badgeText: "Crediting",
    });
    state.receivedAmount = resolveReceivedAmount(resolvedScenario);
    await runtime.emit({
      type: "api",
      message:
        "virtual_account.credited webhook received with amount Rs " +
        state.receivedAmount +
        ".",
    });
    await runtime.pause(2);
    await runtime.emit({
      stepId: "s2",
      stepState: "success",
      badgeText: "Received",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s3",
      stepState: "active-step",
      badgeText: "Checking",
    });
    state.detectedTdsRate = detectTdsRate(
      state.receivedAmount,
      state.expectedAmount,
      STATE_CONSTANTS.supportedTdsRates
    );
    await runtime.emit({
      type: "warn",
      message: "Tolerance engine comparing the webhook amount against supported statutory deduction bands.",
    });
    await runtime.pause(2);

    if (state.receivedAmount === state.expectedAmount) {
      state.invoiceStatus = "PERMANENTLY_CLOSED";
      state.accessState = "ACTIVE";
      state.finalStatus = "FULLY_PAID";
      await runtime.emit({
        type: "success",
        message: "Exact payment matched the invoice. No provisional logic or government follow-up is required.",
      });
      await runtime.emit({
        stepId: "s3",
        stepState: "success",
        badgeText: "Exact Match",
      });
      await runtime.emit({
        stepId: "s4",
        stepState: "success",
        badgeText: "Closed",
      });
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Closed",
        alert: {
          tone: "success",
          text: "The invoice was paid in full, so the SaaS account remained active and the ledger closed immediately.",
        },
      });
      return runtime.result();
    }

    if (state.detectedTdsRate !== null) {
      state.invoiceStatus = "PROVISIONALLY_PAID";
      state.accessState = "ACTIVE";
      state.tdsReceivable = state.expectedAmount - state.receivedAmount;
      await runtime.emit({
        type: "success",
        message:
          "Supported TDS rate detected at " +
          (state.detectedTdsRate * 100).toFixed(0) +
          "%. Invoice moved to PROVISIONALLY_PAID and product access stayed active.",
      });
      await runtime.emit({
        stepId: "s3",
        stepState: "success",
        badgeText: "TDS Match",
      });
      await runtime.pause(1);

      await runtime.emit({
        stepId: "s4",
        stepState: "active-step",
        badgeText: "Activating",
      });
      await runtime.emit({
        type: "api",
        message:
          "Ledger writes a TDS receivable for Rs " +
          state.tdsReceivable +
          " and emits invoice.provisionally_paid to keep access live.",
      });
      await runtime.pause(2);
      await runtime.emit({
        stepId: "s4",
        stepState: "success",
        badgeText: "Live",
      });
      await runtime.pause(1);

      await runtime.emit({
        stepId: "s5",
        stepState: "active-step",
        badgeText: "Sweeping",
      });
      state.quarterSweepStatus = "RUNNING";
      await runtime.emit({
        type: "warn",
        message:
          "Quarter-end TRACES sweep checks whether the client deposited the deducted tax under the platform PAN.",
      });
      await runtime.pause(2);

      if (resolvedScenario === SCENARIOS.tds_missing_certificate) {
        state.quarterSweepStatus = "MISSING";
        state.invoiceStatus = "SETTLED_WITH_ARREARS";
        state.arrearsAmount = state.tdsReceivable;
        state.nextInvoiceAmount += state.arrearsAmount;
        state.finalStatus = "ARREARS_INJECTED";
        await runtime.emit({
          type: "error",
          message:
            "Government sweep found no deposit proof. The receivable converts into arrears instead of suspending the client.",
        });
        await runtime.emit({
          stepId: "s5",
          stepState: "error",
          badgeText: "Missing",
        });
        await runtime.emit({
          stepId: "s6",
          stepState: "warn",
          badgeText: "Arrears",
          alert: {
            tone: "warn",
            text: "The invoice stayed serviceable, but Rs " +
              state.arrearsAmount +
              " was injected into the next bill as arrears.",
          },
        });
        return runtime.result();
      }

      state.quarterSweepStatus = "VERIFIED";
      state.invoiceStatus = "PERMANENTLY_CLOSED";
      state.tdsReceivable = 0;
      state.finalStatus = "TDS_VERIFIED";
      await runtime.emit({
        type: "success",
        message: "TRACES verification cleared the deduction, so the provisional state was upgraded to permanently closed.",
      });
      await runtime.emit({
        stepId: "s5",
        stepState: "success",
        badgeText: "Verified",
      });
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Closed",
        alert: {
          tone: "success",
          text: "The statutory deduction was verified and the invoice closed without any revenue leakage.",
        },
      });
      return runtime.result();
    }

    state.invoiceStatus = "MANUAL_REVIEW_REQUIRED";
    state.accessState = "HOLD";
    state.reviewReason = "OFF_BAND_SHORT_PAYMENT";
    state.finalStatus = "EXCEPTION_QUEUE";
    await runtime.emit({
      type: "error",
      message:
        "The short-payment did not match any supported statutory band, so it cannot be auto-cleared as TDS.",
    });
    await runtime.emit({
      stepId: "s3",
      stepState: "error",
      badgeText: "Off-Band",
    });
    await runtime.emit({
      stepId: "s4",
      stepState: "warn",
      badgeText: "Review",
    });
    await runtime.emit({
      stepId: "s6",
      stepState: "warn",
      badgeText: "Queued",
      alert: {
        tone: "error",
        text: "This payment needs manual finance review because it does not fit the approved TDS tolerance logic.",
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
      detectTdsRate: detectTdsRate,
    },
  };
});
