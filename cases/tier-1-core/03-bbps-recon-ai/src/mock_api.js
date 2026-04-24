(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
    return;
  }

  root.FinTechHubCase03 = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATE_CONSTANTS = {
    confidenceThreshold: 0.95,
    suspenseState: "PENDING_BATCH_RECON",
    manualReviewState: "MANUAL_REVIEW_REQUIRED",
    batchCutoffLabel: "02:00 IST",
  };

  const SCENARIOS = {
    sync_clear: "sync_clear",
    batch_match: "batch_match",
    batch_refund: "batch_refund",
    low_confidence: "low_confidence",
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
      transactionId: "TXN-99812A",
      billerId: "SEB-KOL-771",
      amount: 10000,
      suspenseLedger: 10000,
      maskedPayload: null,
      billerApiStatus: "NOT_STARTED",
      billerLedgerStatus: "UNKNOWN",
      proposedAction: null,
      confidenceScore: null,
      barrierState: "IDLE",
      executionStatus: "IDLE",
      finalAction: "NONE",
      outcomeStatus: "PENDING",
      settlementFired: false,
      refundFired: false,
      reviewReason: null,
      adapterMode: "mock",
    };
  }

  function createLedgerSnapshot(state) {
    return {
      suspenseLedger: state.suspenseLedger,
      billerLedgerStatus: state.billerLedgerStatus,
      finalAction: state.finalAction,
      outcomeStatus: state.outcomeStatus,
      barrierState: state.barrierState,
    };
  }

  function tokenizeTransaction(rawTransaction) {
    return {
      tx_hash: "tx_hash_a12f9c",
      user_hash: "user_hash_8f9a2b",
      phone_hash: "phone_hash_b1c9x7",
      amount: rawTransaction.amount,
      biller_id: rawTransaction.billerId,
      partial_reference: rawTransaction.transactionId.slice(-6),
    };
  }

  function createMockBrainAdapter() {
    return {
      name: "mock-brain-v1",
      async decide(maskedPayload, context) {
        if (context.scenarioId === SCENARIOS.sync_clear) {
          return {
            matchFound: true,
            suggestedAction: "SETTLE",
            confidenceScore: 0.99,
            rationale: "Realtime API confirms the biller ledger already posted the payment.",
            maskedPayload: maskedPayload,
          };
        }

        if (context.scenarioId === SCENARIOS.low_confidence) {
          return {
            matchFound: true,
            suggestedAction: "SETTLE",
            confidenceScore: 0.74,
            rationale: "Signals are mixed across partial references and timestamp drift.",
            maskedPayload: maskedPayload,
          };
        }

        if (context.phase === "batch_followup" && context.scenarioId === SCENARIOS.batch_match) {
          return {
            matchFound: true,
            suggestedAction: "SETTLE",
            confidenceScore: 0.99,
            rationale: "The SFTP batch row confirms the offline ledger posted the payment.",
            maskedPayload: maskedPayload,
          };
        }

        if (context.phase === "batch_followup" && context.scenarioId === SCENARIOS.batch_refund) {
          return {
            matchFound: false,
            suggestedAction: "REFUND_TO_USER",
            confidenceScore: 0.99,
            rationale: "No matching offline ledger row exists, so the refund can be executed safely.",
            maskedPayload: maskedPayload,
          };
        }

        return {
          matchFound: false,
          suggestedAction: "REFUND_TO_USER",
          confidenceScore: 0.98,
          rationale: "Realtime biller APIs remain unavailable and no deterministic receipt is visible yet.",
          maskedPayload: maskedPayload,
        };
      },
    };
  }

  function createRuntime(state, hooks) {
    const events = [];
    const resolvedHooks = hooks || {};
    const sleepMs = typeof resolvedHooks.sleepMs === "number" ? resolvedHooks.sleepMs : 350;

    async function emit(event) {
      const enriched = Object.assign(
        {
          type: "info",
        },
        event,
        {
          snapshot: clone(state),
          index: events.length,
        }
      );

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
      events: events,
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

  async function runCommonPrelude(runtime) {
    const state = runtime.state;

    await runtime.emit({
      stepId: "s1",
      stepState: "active-step",
      badgeText: "Running...",
    });
    await runtime.emit({
      type: "api",
      message: "NPCI webhook received: BBPS payment INIT for Rs 10,000.",
    });
    await runtime.pause(1);
    await runtime.emit({
      type: "info",
      message: "Suspense ledger opened for TXN-99812A while biller verification is still pending.",
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
      badgeText: "Masking",
    });
    state.maskedPayload = tokenizeTransaction(state);
    await runtime.emit({
      type: "warn",
      message: "Mask layer executing deterministic DPDP tokenization before any AI call.",
    });
    await runtime.pause(1);
    await runtime.emit({
      type: "success",
      message:
        "Masked payload ready: { tx_hash, user_hash, phone_hash, amount, partial_reference }.",
    });
    await runtime.emit({
      stepId: "s2",
      stepState: "success",
      badgeText: "Done",
    });
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s3",
      stepState: "active-step",
      badgeText: "Calling API",
    });
    await runtime.emit({
      type: "api",
      message: "BOU -> POST /verify_payment on the legacy electricity board.",
    });
    await runtime.pause(2);
  }

  async function runBrain(runtime, brainAdapter, phase) {
    const state = runtime.state;

    await runtime.emit({
      stepId: phase === "batch_followup" ? "s8" : "s4",
      stepState: "active-step",
      badgeText: "Thinking",
    });
    await runtime.emit({
      type: "api",
      message:
        phase === "batch_followup"
          ? "Brain reparsing masked SFTP batch rows before the final ledger decision."
          : "Brain evaluating masked webhook plus biller response traces.",
    });
    await runtime.pause(2);

    const decision = await brainAdapter.decide(state.maskedPayload, {
      scenarioId: state.scenarioId,
      phase: phase,
      state: clone(state),
    });

    state.proposedAction = decision.suggestedAction;
    state.confidenceScore = decision.confidenceScore;

    await runtime.emit({
      type: "prompt",
      message:
        "Brain output: " +
        JSON.stringify({
          match_found: decision.matchFound,
          suggested_action: decision.suggestedAction,
          confidence_score: decision.confidenceScore,
        }),
    });
    await runtime.emit({
      stepId: phase === "batch_followup" ? "s8" : "s4",
      stepState: "success",
      badgeText: "Done",
    });

    return decision;
  }

  async function runScenario(scenarioId, hooks) {
    const state = createInitialState();
    const runtime = createRuntime(state, hooks);
    const resolvedScenario = SCENARIOS[scenarioId] ? scenarioId : SCENARIOS.sync_clear;
    const brainAdapter =
      hooks && hooks.brain ? hooks.brain : createMockBrainAdapter();

    state.scenarioId = resolvedScenario;

    await runCommonPrelude(runtime);

    if (resolvedScenario === SCENARIOS.sync_clear) {
      state.billerApiStatus = "200_OK";
      state.billerLedgerStatus = "MATCHED_REALTIME";
      await runtime.emit({
        type: "success",
        message: "Legacy biller API replied 200 OK. Payment already appears on the biller ledger.",
      });
      await runtime.emit({
        stepId: "s3",
        stepState: "success",
        badgeText: "Done",
      });
      await runtime.pause(1);

      await runBrain(runtime, brainAdapter, "realtime");
      await runtime.pause(1);

      await runtime.emit({
        stepId: "s5",
        stepState: "active-step",
        badgeText: "Executing",
      });
      await runtime.emit({
        type: "warn",
        message: "Executioner validating confidence threshold and deterministic receipts.",
      });
      await runtime.pause(1);
      state.executionStatus = "EXECUTED";
      state.finalAction = "SETTLE";
      state.outcomeStatus = "SETTLED";
      state.settlementFired = true;
      state.suspenseLedger = 0;
      await runtime.emit({
        type: "success",
        message: "Rules pass: confidence >= 0.95 and realtime biller receipt exists. SETTLE fired.",
      });
      await runtime.emit({
        stepId: "s5",
        stepState: "success",
        badgeText: "Settled",
        alert: {
          tone: "success",
          text: "Settlement completed from the realtime path. No hold was required.",
        },
      });
      return runtime.result();
    }

    state.billerApiStatus = "503_TIMEOUT";
    await runtime.emit({
      type: "error",
      message: "Legacy biller API timed out with 503 Service Unavailable.",
    });
    await runtime.emit({
      stepId: "s3",
      stepState: "error",
      badgeText: "Timed out",
    });
    await runtime.pause(1);

    const initialDecision = await runBrain(runtime, brainAdapter, "realtime");
    await runtime.pause(1);

    await runtime.emit({
      stepId: "s5",
      stepState: "active-step",
      badgeText: "Guardrail",
    });
    await runtime.emit({
      type: "warn",
      message: "Executioner checking thresholds, biller capabilities, and refund safety boundaries.",
    });
    await runtime.pause(1);

    if (resolvedScenario === SCENARIOS.low_confidence) {
      state.executionStatus = "BLOCKED";
      state.outcomeStatus = STATE_CONSTANTS.manualReviewState;
      state.finalAction = "NO_EXECUTION";
      state.reviewReason = "LOW_CONFIDENCE";
      await runtime.emit({
        type: "error",
        message:
          "Rules fail: confidence is below 0.95, so the Brain cannot settle or refund without analyst review.",
      });
      await runtime.emit({
        stepId: "s5",
        stepState: "warn",
        badgeText: "Blocked",
        alert: {
          tone: "warn",
          text: "Execution blocked. The transaction is queued for manual review instead of moving money.",
        },
      });
      return runtime.result();
    }

    if (initialDecision.suggestedAction === "REFUND_TO_USER") {
      state.barrierState = STATE_CONSTANTS.suspenseState;
      state.executionStatus = "HELD";
      await runtime.emit({
        type: "error",
        message: "Refund proposal intercepted because this biller supports offline end-of-day batch posting.",
      });
      await runtime.emit({
        type: "warn",
        message: "Executioner moved the transaction into PENDING_BATCH_RECON instead of executing a refund.",
      });
      await runtime.emit({
        stepId: "s5",
        stepState: "warn",
        badgeText: "Held",
      });
      await runtime.pause(2);

      await runtime.emit({
        revealStepIds: ["s6", "s7", "s8"],
      });

      await runtime.emit({
        stepId: "s6",
        stepState: "active-step",
        badgeText: "Holding",
      });
      await runtime.emit({
        type: "info",
        message:
          "Funds remain in suspense until the " +
          STATE_CONSTANTS.batchCutoffLabel +
          " SFTP drop arrives.",
      });
      await runtime.pause(2);
      await runtime.emit({
        type: "info",
        message: "Clock advanced to 02:00. The convergence barrier is now releasing batch ingestion.",
      });
      await runtime.emit({
        stepId: "s6",
        stepState: "success",
        badgeText: "Done",
      });
      await runtime.pause(1);

      await runtime.emit({
        stepId: "s7",
        stepState: "active-step",
        badgeText: "Parsing",
      });
      await runtime.emit({
        type: "success",
        message: "SFTP file SEB_EOD_20260415.csv landed in the secure drop zone.",
      });
      await runtime.pause(1);
      state.billerLedgerStatus =
        resolvedScenario === SCENARIOS.batch_match ? "MATCHED_BATCH" : "NO_BATCH_MATCH";
      await runtime.emit({
        type: "api",
        message:
          resolvedScenario === SCENARIOS.batch_match
            ? "Batch parser found a masked row that matches the partial reference and amount."
            : "Batch parser found no matching masked row for the transaction.",
      });
      await runtime.emit({
        stepId: "s7",
        stepState: "success",
        badgeText: "Done",
      });
      await runtime.pause(1);

      const followupDecision = await runBrain(runtime, brainAdapter, "batch_followup");
      await runtime.pause(1);

      if (followupDecision.suggestedAction === "SETTLE") {
        state.executionStatus = "EXECUTED";
        state.finalAction = "SETTLE";
        state.outcomeStatus = "SETTLED";
        state.suspenseLedger = 0;
        state.settlementFired = true;
        await runtime.emit({
          type: "success",
          message: "Executioner verified the batch match and released SETTLE after the hold.",
        });
        await runtime.emit({
          stepId: "s8",
          stepState: "success",
          badgeText: "Settled",
          alert: {
            tone: "warn",
            text: "The hold prevented a false refund. Settlement only fired after offline proof arrived.",
          },
        });
        return runtime.result();
      }

      state.executionStatus = "EXECUTED";
      state.finalAction = "REFUND";
      state.outcomeStatus = "REFUNDED";
      state.suspenseLedger = 0;
      state.refundFired = true;
      await runtime.emit({
        type: "success",
        message: "Batch follow-up found no proof of payment, so the refund is now safe to execute before T+1.",
      });
      await runtime.emit({
        stepId: "s8",
        stepState: "success",
        badgeText: "Refunded",
        alert: {
          tone: "success",
          text: "No offline match was found. The refund executed after the hold window closed safely.",
        },
      });
      return runtime.result();
    }

    return runtime.result();
  }

  return {
    SCENARIOS: SCENARIOS,
    STATE_CONSTANTS: STATE_CONSTANTS,
    resetState: createInitialState,
    runScenario: runScenario,
    scenarioHelpers: {
      tokenizeTransaction: tokenizeTransaction,
      createMockBrainAdapter: createMockBrainAdapter,
    },
  };
});
