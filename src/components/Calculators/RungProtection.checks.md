# Design checks — RungProtection (rung 5)

> Written before the component, per dd-000. Rung 5 was blocked on sol-018 for a
> reason that matters here: until the hedging engine was fixed it reported that
> protection *doubled* your money, and a screen built on that would have taught
> the reader something false, beautifully.

**Question:** *What does it cost to protect against that?*

**Rahul's decision, 15 Aug:** "1.85% is right, keep it." The premium is settled
and is not a knob. That is what makes this rung possible: with the price fixed,
the only variable left is how rough the market turns out to be, and that is the
whole lesson.

| entry | check | answer |
|---|---|---|
| dd-001 | did complexity move, or disappear? | Moved. The full hedging controls — premium, floor depth — remain in the expert panel where they always were. This rung fixes the premium at the price the copy quotes and varies the one thing the reader cannot choose. |
| dd-002 | one question, ≤2 new concepts? | One question, one control. Two concepts: what the protection pays on (a *year* ending more than 10% down), and what it charges (1.85% every year, always). Both are defined on screen before they are used. |
| dd-003 | what do they leave with? | That insurance has a **fixed price and a variable payout**, so buying it is a bet that the world will be rougher than the price assumes. That transfers to every insurance decision they will ever make, which is the point — not to a number. |
| dd-004 | which money? | No rupee figure appears at all, so there is nothing to frame. The rung is denominated in *rates* and *counts*: percent a year, "1 year in 14", "futures in 100 where the money lasts". The lifetime cost is given as a share of the starting pot, which is frame-free by construction. |
| dd-005 | the one comparison? | **What you pay every year, against how often the floor actually catches you.** Every other consideration — floor depth, volatility, horizon — is a force pushing one of those two numbers. |
| dd-006 | is a difference hidden behind a mode? | No. Protected and unprotected sit in **adjacent columns**, never a toggle. The difference between them *is* the lesson, and dd-006 says a difference that is the lesson cannot be a mode. This is the entry's exact case. |
| dd-007 | what does each visual difference assert? | Two columns, equal weight, equal type — they are equal claims. Colour appears only on the outcome row, and only to say better or worse. Nothing is smaller than anything else. |
| dd-008 | drag end to end: does any sentence change? | No. The principle is true at every position. The boundary sentence names the roughness at which protection starts paying for itself, which covers the whole track at once and changes only when some *other* input does. The boundary is notched on the track itself. |
| dd-009 | any unexplained figure? | The frequency row explains the floor ("a *year* ending more than 10% down — not a bad month"). The premium row states 1.85% and that it is paid in calm years too. The average payout is derived on screen from the frequency, so the net figure is traceable from the two rows above it. |
| dd-010 | lived experience or summary? | Headline is **how many futures in 100 the money lasts**, in both columns — what a retiree actually lives with. The terminal balance is not shown at all here; it is the accountant's number and rung 4 already demoted it. |

**Deliberate choices**

- **The control is market roughness, not the premium.** Rahul settled the price,
  and a slider on a settled number would invite the reader to shop for an
  answer they like. Roughness is the honest variable: it is the one thing
  neither we nor the reader controls, and the one the whole verdict turns on.
- **"Roughness", never "volatility".** T7. The word is defined by its
  consequence — how often a year ends badly — not by a definition.
- **Frequency and payout are computed analytically, not simulated.** Returns are
  normal with mean `expectedReturn` and spread `annualVolatility`, so
  `P(year < floor)` and the average payout are exact closed forms. A simulated
  figure would wobble between drags for no reason, and dd-008 says nothing that
  moves should need re-reading — a number that jitters is re-read every time.
- **Survival is simulated, and paired.** Both columns run on the same seed and
  the same paths, so the difference between them is the hedge and nothing else.
- **The verdict at the shipped defaults is negative, and the rung says so.**
  At 15% roughness this protection costs about 1.4% a year and returns about
  0.5%, and survival falls. We are not going to bury that: it is the most
  useful thing the screen can tell someone, and the crossover — around 20% —
  is what makes it an idea rather than a verdict.
