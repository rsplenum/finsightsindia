# Design checks — RungSipRates (rung 1)

**Written before the component.**

**Question:** *So how fast is your money really growing — and how much are you
really putting in?*

| entry | check | answer |
|---|---|---|
| dd-004 | does it teach the frame before using it? | This IS the teaching step. "Your money grows 13.4%, prices rise 6%, so you are really 7% better off" gives the real/nominal distinction in the reader's own words without using either word — and every later rung depends on it. |
| dd-005 | is this the one comparison? | Yes, and it is the accumulation twin of the planner's. There the spine is growth against the draw; here it is growth against inflation, with the contribution as the third term. Fees, tax, roughness and the hedging premium all arrive later as pushes on it. |
| dd-002 | one question, ≤2 new concepts? | One comparison, two rates, no new vocabulary. |
| dd-007 | does every visual difference mean something? | The ledger rows are one size and one weight; only the two summary rows are heavier, and they are heavier because they are the answer. Nothing shrinks decoratively. |
| dd-009 | is any needed explanation cut? | No. The two things a saver would otherwise have to work out for themselves are stated: that real growth is a ratio and not a subtraction, and that a flat SIP shrinks in real terms every year unless it is stepped up. |

**Deliberate choices**

- **The contribution gets its own row, falling.** The planner's version has a
  withdrawal that rises with inflation; the mirror image here is the one thing
  most SIP calculators never say — a fixed ₹25,000 a month is a smaller and
  smaller sacrifice each year, and also a smaller and smaller contribution. The
  step-up control in rung 5 is the answer to it, and this rung is where the
  reader learns why it exists.
- **No control on this rung.** It is the model everything else pushes on; giving
  it a slider would invite the reader to tune the spine before they have it.
