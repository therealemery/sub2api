# OwnAPI PackyAPI LLM Upstream Design

Date: 2026-09-01
Status: Approved in conversation; pending written-spec review

## Objective

Connect PackyAPI as the first production LLM upstream for OwnAPI without exposing Packy credentials to customers. Customers create and use OwnAPI API keys. OwnAPI authenticates those keys, restricts the available models, forwards supported Chat Completions requests through the correct Packy token, charges the customer in USD, and records upstream cost separately.

The first release supports only:

- `GET /v1/models`
- `POST /v1/chat/completions`
- streaming and non-streaming Chat Completions

Responses, images, audio, embeddings, reranking, and other protocols are out of scope for this release.

## Confirmed Business Rules

- Customer balances and deductions are denominated in USD.
- Recharge conversion is fixed at `6.7 CNY = 1 USD`.
- The standard customer price is the current manufacturer list price multiplied by `0.7`.
- PackyAPI charges are upstream costs only and never determine the customer charge.
- Customers do not select Packy routing groups when creating an OwnAPI key.
- A newly created customer key uses the single standard OwnAPI customer group by default.
- Administrators may create other OwnAPI customer groups or user-specific overrides with different billing multipliers.
- Only models with a confirmed Packy route, confirmed customer price, and non-loss-making margin may be callable.
- Models without a ready route may remain visible in the public catalog but must be marked unavailable for API use.
- `glm-5.3-flash` and `MiniMax-M3` remain removed.

## Terminology

OwnAPI groups and Packy groups have different purposes and must not be conflated:

- **OwnAPI customer group**: controls customer access, model visibility, rate multiplier, subscription behavior, and API-key routing context.
- **Packy token group**: a Packy-side upstream product/cost group, such as `codex` or `aws-q`. It identifies which Packy token and cost schedule OwnAPI uses for a model.
- **OwnAPI channel**: owns the customer-facing model allowlist, official base prices, and model mappings.
- **OwnAPI account**: stores one Packy credential and its supported model mapping. Each Packy token is represented by a separate OpenAI API-key account.

## Architecture

### Customer group and pricing

Create one active OpenAI-platform OwnAPI group for normal customers, provisionally named `OwnAPI Standard`.

- `rate_multiplier = 0.7`
- wallet billing in USD
- all approved first-release text models available
- new customer API keys default to this group without asking the customer to select a group

The existing group multiplier is the source of the standard discount. The channel pricing table stores manufacturer list prices in USD per token, not already-discounted prices. Billing therefore remains:

```text
customer_charge_usd = official_list_cost_usd * effective_customer_multiplier
```

The effective multiplier uses the repository's existing precedence:

1. user-specific multiplier for the OwnAPI customer group, when configured;
2. otherwise the OwnAPI customer group's multiplier (`0.7` for Standard).

Administrators can create additional customer groups or apply existing per-user group overrides for negotiated pricing. No new discount data model is needed.

### Channel

Create one customer-facing language-model channel, provisionally named `OwnAPI LLM`.

- bind it to `OwnAPI Standard` and any later customer pricing groups;
- enable `restrict_models`;
- configure only approved first-release models;
- store manufacturer list prices in USD;
- map customer-facing OwnAPI model IDs to the exact Packy model IDs;
- use channel-mapped models as the billing source so aliases cannot select an unintended price.

`GET /v1/models` derives its result from this restricted channel/group configuration. It must return only models that are callable for the API key's OwnAPI group.

### Packy accounts

Create one OpenAI `api_key` account per Packy token group:

| Account label | Packy token group |
| --- | --- |
| `Packy / aws-q` | `aws-q` |
| `Packy / codex` | `codex` |
| `Packy / kimi-sale` | `kimi-sale` |
| `Packy / minimax-officially` | `minimax-officially` |
| `Packy / glm-sale` | `glm-sale` |
| `Packy / grok-sale` | `grok-sale` |

Every account:

- uses Packy's OpenAI-compatible base URL;
- sends `Authorization: Bearer <Packy token>`;
- is marked as not supporting the Responses API so Chat Completions uses the repository's raw `/v1/chat/completions` forwarder;
- contains an exact account-level model mapping/allowlist for only that Packy token group;
- binds to the same OwnAPI customer group or groups that may use its models;
- has independent concurrency, priority, health, and enable/disable controls.

The Packy token group does not become an OwnAPI customer group. Routing is selected by the requested model and the accounts' model allowlists within the customer's OwnAPI group.

## Request Flow

1. The client sends an OwnAPI key to `POST /v1/chat/completions`.
2. Existing middleware authenticates the OwnAPI key and resolves its default OwnAPI customer group.
3. Existing balance, quota, expiration, IP, and rate-limit checks run.
4. The restricted channel verifies that the requested model is callable and resolves its canonical/billing model.
5. The scheduler considers only accounts bound to the customer's OwnAPI group and supporting the requested model.
6. The selected Packy account replaces the inbound credential with its server-side Packy token and forwards to Packy's `/v1/chat/completions` endpoint.
7. Streaming requests force `stream_options.include_usage=true`; OwnAPI drains the upstream stream even if the client disconnects so usage can still be settled.
8. On a successful response with usable usage data, OwnAPI calculates the official-list cost and applies the effective customer multiplier.
9. OwnAPI atomically records usage and deducts the customer's USD balance using the existing idempotent billing path.
10. Upstream account cost is recorded separately for margin reporting.

At no point is the Packy token returned to the client or forwarded from the client's request.

## Upstream Cost and Margin

Packy cost must be represented separately from customer billing.

```text
packy_cost_usd = packy_cost_cny / 6.7
gross_profit_usd = customer_charge_usd - packy_cost_usd
gross_margin = gross_profit_usd / customer_charge_usd
```

Use the existing account-statistics pricing mechanism to assign normalized USD cost rules to each Packy account or account group. Usage logs already retain requested model, upstream model, account, channel, customer charge, account multiplier, and account-statistics cost. The admin usage view can derive revenue, upstream cost, profit, and margin without changing customer deduction logic.

The cost rules are configuration data based on the Packy pricing cards. They must be reviewed whenever Packy changes a group price. A route must be disabled if its configured 70% customer price no longer covers its normalized Packy cost.

## Credential Handling

- Never commit Packy tokens, paste them into documentation, or place them in frontend code.
- Never emit full Packy tokens in application logs, errors, API responses, screenshots, or test fixtures.
- Admin API responses must continue to mask saved credentials.
- Local and production credentials are configured separately.
- The existing multi-group Packy token remains untouched during implementation.
- Six dedicated Packy tokens are created only after the code/configuration path is ready and the user confirms the live account action.
- Each dedicated token receives the minimum single Packy group required for its account.

The current repository stores API-key account credentials in the server-side account credential record. This design does not claim that field is encrypted at rest. Database access, backups, logs, and administrator access must therefore be treated as secret-bearing infrastructure. Encrypting all account credentials at rest is a separate security project because it affects every existing upstream type and credential refresh path.

## Failure Behavior

- Unknown or unconfigured model: return an OpenAI-compatible model-not-available error before contacting Packy.
- Insufficient OwnAPI balance or quota: reject before contacting Packy.
- Packy `401` or `403`: treat the account as a credential/configuration failure and do not charge the customer.
- Packy `429`: apply existing account rate-limit handling; do not charge if no billable response was produced.
- Retryable Packy `5xx` or transport failure: use existing failover behavior only when another eligible account exists; otherwise return a sanitized upstream error.
- Streaming connection ends without usage: do not silently charge an estimated amount. Record an operational billing error for investigation and fail closed for customer deduction.
- Usage persistence or deduction failure: preserve the existing mandatory/idempotent billing path and surface the event in operations logs.

Raw Packy response bodies and credentials must not be exposed to customers. Request IDs and sanitized error categories should remain available for support.

## Administration

The first implementation reuses existing admin surfaces:

- Groups: create and manage the standard `0.7` customer group and optional alternative multiplier groups.
- Group user multipliers: override the multiplier for negotiated customers.
- Channels: configure the callable model allowlist, mappings, and official USD list prices.
- Accounts: configure six dedicated Packy accounts, credentials, mappings, concurrency, and status.
- Usage: inspect customer charge and normalized account cost.

Any Packy-specific convenience UI should be deferred until the underlying configuration and end-to-end request path are proven. Packy tokens are not created automatically by OwnAPI.

## Initial Model Enablement

The first-release allowlist is generated from the intersection of:

1. models currently present in the 44-model public catalog;
2. models present in one of the six selected Packy token groups;
3. models with verified current manufacturer list pricing;
4. models whose 70% customer price is greater than their normalized Packy cost.

The mapping table must record, for every enabled model:

- OwnAPI public model ID;
- exact Packy upstream model ID;
- Packy token group;
- official input, cached-input, and output prices;
- Packy input, cached-input, and output cost in CNY;
- normalized cost in USD;
- expected margin at the standard `0.7` multiplier;
- source URL and verification date.

No model is enabled through a wildcard.

## Validation

Automated validation must cover:

- a newly created customer key receives the standard OwnAPI group without a customer-facing group choice;
- `/v1/models` returns only enabled models for that group;
- model allowlist and exact account selection for every Packy token group;
- the Packy authorization header replaces, and never leaks, the OwnAPI customer key;
- raw streaming and non-streaming Chat Completions forwarding;
- forced streaming usage collection;
- customer charge equals official list cost multiplied by the effective group/user multiplier;
- upstream account cost uses Packy CNY cost divided by `6.7`;
- customer balance, API-key quota, usage log, and cost records remain consistent and idempotent;
- no customer charge on rejected, unauthorized, rate-limited, failed, or usage-less upstream responses;
- sanitized errors and credential masking;
- the existing non-Packy routes and billing tests remain green.

After automated tests, perform local end-to-end checks with dedicated low-risk Packy tokens for one non-streaming request and one streaming request per enabled Packy group. Verify the Packy consumption log, OwnAPI usage log, customer balance delta, and calculated margin before production deployment.

## Rollout

1. Implement and test the configuration/routing/billing behavior without live Packy tokens.
2. Create six dedicated single-group Packy tokens after explicit user confirmation.
3. Configure the local OwnAPI group, channel, accounts, model mappings, pricing, and normalized cost rules.
4. Run local end-to-end calls and reconcile both systems' usage records.
5. Keep unverified models unavailable.
6. Integrate the feature branch only after review and full regression validation.
7. Configure production secrets independently and deploy through the existing workflow after its SSH authentication is repaired.

The existing multi-group Packy token is not disabled or deleted as part of this rollout.
