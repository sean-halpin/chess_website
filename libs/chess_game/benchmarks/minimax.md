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

## 2026-09-11 after generated `MoveResult` reuse

This run reuses the `MoveResult` that legal-move generation already produced
when applying child states, rather than regenerating the moving piece's
pseudo-legal moves.

| Metric | Baseline | After reuse |
| --- | ---: | ---: |
| Time limit | 5,000 ms | 5,000 ms |
| Elapsed wall time | 5,015 ms | 5,014 ms |
| Selected move | `e7-e5` | `e7-e5` |
| Positions expanded | 861 | 936 |
| Legal moves generated | 21,083 | 23,514 |

Within the same time budget, the search expanded 75 more positions (8.7%) and
generated 2,431 more legal moves (11.5%).

## 2026-09-11 after direct reads and targeted move copies

This run removes deep clones from read-only legal-move and check detection
paths. Applying a move now creates only a new board and command-history array.

| Metric | After `MoveResult` reuse | After direct reads |
| --- | ---: | ---: |
| Time limit | 5,000 ms | 5,000 ms |
| Elapsed wall time | 5,014 ms | 5,003 ms |
| Selected move | `e7-e5` | `c7-c5` |
| Positions expanded | 936 | 12,646 |
| Legal moves generated | 23,514 | 318,017 |

The search expanded 11,710 more positions (12.5×). The selected move changes
because the engine can now complete deeper iterations within the same budget.

## 2026-09-11 after row-level board copies

Board updates now copy the outer board array and only the row containing the
changed square, instead of rebuilding every square on every update.

| Metric | After direct reads | After row copies |
| --- | ---: | ---: |
| Time limit | 5,000 ms | 5,000 ms |
| Elapsed wall time | 5,003 ms | 5,002 ms |
| Selected move | `c7-c5` | `c7-c5` |
| Positions expanded | 12,646 | 13,219 |
| Legal moves generated | 318,017 | 330,872 |

The row-level copy expanded 573 more positions (4.5%) and generated 12,855
more legal moves (4.0%).

## 2026-09-11 after iterative-deepening root ordering

Each completed iteration now searches its best root move first in the next
iteration. Root alpha-beta bounds are also carried between candidates so an
early strong move can prune later candidates.

| Metric | After row copies | After root ordering |
| --- | ---: | ---: |
| Time limit | 5,000 ms | 5,000 ms |
| Elapsed wall time | 5,002 ms | 5,002 ms |
| Selected move | `c7-c5` | `e7-e5` |
| Positions expanded | 13,219 | 12,208 |
| Legal moves generated | 330,872 | 321,759 |

For this single opening position, root ordering expanded 1,011 fewer positions
(7.6%). Move ordering is position-dependent; this result should be compared
across a representative benchmark suite before treating it as a general
throughput improvement.
