# Design checks — InsuranceAnswer

**Written before the component.** T11's last item: apply sol-019's three layers
to T5. This is layer 1 for the insurance analyser — the page led with the
policy's XIRR, which is the answer to an analyst's question, and buried the one
the reader actually came with.

**Question:** *Should I buy this policy, or buy the cover on its own and invest
the difference?*

That is the single comparison the whole subject reduces to (dd-005). Everything
else on the page — the yield, the GST, the commission, the sensitivity table —
is a push on one side of it.

## The insight the component is built on

The DIY route is **defined** to fund the identical payouts, in the identical
years. The income is held constant by construction. So the honest headline is
not "which one gives you more money" but:

> **Same income, same years. The difference is what is left at the end — and
> what the cover costs you to keep.**

That framing is what makes a terminal surplus a legitimate headline here rather
than an accountant's summary (dd-010), and it is stated on the screen in those
words rather than left for the reader to infer.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing is removed. The 3-step explainer, the frictions X-ray, the sensitivity table and both route cards all survive; the Answer is added above them, so the page gains a layer instead of losing content. |
| dd-001/dont-2 | PASS | The seven inputs remain exactly as they are. This is a new READ surface, not a reduced entry — the analyser's entry contract is not being narrowed to three fields. |
| dd-002/dont-1 | PASS | The step is measured by its question, not its size: one question — policy or unbundle — with the verdict and the cover's cost as its two consequences. |
| dd-002/dont-2 | PASS | Two new concepts, deliberately: unbundling (buying cover and investment separately), and that the income is identical either way. No new controls at all. |
| dd-003/dont-1 | PASS | The takeaway is a sentence, and the transferable idea is that a policy which also invests is two products in one wrapper — price them apart and you can see what each costs. That survives without us. |
| dd-003/dont-2 | PASS | The correct XIRR and the replication walk are the price of admission, not the achievement. What is claimed here is only that the comparison is now stated in one line. |
| dd-004/dont-1 | PASS | The two moneys sit adjacently in the sentence itself — "₹54.5 lakh, worth ₹9.5 lakh in today's prices" — never in a footnote or a parenthetical aside at the bottom of a card. |
| dd-004/dont-2 | PASS | The words real and nominal do not appear. It says "in today's prices" and "in the rupees of the day", which is the distinction in the reader's own words. |
| dd-005/dont-1 | PASS | It names the one comparison and puts it on screen. The frictions and the sensitivity table are pushes on one side of it, and are reachable below rather than listed as worries here. |
| dd-006/dont-1 | PASS | The sentence skeleton is fixed. Only the slotted values move, and the verdict clause swaps only when the verdict genuinely changes kind — funded versus ran out, which is a different answer, not a rewording of the same one. |
| dd-006/dont-2 | PASS | **Cleared 18 Aug.** The unbundle toggle is gone. It was a page-wide mode hiding the one thing that is the lesson — what the protection costs — and with it off the page printed a comparison it had to disclaim in the same breath. What the cover costs is now a permanent named row on this component, in both moneys, whatever else is set. Recorded as a removed capability in `InsurancePolicyForm.checks.md` and on the gate for Rahul. |
| dd-007/dont-1 | PASS | Three sizes, each asserting something: the verdict clause is the largest because it is the answer, the two money figures are equal to each other because they are the same quantity in two moneys, and the supporting line is smallest. |
| dd-007/dont-2 | PASS | The two DIY routes are rendered as equals below; nothing in the Answer implies the growth route is the recommended one, which the old emerald-versus-indigo styling quietly did. |
| dd-008/dont-1 | PASS | Values live in fixed slots. The prose states the principle — same income either way, the difference is what is left — which stays true at every position of every input. |
| dd-008/dont-2 | PASS | It states the outcome and, when the route fails, the boundary: the year the money runs out. Not "you are currently looking at a 12% assumption". |
| dd-009/dont-1 | PASS | Every figure in the sentence is traceable to a figure below it: the surplus is the growth card's, the cover cost is the risk-cost row, the yield is the policy card's. One derivation, `analyseReplication`, feeds all of them. |
| dd-009/dont-2 | PASS | Nothing below is deleted to make room. The Answer adds the explanation the page was missing rather than trimming one it had. |
| dd-010/dont-1 | PASS | The shortfall case leads with the lived quantity — the year the income stops arriving — not with a balance. The surplus case may headline the terminal figure only because the income is identical by construction, which the screen says in those words. |
| dd-012/dont-1 | PASS | No averages anywhere. Every figure is one deterministic path under stated assumptions, and the sensitivity table below shows the spread. |
| dd-012/dont-2 | PASS | The verdict line is a single concrete quantity the reader can picture — rupees left over, or rupees of income that never arrive — never the difference of two averages. |
| dd-012/dont-3 | PASS | The confusion this exists to end is the old page's: −₹11.08 lakh printed in emerald green under the word "Surplus" beside a badge reading POLICY WINS. One verdict, from `verdictFor`, now drives the word, the sign, the colour and the badge. |
| dd-013/dont-1 | PASS | No inputs, no engine, no second read of the form. It renders the same `analyseReplication` result the rest of the page renders, from the single `readPolicyInputs` reader. |
| dd-013/dont-2 | PASS | Asserted in a test: the Answer's surplus IS the growth card's `finalBalance` and its cover cost IS `riskCostPaid`, by identity rather than by recomputation. |
| dd-017/dont-1 | PASS | The premium is a ten-year input and the policy fixes it in flat nominal rupees. It was decaying in silence; the Answer now says what the last instalment really costs in today's prices, so the decay is on the screen instead of in the contract's favour. |
| dd-017/dont-2 | N/A | |
| dd-017/dont-3 | PASS | No mode question is asked. The interpretation — the premium is what the policy demands, in the rupees of each year — is stated, not put to the reader as a choice at the entry. |
| dd-017/dont-4 | N/A | |
| dd-017/dont-5 | PASS | The goal and the contribution are both shown in both moneys, adjacently, and the sentence says which is which rather than leaving the reader to assume they are comparable. |
| dd-019/dont-1 | PASS | Within this component the parts are bound: the card names its quantity once ("Left over at the end") and each of the two rows beneath carries its own frame on the same line as its figure. The defect F-12 names is cross-surface and is answered in dont-2. |
| dd-019/dont-2 | PASS | **F-12 closed, 18 Aug.** The phrase is now a COLUMN HEADER over a table whose rows name their own quantity — the adjacent-columns arrangement dd-019's own note says explicitly passes — so it appears once per table instead of four times beside four unrelated figures. "THE SAME MONEY" is deleted. The fix was structural rather than verbal, because the old frames were already correct. |
| dd-019/dont-3 | PASS | **Cleared with dont-2.** The point stands and is why the fix is a table rather than better wording: a correct frame was never the problem. Every figure now sits at the intersection of a row that names what it counts and a column that names whose money it is. |
| dd-019/dont-4 | N/A | The "THE SAME MONEY" heading itself lives in insurance-analyzer.astro, which carries no checks file; tracked under F-12. |
| dd-020/dont-1 | N/A | The inputs are properties of one policy - premium, term, sum assured - not a menu filtered by who the reader is. There is no eligibility list to prune. |
| dd-020/dont-2 | N/A | No category or status question is asked, so none is being asked without buying a simplification. |
| dd-020/dont-3 | N/A | No category filter exists on this surface, so none can change the surplus or the year the money runs out. |
| dd-021/dont-1 | PASS | **Cleared 18 Aug, and not by one fix.** sol-060 taxed the safe route. This session found three more figures of zero typed in by omission: the growth route paid no fund fee where the bond route's zero is a genuine fact; the policy's payouts were assumed exempt under s.10(10D) whatever its cover; and an escalating income was priced as level. Two of those favour the policy and one favours the replica. Verified on the built page: fed a good policy it prints **Keep the policy** without hedging, and the do-it-yourself panel still prints in full beside it. |
| dd-021/dont-2 | PASS | **Cleared 18 Aug, and the brief's premise turned out to be stale.** Accident cover has been priced since sol-039 — `accidentCost` is in `investableCapitalOf` and the field was on the form. What the engine genuinely could not express was the brief's other half, *"and whether they grow"*: `payoutGrowthPct` is new. The input set is now the brief's list exactly, and the one input that cannot move the verdict — inflation, which discounts both sides identically — sits in the assumptions block labelled as what it is. |
| dd-021/dont-3 | PASS | This part already holds. sol-040 gave the page one verdictFor() driving the heading, the figure, the colour, the badge and the sentence, so the screen states who wins rather than leaving the reader to subtract two numbers and decide. |
| dd-022/dont-1 | PASS | **Cleared 18 Aug.** The page now opens on ONE control — verified on the built page, `main` holds exactly one visible control at rest — and the form that follows asks one question at a time. The one deviation from dd-022's literal wording is the spine, and it is recorded as a RISK in `InsurancePolicyForm.checks.md` and on the gate for Rahul rather than being absorbed here. |
| dd-022/dont-2 | N/A |  |
| dd-022/dont-3 | PASS | **Cleared 18 Aug.** The form's length is the reader's policy: an endowment holder answers six questions and a hybrid with an escalating income and a rider answers ten. Verified by walking both shapes on the built page. Nothing is pre-filled either, which was the other half of the same fault — the old form showed a verdict about a policy nobody owns. |
| dd-022/dont-4 | N/A |  |
| dd-023/dont-1 | PASS | **Rebuilt narrow-first, 18 Aug.** The whole surface was designed at 375 and only then given a wide layout, and it was measured there first: 0 horizontal overflow, 0 pieces of type below 12px, 0 clipped select labels. Three option labels were shortened because they were wider than their boxes at 375 — a native select clips rather than wraps, so a long label is one the reader cannot read. That fault would not have been found by a desktop design checked afterwards. |
| dd-023/dont-2 | PASS | Every figure is rendered in place. The explanatory line under a control is visible prose rather than a hover tooltip, so nothing the reader needs is behind a pointer. |
| dd-023/dont-3 | PASS | The two routes are stated as a verdict in a sentence before they are shown as figures, so the comparison survives being stacked. The sentence is the comparison; the figures support it. |
| dd-024/dont-1 | PASS | **Cleared 18 Aug.** `InsuranceIntro` meets the reader, states the two questions the tool answers and promises both verdicts are printable, then hands over the first question. The old hero — "unmask the true annualized yield (XIRR)" — is deleted: it announced a verdict before asking anything, which is dd-021 as a matter of tone. |
| dd-024/dont-2 | N/A |  |
| dd-024/dont-3 | PASS | **Cleared 18 Aug.** Answering the opening question collapses the welcome entirely and the workbench takes its place — verified on the built page, including that the shared card's `.reveal` is lit explicitly so a workbench hidden at load does not come back invisible, and that a timer sits behind `transitionend` because it does not fire in a backgrounded tab. Both are sol-065's findings, applied here rather than rediscovered. |

## Deliberate choices

- **The verdict is computed, not phrased.** `verdictFor()` returns a
  discriminated union with a `tone`, and every surface renders that. The old
  page made four independent decisions about one fact — heading, colour, badge,
  bottom line — and they disagreed. This is the mechanism, not a promise to be
  careful (dd-011).
- **The income is held constant, and the screen says so.** Without that
  sentence the reader has no way to know the surplus is not being bought by
  cutting their income, and the whole comparison is unreadable.
- **The shortfall case leads with a YEAR.** "The money runs out in year 16 with
  ₹1.06 crore of promised income still to come" is a thing a person lives
  through. "−₹1.06 crore" is not.
- **The policy's own yield stays on screen but stops leading.** It is the
  evidence for the verdict, not the verdict.

## Open — for Rahul

Both of the items that stood here are closed. The toggle is gone rather than
made adjacent, and the safe route has been taxed since sol-060. What is open
now belongs to the components built alongside this one:

- **The spine, not the catalogue** — `InsurancePolicyForm.checks.md`.
- **Whether the do-it-yourself panel may ever name a product** —
  `InsuranceDiyPlan.checks.md`.
- **The ₹5 lakh premium rule is stated, not applied** — `InsuranceRoutes.checks.md`.
