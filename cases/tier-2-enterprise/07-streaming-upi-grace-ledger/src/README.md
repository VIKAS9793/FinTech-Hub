# Case 07 Demo

This folder contains the no-build browser demo and reusable simulator for the StreamFlow UPI AutoPay grace ledger case.

## Files

- `index.html` renders the browser-playable terminal demo.
- `mock_api.js` exports `runScenario`, `resetState`, `SCENARIOS`, and `STATE_CONSTANTS` for browser or Node execution.

## Scenarios

- `system_pending_success`: a timeout is held behind the resolution barrier and later settles successfully.
- `user_failure_recovered`: insufficient funds enters the D+3 commercial grace clock and recovers inside grace.
- `unresolved_suspended`: the system-pending attempt reaches the applicable TAT window without deterministic success, so access is suspended while exposure remains visible.
- `mandate_revoked`: mandate revocation during grace stops silent retries and forces re-consent or one-time payment.

Open `index.html` directly in a browser, or import `mock_api.js` from Node for headless assertions.
