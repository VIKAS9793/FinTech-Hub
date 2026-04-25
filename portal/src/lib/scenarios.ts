export interface LedgerEntry {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'SYSTEM';
  message: string;
  amount?: number;
  timestamp: string;
}

export type BalanceSetter = (update: (prev: Record<string, number>) => Record<string, number>) => void;
export type Logger = (message: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'SYSTEM', amount?: number) => void;

export interface ScenarioStep {
  label: string;
  action: (setBalances: BalanceSetter, addLog: Logger) => Promise<void>;
}

export interface CaseScenario {
  id: string;
  title: string;
  description: string;
  initialBalances: Record<string, number>;
  scenarios: {
    label: string;
    steps: ScenarioStep[];
  }[];
}

export const CASE_SCENARIOS: Record<string, CaseScenario> = {
  "01": {
    id: "01",
    title: "Marketplace Fund Split",
    description: "Atomic T+0 splitting with pre/post-settlement reversal logic.",
    initialBalances: {
      user_wallet: 1000,
      nodal_escrow: 0,
      restaurant_ledger: 0,
      driver_earnings: 0,
      platform_reserve: 5000
    },
    scenarios: [
      {
        label: "Happy Path: Multi-Party Split",
        steps: [
          {
            label: "Capture Payment",
            action: async (setBalances, addLog) => {
              addLog("[PA] CAPTURE: ₹1000 → Nodal Escrow", "INFO", 1000);
              setBalances((prev) => ({ ...prev, user_wallet: prev.user_wallet - 1000, nodal_escrow: prev.nodal_escrow + 1000 }));
              addLog("Funds successfully captured in Escrow.", "SUCCESS");
            }
          },
          {
            label: "Orchestrate Transfers",
            action: async (setBalances, addLog) => {
              addLog("[PA] TRANSFER: Splitting into sub-buckets...", "SYSTEM");
              setBalances((prev) => ({
                ...prev,
                nodal_escrow: 0,
                restaurant_ledger: prev.restaurant_ledger + 800,
                driver_earnings: prev.driver_earnings + 100,
                platform_reserve: prev.platform_reserve + 100
              }));
              addLog("Settlement ready: 80% Merchant, 10% Logistics, 10% Platform.", "SUCCESS");
            }
          }
        ]
      },
      {
        label: "Sad Path: Post-Settlement Offset",
        steps: [
          {
            label: "Trigger Dispute",
            action: async (setBalances, addLog) => {
              addLog("[ERROR] Transfer Reversal → INSUFFICIENT_ESCROW_BALANCE (T+2)", "ERROR");
              addLog("[CHECK] Using Platform Refund Reserve (Nodal Buffer)...", "SYSTEM");
              setBalances((prev) => ({ ...prev, platform_reserve: prev.platform_reserve - 200, user_wallet: prev.user_wallet + 200 }));
              addLog("User refunded from reserve. Writing Negative Ledger entry.", "SUCCESS");
            }
          },
          {
            label: "Future Offset Recovery",
            action: async (setBalances, addLog) => {
              addLog("[LEDGER] Detected -₹200 debt for restaurant_ledger.", "SYSTEM");
              addLog("New sale (₹500) detected. Intercepting debt...", "INFO", 500);
              setBalances((prev) => ({ 
                ...prev, 
                restaurant_ledger: prev.restaurant_ledger + (500 - 200), 
                platform_reserve: prev.platform_reserve + 200 
              }));
              addLog("Debt recovered. Platform reserve replenished.", "SUCCESS");
            }
          }
        ]
      }
    ]
  },
  "02": {
    id: "02",
    title: "B2B BNPL Checkout Saga",
    description: "5-Step compensating saga orchestrating NPCI, AA, and NBFC LOS.",
    initialBalances: {
      retailer_credit_limit: 50000,
      nbfc_lender_ledger: 50000,
      supplier_payout: 0,
      saga_state_escrow: 0
    },
    scenarios: [
      {
        label: "Distributed Saga Rollback",
        steps: [
          {
            label: "Establish Consents",
            action: async (setBalances, addLog) => {
              addLog("AA: Consent Artefact generated. ID: CH-A12F9C", "SUCCESS");
              addLog("NPCI: UPI AutoPay mandate request (₹10,000/month) ACTIVE.", "SUCCESS");
              addLog("LOS: Credit Approved. Loan ID: LN-20260415", "INFO", 50000);
              setBalances((prev) => ({ ...prev, nbfc_lender_ledger: prev.nbfc_lender_ledger - 50000, saga_state_escrow: prev.saga_state_escrow + 50000 }));
            }
          },
          {
            label: "Disbursal Failure",
            action: async (setBalances, addLog) => {
              addLog("SPONSOR BANK: Firing NEFT transfer to Supplier...", "SYSTEM");
              addLog("SPONSOR BANK: DISBURSAL_FAILED_BENEFICIARY_BANK_OFFLINE", "ERROR");
            }
          },
          {
            label: "Execute Rollback Saga",
            action: async (setBalances, addLog) => {
              addLog("--- SAGA ORCHESTRATOR: Cleanup Sequence Initiated ---", "SYSTEM");
              addLog("NPCI: POST /v1/mandates/revoke. Mandate REVOKED.", "SUCCESS");
              addLog("AA: DELETE /v2/consents. Data pipe severed. DPDP compliant.", "SUCCESS");
              setBalances((prev) => ({ ...prev, saga_state_escrow: 0, nbfc_lender_ledger: prev.nbfc_lender_ledger + 50000 }));
              addLog("LOS: Loan record voided. Zero orphaned records.", "SUCCESS");
            }
          }
        ]
      }
    ]
  },
  "03": {
    id: "03",
    title: "Zero-Trust AI Reconciliation",
    description: "Legacy SFTP batch synchronization with AI-driven DPDP masking.",
    initialBalances: {
      legacy_batch_pool: 10000,
      biller_settlement: 0,
      suspense_ledger: 0
    },
    scenarios: [
      {
        label: "Convergence Barrier (SFTP)",
        steps: [
          {
            label: "Initialize Suspense",
            action: async (setBalances, addLog) => {
              addLog("NPCI: BBPS payment INIT for ₹10,000.", "INFO", 10000);
              addLog("Biller API timed out (503). Opening Suspense Ledger.", "SYSTEM");
              setBalances((prev) => ({ ...prev, legacy_batch_pool: prev.legacy_batch_pool - 10000, suspense_ledger: prev.suspense_ledger + 10000 }));
            }
          },
          {
            label: "Mask & Ingest Batch",
            action: async (setBalances, addLog) => {
              addLog("02:00 AM SFTP Drop: Ingesting SEB_EOD_20260415.csv", "SYSTEM");
              addLog("Applying HMAC-SHA256 Tokenization. Data blind masking complete.", "SUCCESS");
            }
          },
          {
            label: "AI Deterministic Settle",
            action: async (setBalances, addLog) => {
              addLog("AI Brain: SFTP row confirms offline ledger posted payment.", "SYSTEM");
              addLog("Executioner verified batch match. Releasing hold.", "SUCCESS");
              setBalances((prev) => ({ ...prev, suspense_ledger: 0, biller_settlement: prev.biller_settlement + 10000 }));
              addLog("Settlement released to Biller. Zero-Trust audit pass.", "SUCCESS");
            }
          }
        ]
      }
    ]
  },
  "07": {
    id: "07",
    title: "Streaming UPI Grace Ledger",
    description: "Simulation of recurring UPI AutoPay with a dual-clock grace ledger.",
    initialBalances: {
      subscriber_wallet: 999,
      exposure_ledger: 0,
      settled_revenue: 0
    },
    scenarios: [
      {
        label: "System Pending Resolution",
        steps: [
          {
            label: "Trigger AutoPay Pull",
            action: async (setBalances, addLog) => {
              addLog("Initiating ₹999 pull against UPI e-mandate.", "INFO", 999);
              setBalances((prev) => ({ ...prev, subscriber_wallet: prev.subscriber_wallet - 999, exposure_ledger: prev.exposure_ledger + 999 }));
              addLog("Bank resolution pending. Categorizing as SYSTEM_PENDING_ACCESS.", "SYSTEM");
            }
          },
          {
            label: "Resolve RBI TAT",
            action: async (setBalances, addLog) => {
              addLog("Final NPCI truth received: Success. Clearing exposure.", "SUCCESS");
              setBalances((prev) => ({ ...prev, exposure_ledger: 0, settled_revenue: prev.settled_revenue + 999 }));
              addLog("Revenue earned. Grace exposure closed.", "SUCCESS");
            }
          }
        ]
      }
    ]
  }
};
