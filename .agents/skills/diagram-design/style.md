# Style

Colors, fonts, and strokes for every diagram. The files in `types/` name these roles (`paper`, `ink`, `accent`, `eyebrow`, ...), never hex values. Define each role once as a CSS variable on `:root`, and redefine the color roles for dark mode.

## Colors

| Role | Use | Light | Dark |
|---|---|---|---|
| `paper` | Page background, default node fill | `#f5f5f5` | `#2d3142` |
| `paper-2` | Secondary fill | `#ececec` | `#393e53` |
| `ink` | Primary text and stroke | `#2d3142` | `#f5f5f5` |
| `ink-strong` | Text on accent fills | `#111111` | `#111111` |
| `muted` | Secondary text, default arrow | `#4f5d75` | `#bfc0c0` |
| `soft` | Sublabels, boundary labels | `#5a6580` | `#949eb2` |
| `rule` | Hairline borders | `rgba(45,49,66,0.12)` | `rgba(245,245,245,0.12)` |
| `rule-solid` | Stronger borders, baselines | `#bfc0c0` | `rgba(191,192,192,0.25)` |
| `accent` | The 1–2 focal elements | `#bf4520` | `#f08a59` |
| `accent-tint` | Fill of accent-bordered boxes | `rgba(191,69,32,0.08)` | `rgba(240,138,89,0.10)` |
| `link` | HTTP/API calls, external arrows | `#2e5aa8` | `#739fdf` |

- Opacity forms such as `ink @ 0.55` mean the `ink` color at that alpha. Resolve `ink` against the skin in use: light `ink` is dark `paper`, so a hairline copied unchanged from light to dark vanishes.
- The `accent` is for 1–2 focal elements. More than two erases the signal.
- Body paper is warm grey, not pure white. Shadows are out; borders are in.

### Contrast

| Use | Minimum against its background |
|---|---|
| Text, including any `soft`, `link` or `accent` used as text | 4.5:1 |
| Large text (24px+, or 18.7px+ at weight 600+) | 3:1 |
| Lines, arrows, borders, data points that carry meaning | 3:1 |
| Translucent tints, `rule`, `paper-2` | none, but never the only carrier of meaning |

Blend `rgba()` over `paper` before measuring. Text inside an `accent-tint` box or on `paper-2` is measured against that surface. The default values above clear these in both skins.

### Series palette

For charts that must separate several series. `accent` stays reserved for the focal series.

| Role | Light | Dark |
|---|---|---|
| `series-1` | `#7c8f6f` | `#9caf8f` |
| `series-2` | `#5e7a9b` | `#82a0c0` |
| `series-3` | `#b8915a` | `#d3ad7a` |
| `series-4` | `#9c6b50` | `#b88670` |
| `series-5` | `#6e6479` | `#8d8298` |

Fill at 0.18 opacity on light, 0.22 on dark. Stroke at full color. Use it only where overlapping shapes need distinct colors.

## Type

System fonts only, so a diagram makes no network request.

| Role | Family | Size | Weight | Use |
|---|---|---|---|---|
| `title` | `Georgia, serif` | 1.75rem | 400 | Page heading |
| `node-name` | `system-ui, sans-serif` | 12px | 600 | Human-readable labels |
| `sublabel` | `ui-monospace, monospace` | 9px | 400 | Port, protocol, URL, field type |
| `eyebrow` | `ui-monospace, monospace` | 7–8px | 500, tracked 0.18em, uppercase | Type tags, axis labels |
| `arrow-label` | `ui-monospace, monospace` | 8px | 400, tracked 0.06em | Arrow annotations |
| `callout` | `Georgia, serif` italic | 14px | 400 | Editorial asides only |

Names go in sans. Mono is for technical content: ports, commands, URLs. Keep 8px of padding in boxes, since system fonts vary in width.

## Stroke, radius, grid

| Token | Value | Use |
|---|---|---|
| `stroke-thin` | 0.8 | Tag outlines, leaf nodes |
| `stroke-default` | 1 | Most strokes |
| `stroke-strong` | 1.2 | Emphasis |
| `radius-sm` | 4 | Small tags |
| `radius-md` | 6 | Node boxes |
| `radius-lg` | 8 | Containers |
| `grid` | 4 | Node origins, sizes, gaps and padding divide by 4. Data-scaled coordinates are exempt. |

## Node treatment

| Node | Fill | Stroke |
|---|---|---|
| `focal` (1–2 max) | `accent-tint` | `accent` |
| `backend` | `#ffffff` | `ink` |
| `store` | `ink @ 0.05` | `muted` |
| `external` | `ink @ 0.03` | `ink @ 0.30` |
| `input` | `muted @ 0.10` | `soft` |
| `optional` | `ink @ 0.02` | `ink @ 0.20`, dashed `4,3` |
| `security` | `accent @ 0.05` | `accent @ 0.50`, dashed `4,4` |
