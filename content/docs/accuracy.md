# Accuracy harness

`npm run accuracy` replays labeled sessions through the real matching engine (`apps/server/src/identification/engine.ts`) using an in-memory candidate store that applies the same update rules as ingest. CI fails when precision or recall drop more than 0.5 points below [`baseline.json`](../apps/server/test/fixtures/accuracy/baseline.json).

## Fixtures

- `apps/server/test/fixtures/accuracy/*.json`: hand-labeled sessions. `acceptance.json` holds the Phase 1 acceptance cases: one device in normal and private windows, a minor browser update with and without the stored token, and lookalike devices with identical hardware that must stay separate.
- Synthetic populations (`apps/server/src/accuracy/synthetic.ts`), generated deterministically from a seed: popularity-skewed GPUs, screens, hardware, timezones and languages; default font sets on most devices; and lifecycle events (return visit, private window, cleared storage, minor and major browser update, external monitor, travel).

A session has a `device` (ground truth: one browser installation), a `profile` (browser storage: same profile means the persisted token is still there) and the hashed `components`.

## Metrics

- **Precision** (pairwise): of all session pairs assigned the same visitor, the share that really are the same device. Low precision means different people get merged, which is the costly error for ban evasion.
- **Recall** (pairwise): of all same-device session pairs, the share assigned the same visitor.
- **False merge rate**: share of devices whose very first session was attached to another device's visitor.
- **Indistinguishable rate**: share of devices whose first-session components exactly equal another device's. No engine can split those; it bounds what is achievable on the fixture.
- **Per scenario**: share of sessions that landed on the device's original visitor.

## Matching method

The default matcher is probabilistic record linkage (`identification.method: "linkage"`, after Fellegi and Sunter). For each component both visits report it adds evidence:

- equal values: `ln((1 - change) / frequency)`. A value few visitors share (a rare font set) is strong evidence; one most share (the platform) is weak.
- different values: `ln(change / (1 - frequency))`. A component that often changes on the same browser (CSS support after an update, `changeRate` 0.3) costs little; one that rarely does (the GPU, 0.02) costs a lot.

`frequency` is the share of the project's visitors with that value, from a table the maintenance job rebuilds from the visitors table (`component_stats`), smoothed towards built-in priors so a young project is not overconfident. Correlated components (everything that follows the GPU, the browser build, the locale, the fonts) form groups in which only the strongest agreement counts, so one fact is not counted five times; every disagreement counts. The sum, damped by `dependence` and added to prior odds that one of the k candidates is the returning browser (`returningRate / k`, plus `priorLogOdds`), gives a probability; at or above `matchProbability` (0.97) it is a match. `similarity` in the decision stays the weighted component similarity, for readability.

Against the weighted matcher (same fixtures):

| Fixture | Weighted precision / recall | Linkage precision / recall |
| --- | --- | --- |
| acceptance | 100% / 100% | 100% / 100% |
| synthetic seed 1 (300 devices) | 96.0% / 90.0% | 98.0% / 95.7% |
| synthetic seed 2 (1,000 devices) | 88.9% / 89.2% | 94.5% / 92.5% |

On seed 2 the gains are after browser updates (major 49% to 86%, minor 84% to 93%), cleared storage (92% to 95%) and in fewer wrong merges (5.5% to 3.2%). The cost: a changed time zone or screen now weighs more, so travel drops from 88% to 80% and an external monitor from 83% to 82%. `dependence`, `priorLogOdds` and `matchProbability` were chosen on these fixtures, then checked on five populations the tuning never saw (seeds 11 to 15, 300 to 3,000 devices): mean precision 86.6% to 89.3%, mean recall 88.5% to 90.1%, at least as good on every one (precision tied on the 300-device population). Change rates and prior frequencies are domain estimates, not fitted. Override files written before linkage existed keep `method: "weighted"`.

## Choosing the default threshold (weighted method)

On the synthetic populations, `matchThreshold` was swept from 0.80 to 0.92. At 0.80 precision collapsed (59% and 35%) because GPU-derived components dominate the weights, so lookalike devices that differ only in screen, timezone or language cleared the bar. 0.90 gave the best F1 on both populations while keeping precision high, so it is the default. This was tuned on synthetic data only and must be revisited on real traffic in Phase 3 (shadow mode); tuned weights then go in a private override file, not in this repository.

## Limits

Synthetic data reflects our assumptions about the world. Real traffic has correlations and noise we did not model (browser extensions, OS updates changing fonts, GPU driver updates changing canvas). Expect real-world accuracy to be lower than these numbers.

## Learning weights from your outcomes

The default suspect-score weights are judgement calls. Once you have outcomes, learn them instead:

1. Export labels as CSV, one `eventId,label` per line, with `fraud` or `legit` (banned accounts, chargebacks and confirmed bots against accounts in good standing). Events must still be within retention.
2. Run `npm run tune -w trace-server -- --labels labels.csv --out scoring.tuned.json`.
3. Read the report: for each signal, how often it fired, the fraud rate when it fired, the learned coefficient, and the old and new weight, plus the ROC AUC of the learned and current weights on your data.
4. If it is better, point `SCORING_CONFIG_PATH` at the file.

It fits a logistic regression with an L2 penalty on which signals fired, then rescales so the score reaches `--block-score` (default 60) where the model estimates 50% fraud. Signals that fired on fewer than `--min-support` events (default 20) keep their current weight. The AUC is measured on the same data it was fitted on, so it is optimistic; hold back a share of labels to check it if you have enough.

