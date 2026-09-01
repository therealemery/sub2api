# OwnAPI Payment Currency Conversion Implementation Plan

## Goal

Implement the approved recharge rules so CNY payment principal converts to USD balance at 6.7:1, USD principal credits USD at 1:1, and the existing operational multiplier applies after conversion without changing subscription, webhook, or refund semantics.

## Task 1: Lock the backend conversion contract with tests

Files:

- Modify `backend/internal/service/payment_amounts.go`.
- Add or modify focused tests beside the payment amount helpers.

Steps:

1. Add failing table tests for `67 CNY -> 10 USD`, `10 USD -> 10 USD`, `67 CNY` at multiplier `0.9 -> 9 USD`, case/whitespace normalization, and unsupported currency rejection.
2. Replace the currency-blind credited-balance helper with a decimal-based helper that accepts the selected payment currency and returns an error.
3. Use one named CNY-per-USD constant and round credited USD to two decimals.
4. Run the focused helper tests.

## Task 2: Move balance conversion after payment-instance selection

Files:

- Modify `backend/internal/service/payment_order.go`.
- Modify focused order tests under `backend/internal/service/`.

Steps:

1. Preserve request/plan principal as `limitAmount`; do not calculate balance credit before instance selection.
2. Resolve the concrete selected currency, then calculate `orderAmount` only for balance orders.
3. Reject a non-CNY/USD selected currency before OAuth continuation, persistence, or provider invocation.
4. Keep `payAmount` based on principal plus fee in the selected gateway currency.
5. Ensure subscription `orderAmount` remains the plan price.
6. Add focused assertions proving the persisted balance amount is USD while `pay_amount` remains gateway currency.
7. Run order, OAuth continuation, provider snapshot, webhook, fulfillment, and refund test subsets.

## Task 3: Add a frontend conversion helper and repair recharge preview

Files:

- Modify `frontend/src/components/payment/currency.ts`.
- Modify `frontend/src/components/payment/__tests__/currency.spec.ts`.
- Modify `frontend/src/views/user/PaymentView.vue`.
- Modify `frontend/src/views/user/__tests__/PaymentView.spec.ts`.

Steps:

1. Add failing tests for CNY/USD credited-balance calculation and unsupported currency behavior.
2. Implement a pure `calculateCreditedUsd` helper matching backend rounding and multiplier normalization.
3. Derive the recharge preview from the selected method currency so switching methods recomputes it.
4. Keep fees outside credited balance and render payment principal/fee/total using the gateway currency formatter.
5. Disable or reject unsupported recharge methods consistently with the backend while leaving subscription behavior unchanged.
6. Run focused currency and PaymentView tests.

## Task 4: Remove hard-coded payment currency symbols

Files:

- Modify `frontend/src/components/payment/OrderTable.vue`.
- Modify `frontend/src/components/payment/PaymentQRDialog.vue`.
- Modify `frontend/src/components/payment/StripePaymentInline.vue`.
- Inspect and modify `frontend/src/components/payment/PaymentStatusPanel.vue` only if needed.
- Modify `frontend/src/components/admin/payment/AdminOrderTable.vue` and related admin detail surfaces if they hard-code currency.
- Add or update focused component tests.

Steps:

1. Format gateway amounts with the order/provider currency.
2. Always format balance credited amounts as USD.
3. Keep subscription amounts in the gateway/order currency.
4. Pass currency into inline Stripe surfaces where the order response already provides it; avoid inventing a second currency source.
5. Run focused rendering tests.

## Task 5: Correct administrator and customer wording

Files:

- Modify `frontend/src/i18n/locales/en.ts`.
- Modify `frontend/src/i18n/locales/zh.ts`.
- Modify `frontend/src/views/admin/SettingsView.vue` if preview parameters change.
- Modify related locale/settings tests.

Steps:

1. Describe the setting as an extra post-conversion multiplier with standard value `1.0`.
2. State that CNY converts at 6.7:1 and USD at 1:1 before the multiplier.
3. Remove customer-facing language that claims the multiplier itself is a CNY-to-USD exchange rate.
4. Run focused locale and SettingsView tests.

## Task 6: Update operational documentation and handoff

Files:

- Modify `docs/PAYMENT.md`.
- Modify `docs/PAYMENT_CN.md`.
- Modify `AGENTS.md`.

Steps:

1. Document the two supported balance recharge currencies, field semantics, fee handling, and operational multiplier.
2. Record that existing payment settings and credentials need no migration; standard multiplier remains `1.0`.
3. Record implementation files, tests, local QA, and any residual limitations in `AGENTS.md`.

## Task 7: Integrated verification

1. Run focused and package-level Go payment tests.
2. Run focused Vitest, Vue type checking, and focused ESLint.
3. Run the frontend build if the focused checks pass.
4. Run `git diff --check` and inspect the full diff for unintended files.
5. Start or reuse the local frontend server, verify CNY/USD recharge previews and displayed currencies in the browser with local/mock data, and do not submit a real provider order.
6. Confirm `frontend/pnpm-workspace.yaml` remains unmodified and uncommitted.
