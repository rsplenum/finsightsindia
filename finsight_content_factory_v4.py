#!/usr/bin/env python3
"""
FinSight India — Content Factory v4
====================================
Reprogrammed for:
  - Standards as LAUNCHPAD for creativity (not a cage)
  - Interactive ALPHA only; writing style chosen automatically from topic vibe
  - Internet gap research: what existing articles miss → must incorporate
  - First-principles analysis end-to-end (origin, mechanism, delta, intent)
  - Demystify for decision-making + true legislative intent + deep insight
  - Comprehensive coverage without checklist-padding
  - Vivid illustrations via Google Nano Banana (Gemini native image models)
  - Creative structure per topic vibe; facts stay grounded

Pipeline:
  1. ALPHA (human) + auto STYLE from topic
  2. QUANT — law facts
  3. GAP — search web, list what competitors miss
  4. NOVELIST — first-principles, creative structure, gap-complete
  5. READER critic — iterate until a lay decision-maker can act
  6. ILLUSTRATOR — Nano Banana generate 2 images → save under src/assets/images
  7. MDX assembler — frontmatter, real ![alt](paths), NoticeTrap, no LaTeX

Usage:
  export GEMINI_API_KEY=...
  pip install crewai python-dotenv ddgs google-genai pillow
  python finsight_content_factory_v4.py
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TextIO

from dotenv import load_dotenv

try:
    from crewai import Agent, Task, Crew, Process, LLM

    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    print("pip install crewai python-dotenv")

load_dotenv()

# =============================================================================
# PATHS & MODELS
# =============================================================================

OUTPUT_ROOT = Path(os.environ.get("FINSIGHT_CONTENT_OUT", "src/content/direct-tax"))
PACKAGE_ROOT = Path(os.environ.get("FINSIGHT_PACKAGE_OUT", "content_packages"))
IMAGES_ROOT = Path(os.environ.get("FINSIGHT_IMAGES_OUT", "src/assets/images"))

_DEFAULT_TEXT = "gemini/gemini-3.6-flash"
# Nano Banana 2 — default image model (white-blend Varsity, dark-mode safe)
_DEFAULT_IMAGE = "gemini-3.1-flash-image"

MODEL_TEXT = os.environ.get("FINSIGHT_LLM_TEXT", _DEFAULT_TEXT)
MODEL_IMAGE = os.environ.get("FINSIGHT_IMAGE_MODEL", _DEFAULT_IMAGE)

# Reject known-bad *text* model ids from older scripts (image model 3.1-flash-image is fine)
if "gemini-3.1-pro" in MODEL_TEXT and "image" not in MODEL_TEXT:
    print(f"⚠️  Bad text model {MODEL_TEXT!r} → {_DEFAULT_TEXT!r}")
    MODEL_TEXT = _DEFAULT_TEXT

# Shared visual language for all generated illustrations
IMAGE_STYLE_BRIEF = (
    "FinSight Varsity editorial illustration. Minimalist, poster-flat clarity. "
    "PURE WHITE (#FFFFFF) background only — illustration must blend into a white page. "
    "Large white margin around a centered subject; clean silhouette, no full-bleed color fields. "
    "Palette: deep navy (#0B1F3A), muted gold (#C9A227), optional soft emerald accents only. "
    "High-contrast line and shape so the art stays readable when the website is in dark mode "
    "(treat the white as a fixed plate sitting on dark UI). "
    "No text, no logos, no watermarks, no photoreal clutter, no busy gradients, no drop shadows "
    "that disappear on dark backgrounds."
)

MAX_READER_RETRIES = int(os.environ.get("FINSIGHT_MAX_READER_RETRIES", "2"))
FORCE_PUBLISH_ON_FAIL = os.environ.get("FINSIGHT_FORCE_PUBLISH_ON_FAIL", "0") == "1"
DISABLE_SEARCH = os.environ.get("FINSIGHT_DISABLE_SEARCH", "0") == "1"
DISABLE_IMAGES = os.environ.get("FINSIGHT_DISABLE_IMAGES", "0") == "1"

# =============================================================================
# DEEP ANALYSIS MANDATE (injected into EVERY agent)
# =============================================================================

DEEP_ANALYSIS_MANDATE = """
THIS IS A SIGNIFICANT TOPIC. Be thorough. Think hard. Read between the lines.

Do a FIRST-PRINCIPLES analysis of concepts, ideas, their ORIGIN, interrelationships,
causes and effects, underlying trends, and significance — so a layperson can elevate
their thinking and answer any question form (discuss, analyse, critically examine,
explain, evaluate, describe) in depth.

Rules of work:
- Don't rush to finish. Take responsibility for the outcome.
- Measure quality at every step; improve when weak.
- Don't leave material gaps that block a real decision.
- Don't artificially limit your reasoning.
- Act as an authority dissecting the subject for high-level understanding.
- Focus on the DELTA — the marginal difference in approach or circumstance that
  produces an entirely different result.
- Focus on MECHANISM — step-by-step process from initial state to final state.
  Knowing only start and end is useless; tracing the mechanics is essential.
- Like a slight mutation in one gene can change a species: find the small legal
  or procedural hinge that changes the entire outcome for the taxpayer.

Standards (FinSight) are a LAUNCHPAD for creativity, not a cage:
- You may invent structure, headings, and narrative shape to match the TOPIC VIBE.
- You must still deliver: clear decision path, true legislative/administrative INTENT,
  deeper insight, and actionable next steps a non-CA can execute.
- Never produce cold audit-novel cosplay unless the topic genuinely demands forensic tone.
- Never pad with inventory. Comprehensive ≠ exhaustive laundry lists.
"""

# =============================================================================
# STYLE CATALOG — auto-selected from topic (not asked of user)
# =============================================================================

STYLES: dict[str, dict[str, str]] = {
    "brutal": {
        "name": "The Brutal Truth",
        "rules": "Direct, mathematical, punchy. Numbers over adjectives. No coddling.",
        "keywords": ["ltcg", "stcg", "budget", "rate hike", "cess", "surcharge", "slab"],
    },
    "forensic": {
        "name": "The Forensic Auditor",
        "rules": "Trail of money/paper. Cold precision only when surveillance/scrutiny is the core emotion. Still readable.",
        "keywords": ["sft", "ais", "scrutiny", "notice", "26as", "insight", "surveillance", "148"],
    },
    "myth": {
        "name": "The Myth-Buster",
        "rules": "Quote the dangerous myth in the reader's voice, then dismantle with statute and mechanism.",
        "keywords": ["44ad", "44ada", "loophole", "myth", "reddit", "fake", "80g", "gift", "barter", "194r"],
    },
    "coffee": {
        "name": "The Coffee Shop Chat",
        "rules": "We/you. Name the paranoia. Peer voice. Warm, clear, decisive.",
        "keywords": ["moonlight", "salary", "hra", "rent", "parents", "missed", "deadline", "itr", "freelance"],
    },
    "wargame": {
        "name": "The Scenario Wargamer",
        "rules": "If X then Y. Branches. Optimization under constraints.",
        "keywords": ["regime", "new vs old", "swp", "sip", "optimize", "vs", "compare"],
    },
    "narrative": {
        "name": "The Narrative Arc",
        "rules": "Named person; hope → shock → agency. Hold them through the close.",
        "keywords": ["esop", "founder", "inherit", "nri", "rnor", "startup"],
    },
    "trench": {
        "name": "The Trench Survivor",
        "rules": "Validate pain first. Honest about permanent damage vs what can still be fixed.",
        "keywords": ["penalty", "234f", "late", "notice", "demand", "prosecution"],
    },
}


def choose_style_for_topic(topic: str) -> dict[str, str]:
    t = topic.lower()
    scores: list[tuple[int, str]] = []
    for key, meta in STYLES.items():
        score = sum(1 for kw in meta["keywords"] if kw in t)
        scores.append((score, key))
    scores.sort(key=lambda x: (-x[0], x[1]))
    best = scores[0][1] if scores[0][0] > 0 else "coffee"
    return STYLES[best]


# =============================================================================
# DATA
# =============================================================================


@dataclass
class ArticleJob:
    topic: str
    filename: str
    category: str = "tds"
    category_name: str = "Direct Tax"
    statutory_hint: str = ""
    alpha: str = ""


@dataclass
class FactoryResult:
    slug: str
    article_mdx: str = ""
    seo: dict[str, Any] = field(default_factory=dict)
    gap_brief: str = ""
    image_paths: list[str] = field(default_factory=list)
    reader_pass: bool = False
    revision_rounds: int = 0
    notes: list[str] = field(default_factory=list)


# =============================================================================
# HELPERS
# =============================================================================


def make_llm(temperature: float) -> Any:
    return LLM(
        model=MODEL_TEXT,
        api_key=os.environ.get("GEMINI_API_KEY"),
        temperature=temperature,
    )


def task_raw(task: Any) -> str:
    out = getattr(task, "output", None)
    if out is None:
        return ""
    return getattr(out, "raw", None) or str(out)


def extract_json(text: str) -> dict[str, Any]:
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


# =============================================================================
# PROCESS LOG (agent activity for later review)
# =============================================================================


class FactoryLogger:
    """
    Append-only log of every crew segment, agent role, task brief, and output.
    Written live to:
      content_packages/{slug}/factory_process_log.md
      content_packages/{slug}/factory_process_log.jsonl
    """

    def __init__(self, slug: str, meta: dict[str, Any] | None = None):
        self.slug = slug
        self.started = datetime.now(timezone.utc)
        self.dir = PACKAGE_ROOT / slug
        self.dir.mkdir(parents=True, exist_ok=True)
        self.md_path = self.dir / "factory_process_log.md"
        self.jsonl_path = self.dir / "factory_process_log.jsonl"
        self.events: list[dict[str, Any]] = []
        self._md: TextIO = open(self.md_path, "w", encoding="utf-8")
        header = {
            "type": "run_start",
            "slug": slug,
            "utc": self.started.isoformat(),
            "meta": meta or {},
        }
        self._write_jsonl(header)
        self._md.write(f"# Factory process log — `{slug}`\n\n")
        self._md.write(f"- **Started (UTC):** {self.started.isoformat()}\n")
        for k, v in (meta or {}).items():
            self._md.write(f"- **{k}:** {v}\n")
        self._md.write("\n---\n\n")
        self._md.flush()
        print(f"📝 Process log → {self.md_path}")

    def _write_jsonl(self, obj: dict[str, Any]) -> None:
        with open(self.jsonl_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(obj, ensure_ascii=False, default=str) + "\n")

    def section(self, title: str) -> None:
        self._md.write(f"## {title}\n\n")
        self._md.flush()
        self._write_jsonl({"type": "section", "title": title, "utc": datetime.now(timezone.utc).isoformat()})

    def note(self, text: str) -> None:
        self._md.write(f"{text}\n\n")
        self._md.flush()
        self._write_jsonl({"type": "note", "text": text, "utc": datetime.now(timezone.utc).isoformat()})

    def log_crew_start(self, label: str, agent_roles: list[str], task_previews: list[str]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._md.write(f"### ▶ Crew segment: **{label}**\n\n")
        self._md.write(f"- Time (UTC): `{now}`\n")
        self._md.write(f"- Agents: {', '.join(agent_roles)}\n\n")
        for i, prev in enumerate(task_previews, 1):
            self._md.write(f"**Task {i} brief (truncated):**\n\n```\n{prev[:2000]}\n```\n\n")
        self._md.flush()
        self._write_jsonl(
            {
                "type": "crew_start",
                "label": label,
                "agents": agent_roles,
                "task_previews": task_previews,
                "utc": now,
            }
        )

    def log_task_output(self, label: str, agent_role: str, task_desc: str, output: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._md.write(f"#### Agent output — `{agent_role}`\n\n")
        self._md.write(f"*Segment:* {label}  \n")
        self._md.write(f"*UTC:* `{now}`\n\n")
        self._md.write("<details>\n<summary>Task description</summary>\n\n")
        self._md.write(f"```\n{(task_desc or '')[:4000]}\n```\n\n</details>\n\n")
        self._md.write("<details open>\n<summary>Full output</summary>\n\n")
        self._md.write(f"```\n{output or '(empty)'}\n```\n\n</details>\n\n")
        self._md.write("---\n\n")
        self._md.flush()
        event = {
            "type": "task_output",
            "label": label,
            "agent": agent_role,
            "task_desc": (task_desc or "")[:8000],
            "output": output or "",
            "output_chars": len(output or ""),
            "utc": now,
        }
        self.events.append(event)
        self._write_jsonl(event)

    def log_exception(self, label: str, err: BaseException) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._md.write(f"### ❌ Error in `{label}`\n\n```\n{type(err).__name__}: {err}\n```\n\n")
        self._md.flush()
        self._write_jsonl(
            {
                "type": "error",
                "label": label,
                "error": f"{type(err).__name__}: {err}",
                "utc": now,
            }
        )

    def close(self, summary: dict[str, Any] | None = None) -> None:
        ended = datetime.now(timezone.utc)
        self._md.write("## Run complete\n\n")
        self._md.write(f"- **Ended (UTC):** {ended.isoformat()}\n")
        self._md.write(f"- **Duration:** {(ended - self.started).total_seconds():.1f}s\n")
        if summary:
            self._md.write("\n### Summary\n\n")
            for k, v in summary.items():
                self._md.write(f"- **{k}:** {v}\n")
        self._md.write("\n")
        self._md.flush()
        self._write_jsonl(
            {
                "type": "run_end",
                "utc": ended.isoformat(),
                "duration_sec": (ended - self.started).total_seconds(),
                "summary": summary or {},
            }
        )
        self._md.close()
        print(f"📝 Process log closed → {self.md_path}")


def run_crew(
    agents: list[Any],
    tasks: list[Any],
    label: str,
    logger: FactoryLogger | None = None,
) -> str:
    print(f"\n── {label} ──")
    roles = []
    for a in agents:
        roles.append(getattr(a, "role", None) or str(a))
    previews = []
    for t in tasks:
        desc = getattr(t, "description", None) or ""
        previews.append(desc[:1500])
    if logger:
        logger.log_crew_start(label, roles, previews)

    try:
        crew = Crew(agents=agents, tasks=tasks, process=Process.sequential, verbose=True)
        result = crew.kickoff()
    except Exception as e:
        if logger:
            logger.log_exception(label, e)
        raise

    # Log each task's output (agent discussion product)
    if logger:
        for t in tasks:
            agent = getattr(t, "agent", None)
            role = getattr(agent, "role", "unknown") if agent else "unknown"
            desc = getattr(t, "description", "") or ""
            out = task_raw(t)
            logger.log_task_output(label, role, desc, out)

    return getattr(result, "raw", None) or str(result)


def build_search_tool() -> Any:
    if DISABLE_SEARCH:
        print("ℹ️  Search disabled")
        return None
    try:
        from ddgs import DDGS
    except ImportError:
        print("⚠️  pip install -U ddgs  (gap research disabled)")
        return None
    try:
        from crewai.tools import BaseTool
        from pydantic import BaseModel, Field

        class In(BaseModel):
            query: str = Field(..., description="Web search query")

        class T(BaseTool):
            name: str = "web_search"
            description: str = "Search the web for articles, guides, and official tax pages on the topic."
            args_schema: type[BaseModel] = In

            def _run(self, query: str) -> str:
                try:
                    rows = list(DDGS().text(query, max_results=10))
                except Exception as e:
                    return f"Search error: {e}"
                if not rows:
                    return "No results"
                bits = []
                for i, r in enumerate(rows, 1):
                    bits.append(
                        f"{i}. {r.get('title','')}\n   {r.get('href') or r.get('link','')}\n   {r.get('body') or r.get('snippet','')}"
                    )
                return "\n\n".join(bits)

        print("✅ Search via ddgs")
        return T()
    except Exception as e:
        print(f"⚠️  Search tool wrap failed: {e}")
        return None


def generate_nano_banana_image(prompt: str, out_path: Path) -> bool:
    """Generate one image with Nano Banana / Gemini image model; save JPEG/PNG."""
    if DISABLE_IMAGES:
        return False
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("⚠️  pip install google-genai  for Nano Banana images")
        return False

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return False

    client = genai.Client(api_key=api_key)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Try native image modality first (Nano Banana family)
    try:
        response = client.models.generate_content(
            model=MODEL_IMAGE,
            contents=(
                f"{IMAGE_STYLE_BRIEF}\n\n"
                "Subject matter (emotionally specific, Indian tax education context):\n"
                f"{prompt}"
            ),
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        for part in getattr(response, "candidates", []) or []:
            content = getattr(part, "content", None)
            if not content:
                continue
            for p in getattr(content, "parts", []) or []:
                inline = getattr(p, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    data = inline.data
                    if isinstance(data, str):
                        import base64

                        data = base64.b64decode(data)
                    out_path.write_bytes(data)
                    print(f"✅ Image saved: {out_path}")
                    return True
    except Exception as e:
        print(f"⚠️  Nano Banana generate_content failed ({MODEL_IMAGE}): {e}")

    # Fallback: Imagen-style generate_images if available on key
    try:
        response = client.models.generate_images(
            model=os.environ.get("FINSIGHT_IMAGEN_MODEL", "imagen-4.0-generate-001"),
            prompt=(
                f"{IMAGE_STYLE_BRIEF} Indian tax education context. Scene: {prompt}"
            ),
            config=types.GenerateImagesConfig(number_of_images=1),
        )
        for gi in getattr(response, "generated_images", []) or []:
            img = getattr(gi, "image", None)
            if img is None:
                continue
            # google genai Image object may support .save
            if hasattr(img, "save"):
                img.save(str(out_path))
                print(f"✅ Image saved via Imagen fallback: {out_path}")
                return True
            data = getattr(img, "image_bytes", None) or getattr(img, "data", None)
            if data:
                out_path.write_bytes(data)
                print(f"✅ Image saved via Imagen bytes: {out_path}")
                return True
    except Exception as e:
        print(f"⚠️  Imagen fallback failed: {e}")

    return False


def ensure_frontmatter(body: str, job: ArticleJob, style_name: str, seo: dict[str, Any]) -> str:
    if body.startswith("---"):
        parts = body.split("---", 2)
        if len(parts) >= 3:
            body = parts[2].lstrip("\n")
    title = seo.get("title") or job.topic
    summary = seo.get("description") or job.alpha or job.topic
    lines = [
        "---",
        f'title: "{str(title).replace(chr(34), chr(39))}"',
        f'category: "{job.category}"',
        f'categoryName: "{job.category_name}"',
        f'readTime: "{seo.get("readTime", "12 min read")}"',
        'updatedDate: "FY 2025-26"',
        f'statutoryAct: "{job.statutory_hint or seo.get("statutoryAct", "Income Tax Act")}"',
        f'summary: "{str(summary).replace(chr(34), chr(39))}"',
        f'writingStyle: "{style_name}"',
        "---",
        "",
        "import NoticeTrap from '../../components/mdx/NoticeTrap.astro';",
        "import CardPremium from '../../components/CardPremium.astro';",
        "",  # mandatory blank line after imports
    ]
    # strip duplicate imports from body
    body = re.sub(r"^import .+astro';\s*", "", body, flags=re.M)
    body = body.lstrip()
    # ban raw latex fences
    body = body.replace("$$", "`")
    return "\n".join(lines) + body


# =============================================================================
# AGENTS
# =============================================================================


def build_agents(search_tool: Any) -> dict[str, Any]:
    llm_rigid = make_llm(0.15)
    llm_creative = make_llm(0.65)
    llm_critic = make_llm(0.2)
    tools = [search_tool] if search_tool else []

    return {
        "quant": Agent(
            role="Principal Tax Quant",
            goal="Extract exact current Indian tax mechanics for the topic as bullets.",
            backstory=DEEP_ANALYSIS_MANDATE
            + "\nYou supply FACTS only: sections, rates, thresholds, deadlines, who pays whom. Flag uncertainty.",
            llm=llm_rigid,
            tools=tools,
            allow_delegation=False,
            verbose=True,
        ),
        "gap": Agent(
            role="Content Gap Strategist",
            goal=(
                "Search the internet for existing articles on this topic. List what they already cover "
                "and — critically — what they MISS. Those misses MUST appear in our article."
            ),
            backstory=DEEP_ANALYSIS_MANDATE
            + "\nYou think like a competitor analyst. Output a gap brief the novelist cannot ignore.",
            llm=llm_creative,
            tools=tools,
            allow_delegation=False,
            verbose=True,
        ),
        "style_picker": Agent(
            role="Vibe & Style Director",
            goal="Confirm the emotional vibe of the topic and the chosen writing persona.",
            backstory=DEEP_ANALYSIS_MANDATE
            + "\nYou match structure energy to the reader's emotional state.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "novelist": Agent(
            role="Narrative Architect",
            goal=(
                "Write a vivid, first-principles article that demystifies the topic so a lay reader "
                "can DECIDE and understand TRUE INTENT. Incorporate every gap item. Creative structure."
            ),
            backstory=DEEP_ANALYSIS_MANDATE
            + "\nYou write like the 44AD freelance trap piece: myth, history, mechanism, algorithm, "
            "human stakes — never like an internal audit memo.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "reader": Agent(
            role="Reader Usability Critic",
            goal=(
                "PASS only if a non-CA Indian taxpayer can state the decision and next actions after reading. "
                "FAIL cold jargon, audit cosplay, missing mechanism, missing gap items."
            ),
            backstory=DEEP_ANALYSIS_MANDATE
            + "\nYou defend the reader. Style catalogs are launchpads; unreadability is a defect.",
            llm=llm_critic,
            allow_delegation=False,
            verbose=True,
        ),
        "seo": Agent(
            role="SEO Strategist",
            goal="JSON: high-anxiety title, meta description, faqs — outcome certainty.",
            backstory="Search intent = panic symptom + decision, not dictionary definition.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "art": Agent(
            role="Illustration Director",
            goal=(
                "Write exactly TWO short scene prompts (anxiety beat + relief/clarity beat), ≤25 words each. "
                "Subjects only — the pipeline adds FinSight Varsity white-background / dark-mode style."
            ),
            backstory="Emotionally specific scenes. No generic person-at-desk. No background color instructions.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
    }


# =============================================================================
# TASKS
# =============================================================================


def t_quant(job: ArticleJob, agent: Any) -> Any:
    return Task(
        description=(
            f"{DEEP_ANALYSIS_MANDATE}\n\n"
            f"Topic: {job.topic}\nHint: {job.statutory_hint or 'discover'}\n"
            f"Alpha thesis from editor: {job.alpha or '(none)'}\n\n"
            "Output STRICT bullets: sections, circulars, rates, thresholds, deadlines, "
            "penalties, payer vs recipient. Flag uncertainty explicitly."
        ),
        expected_output="Bulleted legal facts.",
        agent=agent,
    )


def t_gap(job: ArticleJob, agent: Any, quant_task: Any) -> Any:
    return Task(
        description=(
            f"{DEEP_ANALYSIS_MANDATE}\n\n"
            f"Topic: {job.topic}\n\n"
            "Use web_search (multiple queries) for Indian tax articles/guides on this topic.\n"
            "Return markdown:\n"
            "## Covered by existing articles\n- ...\n"
            "## GAPS (must include in our article)\n- ...\n"
            "## Dangerous myths circulating\n- ...\n"
            "Be specific. Gaps are obligations for the novelist."
        ),
        expected_output="Gap brief markdown.",
        agent=agent,
        context=[quant_task],
    )


def t_novelist(
    job: ArticleJob,
    agent: Any,
    style: dict[str, str],
    quant_task: Any,
    gap_task: Any,
) -> Any:
    return Task(
        description=(
            f"{DEEP_ANALYSIS_MANDATE}\n\n"
            f"Write the FULL article on: {job.topic}\n\n"
            f"EDITOR ALPHA (honor this thesis):\n{job.alpha or '(derive from first principles)'}\n\n"
            f"AUTO-SELECTED STYLE: {style['name']}\n"
            f"Style energy (launchpad, not cage): {style['rules']}\n\n"
            "REQUIREMENTS:\n"
            "- First principles: origin of the rule, intent, mechanism, delta that changes outcomes.\n"
            "- Incorporate EVERY item under GAPS from the gap brief — without fail.\n"
            "- Demystify so the reader can make a decision and see true intent.\n"
            "- Cover the topic from the angles that matter (not infinite edge-case spam).\n"
            "- Creative structure matching the topic vibe (prologue, acts, myth→trap, etc. are allowed).\n"
            "- Named human stakes early; return to agency at the end.\n"
            "- Plain-language checklist of actions (human verbs).\n"
            "- NO ASCII diagrams. NO raw LaTeX. NO 'Case File / Resolution Status / File closed' cosplay.\n"
            "- NO Pillar 1/2/3/4 headings.\n"
            "- Markdown body only (no YAML frontmatter).\n"
            "Quality bar: as engrossing as a strong FinSight myth-buster (e.g. 44AD vs 44ADA freelance trap)."
        ),
        expected_output="Full markdown article body.",
        agent=agent,
        context=[quant_task, gap_task],
    )


def t_reader(agent: Any, draft: str, gap_brief: str) -> Any:
    d = draft if len(draft) < 100_000 else draft[:100_000] + "\n…"
    g = gap_brief if len(gap_brief) < 20_000 else gap_brief[:20_000]
    return Task(
        description=(
            f"{DEEP_ANALYSIS_MANDATE}\n\n"
            "Critique this draft for READER usability and gap coverage.\n\n"
            f"GAP BRIEF:\n{g}\n\n"
            f"DRAFT:\n```markdown\n{d}\n```\n\n"
            "Return JSON only:\n"
            '{"verdict":"PASS"|"FAIL","score":0-10,'
            '"missing_gaps":[],"confusing_bits":[],'
            '"rewrites":[{"original":"...","suggested":"..."}],'
            '"notes":"..."}\n\n'
            "FAIL if: non-CA cannot decide; audit cosplay; missing gap items; "
            "no mechanism; no human stakes; pure statute dump."
        ),
        expected_output="JSON critique.",
        agent=agent,
    )


def t_revise(
    job: ArticleJob,
    agent: Any,
    style: dict[str, str],
    draft: str,
    critique: dict[str, Any],
    gap_brief: str,
    quant_text: str,
) -> Any:
    return Task(
        description=(
            f"{DEEP_ANALYSIS_MANDATE}\n\n"
            f"REVISE the article on: {job.topic}\n"
            f"Style energy: {style['name']} — {style['rules']}\n"
            f"Alpha: {job.alpha}\n\n"
            f"CRITIC: {json.dumps(critique, ensure_ascii=False)[:6000]}\n\n"
            f"GAPS STILL TO HONOR:\n{gap_brief[:8000]}\n\n"
            f"FACTS:\n{quant_text[:6000]}\n\n"
            f"PREVIOUS DRAFT:\n```markdown\n{draft[:90000]}\n```\n\n"
            "Fix every FAIL reason. Keep law accurate. Full revised markdown body only."
        ),
        expected_output="Full revised markdown body.",
        agent=agent,
    )


def t_seo(job: ArticleJob, agent: Any, article: str) -> Any:
    return Task(
        description=(
            f"Topic: {job.topic}\n\n"
            "From the article, return JSON:\n"
            "title, description, readTime, statutoryAct, faqs:[{q,a}], intent\n"
            "Title = high-anxiety symptom + outcome, not dictionary definition."
        ),
        expected_output="SEO JSON.",
        agent=agent,
    )


def t_art(agent: Any, article: str) -> Any:
    return Task(
        description=(
            "From the article, output JSON:\n"
            '{"anxiety_prompt":"≤25 words scene",'
            '"relief_prompt":"≤25 words scene",'
            '"anxiety_alt":"...",'
            '"relief_alt":"..."}\n'
            "Scene content only (who/what emotion). Do NOT specify background color — "
            "pipeline forces pure white Varsity plate for light+dark mode. No text in image."
        ),
        expected_output="JSON with two prompts + alts.",
        agent=agent,
    )


# =============================================================================
# PACKAGE
# =============================================================================


def write_package(
    job: ArticleJob,
    result: FactoryResult,
    style_name: str,
    write_collection: bool,
) -> Path:
    pkg = PACKAGE_ROOT / job.filename
    pkg.mkdir(parents=True, exist_ok=True)
    mdx = ensure_frontmatter(result.article_mdx, job, style_name, result.seo)
    (pkg / "article.mdx").write_text(mdx, encoding="utf-8")
    if write_collection:
        OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
        (OUTPUT_ROOT / f"{job.filename}.mdx").write_text(mdx, encoding="utf-8")
    (pkg / "seo.json").write_text(
        json.dumps({**result.seo, "reader_pass": result.reader_pass}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (pkg / "gap_brief.md").write_text(result.gap_brief or "", encoding="utf-8")
    (pkg / "images.txt").write_text("\n".join(result.image_paths), encoding="utf-8")
    (pkg / "notes.txt").write_text("\n".join(result.notes), encoding="utf-8")
    return pkg


def inject_images(body: str, paths: list[tuple[str, str]]) -> str:
    """paths: list of (rel_md_path, alt). Insert after first para and before checklist if possible."""
    if not paths:
        return body
    tags = [f"![{alt}]({rel})" for rel, alt in paths]
    # after first blank line following first paragraph
    parts = body.split("\n\n", 1)
    if len(parts) == 2:
        body = parts[0] + "\n\n" + tags[0] + "\n\n" + parts[1]
    else:
        body = tags[0] + "\n\n" + body
    if len(tags) > 1:
        if re.search(r"^## .+checklist", body, re.I | re.M):
            body = re.sub(
                r"(^## .+checklist.*$)",
                tags[1] + "\n\n\\1",
                body,
                count=1,
                flags=re.I | re.M,
            )
        else:
            body = body + "\n\n" + tags[1] + "\n"
    return body


# =============================================================================
# MAIN RUN
# =============================================================================


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return (s[:80] or "article").rstrip("-")


def prompt_job_from_user() -> ArticleJob:
    """Interactive: topic first, then alpha. Style is auto-chosen later from topic."""
    print("\n" + "=" * 64)
    print("🏭 FinSight Factory v4 — New article")
    print("=" * 64)

    topic = ""
    while not topic:
        topic = input("\n📌 TOPIC (what should we demystify?): ").strip()
        if not topic:
            print("   Topic is required.")

    default_slug = slugify(topic)
    slug_in = input(f"📁 Filename slug [{default_slug}]: ").strip()
    filename = slugify(slug_in) if slug_in else default_slug

    category = input("🏷️  Category code [tds]: ").strip() or "tds"
    category_name = input("🏷️  Category display name [Direct Tax]: ").strip() or "Direct Tax"
    statutory_hint = input("⚖️  Statutory hint (sections/circulars, or Enter to skip): ").strip()

    print("\n💡 ALPHA — your first-principles thesis / proprietary edge.")
    print("   (Why this rule exists, the delta that changes outcomes, what others miss.)")
    alpha = ""
    while not alpha:
        alpha = input("💡 ALPHA: ").strip()
        if not alpha:
            print("   Alpha is required for quality. Paste your thesis.")

    job = ArticleJob(
        topic=topic,
        filename=filename,
        category=category,
        category_name=category_name,
        statutory_hint=statutory_hint,
        alpha=alpha,
    )
    style = choose_style_for_topic(job.topic)
    print(f"\n✨ Auto-selected writing style from topic: {style['name']}")
    print(f"   ({style['rules'][:100]}…)" if len(style["rules"]) > 100 else f"   ({style['rules']})")
    return job


def run_factory(job: ArticleJob | None = None) -> FactoryResult:
    if not CREWAI_AVAILABLE:
        raise RuntimeError("pip install crewai")
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("Set GEMINI_API_KEY")

    if job is None:
        job = prompt_job_from_user()

    style = choose_style_for_topic(job.topic)
    print("\n" + "-" * 64)
    print(f"   Topic:  {job.topic}")
    print(f"   Slug:   {job.filename}")
    print(f"   Style:  {style['name']} (auto from topic)")
    print(f"   Alpha:  {job.alpha[:120]}{'…' if len(job.alpha) > 120 else ''}")
    print(f"   Models: text={MODEL_TEXT} | image={MODEL_IMAGE}")
    print("-" * 64)

    logger = FactoryLogger(
        job.filename,
        meta={
            "topic": job.topic,
            "style": style["name"],
            "alpha": job.alpha,
            "statutory_hint": job.statutory_hint,
            "model_text": MODEL_TEXT,
            "model_image": MODEL_IMAGE,
        },
    )
    logger.section("Inputs")
    logger.note(f"**Topic:** {job.topic}\n\n**Alpha:**\n\n{job.alpha}")

    search = build_search_tool()
    agents = build_agents(search)
    notes: list[str] = [f"auto_style={style['name']}", f"alpha_len={len(job.alpha)}"]

    try:
        # 1–2 Quant + Gap
        logger.section("Phase A — Quant + Gap research")
        tq = t_quant(job, agents["quant"])
        tg = t_gap(job, agents["gap"], tq)
        run_crew(
            [agents["quant"], agents["gap"]],
            [tq, tg],
            "QUANT + GAP RESEARCH",
            logger=logger,
        )
        quant_text = task_raw(tq)
        gap_brief = task_raw(tg)
        notes.append(f"gap_chars={len(gap_brief)}")

        # 3 Novelist
        logger.section("Phase B — Novelist draft")
        tn = t_novelist(job, agents["novelist"], style, tq, tg)
        run_crew(
            [agents["novelist"]],
            [tn],
            "NOVELIST (first principles + gaps)",
            logger=logger,
        )
        draft = task_raw(tn)

        # 4 Reader loop
        logger.section("Phase C — Reader critic + revision loop")
        reader_pass = False
        critique: dict[str, Any] = {}
        revisions = 0
        for attempt in range(MAX_READER_RETRIES + 1):
            tr = t_reader(agents["reader"], draft, gap_brief)
            run_crew(
                [agents["reader"]],
                [tr],
                f"READER CRITIC round {attempt}",
                logger=logger,
            )
            critique = extract_json(task_raw(tr))
            verdict = str(critique.get("verdict", "")).upper()
            notes.append(f"reader_{attempt}={verdict} score={critique.get('score')}")
            logger.note(
                f"Reader verdict round {attempt}: **{verdict}** "
                f"(score={critique.get('score')})\n\n"
                f"```json\n{json.dumps(critique, ensure_ascii=False, indent=2)[:5000]}\n```"
            )
            if verdict == "PASS":
                reader_pass = True
                print(f"✅ Reader PASS (round {attempt})")
                break
            print(f"❌ Reader FAIL (round {attempt})")
            if attempt >= MAX_READER_RETRIES:
                break
            revisions += 1
            tv = t_revise(job, agents["novelist"], style, draft, critique, gap_brief, quant_text)
            run_crew(
                [agents["novelist"]],
                [tv],
                f"REVISE #{revisions}",
                logger=logger,
            )
            draft = task_raw(tv) or draft

        # 5 SEO + art prompts
        logger.section("Phase D — SEO + art direction")
        ts = t_seo(job, agents["seo"], draft)
        ta = t_art(agents["art"], draft)
        run_crew(
            [agents["seo"], agents["art"]],
            [ts, ta],
            "SEO + ART DIRECTION",
            logger=logger,
        )
        seo = extract_json(task_raw(ts))
        art = extract_json(task_raw(ta))

        # 6 Nano Banana images
        logger.section("Phase E — Image generation (Nano Banana)")
        image_rels: list[tuple[str, str]] = []
        image_paths: list[str] = []
        slug = job.filename
        prompts = [
            (art.get("anxiety_prompt") or f"Anxiety moment for {job.topic}", art.get("anxiety_alt") or "Anxiety"),
            (art.get("relief_prompt") or f"Clarity and relief for {job.topic}", art.get("relief_alt") or "Relief"),
        ]
        for i, (prompt, alt) in enumerate(prompts):
            fname = f"{slug}-{'anxiety' if i == 0 else 'relief'}.jpg"
            abs_path = IMAGES_ROOT / fname
            logger.note(f"Image prompt {i}: `{prompt}` → `{abs_path}`")
            ok = generate_nano_banana_image(prompt, abs_path)
            if ok:
                rel = f"../../assets/images/{fname}"
                image_rels.append((rel, alt))
                image_paths.append(str(abs_path))
                logger.note(f"✅ Image saved: {abs_path}")
            else:
                notes.append(f"image_failed_{i}: {prompt[:80]}")
                logger.note(f"❌ Image failed for prompt {i}")

        body = inject_images(draft, image_rels)
        body = body.replace("$$", "`")

        result = FactoryResult(
            slug=slug,
            article_mdx=body,
            seo=seo,
            gap_brief=gap_brief,
            image_paths=image_paths,
            reader_pass=reader_pass,
            revision_rounds=revisions,
            notes=notes,
        )
        pkg = write_package(
            job, result, style["name"], write_collection=reader_pass or FORCE_PUBLISH_ON_FAIL
        )
        print(f"\n📦 {pkg}")
        print(f"   reader_pass={reader_pass} revisions={revisions} images={len(image_paths)}")
        logger.close(
            summary={
                "package": str(pkg),
                "reader_pass": reader_pass,
                "revision_rounds": revisions,
                "images": len(image_paths),
                "process_log_md": str(logger.md_path),
                "process_log_jsonl": str(logger.jsonl_path),
            }
        )
        return result
    except Exception as e:
        logger.log_exception("run_factory", e)
        logger.close(summary={"failed": True, "error": str(e)})
        raise


# =============================================================================
# ENTRY
# =============================================================================


def main() -> None:
    print("FinSight Content Factory v4")
    print(f"MODEL_TEXT={MODEL_TEXT}")
    print(f"MODEL_IMAGE={MODEL_IMAGE}")
    print(f"MAX_READER_RETRIES={MAX_READER_RETRIES}")
    print("Interactive mode: will ask TOPIC first, then ALPHA.")
    print("(Writing style is chosen automatically from the topic.)\n")

    while True:
        run_factory(None)  # prompts for topic → alpha inside
        again = input("\n▶  Run another article? [y/N]: ").strip().lower()
        if again not in ("y", "yes"):
            break
        time.sleep(2)

    print("\n🎉 Done. Publish only packages with reader_pass=true.")


if __name__ == "__main__":
    main()
