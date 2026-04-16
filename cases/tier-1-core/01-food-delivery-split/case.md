# Case Study 01: Food Delivery Marketplace Fund Splitting

<div align="center">
  <a href="https://www.youtube.com/watch?v=bYnUTFCHrAk"><img src="https://img.youtube.com/vi/bYnUTFCHrAk/maxresdefault.jpg" alt="Case Study Video" style="max-width: 850px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);"></a>
</div>



## 📝 Business Narrative
We are building a massive food delivery marketplace. A user pays ₹1,000 for a meal. This total must be split across multiple parties (Restaurant, Partner, Government, and Platform) instantly, without the funds hitting our corporate account to remain RBI compliant.

## 🏢 Stakeholders
- **User**: Hungry customer paying via UPI.
- **Restaurant**: Food provider needing ₹800.
- **Delivery Partner**: Rider needing ₹100.
- **Government**: Tax authority needing ₹50 (GST).
- **Platform**: Us, taking ₹50 as commission.

## 💸 Fund Flow (The ₹1,000 Reality)
- **₹800** to Restaurant
- **₹100** to Delivery Partner
- **₹50** for GST (Government)
- **₹50** to Platform Commission

---

## ⚡ Challenge A — Pre-Settlement "Sad Path" (T+0)
The user pays ₹1,000. Our system fires the Split API. In our internal ledger, the restaurant is marked for ₹800, and the driver for ₹100.

**The Twist**: The food arrives, but the ₹200 Paneer Tikka is missing. The user demands a ₹200 partial refund **within the same day** — the Nodal Escrow is still holding all funds.

### Constraints
1. **User Experience**: Must refund ₹200 back to the user immediately.
2. **Driver Protection**: The delivery driver did their job perfectly and must receive their full ₹100.
3. **Restaurant Accountability**: The restaurant absorbs the ₹200 loss (payout drops to ₹600).
4. **Escrow State**: Money is still sitting in Nodal Escrow — settlement has **not** run yet.

---

## 🔥 Challenge B — Post-Settlement "Extreme Sad Path" (T+2)
The exact same scenario, but the user notices the missing Paneer Tikka **two days later**.

**The Twist**: T+1 settlement already ran. The restaurant physically received ₹800 in their Partner Bank account. The Nodal Escrow is **empty**.

### Constraints
1. **API Failure**: The `Transfer Reversal` API will return `INSUFFICIENT_ESCROW_BALANCE` — the vault is dry.
2. **Regulatory Compliance**: The Food Platform **cannot** wire ₹200 from its corporate Partner Bank account. Mixing corporate funds with user funds is **illegal co-mingling** under RBI regulations (shadow banking).
3. **User Experience**: The user still demands an instant refund — they will delete the app otherwise.
4. **Restaurant Accountability**: The restaurant is 100% at fault and must absorb the loss eventually.
