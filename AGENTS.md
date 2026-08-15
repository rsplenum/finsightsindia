## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Institutional Memory (CRITICAL)

We keep two memories, and they answer different questions. Read both before you act.

**`src/data/engineering-solutions.json` — what broke and how it was fixed.**
Read it before proposing technical solutions, making UI changes, or debugging build errors. If a problem is listed there, strictly implement the documented solution rather than rediscovering it.

**`src/data/design-doctrine.json` — the spirit we work in.**
Read it before ANY design, UX, copy, or product decision. This is Rahul's judgment, recorded verbatim, about how things should feel rather than how they should function. Feedback about spirit used to live only in conversation and died with it; that is why this file exists.

Three rules govern it:
- **The lesson may arrive attached to something small. Its scope is not the size of its trigger.** A remark about one calculator screen may govern the entire product.
- **A principle that has been violated twice is a process failure, not a mistake.** The list of failures must not repeat.
- **Record the spirit, not just the fix.** When Rahul gives feedback about how something should feel, capture the generalisable principle and his verbatim words, then apply it — do not silently patch the one instance and move on.

The meta-principle both files serve: *it is so simple to be difficult, but it is so difficult to be simple.* Our audience is the layperson; our offering is the whole of the complexity, not a reduced or diluted version of it. The difficulty of packaging it is ours to absorb, never theirs. The user pays us in the currency of their time and attention.

## Nothing Important Lives Only In Chat (CRITICAL PROTOCOL)

Conversation is transient and the most important things happen in it. Rahul's
feedback, a change of plan, a deferral, an open question — all of it arrives in
chat and none of it survives there. A repeated mistake costs tokens, time,
effort and trust, and the only defence is that the lesson was written down
somewhere that outlives the session.

**Every item below has a home. Use it the moment the thing happens, not later.**

| What arrives | Where it goes | When |
|---|---|---|
| Feedback about spirit, feel, or how something should read | `src/data/design-doctrine.json` — verbatim words, the principle, and a test | **Before** acting on it |
| A technical fault and its fix | `src/data/engineering-solutions.json` | When fixed, or when deliberately deferred |
| A decision and its reasoning | The commit message, written long | At commit |
| State of play, plan changes, deferrals, open decisions | The Launch Gate artifact | **At every checkpoint** |

### The rules

1. **Record Rahul's feedback before acting on it.** Capture the verbatim words — his phrasing carries nuance a paraphrase loses, and he has said he may not reproduce good feedback as well a second time. Acting first and recording later means it never gets recorded.
2. **A change of plan updates the Launch Gate artifact in the same turn.** An out-of-date tracker is worse than none: it misinforms with authority. If the plan moved and the artifact did not, the plan is not real.
3. **Deferrals are recorded with their reason.** "We will do this later" that exists only in chat is a decision that will be silently reversed or forgotten. Say what was deferred, why, and what it is waiting on.
4. **Open decisions belong to Rahul and must be visible.** Anything awaiting his judgement is listed explicitly, not carried in an agent's head.
5. **Never rely on an in-session task list.** It decays within hours and then quietly misleads. The durable stores above are the memory; a task list is at best a scratchpad for the current hour.

### The test

At any moment, someone with no access to this conversation should be able to
read the four stores above and know: what is done, what is next, what was
deliberately deferred and why, and what is waiting on Rahul. If any of that
lives only in chat, this protocol has been broken.

We are running towards a launch, not running on a treadmill. The difference is
entirely whether what we learn is still there tomorrow.

## FinSight Article Publishing Pipeline (CRITICAL STANDARD)

To prevent regressions, "stripped down" drafts, or orphaned components during the 100 Topics generation, EVERY article must pass the following strict checklist before it is considered complete:

1. **Research Depth Parity:** The final `.mdx` article MUST contain every mechanical step, edge-case, and psychological hook detailed in the initial research. Never summarize or strip down the core argument.
2. **Visual Standards Integration (The "Magazine" Aesthetic):**
   - Always use the `<CardPremium>` component for the TL;DR.
   - All interactive calculators/components MUST include Tailwind `dark:` mode classes (e.g., `dark:bg-navy-900`, `dark:text-white`) to align with the brand theme.
   - **No Juvenile Animations:** When building SVG or CSS-based infographics and components, strictly avoid "game UI" keyframe animations (like bouncing elements, flashing sirens, or rapid pulsing). Use elegant, static magazine-style editorial design to convey motion and narrative (e.g., static speed lines, dashed paths, refined borders, structural alignment). Keep the tone mature, tasteful, and sophisticated.
3. **Data & Navigation Architecture:**
   - **Reel Scripts** must NEVER be embedded inline in the `.mdx`. They MUST be appended as JSON objects to `src/data/reel-scripts.json`.
   - New pages or ledgers MUST be wired into the global navigation (`src/layouts/Layout.astro`) so they are actually accessible to users.
4. **THE NO HASTE DOCTRINE (CRITICAL):**
   - Do not rush to clear the backlog. Depth is infinitely more valuable than speed.
   - Never cut corners to save tokens, bypass API limits, or please the user with a fast turnaround.
   - Pause, reflect, and deliver uncompromising quality. 
   - Stop asking "shall we proceed to the next step?" immediately after delivering a phase. Give the user (and the process) room to breathe. No Haste.

## Image Generation (CRITICAL GUARDRAIL)

BEFORE generating any illustration using the `generate_image` tool, you MUST:
1. Stop execution.
2. Present the exact prompt you intend to use to the user.
3. Wait for the user's explicit authorization.

**Do NOT proactively execute `generate_image` under any circumstances without prior approval.**
