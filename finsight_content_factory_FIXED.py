#!/usr/bin/env python3
"""
FinSight India — Content Factory v3
====================================
Generation → Evaluation → Iteration (bounded), then polish + package.

Pipeline primitives:
  1. GENERATE  — Quant → SEO → Novelist (draft v1)
  2. EVALUATE  — Style Critic → PASS | FAIL + rewrites
  3. ITERATE   — if FAIL, Novelist revises using critique (max MAX_STYLE_RETRIES)
  4. POLISH    — only after PASS (or exhausted retries): Visual → UI → YouTube
  5. PACKAGE   — mdx + seo.json + reel + thumbnail + notes

Publish gate: style_pass == True (or FORCE_PUBLISH_ON_FAIL=1 for debug)

Usage:
  export GEMINI_API_KEY=...
  python finsight_content_factory.py
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

try:
    from crewai import Agent, Task, Crew, Process, LLM

    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    print(
        "⚠️  crewai not installed.\n"
        "   pip install crewai python-dotenv\n"
        "   Optional live search: pip install -U ddgs"
    )

load_dotenv()


def build_search_tool() -> Any:
    """
    Live web search for the Quant agent — never crash the factory if missing.

    Preferred package: `ddgs` (replaces deprecated duckduckgo-search / langchain tool).
      pip install -U ddgs

    Disable search entirely:
      export FINSIGHT_DISABLE_SEARCH=1
    """
    if os.environ.get("FINSIGHT_DISABLE_SEARCH", "0") == "1":
        print("ℹ️  Search disabled (FINSIGHT_DISABLE_SEARCH=1). Quant uses model knowledge only.")
        return None

    try:
        from ddgs import DDGS
    except ImportError:
        print(
            "⚠️  `ddgs` not installed — Quant will run WITHOUT live search.\n"
            "   Fix:  pip install -U ddgs\n"
            "   Or:   export FINSIGHT_DISABLE_SEARCH=1"
        )
        return None

    try:
        from crewai.tools import BaseTool
        from pydantic import BaseModel, Field

        class SearchInput(BaseModel):
            query: str = Field(..., description="Search query for current Indian tax law")

        class DdgsSearchTool(BaseTool):
            name: str = "web_search"
            description: str = (
                "Search the live web for current Indian tax laws, CBDT circulars, "
                "sections, rates, and thresholds. Pass a clear search query string."
            )
            args_schema: type[BaseModel] = SearchInput

            def _run(self, query: str) -> str:
                try:
                    rows = list(DDGS().text(query, max_results=8))
                except Exception as e:
                    return f"Search error: {e}"
                if not rows:
                    return "No results."
                parts = []
                for i, r in enumerate(rows, 1):
                    title = r.get("title") or ""
                    href = r.get("href") or r.get("link") or ""
                    body = r.get("body") or r.get("snippet") or ""
                    parts.append(f"{i}. {title}\n   {href}\n   {body}")
                return "\n\n".join(parts)

        print("✅ Live search enabled via `ddgs`.")
        return DdgsSearchTool()
    except Exception as e:
        print(f"⚠️  Could not wrap ddgs for CrewAI ({e}). Quant runs without search.")
        return None


# =============================================================================
# CONFIG
# =============================================================================

OUTPUT_ROOT = Path(os.environ.get("FINSIGHT_CONTENT_OUT", "src/content/direct-tax"))
PACKAGE_ROOT = Path(os.environ.get("FINSIGHT_PACKAGE_OUT", "content_packages"))
MODEL_RIGID = os.environ.get("FINSIGHT_LLM_RIGID", "gemini/gemini-3.6-flash")
MODEL_CREATIVE = os.environ.get("FINSIGHT_LLM_CREATIVE", "gemini/gemini-3.6-flash")

# Bounded iteration: generation → evaluation → revision
MAX_STYLE_RETRIES = int(os.environ.get("FINSIGHT_MAX_STYLE_RETRIES", "2"))
# If still FAIL after retries, do not write to content collection unless forced
FORCE_PUBLISH_ON_FAIL = os.environ.get("FINSIGHT_FORCE_PUBLISH_ON_FAIL", "0") == "1"

# =============================================================================
# STYLES + NARRATIVE CONTRACT
# =============================================================================

POLYMORPHIC_STYLES: dict[str, dict[str, str]] = {
    "1": {
        "name": "The Brutal Truth",
        "rules": "Direct, authoritative, highly mathematical, devoid of fluff. Fast, punchy sentences. Numbers over adjectives.",
        "exemplar": "The New Regime is not a suggestion. Unless your Old Regime deductions clear ₹3.75 Lakh, you are paying more tax for the privilege of feeling traditional.",
    },
    "2": {
        "name": "The Forensic Auditor",
        "rules": "Procedural, investigative. Follow a trail of money or paperwork step-by-step. Cold, stark, precise. Case-file framing is allowed. No humor.",
        "exemplar": "Dispatch Note #DN-8841. Item retained. Return voucher: ABSENT. TDS under 194R: ₹0.00. Statutory breach recorded.",
    },
    "3": {
        "name": "The Myth-Buster",
        "rules": "Systematic. Quote the myth in the reader's voice, then dismantle it with statute. Slightly sarcastic. Harsh wake-up call.",
        "exemplar": "The WhatsApp tip said: 'Just file under 44AD, declare 8%, done.' The portal said: Form 26AS shows 194J. Mismatch. Notice follows.",
    },
    "4": {
        "name": "The Coffee Shop Chat",
        "rules": "Conversational. Use 'we' and 'you.' Name the paranoia before the math. Relatable peer, not lecturer.",
        "exemplar": "You opened AIS and there were two Form 16s. You did not sleep well. Here is the conversation you needed the next morning.",
    },
    "5": {
        "name": "The Scenario Wargamer",
        "rules": "Analytical, branching. If X then Y. Matrix of outcomes. Optimization-first.",
        "exemplar": "If deductions exceed ₹3.75 L, Old Regime wins. If not, New Regime leaves more cash. Joint home loan changes the threshold—run the branch before you lock Form 10-IEA.",
    },
    "6": {
        "name": "The Narrative Arc",
        "rules": "Persona-driven story. Beginning (hope), middle (shock), end (agency). Hold the named person through the close.",
        "exemplar": "Rahul exercised at ₹10. FMV hit ₹1,010. The next salary slip was zero. This is how paper wealth becomes a cash tax bill—and how to structure the exit.",
    },
    "7": {
        "name": "The Diplomat",
        "rules": "Reassuring, structured. Safe harbors, smooth transitions. No panic amplification.",
        "exemplar": "There is a clean path through this. We will map the deadline, the fee, and the one filing that stops the interest clock.",
    },
    "8": {
        "name": "The Chess Grandmaster",
        "rules": "Forward-looking, calculating. Counter-moves to policy. Multi-year thinking.",
        "exemplar": "The department moved first with AIS matching. Your counter-move is pre-emptive reconciliation before the return is filed—not after the notice.",
    },
    "9": {
        "name": "The Alchemist",
        "rules": "Transformative, energetic. Turn liability into a tax-free or lower-tax outcome. Slightly euphoric but still accurate.",
        "exemplar": "The same loss that felt like failure becomes an eight-year shield—if you file on time and stop treating it like a salary offset.",
    },
    "10": {
        "name": "The Trench Survivor",
        "rules": "Gritty, realistic. Validate frustration first. No pep talk until the path is clear. Honest about permanent damage vs what can still be fixed.",
        "exemplar": "The loss carry-forward is already gone. That part is decided. What is left is stopping the interest clock and filing a clean belated return.",
    },
}

NARRATIVE_CONTRACT = """
STRUCTURE (unless Forensic Auditor case-file frame is chosen):

1. HOOK (80–150 words): Named person + concrete number + consequence. NO statute in the first paragraph.
2. THE FEAR NAMED: One sentence mirroring the reader's monologue.
3. THE MECHANISM (short): Only needed regulation + 2–4 sentences on why the law/algorithm exists.
4. THE WORKED EXAMPLE: Same person, numbers, outcome.
5. THE WAY OUT: Checklist in human verbs. Deadlines in calendar language.
6. EDGE CASES (optional): Only if they change the decision.
7. CLOSING RELIEF: Return to the named person — what Monday looks like after they act.

HARD BANS:
- No "Pillar 1/2/3/4" headings.
- No ASCII art, box-drawing, or markdown flowcharts.
- No padding for word count.
- No opening with "What is the regulation regarding this specific transaction?"
"""

# =============================================================================
# DATA
# =============================================================================


@dataclass
class ArticleJob:
    topic: str
    filename: str
    style_key: str
    category: str = "tds"
    category_name: str = "Compliance"
    statutory_hint: str = ""
    alpha: str = ""
    protagonist: str = ""
    primary_fear: str = ""


@dataclass
class FactoryResult:
    slug: str
    article_mdx: str = ""
    seo: dict[str, Any] = field(default_factory=dict)
    reel: str = ""
    thumbnail: str = ""
    constants: dict[str, Any] = field(default_factory=dict)
    style_pass: bool = False
    revision_rounds: int = 0
    notes: list[str] = field(default_factory=list)


# =============================================================================
# LLM / PARSE HELPERS
# =============================================================================


def make_llm(model: str, temperature: float) -> Any:
    if not CREWAI_AVAILABLE:
        return None
    return LLM(
        model=model,
        api_key=os.environ.get("GEMINI_API_KEY"),
        temperature=temperature,
    )


def extract_json_block(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    return {}


def task_raw(task: Any) -> str:
    out = getattr(task, "output", None)
    if out is None:
        return ""
    return getattr(out, "raw", None) or str(out)


def run_crew(agents: list[Any], tasks: list[Any], label: str) -> str:
    """Run a sequential mini-crew; return last task raw output."""
    print(f"\n── Crew segment: {label} ({len(tasks)} task(s)) ──")
    crew = Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
    )
    result = crew.kickoff()
    return getattr(result, "raw", None) or str(result)


def ensure_frontmatter(mdx: str, job: ArticleJob, style_name: str, seo: dict[str, Any]) -> str:
    title = seo.get("title") or job.topic
    summary = seo.get("description") or job.primary_fear or job.topic
    fm = {
        "title": title,
        "category": job.category,
        "categoryName": job.category_name,
        "readTime": seo.get("readTime", "9 min read"),
        "updatedDate": "FY 2025-26",
        "statutoryAct": job.statutory_hint or seo.get("statutoryAct", "Income Tax Act"),
        "summary": summary,
        "writingStyle": style_name,
        "protagonist": job.protagonist or seo.get("protagonist", "the taxpayer"),
        "primaryFear": job.primary_fear or seo.get("primaryFear", "unexpected tax liability"),
    }
    body = mdx
    if mdx.startswith("---"):
        parts = mdx.split("---", 2)
        if len(parts) >= 3:
            body = parts[2].lstrip("\n")
    lines = ["---"]
    for k, v in fm.items():
        val = str(v).replace('"', '\\"')
        lines.append(f'{k}: "{val}"')
    lines.append("---")
    lines.append("")
    if "<NoticeTrap" in body and "import NoticeTrap" not in body:
        lines.append("import NoticeTrap from '../../components/mdx/NoticeTrap.astro';")
        lines.append("")
    if "<CardPremium" in body and "import CardPremium" not in body:
        lines.append("import CardPremium from '../../components/CardPremium.astro';")
        lines.append("")
    return "\n".join(lines) + body


# =============================================================================
# AGENTS
# =============================================================================


def build_agents(search_tool: Any) -> dict[str, Any]:
    llm_rigid = make_llm(MODEL_RIGID, 0.1)
    llm_creative = make_llm(MODEL_CREATIVE, 0.55)
    llm_critic = make_llm(MODEL_RIGID, 0.2)

    return {
        "quant": Agent(
            role="Principal Tax Quant",
            goal="Verify current Indian tax mechanics. Bulleted facts only: sections, rates, thresholds, deadlines, penalties.",
            backstory="Ruthless quant. No narrative. Flag uncertainty explicitly.",
            llm=llm_rigid,
            tools=[search_tool] if search_tool else [],
            allow_delegation=False,
            verbose=True,
        ),
        "seo": Agent(
            role="SEO Forensic Strategist",
            goal="JSON: high-anxiety title, description, slug, faqs, intent. No dictionary-definition titles.",
            backstory="Panic symptoms → commercial queries. Outcome Certainty mandatory.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "novelist": Agent(
            role="Narrative Architect",
            goal="Write or revise the full article under the assigned persona and narrative contract.",
            backstory="FinSight polymorphic voice. Never pad. Never open with statute when a human scene carries more anxiety.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "style_critic": Agent(
            role="Style & Voice Critic",
            goal="PASS or FAIL with drift sentences and concrete rewrites. Reject interchangeable tax-blog prose.",
            backstory="You protect FinSight from formulaic output.",
            llm=llm_critic,
            allow_delegation=False,
            verbose=True,
        ),
        "visual": Agent(
            role="Art Director",
            goal="Insert 1–2 markers: [Illustration: <≤12 words>]. Anxiety under hook; optional relief before close.",
            backstory="Specific to the protagonist's moment. No generic stock.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "ui": Agent(
            role="Astro MDX Architect",
            goal="MDX body with NoticeTrap around traps; checklist heading; no frontmatter; no ASCII; no duplicate H1.",
            backstory="FinSight MDX pipeline specialist.",
            llm=llm_rigid,
            allow_delegation=False,
            verbose=True,
        ),
        "youtube": Agent(
            role="YouTube Reel Producer",
            goal="60–100s spoken script (hook in first 3s) + thumbnail thesis (5–8 word overlay).",
            backstory="Short-form tax content that stops the scroll without lying.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
    }


# =============================================================================
# TASK BUILDERS (single-purpose, for composition in the loop)
# =============================================================================


def task_quant(job: ArticleJob, agent: Any) -> Any:
    return Task(
        description=(
            f"Topic: {job.topic}\nStatutory hint: {job.statutory_hint or 'discover'}\n\n"
            "Extract CURRENT Indian tax rules only as bullets: sections, rates, thresholds, "
            "deadlines, penalties, payer vs recipient. Flag uncertainty."
        ),
        expected_output="Bulleted legal constraint list.",
        agent=agent,
    )


def task_seo(job: ArticleJob, agent: Any, quant_task: Any) -> Any:
    return Task(
        description=(
            f"Topic: {job.topic}\nPrimary fear: {job.primary_fear}\n\n"
            "Return JSON with keys: title, title_alts, description, slug, intent, "
            "faqs ([{q,a}]), readTime, statutoryAct.\n"
            "High-anxiety H1. Outcome certainty in description."
        ),
        expected_output="Single JSON object.",
        agent=agent,
        context=[quant_task],
    )


def task_novelist_draft(
    job: ArticleJob,
    agent: Any,
    style: dict[str, str],
    quant_task: Any,
    seo_task: Any,
) -> Any:
    return Task(
        description=(
            f"Write the FULL article for: {job.topic}\n\n"
            f"PROTAGONIST: {job.protagonist}\n"
            f"PRIMARY FEAR: {job.primary_fear}\n"
            f"ALPHA: {job.alpha or '(none)'}\n\n"
            f"STYLE: {style['name']}\nRULES: {style['rules']}\n"
            f"EXEMPLAR:\n{style['exemplar']}\n\n"
            f"{NARRATIVE_CONTRACT}\n\n"
            "Ground truth = quant facts. Markdown body only (no YAML frontmatter)."
        ),
        expected_output="Full markdown article body.",
        agent=agent,
        context=[quant_task, seo_task],
    )


def task_style_critique(
    agent: Any,
    style: dict[str, str],
    draft_text: str,
) -> Any:
    """Critic sees the draft in the description (not only context) so revision rounds work cleanly."""
    # Truncate extremely long drafts in the prompt edge case
    draft_for_prompt = draft_text if len(draft_text) < 120_000 else draft_text[:120_000] + "\n…[truncated]"
    return Task(
        description=(
            f"Critique this article against style '{style['name']}'.\n"
            f"Rules: {style['rules']}\n"
            f"Exemplar energy: {style['exemplar']}\n\n"
            "ARTICLE DRAFT:\n"
            "```markdown\n"
            f"{draft_for_prompt}\n"
            "```\n\n"
            "Return JSON only:\n"
            '  "verdict": "PASS" | "FAIL",\n'
            '  "score": 0-10,\n'
            '  "drift_sentences": [strings],\n'
            '  "rewrites": [{"original": "...", "suggested": "..."}],\n'
            '  "notes": "..."\n\n'
            "FAIL if: no named person early; statute-first open (unless Forensic); "
            "generic tax-blog voice; missing close returning to the person; ASCII diagrams."
        ),
        expected_output="JSON critique with PASS or FAIL.",
        agent=agent,
    )


def task_novelist_revise(
    job: ArticleJob,
    agent: Any,
    style: dict[str, str],
    previous_draft: str,
    critique: dict[str, Any],
    quant_summary: str,
) -> Any:
    rewrites = json.dumps(critique.get("rewrites", []), ensure_ascii=False)[:8000]
    drifts = json.dumps(critique.get("drift_sentences", []), ensure_ascii=False)[:4000]
    notes = critique.get("notes", "")
    draft_for_prompt = (
        previous_draft if len(previous_draft) < 100_000 else previous_draft[:100_000] + "\n…[truncated]"
    )
    return Task(
        description=(
            f"REVISE the article. Do not start from scratch unless the draft is unusable.\n\n"
            f"Topic: {job.topic}\n"
            f"PROTAGONIST: {job.protagonist}\n"
            f"PRIMARY FEAR: {job.primary_fear}\n"
            f"STYLE: {style['name']} — {style['rules']}\n"
            f"EXEMPLAR:\n{style['exemplar']}\n\n"
            f"{NARRATIVE_CONTRACT}\n\n"
            f"QUANT FACTS (must remain accurate):\n{quant_summary[:6000]}\n\n"
            f"CRITIC VERDICT: {critique.get('verdict')} (score {critique.get('score')})\n"
            f"CRITIC NOTES: {notes}\n"
            f"DRIFT SENTENCES:\n{drifts}\n"
            f"REQUESTED REWRITES:\n{rewrites}\n\n"
            "PREVIOUS DRAFT:\n"
            "```markdown\n"
            f"{draft_for_prompt}\n"
            "```\n\n"
            "Apply the rewrites. Fix every drift. Keep correct law. "
            "Output the full revised markdown body only."
        ),
        expected_output="Full revised markdown article body.",
        agent=agent,
    )


def task_visual(agent: Any, article: str) -> Any:
    body = article if len(article) < 100_000 else article[:100_000] + "\n…[truncated]"
    return Task(
        description=(
            "Insert 1 or 2 markers only: [Illustration: <max 12 words>].\n"
            "One under the hook (anxiety); optional one before the close (relief).\n\n"
            "ARTICLE:\n```markdown\n"
            f"{body}\n"
            "```\n\n"
            "Output the full article with markers."
        ),
        expected_output="Article markdown with illustration markers.",
        agent=agent,
    )


def task_ui(agent: Any, article: str) -> Any:
    body = article if len(article) < 100_000 else article[:100_000] + "\n…[truncated]"
    return Task(
        description=(
            "Convert to FinSight MDX body:\n"
            "- Wrap main trap/penalty in <NoticeTrap title=\"...\">...</NoticeTrap>\n"
            "- Checklist under '## Key Takeaway Summary & Actionable Checklist'\n"
            "- Remove ASCII diagrams if any remain\n"
            "- No YAML frontmatter, no H1 repeating the SEO title\n\n"
            "ARTICLE:\n```markdown\n"
            f"{body}\n"
            "```\n\n"
            "Output final MDX body only."
        ),
        expected_output="Production MDX body.",
        agent=agent,
    )


def task_youtube(job: ArticleJob, agent: Any, article: str, seo: dict[str, Any]) -> Any:
    body = article if len(article) < 80_000 else article[:80_000] + "\n…[truncated]"
    return Task(
        description=(
            f"Topic: {job.topic}\nSEO title: {seo.get('title', job.topic)}\n\n"
            "Write:\n"
            "1) ## reel_60s — spoken 60–100s script; FIRST LINE is the fear/hook; "
            "one number; one action; CTA to FinSight article.\n"
            "2) ## thumbnail_thesis — 5–8 word overlay + brief visual idea.\n\n"
            "ARTICLE (for accuracy):\n```markdown\n"
            f"{body}\n"
            "```"
        ),
        expected_output="Markdown with ## reel_60s and ## thumbnail_thesis.",
        agent=agent,
    )


# =============================================================================
# PACKAGE WRITER
# =============================================================================


def write_package(
    job: ArticleJob,
    result: FactoryResult,
    style_name: str,
    write_to_collection: bool,
) -> Path:
    slug = job.filename
    pkg_dir = PACKAGE_ROOT / slug
    pkg_dir.mkdir(parents=True, exist_ok=True)

    mdx = ensure_frontmatter(result.article_mdx, job, style_name, result.seo)
    (pkg_dir / "article.mdx").write_text(mdx, encoding="utf-8")

    if write_to_collection:
        OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
        (OUTPUT_ROOT / f"{slug}.mdx").write_text(mdx, encoding="utf-8")

    seo = {
        "slug": slug,
        "title": result.seo.get("title", job.topic),
        "description": result.seo.get("description", ""),
        "intent": result.seo.get("intent", ""),
        "faqs": result.seo.get("faqs", []),
        "title_alts": result.seo.get("title_alts", []),
        "writingStyle": style_name,
        "protagonist": job.protagonist,
        "primaryFear": job.primary_fear,
        "style_pass": result.style_pass,
        "revision_rounds": result.revision_rounds,
    }
    (pkg_dir / "seo.json").write_text(json.dumps(seo, indent=2, ensure_ascii=False), encoding="utf-8")
    (pkg_dir / "reel_60s.md").write_text(result.reel or "# reel missing\n", encoding="utf-8")
    (pkg_dir / "thumbnail_thesis.txt").write_text(
        result.thumbnail or "thumbnail thesis missing\n", encoding="utf-8"
    )
    (pkg_dir / "constants.json").write_text(
        json.dumps(result.constants or {"note": "fill from quant if needed"}, indent=2),
        encoding="utf-8",
    )
    (pkg_dir / "factory_notes.txt").write_text("\n".join(result.notes) or "ok", encoding="utf-8")
    return pkg_dir


# =============================================================================
# CORE: GENERATION → EVALUATION → ITERATION → POLISH
# =============================================================================


def run_factory(job: ArticleJob, interactive_alpha: bool = True) -> FactoryResult:
    if not CREWAI_AVAILABLE:
        raise RuntimeError("Install: pip install crewai python-dotenv  (optional search: pip install -U ddgs)")
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY not set")

    style = POLYMORPHIC_STYLES.get(job.style_key, POLYMORPHIC_STYLES["4"])
    style_name = style["name"]

    print("\n" + "=" * 64)
    print(f"🏭 FinSight Factory v3 (iterate until PASS)")
    print(f"   {job.topic}")
    print(f"   Style: {style_name} | slug: {job.filename} | max_retries: {MAX_STYLE_RETRIES}")
    print("=" * 64)

    if interactive_alpha:
        injected = input("💡 INJECT ALPHA (or Enter): ").strip()
        if injected:
            job.alpha = injected
        if not job.protagonist:
            job.protagonist = input("👤 Protagonist: ").strip() or "the taxpayer"
        if not job.primary_fear:
            job.primary_fear = input("😨 Primary fear: ").strip() or "unexpected tax demand"

    search_tool = build_search_tool()  # None is OK — Quant runs without tools
    agents = build_agents(search_tool)
    notes: list[str] = []

    # ── PHASE A: GENERATE (Quant + SEO + first draft) ─────────────────────
    t_quant = task_quant(job, agents["quant"])
    t_seo = task_seo(job, agents["seo"], t_quant)
    t_draft = task_novelist_draft(job, agents["novelist"], style, t_quant, t_seo)

    run_crew(
        [agents["quant"], agents["seo"], agents["novelist"]],
        [t_quant, t_seo, t_draft],
        "A · GENERATE (quant → seo → draft)",
    )

    quant_text = task_raw(t_quant)
    seo = extract_json_block(task_raw(t_seo))
    draft = task_raw(t_draft)
    notes.append(f"draft_v1_chars={len(draft)}")

    # ── PHASE B: EVALUATE → ITERATE (bounded) ─────────────────────────────
    style_pass = False
    critique: dict[str, Any] = {}
    revision_rounds = 0

    for attempt in range(MAX_STYLE_RETRIES + 1):
        # Evaluate current draft
        t_crit = task_style_critique(agents["style_critic"], style, draft)
        run_crew([agents["style_critic"]], [t_crit], f"B · EVALUATE (round {attempt})")
        critique = extract_json_block(task_raw(t_crit))
        verdict = str(critique.get("verdict", "")).upper()
        score = critique.get("score", "?")
        notes.append(f"eval_round_{attempt}: verdict={verdict} score={score}")

        if verdict == "PASS":
            style_pass = True
            print(f"✅ Style PASS on round {attempt} (score={score})")
            break

        print(f"❌ Style FAIL on round {attempt} (score={score})")
        if attempt >= MAX_STYLE_RETRIES:
            notes.append("max style retries exhausted — leaving FAIL draft for package notes")
            break

        # Iterate: feed critique back to novelist
        revision_rounds += 1
        t_rev = task_novelist_revise(
            job, agents["novelist"], style, draft, critique, quant_text
        )
        run_crew(
            [agents["novelist"]],
            [t_rev],
            f"B · ITERATE revise #{revision_rounds}",
        )
        revised = task_raw(t_rev)
        if revised.strip():
            draft = revised
            notes.append(f"revise_{revision_rounds}_chars={len(draft)}")
        else:
            notes.append(f"revise_{revision_rounds}_empty_output")

    # ── PHASE C: POLISH only after loop (always produce package; gate collection write)
    t_vis = task_visual(agents["visual"], draft)
    run_crew([agents["visual"]], [t_vis], "C · POLISH visual")
    with_visual = task_raw(t_vis) or draft

    t_ui = task_ui(agents["ui"], with_visual)
    run_crew([agents["ui"]], [t_ui], "C · POLISH mdx")
    mdx_body = task_raw(t_ui) or with_visual

    t_yt = task_youtube(job, agents["youtube"], mdx_body, seo)
    run_crew([agents["youtube"]], [t_yt], "C · POLISH youtube")
    yt_raw = task_raw(t_yt)

    reel, thumbnail = yt_raw, ""
    if "## thumbnail_thesis" in yt_raw:
        parts = yt_raw.split("## thumbnail_thesis", 1)
        reel = parts[0].replace("## reel_60s", "").strip()
        thumbnail = parts[1].strip()

    result = FactoryResult(
        slug=job.filename,
        article_mdx=mdx_body,
        seo=seo,
        reel=reel,
        thumbnail=thumbnail,
        constants={},
        style_pass=style_pass,
        revision_rounds=revision_rounds,
        notes=notes,
    )

    write_to_collection = style_pass or FORCE_PUBLISH_ON_FAIL
    pkg = write_package(job, result, style_name, write_to_collection=write_to_collection)

    print(f"\n📦 Package: {pkg}")
    print(f"   style_pass={style_pass}  revision_rounds={revision_rounds}")
    print(f"   collection_write={write_to_collection}  path={OUTPUT_ROOT / (job.filename + '.mdx')}")
    if not style_pass:
        print("   ⚠️  FAIL after retries — package kept for inspection; collection write skipped "
              "(set FINSIGHT_FORCE_PUBLISH_ON_FAIL=1 to override).")

    return result


# =============================================================================
# BATCH
# =============================================================================

ARTICLES: list[ArticleJob] = [
    ArticleJob(
        topic="The Influencer Barter Trap: Section 194R, in-kind benefits, and tax on free products",
        filename="influencer-barter-trap-194r",
        style_key="2",
        category="tds",
        category_name="Freelancers & Creators",
        statutory_hint="Section 194R, Section 28(iv), CBDT Circular 12/2022",
        protagonist="Ava, lifestyle creator who kept a ₹1.4L review laptop",
        primary_fear="The free product is taxable income and the brand never deducted TDS",
        alpha="Retained product = benefit; documented return is the clean exemption path",
    ),
]


def main() -> None:
    print("FinSight Content Factory v3 — Generate → Evaluate → Iterate → Polish")
    print(f"MAX_STYLE_RETRIES={MAX_STYLE_RETRIES}  FORCE_PUBLISH_ON_FAIL={FORCE_PUBLISH_ON_FAIL}")
    print(f"OUTPUT_ROOT={OUTPUT_ROOT.resolve()}")
    print(f"PACKAGE_ROOT={PACKAGE_ROOT.resolve()}")

    for i, job in enumerate(ARTICLES):
        run_factory(job, interactive_alpha=True)
        if i < len(ARTICLES) - 1:
            print("\n⏳ Cooldown 45s…\n")
            time.sleep(45)

    print("\n🎉 Batch complete.")


if __name__ == "__main__":
    main()
