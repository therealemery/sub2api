# OwnAPI DeepSeek Sale and GPT 6 Pricing Design

## Objective

Publish two DeepSeek text models through a dedicated Packy `deepseek-sale` token and correct GPT-6
Astra pricing everywhere. Public prices, customer billing, account routing, and upstream cost
reporting must remain consistent. Customers continue to authenticate only with OwnAPI keys and
must not see Packy account names, credentials, token groups, URLs, or upstream model aliases.

## DeepSeek Models and Private Mapping

OwnAPI publishes these exact customer model IDs:

- `deepseek-v4.1-flash`, privately mapped to Packy `deepseek-v4-flash`.
- `deepseek-v4-pro`, privately mapped to Packy `deepseek-v4-pro`.

Both use the existing customer-facing `POST /v1/chat/completions` contract. Packy dispatch uses the
OpenAI Chat Completions protocol and remains fail-closed for unknown models.

A fifth managed account named `Packy / DeepSeek Sale` owns only these two mappings and uses a token
created with the `deepseek-sale` group. Neither model may be added to Core, Expansion, ZAI,
GPT-5.4, or an official DeepSeek group. The production token is entered outside Git after the code
and migration are deployed.

## DeepSeek Customer Pricing

The supplied manufacturer-price screenshot is the public USD list-price authority for both models:

| Price kind | Official USD per MTok | OwnAPI at 75 percent |
| --- | ---: | ---: |
| Input | 0.1500 | 0.1125 |
| Output | 0.6000 | 0.4500 |
| Cache read | 0.0030 | 0.00225 |
| Cache write | Not published | Not published |

The catalog pricing type is extended to support an explicit `0.75` multiplier. Both cards and
detail pages show official and OwnAPI prices with a 75-percent label. Backend channel pricing uses
the same exact per-token values, so the default OwnAPI group multiplier remains `1.0`.

Packy's `deepseek-sale` card values describe Packy balance deductions under its RMB/USD 1:1 display
convention. Upstream account-cost reporting remains separate from customer billing and normalizes
the Packy balance deduction to OwnAPI USD reporting using the configured `6.7 CNY = 1 USD` policy.
The Packy token itself remains the authority for the selected sale group; the public price never
inherits Packy's display convention.

## GPT 6 Astra Pricing

The supplied official-price screenshot replaces the current incorrect GPT-6 Astra short-context
prices. The existing 200,000-input-token boundary is preserved: up to and including 200,000 tokens
uses short pricing; more than 200,000 uses long pricing.

| Context tier | Price kind | Official USD per MTok | OwnAPI at 70 percent |
| --- | --- | ---: | ---: |
| Short | Input | 10.00 | 7.00 |
| Short | Output | 50.00 | 35.00 |
| Short | Cache read | 1.00 | 0.70 |
| Short | Cache write | 12.50 | 8.75 |
| Long | Input | 20.00 | 14.00 |
| Long | Output | 75.00 | 52.50 |
| Long | Cache read | 2.00 | 1.40 |
| Long | Cache write | 25.00 | 17.50 |

The public catalog, model detail tier switch, channel defaults, channel pricing intervals, and
billing tests all use these values. The Packy Core account and private upstream cost rule do not
change unless Packy's own GPT-6 card price changes; manufacturer list-price corrections must not be
mistaken for upstream-cost changes.

## Migration and Safety

A new idempotent migration updates only the `OwnAPI LLM` channel and the specifically named Packy
accounts. It adds both DeepSeek customer prices, replaces GPT-6 customer default and interval
prices, adds the dedicated account-cost rule when `Packy / DeepSeek Sale` exists, and enforces the
exact DeepSeek model mapping on that account. It does not create or store a secret token.

Until the dedicated production account exists with a valid `deepseek-sale` token, DeepSeek requests
fail closed as unavailable. The migration must not route them through another Packy account.

## Verification

Tests cover catalog names and 75-percent arithmetic, GPT-6 short/long official and customer prices,
DeepSeek protocol routing, customer-to-upstream alias rewriting, migration idempotence, exact
account scoping, and channel billing values. After deployment, verify the production migration and
account scope read-only. Enable the account only after its `deepseek-sale` token is supplied and
validated, then run one explicitly approved minimum-cost request per upstream model and reconcile
customer charge, Packy account cost, usage history, and upstream privacy.
