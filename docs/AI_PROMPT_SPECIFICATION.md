# FlyCheap AI — AI Prompt Specification

**Version:** 1.0  
**Status:** Draft / implementation-aligned

## Scope

AI explains validated flight evidence. It does not create prices, invent availability, select a provider, or override deterministic safety rules.

## Input contract

The explainer receives normalized route, fare, currency, observed time, historical comparison, score, total-cost components, risk reasons and buy-decision output. Missing evidence must remain missing.

## Output contract

The response must contain a short explanation, recommendation from the allow-list, risk from the allow-list, confidence in `[0,1]`, evidence tags and uncertainty/limitations. The client normalizes malformed output and uses safe defaults; backend functions remain internal-authenticated.

## Safety rules

- Never state that a price is guaranteed.
- Never claim an airline, promotion, weather, visa or fee fact without supplied evidence.
- Never recommend unsafe self-transfer or hidden-city behavior without the deterministic risk assessment.
- If evidence is insufficient, recommend monitoring or insufficient data.
- AI failure is fail-independent: feed/analyzer data remains valid and the UI explains that AI insight is unavailable.

## Evaluation

Validate schema, unsupported claims, confidence calibration, evidence grounding and regression fixtures before changing prompts or models. Live evaluation is blocked until the Edge Function and provider/history data are deployed.
