# Architecture delta

Adapted from [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT, see `.agents/LICENSE`), `type-architecture-delta.md` and `primitives-core.md`.

Two snapshots of the same modules, with a change ledger between them: **Before · Changes · After**. Use it when a change rewires modules or relationships. The reader sees what appeared, disappeared, changed, moved, or reconnected.

Not for:

- One snapshot of the system. Use the Mermaid graph.
- Attribute-only changes with no topology story. Use a table.
- Order of events over time. A delta has two states and says nothing about order, downtime, or cause.

Start from the block in `template.html` (`.delta-scroll`). Verify with `python3 <skill-dir>/verify-architecture-delta.py <page>`.

## Layout

- Three panels: Before, Changes, After. Before and After have the same width, height, and grid. The middle panel is a text ledger, not a third diagram.
- Name the snapshots with a version, commit, or date (`main`, `PR #3`).
- Copy the Before coordinates into After. Move a retained component only when the move is part of the story, and give it a `MOVED` entry. Never lay out each panel on its own.
- Each snapshot is one `<g transform="translate(x y)">`. Write component bounds and paths in local coordinates. Before and After share one y. The ledger sits in the gap.
- Grid pitch is 4. Every component x, y, width, height is a multiple of 4. Template grid: `336 288 4`.
- Budget across the whole comparison: **8 components, 10 relationships, 8 ledger entries**. A retained ID counts once. A component that is changed and moved needs two ledger entries. Over budget: use the Mermaid graph (see SKILL.md). Never drop edges to fit.
- Node text must fit a 144 wide node: name at most 17 characters, sublabel at most 22, kicker at most 22.
- Ledger rows: kicker line, one description line of at most 44 characters, 48 apart. Entry k has its kicker at y `94 + 48 * k` and its description baseline at `116 + 48 * k` (k from 0). The template fits 6 entries: the last baseline (356) stays above the vertical `.rule` end (360). More than 6 entries: add 48 per extra entry to the viewBox height (`384`), the `rect.bg` height, and the end of each vertical `.rule` line (`V 360`). Grow `data-grid` height in both snapshots only if components need it.
- Small screens: keep all three panels. The SVG sits in `.delta-scroll` (`overflow-x: auto`) with a scroll hint. Do not shrink text or stack the panels.

## Colors and change vocabulary

Colors come from the template tokens, never hard-coded: `--node-added`, `--node-modified`, `--node-deleted`, `--card`, `--border`, `--foreground`, `--body`, `--muted-foreground`. The template CSS keys on `data-status`, so light and dark both work. Font is Inter, radius 0, black borders, no extra colors.

Color is secondary. Every change also has text and a line or shape treatment:

| State | Meaning | Treatment |
|---|---|---|
| `unchanged` | same identity, meaning, position, endpoints | plain solid outline, no ledger entry, kicker `=` |
| `added` | only in After | `+` kicker, green fill, thicker line for a path |
| `removed` | only in Before | `−` kicker, pink fill, dashed outline or path |
| `changed` | retained, signature differs | `Δ` kicker, blue fill, ledger says old → new |
| `moved` | retained component, local x or y differs | `↔` kicker, dotted outline |
| `rewired` | retained relationship, source or target differs | dash-dot line, ledger says old → new endpoints |

Do not leave a node out of After to mean removal without a `REMOVED` entry. Do not draw an `ADDED` edge when the edge was rewired. A replacement gets a new ID plus a removal and an addition.

## Metadata contract

The verifier reads these attributes, not the labels. IDs match `[A-Za-z][A-Za-z0-9_.:-]*`. No empty, duplicate, or malformed values.

### Diagram and snapshots

- Exactly one `<svg data-diagram="architecture-delta">` with `role="img"`, `aria-labelledby`, and `<title>` then `<desc>` as its first children. The `<desc>` is one sentence about what changed, not about shapes.
- Two direct child `<g>`: `data-snapshot="before"` and `data-snapshot="after"`.
- Each has `data-grid="<width> <height> <pitch>"` (same in both) and `transform="translate(<x> <y>)"`. Nothing else may transform geometry. No nested `<svg>`, `<use>`, animation, or `<foreignObject>`.
- Do not put objects or ledger text in `<defs>` or other non-rendering containers. Do not hide them with CSS.

### Components

A `<g>` with:

| Attribute | Contract |
|---|---|
| `data-kind="component"` | marks a component |
| `data-object-id` | unique within a snapshot |
| `data-status` | one state, or `changed moved` |
| `data-signature` | non-empty meaning of the object |

It holds exactly one direct `<rect data-role="bounds">` with numeric `x`, `y`, `width`, `height`, on the grid, inside the grid. This is the drawn node box.

### Relationships

A `<path>` with `data-kind="relationship"`, `data-object-id`, `data-status`, `data-signature`, `data-from`, `data-to`. Both ends are component IDs in the same snapshot. Swapping source and target is a rewire.

Every path in a snapshot that is not inside a component is a relationship and needs all of this. Decorative paths go inside a component, or outside the snapshots.

Statuses: `unchanged`, `added`, `removed`, `changed`, `rewired`, or `changed rewired`. `moved` is for components, `rewired` for relationships. `unchanged`, `added`, `removed` stand alone.

`d` is one absolute `M` then absolute `L`, `H`, `V`, `Q`, or `C`. No relative commands, subpaths, `Z`, or arcs. All points stay inside the grid. The start touches the source box outline and the end touches the target box outline, within 2px.

### Status and signature rules

- An ID only in Before is `removed`. An ID only in After is `added`.
- A retained ID keeps its kind and its status in both snapshots.
- The signature differs **if and only if** the object is `changed`. Build it from the facts you compare, like `uploader:send` and `uploader:withRetry`, or `call:upload`. Leave out ID, coordinates, style, and endpoints. A move or rewire alone never changes it.
- A retained component's local (x, y) differs if and only if it is `moved`. A size change also needs `changed`.
- A retained relationship's (`data-from`, `data-to`) differs if and only if it is `rewired`. Its route may change when an end moves.

### Ledger

One visible `<text>` per (object ID, change) pair, outside both snapshots, with `data-change="ADDED|REMOVED|CHANGED|MOVED|REWIRED"` and `data-target="<one ID>"`. The text starts with the same uppercase word and explains the difference. Put the metadata on the outer `<text>`, not on a `<tspan>`. No entries for unchanged objects. At least one entry.

## Connector rules

Required for every path. Draw paths before components so boxes sit on top.

1. **Right angles only.** Every bend is a rounded quarter turn: `Q` with a corner radius of 8 (6 at least in tight spots). A straight connector is still a `<path>`. No diagonals. A connector leaves and enters a box at right angles to the edge, on the straight part at least 8px from a corner.
2. **No overlap.** Two connectors never share a stroke or run on top of each other. Offset parallel routes by 12px or more. If they keep colliding, the layout is too tight or over budget.
3. **Fan shared edges.** Two connectors on the same edge of a box use different points, 12px or more apart. For N connectors on an edge of length L, point k sits at `L * k / (N + 1)`.
4. **Do not pass behind other boxes.** Route around boxes that are not the source or target. If a box cannot be avoided, dash the stroke and put no arrowhead on that box.
5. **Stable edges may re-route.** A relationship that follows a moved component keeps its ID and status.

Elbow path, going down, right, then down, corner radius 8: `M 168 160 V 176 Q 168 184 176 184 H 248 Q 256 184 256 192 V 208`.

## Arrow labels

Optional. Use them for the relationship ID and a short word, like `r1 · send`.

- At most 14 characters. Style comes from `.lbl` in the template.
- Put an opaque mask `<rect>` (fill `var(--card)`) behind the text, so the label stays readable.
- Keep a 6 to 10px gap between the mask and the connector line. The line must stay visible. For a vertical segment put the label beside the line, not on it.
- The mask must not overlap a node drawn later. Place it on a stretch of open canvas. A mask fully inside a node is fine.
- Never rotate text.

## What the verifier checks

IDs, snapshot membership, shared grid, bounds on grid, signature and position rules, relationship ends on box outlines, budgets, and ledger coverage. It rejects CSS that transforms, moves, resizes, or hides verified objects. Keep geometry in SVG attributes, not CSS.

It does not render the page. You still check by eye, light and dark, desktop and mobile: label fit, crossings, a box covering a line, and signatures that describe the real change.

## Anti-patterns

- Two snapshots laid out separately, so nodes seem to move.
- A ledger line that says only "updated".
- Color as the only status marker.
- Unchanged nodes drifting without a `MOVED` entry.
- A semantic change hidden behind an unchanged signature.
- An edge drawn to another component while its `data-from` / `data-to` stay the same.
- Counting retained objects twice to justify dropping others.
- Reading the delta as a migration plan. It has no order, rollback, or downtime.
