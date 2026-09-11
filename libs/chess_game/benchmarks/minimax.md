# Minimax benchmark baseline

Run this benchmark from `libs/chess_game`:

```sh
npm run benchmark:minimax
```

It measures Black's response after `1. e4` with a five-second search budget
and a maximum requested depth of 10. The figures are machine-dependent. A
`position expanded` is one call to `GameState.getChildren`; `legal moves
generated` is the sum of child positions returned by those calls.

## 2026-09-11 baseline

Run on this repository's development environment with Node.js 20.10.0:

| Metric | Result |
| --- | ---: |
| Time limit | 5,000 ms |
| Elapsed wall time | 5,015 ms |
| Selected move | `e7-e5` |
| Positions expanded | 861 |
| Legal moves generated | 21,083 |

The small elapsed-time overrun is expected: cancellation is checked at minimax
node boundaries, so work already in progress completes before the search exits.
