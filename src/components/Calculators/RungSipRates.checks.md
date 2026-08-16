# Design checks — RungSipRates (rung 2)

**Question:** *What are my savings really earning, and what am I really putting in?*

**Retrofitted to the dd-016 format on 16 Aug**, when sol-035 was fixed here. The
rung's whole argument had to be rewritten, not just its NaN: it used to say *a
fixed instalment shrinks, so consider a step-up*, and under dd-017 holding
purchasing power is the default — so the shrinking case is now only true for
someone who has deliberately chosen a flat amount.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing removed. The rung gained the cash figure of the last instalment; the flat-amount case is still reachable and still explained. |
| dd-001/dont-2 | PASS | Layer two of the ladder, driven by the three entry inputs; it asks for nothing again. |
| dd-002/dont-1 | PASS | One question, one table, one closing idea. No control added. |
| dd-002/dont-2 | PASS | The only new concept is that the instalment itself rises — and it is the concept the rung exists to teach. |
| dd-003/dont-1 | PASS | The takeaway is the two rates and what they do to a monthly commitment, which is usable on any product we never built. |
| dd-003/dont-2 | PASS | Correct arithmetic is the floor; the achievement is that the reader stops thinking of ₹25,000 as a fixed thing. |
| dd-004/dont-1 | PASS | Every row is a rate a year or a rupee a month, and the two money frames are named on the rows themselves. |
| dd-004/dont-2 | PASS | Neither word appears. "Really worth", "in today's money" and "spending power" carry it. |
| dd-005/dont-1 | PASS | This IS the spine — what you earn against what prices do. Everything else on the page is a push on it. |
| dd-006/dont-1 | PASS | No control on the rung, so no state to diff. |
| dd-006/dont-2 | PASS | The gap between what you pay in cash and what it is worth is shown as two figures, never as one behind a switch. |
| dd-007/dont-1 | PASS | One weight for the rate rows, heavier for the two that carry the argument. Nothing decorative. |
| dd-007/dont-2 | PASS | Colour marks only whether the last instalment holds its value — green, amber or red on a single row, by a stated threshold. |
| dd-008/dont-1 | N/A | No control on this rung. |
| dd-008/dont-2 | N/A | No control on this rung. |
| dd-009/dont-1 | PASS | The real rate is the ratio, not the difference, and the closing paragraph states both figures it comes from so the reader can trace it. |
| dd-009/dont-2 | PASS | The rewrite made the rung longer, not shorter: it now says what the instalment becomes in cash as well as what it is worth. |
| dd-010/dont-1 | PASS | The lived quantity is what you hand over every month for twenty years, not a terminal balance — there is no terminal balance on this rung at all. |
| dd-012/dont-1 | N/A | Nothing here exists for a tail; every figure is the stated plan. |
| dd-012/dont-2 | PASS | No differences of averages. Two rupee amounts a reader can picture. |
| dd-012/dont-3 | PASS | **This is the rung that failed it.** It printed "₹NaN a month" on the live page. A screen that prints NaN has failed whatever else is right, which is why every figure it prints is now asserted finite. |
| dd-013/dont-1 | PASS | One engine, one input set. The escalation is asked of `contributionPlan()` rather than recomputed here — sol-035 was exactly that re-derivation. |
| dd-013/dont-2 | PASS | The instalment figure here and the entry's escalation line come from the same derivation, so they cannot disagree. |
| dd-017/dont-1 | PASS | The rung's entire subject is that a multi-year input decays if nothing is done about it. It is where that is made visible. |
| dd-017/dont-2 | PASS | Rows are in rupees a month and per cent a year — what a person commits and what they earn, not a drift and a discount factor. |
| dd-017/dont-3 | N/A | Not the entry. |
| dd-017/dont-4 | PASS | At a zero real step the rung now states that the instalment rises with prices and what it costs never changes — the opposite of the old copy, which assumed zero meant decay. |
| dd-017/dont-5 | PASS | The goal does not appear on this rung; the two figures that do are both labelled with their money. |

## Deliberate choices

- **Four copy branches, not one.** Going backwards in real terms, a deliberately
  flat instalment, holding pace, and holding pace with a career raise on top are
  four genuinely different situations and one sentence cannot serve them. The
  branch is chosen from the derived plan, never from a raw field.
- **The rung leads with rates and ends with rupees.** The rates are the model;
  the rupees are what makes the model bite. Reversing that order was tried on
  the planner and read as an arithmetic lesson rather than a personal one.
- **No control here yet.** The contribution-mode chooser belongs on this rung —
  it is the rung about inflation eating money — and the entry currently links to
  the expert panel instead. That is honest but not finished, and it is on the
  gate rather than bolted on at the end of a session.
