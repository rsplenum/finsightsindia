# Design checks — InsuranceIntro

**Written before the component.** dd-024, applied to the insurance analyser: the
page had a beginning but it was a marketing hero, and the first thing it did
after it was ask six questions at once.

**Question:** *What is this thing going to tell me, and is it worth finding my
policy document for?*

## What it replaces, and why that mattered

The page opened on `Hero` — badge "Smart Policy Reality Check", title
"Guaranteed Income ROI Analyzer", and a description containing the words XIRR,
inflation-adjusted, and DIY term replication arbitrage. Four pieces of the
analyst's vocabulary before the reader had been told anything. F-13 already
flagged "TRUE YIELD (XIRR)"; the hero was the same fault one section higher.

Worse, it announced a verdict before asking anything: *unmask* the true yield.
The reader arrives suspicious of the policy **and** of us, and a page that has
already decided is a page they are right to discount (dd-021).

So the welcome states the two questions the tool answers, promises both answers
are printable, and hands over the first question. Same shape as `TaxIntro`, same
register — the reference is `antigravity.google` for its spacing and hierarchy,
never its ornament. Nothing bounces.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing is deleted. The hero's content was a description of our engine; what was true in it — that the tool computes a yield and prices a replica — is said here in the reader's words, and the machinery it described survives in the working panel below. |
| dd-001/dont-2 | PASS | The one question is the entry, and the welcome says so: it decides which questions can apply, and everything else follows. |
| dd-002/dont-1 | PASS | One step, one question. The three promises are not content revealed, they are why the question is worth answering. |
| dd-002/dont-2 | PASS | One control on the whole screen. Two concepts: that a policy bundles protection with investment, and that the bundle can be priced apart. Both are needed before the first question means anything. |
| dd-003/dont-1 | PASS | The transferable idea is on the welcome itself, before any number: a policy that also invests is two products in one wrapper, and you can price them separately. That is usable without us. |
| dd-003/dont-2 | PASS | The promises say what the reader gets, never what we can do. There is no count of features and no claim about the engine. |
| dd-004/dont-1 | N/A | No figures on this surface. |
| dd-004/dont-2 | PASS | Neither word appears. Where the welcome must refer to money losing value it says "what it will actually buy by the time it arrives". |
| dd-005/dont-1 | PASS | It names one comparison — keep the policy, or buy the cover on its own and invest the difference — and does not hand the reader a list of things to worry about. |
| dd-006/dont-1 | PASS | The welcome has one body of text and it does not change. It collapses when answered; it is never swapped. |
| dd-006/dont-2 | N/A | No control here hides half of anything; the one control is the opening question. |
| dd-007/dont-1 | PASS | Three sizes, each asserting something: the headline is the subject, the lede is what the tool does, the promise cards are equal to one another because the three promises are equal. |
| dd-007/dont-2 | PASS | The three promise cards are drawn identically because none outranks the others. |
| dd-008/dont-1 | PASS | Nothing here is rewritten by a control. The one control changes the page's state, not this text. |
| dd-008/dont-2 | PASS | It says what the tool will do, not where the reader currently is. |
| dd-009/dont-1 | N/A | No figures. |
| dd-009/dont-2 | PASS | The welcome adds the explanation the page lacked. Nothing below it was trimmed to make room; the hero it replaces said less. |
| dd-010/dont-1 | PASS | The promises headline what a person lives through — what the policy pays back a year, and what the same money would have done — not a terminal balance. |
| dd-012/dont-1 | N/A | No averages. |
| dd-012/dont-2 | N/A | No verdict on this surface. |
| dd-012/dont-3 | PASS | The confusion it ends is the hero's: four analyst's terms before a single plain sentence. Every word here is one a policyholder uses. |
| dd-013/dont-1 | PASS | No inputs, no engine. It holds the one `<select>` whose value the page reads through `readPolicyInputs()` like every other field. |
| dd-013/dont-2 | PASS | The shape question appears here and is restated in the form; one handler keeps them in step, as on the tax page. |
| dd-017/dont-1 | N/A | No inputs that persist over years on this surface. |
| dd-017/dont-2 | PASS | The question is asked in the reader's unit — what the policy gives back and when — not in the engine's, which would be a payout schedule. |
| dd-017/dont-3 | PASS | The shape question is not a mode question about how to interpret an input; it is a fact about the policy, and it removes questions rather than reinterpreting them. |
| dd-017/dont-4 | N/A | |
| dd-017/dont-5 | N/A | No figures. |
| dd-019/dont-1 | N/A | No figures. |
| dd-019/dont-2 | N/A | |
| dd-019/dont-3 | N/A | |
| dd-019/dont-4 | PASS | The headline is a question, not a claim of equivalence. |
| dd-020/dont-1 | PASS | The three shapes cover every policy this tool can price, and the working panel says plainly which kinds it cannot — a unit-linked plan, whose returns are not promised — rather than silently omitting them. |
| dd-020/dont-2 | PASS | The shape removes the income questions from an endowment and the maturity year from a pure money-back plan. It earns its place. |
| dd-020/dont-3 | PASS | The shape decides which questions appear and never what is done with an answer already given. |
| dd-021/dont-1 | PASS | **The rule that rewrote this surface.** The hero said "unmask", which is a verdict before a question. The welcome promises the comparison and states outright that it prints either answer — and the third promise says so in those words. |
| dd-021/dont-2 | PASS | The one question changes which questions follow, so it changes the verdict by way of what the engine is told. It is the cheapest question on the page and it buys the most. |
| dd-021/dont-3 | PASS | The welcome promises a verdict rather than figures, and names it as the third of the three things the reader will get. |
| dd-022/dont-1 | PASS | One control on the page at rest, and it is the question that decides what applies. Nothing else is on screen. |
| dd-022/dont-2 | PASS | One question, and it is the one the policy implies rather than a set of fields chosen for being common. Nothing about the premium, the term or the cover appears until it has been answered. |
| dd-022/dont-3 | PASS | Nothing is laid out in front of the reader. The form does not exist until this is answered. |
| dd-022/dont-4 | N/A | No add control on this surface. |
| dd-023/dont-1 | PASS | Designed at 375: a single centred column, headline, lede, three stacked cards, then the question. At 1280 the three cards sit in a row and nothing else changes. |
| dd-023/dont-2 | PASS | Everything is visible prose. The one control is a native select, which a phone renders full-screen — the largest tap target available and no hover anywhere. |
| dd-023/dont-3 | N/A | No side-by-side comparison here. |
| dd-024/dont-1 | PASS | **This is the entry that created this component.** The page is not left mostly empty around a lone control: the reader is met, told what the tool does and what they will get, and only then asked. |
| dd-024/dont-2 | PASS | It says a great deal about what the reader has arrived at — three promises and a plain statement of the comparison — before asking anything. |
| dd-024/dont-3 | PASS | Answering the question collapses this section entirely and the workbench takes its place. The change between the two states is the design. |

## Deliberate choices

- **The headline is a question, not a claim.** "What is this policy actually
  paying you?" can be answered "rather well". "Unmask the true yield" cannot.
- **The three promises are the brief's three outputs, in order** — the rate of
  return, what the same bundle costs assembled by hand, and the verdict. If the
  page ever stops delivering one of them, this welcome is a lie the reader can
  check.
- **The collapse is a transition with a timer behind it.** `transitionend` does
  not fire in a backgrounded tab, which left the tax page's welcome sitting
  there for good until sol-065 found it. Same fix here, on purpose.
- **No count of anything.** Naming how many policy shapes or how many
  assumptions we model would be dd-003/dont-2 — capability read as achievement —
  and would make the reader brace for a long form.
