# Design checks — TaxIntro

**Written before the component.**

**Question:** *What is this, and why is the first question worth answering?*

The page's welcome. dd-024, recorded from Rahul on 18 Aug: the build before this
one opened on a single narrow select in a five-column grid with seven empty
columns beside it. dd-022 was applied correctly and the result was still wrong —
"one question at rest" is a rule about what is ASKED, and it was read as a
licence to say nothing at all.

So this component meets the reader, tells them what the thing does, and hands
them the first question. Then it gets out of the way: once the category is
answered it collapses, and the form and the working take the space.

Register taken from `antigravity.google` at Rahul's direction — generous space,
one confident headline, a clear hierarchy, restrained motion. **The register,
not the ornament**: CLAUDE.md's bar on game-UI animation still governs, and
nothing here bounces, flashes or pulses.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing is removed to make room for this. It sits above a form that still reaches all 41 income sources and 28 deductions, and it collapses rather than competing with them once the reader has begun. |
| dd-001/dont-2 | PASS | It states plainly that the form asks one question to begin with and grows from there. The three things it promises are the three the page actually delivers, not a reduced version of them. |
| dd-002/dont-1 | PASS | One step, and it reveals one control: the category question. The prose around it is an explanation of that question, not a second thing to work through. |
| dd-002/dont-2 | PASS | Exactly one control on the screen at rest. |
| dd-003/dont-1 | PASS | It states no figure at all. Its takeaway is what the page will do for the reader, in sentences. |
| dd-003/dont-2 | RISK | This is the sharpest risk on an introduction and it is inherent to the form: a page that says what it can do is one step from boasting about it. Mitigated by naming only what the reader gets — the monthly figure, which regime is cheaper, and the working — and never a count of sources, sections or features. To be judged on the built page rather than asserted here. |
| dd-004/dont-1 | N/A | No figures at all, so there are no two number systems to reconcile. |
| dd-004/dont-2 | N/A | Same reason. |
| dd-005/dont-1 | PASS | It names three things the reader will get, not a list of things that might be wrong with their return. The exhaustive catalogue is deliberately not advertised here — it is discovered through the add control, one entry at a time, when it is relevant. |
| dd-006/dont-1 | PASS | Nothing is swapped. The section collapses once, on the first answer, and does not come back. |
| dd-006/dont-2 | N/A | It draws no comparison, so there is no half of one to hide. |
| dd-007/dont-1 | PASS | Three sizes and each earns its place: the headline, the standfirst, and the body of the three points. The size cascade stops there. |
| dd-007/dont-2 | PASS | The hierarchy drawn is the real one — the headline is the promise, the three points are what it is made of, and the question is the way in. |
| dd-008/dont-1 | N/A | No control here changes any sentence; the section has one control and answering it removes the section. |
| dd-008/dont-2 | PASS | It describes what the page will do, never where the reader currently stands — it cannot, since at this point it knows nothing about them. |
| dd-009/dont-1 | N/A | No figures, so nothing can differ from a stated assumption. |
| dd-009/dont-2 | PASS | This component exists BECAUSE an explanation was missing. It is the opposite of shortening a screen by deleting one. |
| dd-010/dont-1 | PASS | It headlines the reader's question rather than a summary figure, and the monthly bite it promises is delivered by `TaxAnswer` once there is something to compute. |
| dd-012/dont-1 | N/A | Nothing is averaged. |
| dd-012/dont-2 | N/A | Same reason. |
| dd-012/dont-3 | PASS | Its entire purpose is that the reader is not confused about what they have arrived at. It is the fix for a screen that left them to guess. |
| dd-013/dont-1 | PASS | It has no inputs of its own beyond the category select, which `readTaxInputs()` already owns, and no arithmetic whatsoever. |
| dd-013/dont-2 | PASS | It states no quantity, so it cannot disagree with one stated elsewhere. |
| dd-017/dont-1 | N/A | No multi-year input. |
| dd-017/dont-2 | PASS | The one question it asks is in the reader's own unit — what they do for a living — rather than in a filing status or an ITR form number. |
| dd-017/dont-3 | N/A | The category is not a mode question: it removes what the statute forbids and changes no computed answer (dd-020/dont-3). |
| dd-017/dont-4 | N/A | No step-up here. |
| dd-017/dont-5 | N/A | No goal and no contribution here. |
| dd-019/dont-1 | N/A | There are no numbers on this screen to split across a label and a caption. |
| dd-019/dont-2 | N/A | No quantities, so no frames. |
| dd-019/dont-3 | N/A | Same reason. |
| dd-019/dont-4 | N/A | No heading here claims an equivalence. |
| dd-020/dont-1 | PASS | It hides nothing. The category question it introduces removes only what the statute forbids, and the catalogue's own test enforces that. |
| dd-020/dont-2 | PASS | The one question it asks is the one that earns its place most clearly on the whole form: it removes the presumptive schemes and the salary-only deductions from what follows. |
| dd-020/dont-3 | PASS | This component computes nothing, so it cannot move an answer. The select it hosts is read by `readTaxInputs()` and reaches the engine only as a filter on what is OFFERED. |
| dd-021/dont-1 | PASS | It promises to say which regime is cheaper, not which regime is better. The copy is careful not to pre-load the answer in either direction, which matters because most readers arrive expecting the new regime to win. |
| dd-021/dont-2 | PASS | Its one question changes what the form offers and, through that, the deductions available — so it can change the verdict. |
| dd-021/dont-3 | PASS | It promises a verdict outright — "which one is cheaper for you, and by how much" — rather than promising figures and leaving the reader to subtract. |
| dd-022/dont-1 | PASS | One control, and it is the category. No money field exists on the page until that is answered. |
| dd-022/dont-2 | PASS | Nothing on this screen is a field standing at zero. The introduction is prose and one question. |
| dd-022/dont-3 | PASS | It hands the reader the first question and then gets out of the way so they can build the rest. |
| dd-022/dont-4 | N/A | There is no add control on this component; it hosts the question that precedes them. |
| dd-023/dont-1 | PASS | Designed at 375 first: a single centred column, headline then standfirst then three stacked points then the question. The wide screen lays the three points side by side and adds space, which is the design becoming more than itself rather than the phone getting less. |
| dd-023/dont-2 | PASS | No hover state carries anything. The three points are always-visible prose and the question is a native select, which a phone renders as a full-screen picker. |
| dd-023/dont-3 | PASS | The three points read as a stack on a phone and as a row on a desktop, and they are three independent statements rather than a comparison — so nothing depends on their being beside each other. |
| dd-024/dont-1 | PASS | This component IS the answer to that rule. The page no longer opens on a lone control in a field of white; it opens on a welcome that says what this is and why the question is worth answering. |
| dd-024/dont-2 | PASS | Same instance from the other side: "one question at rest" governs what is ASKED, and this says what the reader has arrived at without asking them anything more. |
| dd-024/dont-3 | PASS | The layout is not held fixed. Answering the question collapses this section and resolves the page into the form and the working — the screen reorganises around what the reader has told it. |

## Deliberate choices

- **It collapses rather than scrolling away.** A welcome that stays on the page
  becomes furniture the reader has to scroll past on every recompute. Once the
  category is answered it has done its job, and the space belongs to the working.

- **Motion is a transition, never a keyframe.** Opacity and a short translate,
  driven by the state change rather than running on a timer, and disabled under
  `prefers-reduced-motion`. CLAUDE.md's bar on game-UI animation is not relaxed
  by a reference to somebody else's site: what was taken from it is the register
  — space, one confident headline, restraint — not the ornament.

- **Three promises, not a feature list.** The monthly figure, which regime is
  cheaper and by how much, and the working line by line. Naming the size of the
  catalogue here would be dd-003/dont-2 exactly: capability mistaken for
  achievement, and a reader made to feel the form will be long.

- **It never says the new regime is simpler or better.** Most readers arrive
  believing it, and about a third of them are wrong. An introduction that agrees
  with them has decided the verdict before the form is filled in — dd-021.
