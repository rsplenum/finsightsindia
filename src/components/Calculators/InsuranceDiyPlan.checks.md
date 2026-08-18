# Design checks — InsuranceDiyPlan

**Written before the component.** The third of the brief's three outputs, and
the one the page never had at all.

> *"then displays how to do DIY generally, that opens oppoutunity to promote
> genuinely beneficial and advantageous products."* — Rahul, 16 Aug 2026

**Question:** *All right — so what do I actually do on Monday?*

## Why a verdict without this is half delivered

dd-021/do-4 states it plainly: *a verdict the reader cannot act on is half
delivered.* The old page ended at a number. A reader persuaded that unbundling
wins was then left to work out, alone, what sum assured to buy, from whom, what
to do with the difference, and how to take an income out of it later — which is
the entire reason people buy the bundled product in the first place. The bundle
is not sold on its returns. It is sold on the fact that somebody else does the
assembling.

So this panel is the assembly instructions, priced from the reader's own
figures. It is not a generic explainer.

## It must be printable when the POLICY wins, too

The obvious failure here is a panel that only exists when the do-it-yourself
route wins, which would make the whole page an advertisement for the conclusion
it reaches (dd-021/dont-1). So:

- When the do-it-yourself route wins, this is **how to do it**.
- When the policy wins, this is **what you would be giving up** — the same four
  steps, with the shortfall stated, and a plain sentence saying the policy is
  the better deal on these figures and why.

Both are printed from the same four steps and the same figures. The panel's
structure does not change with the verdict; only what it says about the outcome
does.

## What it must be honest about

A do-it-yourself route is not free of drawbacks, and a panel that lists only its
advantages is the same advocacy in the other direction. Four things the policy
does that the replica does not, stated in the panel rather than left out:

1. **The policy's number is a contract; the replica's is an assumption.** The
   guaranteed income arrives whatever the market does. The index fund's does not.
2. **Where s.10(10D) applies, the policy's payouts are tax-free in the reader's
   hands** and the replica's are not. That is a real advantage and the screen
   says so.
3. **The policy cannot be stopped easily**, which is a cost when you want out
   and a benefit when you would otherwise have spent the money.
4. **The replica needs the reader to keep doing it** for thirty years, including
   the years the market falls.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing removed; this is entirely new. It is the complexity the old page pushed onto the reader being absorbed into our work instead — dd-001/do-2, in the one place the page was doing the opposite. |
| dd-001/dont-2 | PASS | The steps are the whole of what the route requires, not a reduced version. Where a step has a real choice inside it — which fund plan, which insurer — the choice is named rather than made for the reader. |
| dd-002/dont-1 | PASS | One question, four steps in the order they happen. Measured by the reader's question, not by how much it says. |
| dd-002/dont-2 | RISK | Four steps is more than two new concepts. Deliberate: they are one procedure and splitting them across disclosures would leave a reader holding half a plan, which is worse than a long one. They arrive after the verdict, so nobody meets them before they have a reason to care. |
| dd-003/dont-1 | PASS | This is the most transferable thing on the page: buy protection as protection, invest the rest, and know what each costs. It works on any policy, including ones this tool never priced. |
| dd-003/dont-2 | PASS | It claims nothing about the tool. Every sentence is about what the reader would do. |
| dd-004/dont-1 | PASS | Where a figure is projected forward it carries its frame on its own line. The amounts in the steps are today's rupees by construction — what to pay this year — and say so. |
| dd-004/dont-2 | PASS | Neither word appears anywhere in the panel. Where it has to distinguish today's rupees from later ones it says "of today's money", which is the distinction in the reader's own vocabulary. |
| dd-005/dont-1 | PASS | Four steps in sequence, not a list of considerations. The four honest drawbacks are a named section with a heading that says what they are, rather than worries scattered through the instructions. |
| dd-006/dont-1 | PASS | The panel's skeleton is fixed. The verdict changes what the outcome sentence says, which is a different answer rather than a rewording. |
| dd-006/dont-2 | PASS | The trade-off — guarantee versus return — is stated adjacently, both sides visible at once. It is not behind a control. |
| dd-007/dont-1 | PASS | Step number, step heading, step body, figure. Four levels, each asserting a different thing. The four drawbacks are set identically to one another because none outranks the rest. |
| dd-007/dont-2 | PASS | The steps are numbered because they are genuinely sequential — you cannot invest the difference before you know what the cover costs. |
| dd-008/dont-1 | PASS | Each step's prose is a principle that holds at every input: *buy the cover first, because what is left is what you invest.* Only the rupee figures move, and they sit in fixed slots. |
| dd-008/dont-2 | PASS | It says what to do, not where the reader is. |
| dd-009/dont-1 | PASS | Every figure here is traceable: the cover sums are what the reader typed, the annual costs are those sums at the stated per-crore rate, and the investable amount is the premium less both. The arithmetic is shown, not asserted. |
| dd-009/dont-2 | PASS | This panel *is* the explanation the page was missing. |
| dd-009/do-3 note | PASS | The reader is never asked to subtract. "You pay ₹1,00,000; the cover costs ₹17,000; you invest ₹83,000" — all three figures printed, none left as an exercise. |
| dd-010/dont-1 | PASS | The steps headline what a person does and pays, month to month and year to year, not a terminal figure. |
| dd-012/dont-1 | N/A | No averages. |
| dd-012/dont-2 | N/A | No verdict line of its own; it renders the one `verdictFor()` produced. |
| dd-012/dont-3 | PASS | The confusion it ends is the whole page's old ending: a persuaded reader with nothing to do next. |
| dd-013/dont-1 | PASS | Same `analyseReplication` result as every other surface. No figure here is recomputed. |
| dd-013/dont-2 | PASS | The cover cost and the investable amount shown here are the engine's `riskCostPerYear` and `investableCapital` by identity, and a test asserts it. |
| dd-017/dont-1 | PASS | Step 3's amount is a multi-year commitment, and the panel says what it will be worth by the last year rather than letting it decay in silence. |
| dd-017/dont-2 | PASS | Every figure is stated per year, which is how a premium is quoted and how the reader thinks about it. |
| dd-017/dont-3 | PASS | The interpretation is stated: the amount invested is level in cash terms, matching the policy's level premium, so the two routes stay comparable. Not put to the reader as a choice. |
| dd-017/dont-4 | PASS | The panel says explicitly that a level contribution buys less each year, which is the same drift the policy's premium has. Neither side is silently favoured. |
| dd-017/dont-5 | PASS | Where today's money and later money both appear, each is named. |
| dd-019/dont-1 | PASS | Each figure carries its quantity on its own line: "what the life cover costs, each year". |
| dd-019/dont-2 | PASS | Nothing on this panel is framed "in today's prices" except the one line that says what the last year's contribution will be worth, and it names its quantity. |
| dd-019/dont-3 | PASS | Structural: every step's figure is a labelled row rather than a bold number with a caption beside it. |
| dd-019/dont-4 | N/A | |
| dd-020/dont-1 | PASS | Nothing is withheld. Where a route is unavailable for a real reason — a reader who cannot get term cover — the panel says what to do instead rather than pretending the option exists. |
| dd-020/dont-2 | N/A | It asks nothing. |
| dd-020/dont-3 | PASS | The policy shape changes which steps have figures — an endowment's step 4 is a single redemption rather than an annual withdrawal — and never what a step means. |
| dd-021/dont-1 | PASS | **The rule this whole panel is built to satisfy, and the rule most likely to be broken by it.** It prints when the policy wins as well as when it loses, with the same four steps, and it names four things the policy does that the replica does not. Checked against the brief's test: fed a good policy, this panel says so. |
| dd-021/dont-2 | N/A | No inputs. |
| dd-021/dont-3 | PASS | dd-021/do-4 is the point of the component. The verdict is followed by how to act on it. |
| dd-022/dont-1 | N/A | No fields. |
| dd-022/dont-2 | N/A | |
| dd-022/dont-3 | N/A | |
| dd-022/dont-4 | N/A | |
| dd-023/dont-1 | PASS | Designed at 375: four stacked steps, each a heading, a paragraph and a figure row. There is no wide version — it is the same single column at 1280, which is the honest outcome of designing narrow first. |
| dd-023/dont-2 | PASS | Every figure is in place. No tooltips. |
| dd-023/dont-3 | N/A | Nothing here is side by side. |
| dd-024/dont-1 | PASS | It does not exist until there is a verdict to act on, so it is never a heading over an empty space. |
| dd-024/dont-2 | PASS | It opens by saying what the reader is looking at and why it follows from the verdict above. |
| dd-024/dont-3 | PASS | It reorganises with the verdict and with the policy shape — which steps carry figures, and whether the closing sentence is "here is how" or "here is what you would give up". |

## Deliberate choices

- **No product is named and no link is placed.** Rahul's note says this opens
  the opportunity to promote genuinely beneficial products. That opportunity is
  real and it is not this session's to take: a recommendation shipped inside a
  tool whose whole claim is neutrality has to be a decision he makes, with
  whatever disclosure it carries. What is built is the honest version — what to
  buy, what it should cost, what to look for — with no destination attached.
  **On the gate for him.**
- **The four drawbacks are not a disclaimer.** They are in the body, at the same
  weight as the steps, because a reader who discovers them later concludes the
  page was selling something.
- **Step 4 is the one nobody explains.** Taking an income out of a fund is the
  part the bundled product genuinely does for you, and the step says how — sell
  what you need in the year you need it, and what that costs in tax.

## Open — for Rahul

- **Whether to name products or link to them at all**, and if so with what
  disclosure. Built without, deliberately.
