---
name: diagram-design
description: Draw one standalone HTML page with an inline SVG diagram or chart - architecture, flowchart, sequence, data flow, timeline, bar, waterfall, line, heatmap, scatter, sankey. Use when asked to draw, chart, plot, or diagram something, or invoked as /ds:diagram-design.
argument-hint: "[type] <what to draw | path to data>"
---

# diagram design

One diagram per page, in an editorial style. Rules for each type are in `types/`. Colors, fonts, and strokes are in `style.md`.

Adapted from [diagram-design](https://github.com/cathrynlavery/diagram-design) by Cathryn Lavery (MIT, see `.agents/LICENSE` in the plugin repo).

## Rules

- Deleting beats adding. Every node is a distinct idea, and every line carries information.
- The `accent` goes on 1–2 elements. It marks the point of the figure, not everything important.
- Target density is about 4/10. A diagram that needs a guide is two diagrams.
- Draw nothing when a sentence or a 3-column table says the same.

## Pick the type

| If you are showing | Read |
|---|---|
| Components and connections in one snapshot; nested admin and traffic scopes | `types/type-architecture.md` |
| Decision logic with branches | `types/type-flowchart.md` |
| Time-ordered messages between actors | `types/type-sequence.md` |
| Role-scoped data flow, who does what at each step | `types/type-data-flow.md` |
| Events positioned in time | `types/type-timeline.md` |
| Comparison across categories | `types/type-bar.md` |
| A start total bridged to an end total by signed steps | `types/type-waterfall.md` |
| A trend over time, change between two states, a distribution per series, rank movement | `types/type-line.md` |
| Cross-tabulated data, fill encodes the value | `types/type-heatmap.md` |
| Two variables; bubble adds a third, beeswarm shows one dot per item | `types/type-scatter.md` |
| A quantity splitting and merging across stages | `types/type-sankey.md` |

When two types fit, pick the one whose axis is the point. Do not mix layout grammars.

For a before/after rewiring of modules, use the architecture delta in the `visual-review` skill (`architecture-delta.md`), not this skill.

## Steps

1. Pick the type. Read its `types/type-*.md` and `style.md`.
2. Say the plan in one line: the type, the focal element, what you cut. If the user can answer, wait for a reply when the type is ambiguous.
3. Write one self-contained `.html` file: inline SVG, inline CSS, no external fonts, scripts, or images.
   - Define `style.md` roles as CSS variables on `:root`; override the color roles under `@media (prefers-color-scheme: dark)`.
   - Give `body` an explicit background.
   - `<svg>` has `role="img"` and `aria-labelledby` pointing at its own `<title>` and `<desc>`. `<title>` is the first child. Prefix the ids, for example `bar-title`.
   - Set `min-width` to the viewBox width and put the SVG in a wrapper with `overflow-x: auto`, so a phone scrolls the diagram and not the page.
   - Draw arrows before boxes. Legend is a horizontal strip under the diagram, never floating inside it. Add about 60px to the viewBox for it.
4. Save to `~/.agent/diagrams/diagram-design/<slug>.html`. Tell the user the path.
5. Check the list below. Open the page in a browser when you can, in light and dark.

## Connector rules

For architecture, flowchart, data flow, and sequence. All six are mandatory.

1. Orthogonal only. Between off-axis nodes use rounded right-angle elbows at `r=8` (`r=6` in tight layouts). A straight line only when both ends share x or y. No diagonals.
2. Arrow labels are at most 14 characters, in caps, centered on the segment, on an opaque mask rect, with a 6–10px gap from the stroke. Beside vertical segments, never on the line.
3. No overlapping or stacked strokes. Offset parallel routes by 12px or more; use a bridge at a single crossing.
4. Connectors on one box edge each get their own attach point at `L * k / (N + 1)`, 12px or more apart.
5. No line passes behind a box that is not its endpoint. Reroute. If impossible, dash it (`4,3`) and put the label at the visible end.
6. A label mask must not overlap a node drawn after it.

Arrows: `muted` by default, `accent` for the headline path, `link` for HTTP and external calls, dashed `5,4` for optional, async, or return.

## Budget per diagram

| Limit | Value |
|---|---|
| Nodes | 9 |
| Arrows or transitions | 12 |
| Accent elements | 2 |
| Callouts | 2 |

Per-type limits are in each `type-*.md`. Over budget: split into an overview and a detail diagram.

## Check before you finish

- [ ] The type fits. A table or sentence would not do the same job.
- [ ] Could any node, arrow, or label be removed? Could two nodes merge?
- [ ] Accent on 2 elements or fewer. Legend lists only what is used.
- [ ] Within the budget and the type's own limits.
- [ ] Every arrow label has an opaque mask. No vertical `writing-mode` text.
- [ ] Text clears 4.5:1 in light and dark (`style.md`).
- [ ] No shadows, no radius above 10px. Sizes and gaps on the 4px grid.
- [ ] Names in sans, technical strings (ports, URLs, commands) in mono.
- [ ] For a chart: the axis is not truncated, and each value printed matches its mark.
