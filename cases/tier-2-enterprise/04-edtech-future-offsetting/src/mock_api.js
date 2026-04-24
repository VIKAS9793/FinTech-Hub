(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
    return;
  }

  root.FinTechHubCase04 = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATE_CONSTANTS = {
    reserveFloor: 250000,
    reserveStartingBalance: 1000000,
    coursePrice: 50000,
    tutorPayout: 45000,
    platformFee: 5000,
    debtAgeForAutodebitDays: 15,
  };

  const SCENARIOS = {
    reserve_only: "reserve_only",
    future_offset: "future_offset",
    aged_recovery: "aged_recovery",
    hostile_revocation: "hostile_revocation",
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      setTimeout(resolve, milliseconds);
    });
  }

  function calculateReserveExposure(refundAmount, tutorPayoutAmount) {
    return {
      reserveDrawdown: refundAmount,
      tutorDebt: tutorPayoutAmount,
      platformShareAbsorbed: refundAmount - tutorPayoutAmount,
    };
  }

  function createInitialState() {
    return {
      scenarioId: null,
      reserveBalance: STATE_CONSTANTS.reserveStartingBalance,
      debtOutstanding: 0,
      tutorCashReceived: 0,
      studentRefunded: 0,
      futureOffsetRecovered: 0,
      mandateStatus: "ACTIVE",
      iamStatus: "OPEN",
      legalNoticeStatus: "NONE",
      bureauStatus: "CLEAR",
      daysPastDue: 0,
      finalStatus: "IDLE",
    };
  }

  function createLedgerSnapshot(state) {
    return {
      reserveBalance: state.reserveBalance,
      debtOutstanding: state.debtOutstanding,
      daysPastDue: state.daysPastDue,
      finalStatus: state.finalStatus,
      mandateStatus: state.mandateStatus,
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
    const resolvedScenario = SCENARIOS[scenarioId] ? scenarioId : SCENARIOS.reserve_only;
    const exposure = calculateReserveExposure(
      STATE_CONSTANTS.coursePrice,
      STATE_CONSTANTS.tutorPayout
    );

    state.scenarioId = resolvedScenario;

    await runtime.emit({
      stepId: "s1",
      stepState: "active-step",
      badgeText: "Running",
    });
    await runtime.emit({
      type: "api",
      message: "Student pays Rs 50,000. The tutor receives Rs 45,000 instantly through the T0 path.",
    });
    state.tutorCashReceived = STATE_CONSTANTS.tutorPayout;
    await runtime.pause(2);
    await runtime.emit({
      type: "success",
      message: "The e-NACH recovery mandate is already active from onboarding before T0 payouts were enabled.",
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
      badgeText: "Refunding",
    });
    await runtime.emit({
      type: "error",
      message: "Day 6 refund hits after escrow is empty, so the reserve must absorb the customer promise.",
    });
    state.reserveBalance -= exposure.reserveDrawdown;
    state.studentRefunded = STATE_CONSTANTS.coursePrice;
    await runtime.pause(2);
    await runtime.emit({
      type: "warn",
      message:
        "Reserve drawdown: Rs " +
        exposure.reserveDrawdown +
        ". Platform fee loss absorbed: Rs " +
        exposure.platformShareAbsorbed +
        ".",
    });
    await runtime.emit({
      stepId: "s2",
      stepState: "warn",
      badgeText: "Reserve Used",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s3",
      stepState: "active-step",
      badgeText: "Writing Debt",
    });
    state.debtOutstanding = exposure.tutorDebt;
    await runtime.emit({
      type: "warn",
      message:
        "Negative ledger recorded against the tutor for Rs " +
        exposure.tutorDebt +
        ". Future sales now route into reserve recovery first.",
    });
    await runtime.pause(2);
    await runtime.emit({
      stepId: "s3",
      stepState: "success",
      badgeText: "Debt Live",
    });
    await runtime.pause(1);

    if (resolvedScenario === SCENARIOS.reserve_only) {
      state.finalStatus = "NEGATIVE_LEDGER_OPEN";
      await runtime.emit({
        stepId: "s6",
        stepState: "warn",
        badgeText: "Open Debt",
        alert: {
          tone: "warn",
          text: "The reserve saved the refund promise, but the tutor debt is still outstanding until a recovery path fires.",
        },
      });
      return runtime.result();
    }

    await runtime.emit({
      stepId: "s4",
      stepState: "active-step",
      badgeText: "Evaluating",
    });

    if (resolvedScenario === SCENARIOS.future_offset) {
      await runtime.emit({
        type: "api",
        message: "A new course sale lands the next week. Routing engine checks the negative ledger before payout.",
      });
      await runtime.pause(2);
      state.futureOffsetRecovered = STATE_CONSTANTS.tutorPayout;
      state.reserveBalance += STATE_CONSTANTS.tutorPayout;
      state.debtOutstanding = 0;
      state.finalStatus = "RECOVERED_BY_FUTURE_OFFSET";
      await runtime.emit({
        type: "success",
        message: "Rs 45,000 is intercepted from the new sale and pushed back into the reserve. Tutor payout is withheld for that transaction.",
      });
      await runtime.emit({
        stepId: "s4",
        stepState: "success",
        badgeText: "Recovered",
      });
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Closed",
        alert: {
          tone: "success",
          text: "Future offsetting replenished the reserve and cleared the tutor debt without manual chasing.",
        },
      });
      return runtime.result();
    }

    state.daysPastDue =
      resolvedScenario === SCENARIOS.aged_recovery
        ? STATE_CONSTANTS.debtAgeForAutodebitDays
        : 10;
    await runtime.emit({
      type: "warn",
      message:
        "No replacement sale arrived. Debt aged to " + state.daysPastDue + " days and offsetting is no longer enough.",
    });
    await runtime.pause(2);
    await runtime.emit({
      stepId: "s4",
      stepState: "warn",
      badgeText: "Aged Debt",
    });
    await runtime.pause(1);

    await runtime.emit({
      revealStepIds: ["s5"],
    });
    await runtime.emit({
      stepId: "s5",
      stepState: "active-step",
      badgeText: "Recovering",
    });

    if (resolvedScenario === SCENARIOS.aged_recovery) {
      await runtime.emit({
        type: "api",
        message: "e-NACH recovery fires on day 15 because the debt remained negative for the full aging window.",
      });
      await runtime.pause(2);
      state.reserveBalance += STATE_CONSTANTS.tutorPayout;
      state.debtOutstanding = 0;
      state.mandateStatus = "DEBIT_SUCCESS";
      state.finalStatus = "RECOVERED_BY_AUTODEBIT";
      await runtime.emit({
        type: "success",
        message: "Auto-debit recovered Rs 45,000 directly from the tutor bank account back into the reserve.",
      });
      await runtime.emit({
        stepId: "s5",
        stepState: "success",
        badgeText: "Auto-Debit OK",
      });
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Closed",
        alert: {
          tone: "success",
          text: "Forced recovery closed the debt after the tutor never generated a replacement sale.",
        },
      });
      return runtime.result();
    }

    await runtime.emit({
      type: "error",
      message: "NPCI webhook reports mandate.revoked while the tutor still owes reserve debt.",
    });
    await runtime.pause(2);
    state.mandateStatus = "REVOKED_HOSTILE";
    state.iamStatus = "LOCKED";
    state.legalNoticeStatus = "DRAFTED_FOR_REVIEW";
    state.bureauStatus = "REPORTING_REVIEW";
    state.finalStatus = "HOSTILE_REVOCATION_ESCALATED";
    await runtime.emit({
      type: "warn",
      message: "Containment fired: IAM hold applied, legal evidence pack drafted, and bureau-reporting eligibility queued for review.",
    });
    await runtime.emit({
      stepId: "s5",
      stepState: "error",
      badgeText: "Escalated",
    });
    await runtime.emit({
      stepId: "s6",
      stepState: "warn",
      badgeText: "Debt Open",
      alert: {
        tone: "error",
        text: "Hostile revocation severed the recovery rail, so the platform escalated enforcement and kept the debt open.",
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
      calculateReserveExposure: calculateReserveExposure,
    },
  };
});
