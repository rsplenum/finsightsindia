# Design checks — InsurancePolicyForm

**Written before the component.** The insurance analyser's input column, rebuilt
18 Aug against dd-021, dd-022, dd-023 and dd-024. It replaces the six-field
panel inside `insurance-analyzer.astro`, which laid its whole form out at once
and pre-filled every box with somebody else's policy.

**Question:** *What is my policy, in the words my policy document uses?*

## The design, settled here before it is built

### The one question, and what it removes

The category is **"What does this policy give back, and when?"** — a regular
income, one lump sum at the end, or both. It is a dd-020 filter and not a guess:
an endowment plan has no annual income, so "the policy year the income starts"
cannot apply to it, and a money-back plan with no terminal bonus has no maturity
year. The question buys a real simplification, which is what dd-020/dont-2
demands of any question at all.

It lives in `InsuranceIntro`, not here, because answering it is what resolves
the page from a welcome into a workbench (dd-024). It is restated compactly at
the top of this form so it can be changed without going back to a screen that
has collapsed — the `inCategoryRestate` pattern from `TaxInputForm`.

### THE ONE DEVIATION FROM dd-022, STATED RATHER THAN SLID PAST

dd-022/do-2 reads: *show exactly ONE field once the category is known, and every
other field arrives because the reader asked for it.* On the tax form that is
exactly right, because every field after the primary one is **optional** — a
reader either has rental income or does not, and a form that never mentions rent
has still asked them everything that applies.

**An insurance policy is not like that.** Premium, term, payout, payout year and
sum assured are not optional facts about the reader's life; they are the five
facts that constitute the policy. None of them can be omitted and still leave a
verdict — and an add-dropdown offering "Premium payment term" as a thing you may
*add* misrepresents it as optional, which is a lie about the arithmetic.

So this form uses **a spine, not a catalogue**: it opens on one field, and each
answer reveals the next question. At any moment there is exactly one unanswered
question on screen, plus the answers already given. The add control is kept for
what is genuinely optional — an escalating income, and accident or health cover.

This satisfies dd-022's stated purpose (*"the user faces zero cognitive load"*,
*"its length is the length of their life and not of our catalogue"*) and dd-002
exactly. It does **not** satisfy dd-022/do-2's literal words. That is a reading
of Rahul's rule, so it is recorded as a RISK below rather than a PASS, and it is
on the launch gate for him — the same treatment the `primaryFor` judgement for
Professional and Self-employed got.

### Every field starts empty

The form this replaces pre-filled all six boxes — ₹1,00,000, 10 years, ₹1,20,000
a year — so a reader who had typed nothing was shown a confident verdict about a
policy nobody owns. Under dd-022 a pre-filled box is worse than an empty one: it
is a question the reader must read, check and correct, and if they do not, the
answer on screen is ours rather than theirs. Nothing is computed until the spine
is complete.

### The order of the questions

Premium → for how many years → what it pays back → what it protects → your slab.
That is the order the policy document states them in and the order a person
recites them in. The slab is last because it is the only question about the
reader rather than about the policy, and by then they can see why it is asked.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | RISK | One capability is deliberately removed: the **unbundle toggle**. Off, it invested the whole premium and bought no cover, and the page itself printed "this is not a like-for-like comparison" when it did. What it produced was a comparison the screen had to disclaim, not a capability. What the reader actually wanted from it — what the protection costs — is now a permanent named figure instead of a mode (dd-006/do-1). Recorded as a RISK and put on the gate for Rahul, because removing a control is his call and not ours. |
| dd-001/dont-2 | PASS | The entry is one field; the offering is the whole policy. Every fact the engine can price is still asked for, and the assumptions block keeps the fund plan, the inflation rate and both cover-cost overrides reachable rather than fixed behind our numbers. |
| dd-002/dont-1 | PASS | Layering is by question, not volume: one unanswered question at a time, in the order the policy document states them. |
| dd-002/dont-2 | PASS | Each step reveals exactly one new control. The only step revealing two concepts at once is the payout block for the "both" shape, and there the second is the terminal lump sum, which the reader has just said their policy has. |
| dd-003/dont-1 | PASS | The form's transferable idea is that a policy is a cashflow plus a protection, and that the two can be priced apart. The block headings say so in those words — "What you pay", "What it pays back", "What it protects". |
| dd-003/dont-2 | PASS | Nothing here claims completeness. The assumptions block states what we assumed and lets it be corrected, which is the opposite of presenting capability as achievement. |
| dd-004/dont-1 | PASS | No figure on the form is projected forward, so no reconciliation is needed here. The two moneys live on the output surfaces, adjacently, never in a footnote. |
| dd-004/dont-2 | PASS | The words real and nominal do not appear. Where the form must talk about money losing value it says "what it will be worth by then". |
| dd-005/dont-1 | PASS | The form asks for the policy, not for a list of worries. Every field is a fact printed on the policy document. |
| dd-006/dont-1 | PASS | Nothing on this form swaps one body of text for a near-identical one. The category restate changes which questions exist, which is a different form and not a reworded one. |
| dd-006/dont-2 | PASS | **This is the rule that removed the unbundle toggle.** What the protection costs is the lesson, and it was hidden behind a switch. It is now a permanent figure on the answer, shown whichever way anything is set. |
| dd-007/dont-1 | PASS | Two type sizes on the form: the field label and the hint under it. The block heading is a third and asserts that the block is a group. No size means "this one is prettier". |
| dd-007/dont-2 | PASS | The three blocks are genuinely three things — money out, money back, protection — and are drawn as equals. Nothing implies one matters more. |
| dd-008/dont-1 | PASS | Every hint under every field is a fixed statement of what the field means. None of them is rewritten as a value changes; the values that move live on the output panels in fixed slots. |
| dd-008/dont-2 | PASS | No sentence here describes where the reader currently is. The nearest thing is the slab hint, which states a principle — interest is taxed as it accrues — that is true at every setting of the control. |
| dd-009/dont-1 | PASS | The one place a figure on the form differs from what the reader typed is the cover cost, which is priced from the sum assured. It is shown in the assumptions block with the per-crore rate that produced it, in the same view. |
| dd-009/dont-2 | PASS | Nothing is shortened by deleting an explanation. Every field keeps its hint, and the assumptions block gains explanations the old advanced panel never had — what the fund fee is, and why the bond route has none. |
| dd-010/dont-1 | N/A | The form headlines nothing; it asks. |
| dd-012/dont-1 | N/A | No averages are taken on this surface. |
| dd-012/dont-2 | N/A | The form states no verdict. |
| dd-012/dont-3 | RISK | The honest risk of a spine is that a reader who cannot answer question three never reaches the verdict at all, where the old form at least showed them something. Mitigated: every question after the first says what it will be used for, and the working panel says in plain words which answer it is still waiting on. Judged worth it, because what the old form showed them was a verdict about a policy that was not theirs. |
| dd-013/dont-1 | PASS | No inputs of its own. `readPolicyInputs()` is the one reader for this page and this form's ids are declared there, not here. |
| dd-013/dont-2 | PASS | The category appears twice — in the welcome and restated here — and the page keeps them in step through one handler, exactly as the tax page does. No quantity appears twice with two values. |
| dd-017/dont-1 | PASS | **This is the rule the premium field was failing.** A level premium is a ten- or twelve-year commitment quoted in flat rupees, so it decays in silence and the decay flatters the policy. The field's hint now says the policy will never raise it, and the answer prints what the last instalment really costs. |
| dd-017/dont-2 | PASS | Every question is in the unit the policy document uses: rupees a year, policy years counted from one, a sum assured in rupees. Nothing is asked in the engine's units. |
| dd-017/dont-3 | PASS | The escalating-income field states its interpretation instead of asking for a mode: "increases by this much of the starting income every year" — simple escalation, named on the label, so it can be checked against the policy wording rather than guessed at. |
| dd-017/dont-4 | PASS | An escalation of zero is a level income, which is what most of these policies actually pay, and the answer says the income does not keep pace with prices rather than leaving it implied. |
| dd-017/dont-5 | PASS | The form asks for everything in the rupees of the day, which is how the policy states them, and every output figure carries its own frame. The two are never set beside each other without saying which is which. |
| dd-019/dont-1 | PASS | Field labels name the quantity in full on the label line — "The income it pays, each year" — rather than splitting a noun across a heading and a caption. |
| dd-019/dont-2 | N/A | No frame phrase appears on this surface; nothing here is projected forward. |
| dd-019/dont-3 | N/A | |
| dd-019/dont-4 | PASS | No heading here claims an equivalence. The block headings are plain descriptions of what the block holds. |
| dd-020/dont-1 | PASS | Nothing is hidden for being unlikely. A policy of any shape can still be described: the escalating income and the accident cover are one control away, and the assumptions block holds every number we chose. |
| dd-020/dont-2 | PASS | The category removes real questions — the income fields for an endowment, the maturity year for a pure money-back plan. It buys the simplification it costs. |
| dd-020/dont-3 | PASS | The shape decides which questions are asked and never what the engine does with an answer. A field the reader has already filled in keeps its value and keeps counting if the shape changes, on the tax form's rule. |
| dd-021/dont-1 | PASS | The form asks for the policy and nothing that presupposes an answer. **Two defaults that argued were removed**: the growth route paid no fund fee where the bond route genuinely has none, and the policy's payouts were assumed tax-free whatever the premium-to-cover ratio. Both are now priced, and they push in opposite directions. |
| dd-021/dont-2 | PASS | Every field can move the verdict. The one that cannot — the inflation rate, which discounts both sides identically and changes who wins by nothing — is in the assumptions block, labelled as what it is: the rate that decides what the figures are worth, not who wins. |
| dd-021/dont-3 | N/A | The form states no verdict; `InsuranceAnswer` does. |
| dd-022/dont-1 | RISK | **The deviation stated in full above.** After the category the form shows one field. But the five spine facts arrive as each previous one is answered, rather than because the reader asked for them by name — because they are not optional facts about a life, they are what a policy *is*. At any moment exactly one question is unanswered. Recorded as a reading of Rahul's rule and put on the gate for him, not claimed as compliance. |
| dd-022/dont-2 | PASS | The primary field is one field — what you pay a year — and it is the one every shape of policy implies. It was never read as a set. |
| dd-022/dont-3 | PASS | The form is built, not laid out. Its length is the length of the reader's policy: an endowment holder answers four questions, a money-back holder with an escalating income and an accident rider answers eight. |
| dd-022/dont-4 | PASS | The add control is the last child of its block, and an added field is appended before it, so it travels down under whatever was just added. Same mechanism as `TaxInputForm`. |
| dd-023/dont-1 | PASS | **Designed at 375 and only then given a wide layout.** One question at a time in a single column is the same design at both widths; what 1280 buys is the working sitting beside the form instead of below it. Verified at 375 before 1280. |
| dd-023/dont-2 | PASS | Every hint is visible prose. There are no tooltips at all — the old form's six `tooltip=` attributes are gone, and what they said is now printed under the field. A thumb reaches everything. |
| dd-023/dont-3 | N/A | The form makes no comparison; it asks. |
| dd-024/dont-1 | PASS | The form never stands alone in a field of white. It exists only after the welcome has been answered, and it arrives with the working panel beside it saying what it is waiting for. |
| dd-024/dont-2 | PASS | Every block says what it is for before it asks. The reader is told what the answer will buy them before they are asked to find their policy document. |
| dd-024/dont-3 | PASS | The form reorganises around the shape: an endowment holder is never shown the three income questions, and the block headings change with it. |

## Deliberate choices

- **Nothing is pre-filled.** A default in a money field is our policy standing
  in for theirs, and a verdict computed from it is worse than no verdict.
- **The tooltips are gone.** Six `tooltip=` attributes became six visible hints.
  A hint a thumb cannot reach is a hint that was not given (dd-023/dont-2).
- **The slab question is last and it is asked.** sol-060's ruling stands: *"ask
  them to choose a slab. 10, 20, 30."* It is last because it is the only
  question about the reader rather than about the policy.
- **The assumptions are a block, not an "Advanced" button.** They are numbers we
  chose that change the reader's answer, so they are stated and correctable
  rather than hidden behind a gear icon.

## Open — for Rahul

- **The spine, not the catalogue** (dd-022). Stated above. The five facts that
  constitute a policy arrive one at a time rather than being added by name. If
  you want the literal reading, they become entries in an add dropdown and the
  form starts as one premium field with everything else behind a picker.
- **The unbundle toggle is gone.** It produced a comparison the page itself
  disclaimed. Say the word and it comes back as adjacency rather than a mode.
