(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
    return;
  }

  root.FinTechHubCase07 = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATE_CONSTANTS = {
    subscriptionAmount: 999,
    scheduledRenewals: 1000000,
    timeoutCohortSize: 50000,
    commercialGraceDays: 3,
    rbiMerchantTatDays: 5,
  };

  const SCENARIOS = {
    system_pending_success: "system_pending_success",
    user_failure_recovered: "user_failure_recovered",
    unresolved_suspended: "unresolved_suspended",
    mandate_revoked: "mandate_revoked",
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      setTimeout(resolve, milliseconds);
    });
  }

  function createInitialState() {
    return {
      scenarioId: null,
      attemptState: "NOT_STARTED",
      entitlementState: "ACTIVE_PRE_RENEWAL",
      mandateState: "ACTIVE",
      recoveryRail: "UPI_AUTOPAY",
      retryBlocked: false,
      atRiskAmount: 0,
      collectedAmount: 0,
      exposureBucket: "NONE",
      resolutionSource: "NONE",
      graceDay: 0,
      rbiTatDay: 0,
      finalStatus: "IDLE",
    };
  }

  function createLedgerSnapshot(state) {
    return {
      attemptState: state.attemptState,
      entitlementState: state.entitlementState,
      mandateState: state.mandateState,
      recoveryRail: state.recoveryRail,
      retryBlocked: state.retryBlocked,
      atRiskAmount: state.atRiskAmount,
      collectedAmount: state.collectedAmount,
      exposureBucket: state.exposureBucket,
      resolutionSource: state.resolutionSource,
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

  async function sendPreDebitNotification(runtime) {
    const state = runtime.state;

    await runtime.emit({
      stepId: "s1",
      stepState: "active-step",
      badgeText: "T-1",
    });
    await runtime.emit({
      type: "api",
      message: "Issuer pre-debit notification sent at least 24 hours before the Rs 999 recurring pull.",
    });
    state.attemptState = "PRE_DEBIT_NOTIFIED";
    await runtime.pause(1);
    await runtime.emit({
      type: "success",
      message: "Mandate is active. First transaction/AFA setup happened earlier; this renewal stays below the recurring debit threshold.",
    });
    await runtime.emit({
      stepId: "s1",
      stepState: "success",
      badgeText: "Notified",
    });
  }

  async function fireRenewalPull(runtime) {
    const state = runtime.state;

    await runtime.pause(1);
    await runtime.emit({
      stepId: "s2",
      stepState: "active-step",
      badgeText: "Pulling",
    });
    state.attemptState = "REQUEST_SENT";
    await runtime.emit({
      type: "api",
      message: "Billing engine fires the Day 1 UPI AutoPay pull with a unique attempt_id and provider_ref.",
    });
    await runtime.pause(1);
  }

  async function enterSystemPending(runtime) {
    const state = runtime.state;

    state.attemptState = "SYSTEM_PENDING";
    state.entitlementState = "SYSTEM_PENDING_ACCESS";
    state.retryBlocked = true;
    state.atRiskAmount = STATE_CONSTANTS.subscriptionAmount;
    state.exposureBucket = "BANK_OR_SWITCH_AMBIGUITY";
    state.rbiTatDay = 1;

    await runtime.emit({
      type: "warn",
      message: "PSP returns timeout. No debit truth exists yet, so the user keeps access but the retry rail is locked.",
    });
    await runtime.emit({
      stepId: "s2",
      stepState: "warn",
      badgeText: "Unknown",
    });
    await runtime.emit({
      stepId: "s3",
      stepState: "active-step",
      badgeText: "Barrier",
    });
    await runtime.pause(1);
  }

  async function enterUserFailure(runtime) {
    const state = runtime.state;

    state.attemptState = "USER_FAILURE";
    state.entitlementState = "GRACE_ACTIVE_USER_FAILURE";
    state.atRiskAmount = STATE_CONSTANTS.subscriptionAmount;
    state.exposureBucket = "CUSTOMER_SIDE_RECOVERY";
    state.graceDay = 1;

    await runtime.emit({
      type: "error",
      message: "Issuer returns deterministic insufficient-funds failure. Commercial D+3 grace opens as a receivable.",
    });
    await runtime.emit({
      stepId: "s2",
      stepState: "error",
      badgeText: "Failed",
    });
    await runtime.emit({
      stepId: "s4",
      stepState: "active-step",
      badgeText: "Grace D+1",
    });
    await runtime.pause(1);
  }

  async function resolveSystemSuccess(runtime) {
    const state = runtime.state;

    await runtime.emit({
      type: "api",
      message: "Async resolver polls PSP status and settlement recon before the merchant-payment TAT window expires.",
    });
    await runtime.pause(2);

    state.attemptState = "DEBIT_SUCCESS";
    state.entitlementState = "ACTIVE_PAID";
    state.retryBlocked = false;
    state.atRiskAmount = 0;
    state.collectedAmount = STATE_CONSTANTS.subscriptionAmount;
    state.exposureBucket = "CLEARED";
    state.resolutionSource = "PSP_STATUS_POLL";
    state.finalStatus = "RECOVERED_BY_RECON";

    await runtime.emit({
      type: "success",
      message: "Delayed debit truth arrives: original pull settled. No duplicate pull or manual pay link was fired.",
    });
    await runtime.emit({
      stepId: "s3",
      stepState: "success",
      badgeText: "Resolved",
      alert: {
        tone: "success",
        text: "System ambiguity cleared through reconciliation. Access stayed live and revenue was booked only after receipt truth arrived.",
      },
    });
  }

  async function recoverUserFailure(runtime) {
    const state = runtime.state;

    await runtime.emit({
      type: "warn",
      message: "Recovery engine offers controlled retry and one-time pay link because the failure is customer-side, not system-ambiguous.",
    });
    await runtime.pause(2);

    state.attemptState = "DEBIT_SUCCESS";
    state.entitlementState = "ACTIVE_PAID";
    state.atRiskAmount = 0;
    state.collectedAmount = STATE_CONSTANTS.subscriptionAmount;
    state.exposureBucket = "CLEARED";
    state.resolutionSource = "GRACE_RECOVERY_LINK";
    state.finalStatus = "RECOVERED_WITHIN_GRACE";
    state.graceDay = 2;

    await runtime.emit({
      type: "success",
      message: "User pays within D+3. Grace receivable is cleared and the entitlement returns to ACTIVE_PAID.",
    });
    await runtime.emit({
      stepId: "s4",
      stepState: "success",
      badgeText: "Recovered",
      alert: {
        tone: "success",
        text: "Customer-side failure recovered inside commercial grace. Revenue is protected without premature suspension.",
      },
    });
  }

  async function suspendUnresolved(runtime) {
    const state = runtime.state;

    await runtime.emit({
      type: "api",
      message: "Resolver reaches the applicable failed-transaction window without a success receipt. The original attempt cannot be treated as paid.",
    });
    await runtime.pause(2);

    state.attemptState = "UNRESOLVED_TILL_TAT";
    state.entitlementState = "SUSPENDED";
    state.retryBlocked = false;
    state.atRiskAmount = STATE_CONSTANTS.subscriptionAmount;
    state.exposureBucket = "FALSE_GRACE_LEAKAGE";
    state.resolutionSource = "TAT_EXPIRED_NO_SUCCESS";
    state.finalStatus = "SUSPENDED_UNPAID";
    state.rbiTatDay = STATE_CONSTANTS.rbiMerchantTatDays;

    await runtime.emit({
      type: "error",
      message: "No deterministic debit truth arrived. Access is suspended and the Rs 999 exposure remains visible to finance.",
    });
    await runtime.emit({
      stepId: "s3",
      stepState: "error",
      badgeText: "Expired",
    });
    await runtime.emit({
      stepId: "s6",
      stepState: "error",
      badgeText: "Suspended",
      alert: {
        tone: "error",
        text: "The system did not convert ambiguity into paid revenue. The exposure remains tracked instead of disappearing inside active-subscriber metrics.",
      },
    });
  }

  async function handleMandateRevoked(runtime) {
    const state = runtime.state;

    await runtime.emit({
      stepId: "s5",
      stepState: "active-step",
      badgeText: "Revoked",
    });
    await runtime.emit({
      type: "warn",
      message: "Day 2 mandate.revoked webhook received. Silent retries stop and the account becomes non_renewable.",
    });

    state.mandateState = "REVOKED";
    state.entitlementState = "MANDATE_REVOKED_GRACE";
    state.recoveryRail = "RECONSENT_OR_ONE_TIME_PAY";
    state.retryBlocked = true;
    state.atRiskAmount = STATE_CONSTANTS.subscriptionAmount;
    state.exposureBucket = "CHURN_INTENT";
    state.graceDay = 2;
    await runtime.pause(2);

    await runtime.emit({
      type: "api",
      message: "Only two recovery rails remain: create a fresh mandate or complete a one-time payment before D+3 expiry.",
    });
    await runtime.pause(1);

    state.entitlementState = "SUSPENDED";
    state.finalStatus = "MANDATE_REVOKED_SUSPENDED";
    state.resolutionSource = "GRACE_EXPIRED_NO_RECONSENT";
    state.graceDay = STATE_CONSTANTS.commercialGraceDays;

    await runtime.emit({
      type: "error",
      message: "Grace expiry reached without re-consent or manual payment. Access is suspended and future AutoPay remains blocked.",
    });
    await runtime.emit({
      stepId: "s5",
      stepState: "error",
      badgeText: "No consent",
    });
    await runtime.emit({
      stepId: "s6",
      stepState: "error",
      badgeText: "Suspended",
      alert: {
        tone: "error",
        text: "Revocation is treated as churn intent. The user kept the promised grace window, but the account cannot coast into another cycle.",
      },
    });
  }

  async function runScenario(scenarioId, hooks) {
    const state = createInitialState();
    const runtime = createRuntime(state, hooks);
    const resolvedScenario = SCENARIOS[scenarioId] ? scenarioId : SCENARIOS.system_pending_success;

    state.scenarioId = resolvedScenario;

    await sendPreDebitNotification(runtime);
    await fireRenewalPull(runtime);

    if (resolvedScenario === SCENARIOS.user_failure_recovered) {
      await enterUserFailure(runtime);
      await recoverUserFailure(runtime);
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Paid",
      });
      return runtime.result();
    }

    await enterSystemPending(runtime);

    if (resolvedScenario === SCENARIOS.system_pending_success) {
      await resolveSystemSuccess(runtime);
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Paid",
      });
      return runtime.result();
    }

    if (resolvedScenario === SCENARIOS.mandate_revoked) {
      await handleMandateRevoked(runtime);
      return runtime.result();
    }

    await suspendUnresolved(runtime);
    return runtime.result();
  }

  function resetState() {
    return createInitialState();
  }

  return {
    STATE_CONSTANTS: STATE_CONSTANTS,
    SCENARIOS: SCENARIOS,
    resetState: resetState,
    runScenario: runScenario,
    createInitialState: createInitialState,
    createLedgerSnapshot: createLedgerSnapshot,
  };
});
