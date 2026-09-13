# OwnAPI Text Pricing and Conditional Multiplier Design

Date: 2026-09-13
Status: Approved by the user on 2026-09-13

## Objective

Make the public text-model prices, customer deductions, Packy account costs, model routing, and
usage history use one auditable pricing decision. The change must preserve OwnAPI customer API
keys and customer-facing model IDs while keeping Packy credentials, groups, account names,
endpoints, and private model aliases on the server.

This specification supersedes the DeepSeek price table and the GPT-6 200,000-token boundary in
`2026-09-11-ownapi-deepseek-sale-gpt6-pricing-design.md`. The existing DeepSeek private routing
contract remains valid.

## Scope

This change covers:

- the reviewed Packy cost-to-OwnAPI-sale discount policy for published text models;
- separation of the four Codex-priced models into a dedicated Packy account;
- a reusable request-condition pricing rule, initially used for DeepSeek weekday peak hours;
- the same DeepSeek peak factor in customer billing and Packy cost accounting;
- explicit audit fields and customer-visible usage-history disclosure;
- corrected GPT-6 Astra short/long context billing with a 272,000-token boundary; and
- synchronized public model-page pricing and bilingual conditions.

It does not add automatic Packy price synchronization, change customer API-key behavior, expose
upstream information, change video billing, or create/copy Packy credentials.

## Sources of Truth and Review Policy

Manufacturer list prices and Packy upstream costs are different facts and remain independently
sourced:

- The manufacturer price source determines the public comparison price and the OwnAPI base sale
  price.
- The signed-in Packy price card for the exact token group determines upstream account cost.
- Packy balance deductions shown in CNY are normalized for OwnAPI reporting at
  `6.7 CNY = 1 USD`; the currency convention never changes customer list-price arithmetic.
- Each price snapshot records its source URL or signed-in source label and review date.
- Prices are updated only through a reviewed, version-controlled snapshot. OwnAPI does not scrape
  Packy or change production prices automatically.

A model is callable only when all of the following are confirmed for the same exact model and
route: manufacturer price, Packy price card, Packy token group, private protocol, model mapping,
and non-loss-making margin. Missing or contradictory data makes the model unavailable rather than
falling back to a family price or another account.

## Sale-Price Policy

The Packy cost band selects the OwnAPI sale multiplier applied to manufacturer list price:

| Packy cost relative to manufacturer list | OwnAPI base sale price | Availability |
| --- | ---: | --- |
| At or below 60% | Manufacturer list x 0.7 | Published and callable after route verification |
| Above 60% and at or below 80% | Manufacturer list x 0.8 | Published and callable after route verification |
| Above 80% or not verifiable | No price | Removed from the public catalog and callable channel |

The current approved snapshot applies these specific classifications:

- Qwen, GLM, and the two approved DeepSeek sale models use a 50% Packy cost band and a 70% OwnAPI
  base sale price.
- `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-6-astra` use the Packy `codex` cost
  band at 12% and a 70% OwnAPI base sale price. These four models are mandatory catalog entries.
- Other approved OpenAI text models using the 72% Packy cost band use an 80% OwnAPI base sale
  price.
- Any reviewed model whose Packy cost exceeds 80% is removed from both discovery and API
  availability in the same release.

The existing standard OwnAPI customer group remains `1.0`. A sale multiplier belongs in the
model's base price, not in the customer group, so it is applied exactly once.

## Customer-Specific Multiplier Precedence

After calculating the model base price and any request-condition multiplier, OwnAPI applies one
existing negotiated customer multiplier using this precedence:

1. customer-and-model override;
2. customer-and-group override;
3. group multiplier;
4. default `1.0`.

Only the first matching negotiated multiplier is used. Changing one customer's rate for one model
therefore does not discount that customer's other models.

For each billable token component:

```text
ownapi_base_component_usd = manufacturer_component_usd * model_sale_multiplier
customer_component_usd = ownapi_base_component_usd
                       * request_condition_multiplier
                       * effective_customer_multiplier
```

Input, output, cache-read, and cache-write components are calculated independently before being
summed. Money calculations use the repository's precise decimal path and are rounded only at the
existing persistence/display boundaries.

## Packy Account Boundaries

Create or retain a managed account named `Packy / Codex` for exactly these customer-facing model
IDs:

- `gpt-5.6-luna`
- `gpt-5.6-sol`
- `gpt-5.6-terra`
- `gpt-6-astra`

The account uses only a Packy token whose enabled group is `codex`. The four IDs are removed from
the `Packy / Core` account mapping. Core continues to serve only its separately verified non-Codex
models. The scheduler remains exact-model and fail-closed: it may not use Core as a backup for a
Codex model, infer an account from the provider family, or fall through to an arbitrary
OpenAI-compatible account.

Database migrations may update account mappings by exact account name, but they do not create,
copy, rotate, or expose credentials. Until `Packy / Codex` exists with a verified token and exact
mapping, these models remain publicly described but unavailable for customer API calls.

The existing `Packy / DeepSeek Sale` account remains the only route for:

- `deepseek-v4.1-flash` -> private Packy alias `deepseek-v4-flash`;
- `deepseek-v4-pro` -> private Packy ID `deepseek-v4-pro`.

Neither DeepSeek model may fall back to an official group or any other Packy account.

## DeepSeek Base Prices and Cost Snapshot

The verified manufacturer USD list price for `deepseek-v4.1-flash` is:

| Component | Manufacturer price per million tokens | OwnAPI base at 70% |
| --- | ---: | ---: |
| Input | $0.1500 | $0.1050 |
| Output | $0.6000 | $0.4200 |
| Cache read | $0.0030 | $0.0021 |
| Cache write | Not published | Not billed |

The reviewed Packy standard-time cards dated 2026-09-13 show:

| Private Packy model | Input CNY/MTok | Output CNY/MTok | Cache read CNY/MTok |
| --- | ---: | ---: | ---: |
| `deepseek-v4-flash` | 0.50 | 2.00 | 0.010 |
| `deepseek-v4-pro` | 2.25 | 6.75 | 0.075 |

These Packy values are upstream cost inputs, not manufacturer prices. They are divided by 6.7 for
the standard-time USD account cost and multiplied by the request-condition factor during peak
hours.

`deepseek-v4-pro` must not reuse the Flash manufacturer price. Its current catalog and channel
price are treated as invalid. It remains unavailable and has no customer deduction until a
manufacturer-authoritative price source for that exact model supplies input, output, and cache
prices. A Packy discount label or a price inferred by doubling the 50% cost card is insufficient as
the manufacturer USD source. Once verified, the same 70% sale policy applies without changing the
conditional-rule design.

## Reusable Request-Condition Pricing Rules

Request conditions are represented as version-controlled structured rules, not cron jobs that
rewrite base prices and not page-only prose. Each rule contains:

- stable rule ID and human-readable bilingual name;
- exact canonical customer model IDs;
- IANA time zone;
- included weekdays;
- one or more half-open local-time windows;
- customer-charge multiplier and upstream-cost multiplier;
- evidence source and verification date; and
- optional effective start/end bounds for future rule versions.

The initial rule is:

```text
id: deepseek-weekday-peak-2026-09-13
models: deepseek-v4.1-flash
timezone: Asia/Shanghai
weekdays: Monday through Friday
windows: [09:00, 12:00), [14:00, 18:00)
customer multiplier: 2.0
upstream-cost multiplier: 2.0
```

Equivalent UTC windows are `[01:00, 04:00)` and `[06:00, 10:00)`. `Asia/Shanghai` is the
calculation authority; UTC is displayed for customer convenience. The windows are half-open: the
opening minute is included and the closing instant is excluded. Weekends always use `1.0`.

The rule registry is validated at application startup. Duplicate rule IDs, overlapping rules for
the same model, invalid time zones, invalid windows, or non-positive multipliers prevent the
affected models from being scheduled. OwnAPI does not silently choose `1.0` or `2.0` when rule
configuration is invalid.

## Request-Time Locking and Retry Semantics

Every upstream attempt receives a server UTC timestamp immediately before the Packy request is
sent. A failed transport attempt, retryable response, authentication failure, rate limit, or
response without billable usage discards that attempt's timestamp and creates no customer charge.

When an attempt produces the final billable successful response, its send timestamp becomes the
request's `pricing_effective_at`. OwnAPI evaluates the conditional rule once from that timestamp
and canonical billing model, then locks the result for both customer charging and Packy cost
accounting. A streaming response or retry that crosses a window boundary does not change the
locked multiplier. A later successful retry uses that retry's own send timestamp.

Pricing inputs are resolved and validated before contacting Packy. Billing remains finalized only
after a successful response supplies usable usage data. This prevents a request from reaching an
upstream when OwnAPI cannot later determine a valid customer price or account cost.

## Upstream Cost Accounting

For DeepSeek, account cost uses the exact private Packy model selected by the account mapping:

```text
packy_component_cost_usd = packy_card_component_cny / 6.7
                         * request_condition_multiplier
```

The alias `deepseek-v4.1-flash -> deepseek-v4-flash` is resolved before selecting the Packy cost
rule. Customer billing continues to use the canonical OwnAPI model and its manufacturer-based
price. One immutable pricing context containing both model identities, the successful-attempt
timestamp, and the condition result is passed to both calculations so the two paths cannot
independently choose different aliases, times, or multipliers.

Account cost remains operational data and is not exposed through customer API responses. Admin
profit reporting may show the sanitized account label and private accounting model under existing
permissions.

## GPT-6 Astra Context Pricing

GPT-6 Astra uses the following manufacturer prices and a 70% OwnAPI base sale multiplier:

| Tier | Component | Manufacturer USD/MTok | OwnAPI base USD/MTok |
| --- | --- | ---: | ---: |
| Up to 272K | Input | 10.00 | 7.00 |
| Up to 272K | Output | 50.00 | 35.00 |
| Up to 272K | Cache read | 1.00 | 0.70 |
| Up to 272K | Cache write | 12.50 | 8.75 |
| Above 272K | Input | 20.00 | 14.00 |
| Above 272K | Output | 75.00 | 52.50 |
| Above 272K | Cache read | 2.00 | 1.40 |
| Above 272K | Cache write | 25.00 | 17.50 |

The long tier applies only when total input tokens reported for the successful request are greater
than 272,000. Exactly 272,000 uses the short tier. Cached tokens remain part of the total input
token count for tier selection, then receive the cache-read component price during component
billing. The former 200,000-token boundary is removed from the catalog, channel configuration,
billing intervals, tests, and customer documentation.

## Persistence and Usage History

Each new text usage record persists enough immutable audit data to reproduce the decision:

- canonical customer model and actual private accounting model under existing visibility rules;
- `pricing_effective_at` from the successful upstream attempt;
- applied condition multiplier, always `1.0` or `2.0` for the initial rule;
- matched rule ID, nullable when no rule matches;
- effective negotiated customer multiplier;
- final customer charge and normalized account cost; and
- the existing input, output, cache-read, and cache-write usage components.

New records default the condition multiplier to `1.0`; historical rows are not re-rated and show
the neutral factor with no matched rule. The customer Usage page displays `1x` or `2x` and a
localized peak-rule label without exposing Packy. The stable rule ID itself is provider-neutral
and can therefore be shared by the customer and admin DTOs; the admin view also exposes the
pricing-effective timestamp for reconciliation.

The database migration is additive for audit columns and idempotent for price/account updates.
Constraints require a positive condition multiplier. Usage creation, balance deduction, and cost
persistence remain in the existing idempotent settlement transaction.

## Public Model Pages and Documentation

Catalog cards continue to show the base OwnAPI sale price and the 70% or 80% comparison badge.
DeepSeek detail pages add a prominent bilingual pricing-condition section stating:

- base prices shown on the page apply outside peak hours;
- Monday-Friday Beijing time `09:00-12:00` and `14:00-18:00` are charged at `2x`;
- equivalent UTC times are `01:00-04:00` and `06:00-10:00`;
- opening times are included, closing times are excluded; and
- usage history records whether `1x` or `2x` applied.

The UI derives this copy from the same structured rule exported for public display. It must not
maintain separate handwritten windows that can drift from backend billing. The API response shape
and customer integration examples do not expose private Packy details.

GPT-6 Astra displays short and long context tiers with the exact 272K boundary. Models removed by
the profitability policy disappear from both the public catalog and `GET /v1/models` for customer
keys in the same deployment.

## Failure and Safety Behavior

- No confirmed manufacturer price: hide/disable the model and reject before upstream dispatch.
- No exact eligible account, protocol, or mapping: return a sanitized model-unavailable error.
- Invalid conditional rule registry: make affected models unavailable at startup; never guess a
  factor.
- Upstream failure or retry without billable usage: no usage record and no customer deduction.
- Successful response without usable usage: preserve the existing fail-closed billing behavior and
  raise an operational reconciliation error.
- Persistence or deduction failure: preserve existing transactional/idempotent settlement and
  alert operations; do not create a second charge during retry.
- Raw Packy errors, hostnames, token groups, model aliases, request IDs, and credentials remain
  sanitized from customer responses and customer-visible history.

## Migration, Rollout, and Rollback

1. Add tests and the request-condition evaluator without changing production configuration.
2. Add additive usage audit columns and backfill only neutral defaults; do not recalculate history.
3. Update the reviewed catalog/channel price snapshot, DeepSeek costs, and GPT-6 272K intervals in
   one versioned migration.
4. Remove the four Codex mappings from Core. Add them only to `Packy / Codex` when that exact
   account already exists; never move or copy its credential in SQL.
5. Keep DeepSeek Pro unavailable until its exact manufacturer price source is confirmed and
   reviewed.
6. Before production migration, export the affected channel prices, account mappings, account-cost
   rules, and schema version, and retain the current production image.
7. Deploy through the existing traceable workflow. Verify the database migration, catalog,
   `GET /v1/models`, exact account scopes, rule display, and synthetic billing calculations before
   enabling paid traffic.
8. Run paid smoke requests only after separate explicit approval, using minimum output. Reconcile
   OwnAPI customer charge, condition factor, Packy deduction, normalized cost, and profit.

Rollback first disables affected models, restores the exported price/mapping snapshot, and deploys
the retained prior image. Additive audit columns may remain because old binaries ignore them;
historical usage and balances are never rewritten. Rollback must not restore Codex mappings to
Core unless its token is independently verified to contain the exact Codex group.

## Verification

Automated tests must cover:

- cost-band boundaries at 60% and 80%, rejection above 80%, and every approved model
  classification;
- exact Codex-only account selection and proof that Core cannot serve the four Codex models;
- DeepSeek canonical/private alias selection for customer billing and account cost;
- weekday standard time, both peak openings, both peak closings, weekends, and UTC conversion;
- a response that crosses a window boundary and a failed attempt followed by a successful retry on
  the other side of a boundary;
- identical condition context for customer charge and Packy account cost;
- input, output, cache-read, and cache-write multiplication at `2x`;
- customer-and-model, customer-and-group, group, and default multiplier precedence after the
  condition factor;
- 6.7 CNY/USD normalization and profit calculations;
- historical/default `1x` usage rows and new `1x`/`2x` customer/admin rendering;
- GPT-6 Astra at 271,999, exactly 272,000, and 272,001 total input tokens, including cached input;
- DeepSeek Pro fail-closed behavior without a verified manufacturer price;
- bilingual model-page windows generated from the structured rule; and
- no regression in non-Packy billing, streaming settlement, API-key authentication, or upstream
  privacy.

Production verification is read-only until paid testing is separately approved. No deployment is
part of this design-document checkpoint.
