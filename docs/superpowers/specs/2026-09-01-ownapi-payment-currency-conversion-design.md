# OwnAPI Payment Currency Conversion Design

## Objective

OwnAPI customer balances are denominated in USD. Balance recharge orders must convert the payment principal according to the selected payment instance currency:

- `6.7 CNY` credits `$1 USD`.
- `$1 USD` credits `$1 USD`.
- Only CNY and USD payment instances may create balance recharge orders.
- `BALANCE_RECHARGE_MULTIPLIER` remains an optional operational multiplier applied after currency conversion, with `1.0` as the standard value.

Subscription purchases retain their existing amount and currency behavior.

## Selected Approach

The backend determines the selected payment instance and its currency before calculating the balance credited to the customer. The calculation is:

```text
CNY credited USD = payment principal CNY / 6.7 * operational multiplier
USD credited USD = payment principal USD * operational multiplier
```

The result is rounded to two USD decimal places using decimal arithmetic. Unsupported currencies return a validation error for balance recharge orders.

This keeps the existing order schema and fulfillment contract:

- `payment_orders.amount` is the USD balance credited for balance orders.
- `payment_orders.pay_amount` is the amount collected by the gateway in the selected payment currency, including the configured recharge fee.
- `provider_snapshot.currency` records the gateway payment currency.
- `PaymentOrderCurrency` remains the source for gateway amount validation and display.

## Alternatives Considered

Setting `BALANCE_RECHARGE_MULTIPLIER` to `1 / 6.7` was rejected because the same multiplier would incorrectly convert USD payments. Adding a second credited-balance field was rejected because the existing `amount` field already drives balance fulfillment and proportional refunds; a schema migration would add risk without changing the domain model.

## Order Creation Flow

1. Validate the request and determine whether it is a balance or subscription order.
2. Select the concrete payment instance and resolve its normalized currency.
3. For a balance order, reject currencies other than CNY and USD and calculate the credited USD amount from the requested payment principal.
4. Calculate `pay_amount` from the payment principal plus the configured fee in the selected payment currency.
5. Persist both amounts and the selected provider snapshot in one order.

The recharge fee never increases credited balance. Minimum, maximum, and daily recharge limits continue to apply to the payment principal, preserving their current semantics.

For WeChat OAuth continuation, any resumed creation path must use the same selected currency and conversion rule so the preview, created order, and eventual fulfillment cannot diverge.

## Fulfillment, Webhooks, and Refunds

Balance fulfillment continues to credit `payment_orders.amount`, which is now explicitly USD. Webhook amount checks continue comparing the provider-reported amount against `payment_orders.pay_amount` using the payment currency's tolerance.

The existing proportional refund calculation remains unchanged: it derives the gateway refund amount from the ratio between refunded USD balance and the original credited USD balance, then applies that ratio to the gateway payment amount. A full refund still returns the complete gateway payment amount.

Subscription order pricing, fulfillment, and refunds do not perform the balance currency conversion.

## Frontend Behavior

The recharge page derives the selected currency from `checkout.methods[selectedMethod].currency` and previews:

- the payment principal and fee in the gateway currency;
- the credited balance in USD;
- CNY conversion at `6.7:1` or USD conversion at `1:1`, followed by the operational multiplier.

Changing the selected payment method immediately recomputes the preview. Order tables, QR/status panels, Stripe inline payment, and administrator order views use the order currency formatter for gateway amounts instead of a hard-coded yuan symbol. Balance credited amounts always display as USD.

The administrator setting is renamed conceptually from a CNY-to-USD rate to an additional post-conversion multiplier. Its standard value remains `1.0`, and its help text states that CNY first converts at `6.7:1` while USD converts at `1:1`.

## Error Handling

- Balance recharge through a non-CNY/USD instance fails before order persistence or provider invocation.
- Invalid or missing operational multipliers continue falling back to `1.0` under the existing normalization rule.
- Invalid payment amounts keep the current request validation errors.
- No live payment settings, credentials, or provider orders are changed during implementation or QA.

## Verification

Backend tests cover `67 CNY -> 10 USD`, `10 USD -> 10 USD`, `67 CNY` at multiplier `0.9 -> 9 USD`, unsupported currency rejection, selection-before-conversion, unchanged subscription behavior, webhook validation against gateway currency, and proportional/full refunds.

Frontend tests cover CNY and USD previews, recomputation after method changes, fee exclusion from credited balance, and currency-correct rendering in customer and administrator order surfaces. Focused Go tests, focused Vitest, Vue type checking, linting, production build checks where relevant, and `git diff --check` must pass before browser QA. Browser QA uses local mocked/configured checkout data and must not create a real provider order.
