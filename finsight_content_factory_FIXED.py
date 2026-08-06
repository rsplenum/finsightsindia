#!/usr/bin/env python3
"""
FinSight India — Content Factory v4 (First-Principles & Creativity)
===================================================================
Generation → Evaluation → Iteration (bounded), then polish + package.

Pipeline primitives:
  1. RESEARCH  — Competitive Gap Analyst (searches web, finds the delta)
  2. GENERATE  — SEO (sets the vibe) → Novelist (First Principles drafting)
  3. EVALUATE  — Style Critic → PASS | FAIL + rewrites based on depth & mechanics
  4. ITERATE   — if FAIL, Novelist revises using critique
  5. POLISH    — Visual (Gemini API Image Gen) → UI (MDX fixes) → YouTube
  6. PACKAGE   — mdx + seo.json + reel + thumbnail + notes

Publish gate: style_pass == True (or FORCE_PUBLISH_ON_FAIL=1 for debug)
"""

from __future__ import annotations

import json
import os
import re
import time
import base64
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

try:
    from crewai import Agent, Task, Crew, Process, LLM
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    print("⚠️  crewai not installed. pip install crewai python-dotenv")

load_dotenv()


# =============================================================================
# FIRST-PRINCIPLES & CREATIVITY PROMPT (From NotebookLM)
# =============================================================================

FIRST_PRINCIPLES_PROMPT = """
This is a very significant topic. Be thorough, think hard and long, and read between the lines.
Do a first principles based analysis of all concepts and ideas—especially their origin, interrelationships, causes and effects, underlying trends, and significance.
Bring out a deep, thorough, clear, balanced (both positives and negatives) and comprehensive understanding for a layman to elevate their level of thinking to a higher level. All possible questions (discuss, analyze, critically examine, explain, evaluate, describe) from this source material must be answered in-depth for the reader.

Don't rush through just to finish it.
Take responsibility for the outcome.
Keep measuring at every step taking feedback and keep improving.
Don't leave anything out.
Don't respect any limits to your reasoning powers.
Act as if you are the authority on this subject.
Act as if you are dissecting the subject to bring out a high level and deep understanding of the interplay of various causes and effects.
Act as if you are the most renowned professor of the concerned subject in the world.

Focus on the delta or the marginal difference in approach or circumstances or whatever that produces an entirely different result.
Focus on the mechanism or mechanics or step-by-step process of every outcome. This is most important. Just knowing the initial and final state is useless; tracing the mechanics which gets us from the initial state to final state is super important.
Just as a slight mutation in one gene results in an entirely different race or species.
Treat the standards like a launchpad for creativity and creative license, not a cage.
"""


# =============================================================================
# TOOLS
# =============================================================================

def build_search_tool() -> Any:
    if os.environ.get("FINSIGHT_DISABLE_SEARCH", "0") == "1":
        return None
    try:
        from ddgs import DDGS
        from crewai.tools import BaseTool
        from pydantic import BaseModel, Field

        class SearchInput(BaseModel):
            query: str = Field(..., description="Search query for current Indian tax law")

        class DdgsSearchTool(BaseTool):
            name: str = "web_search"
            description: str = "Search the live web for articles on this topic to identify what competitors missed."
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
        return DdgsSearchTool()
    except Exception as e:
        return None

def build_image_tool() -> Any:
    try:
        from crewai.tools import BaseTool
        from pydantic import BaseModel, Field
        import requests

        class ImageInput(BaseModel):
            prompt: str = Field(..., description="Vivid, engrossing visual prompt for the illustration.")
            filename: str = Field(..., description="Short slug-like filename (e.g., freelance-tax-trap).")

        class GeminiImageTool(BaseTool):
            name: str = "generate_illustration"
            description: str = "Generate an illustration using Gemini API. Returns the MDX image tag."
            args_schema: type[BaseModel] = ImageInput

            def _run(self, prompt: str, filename: str) -> str:
                api_key = os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    return f"![Illustration: {prompt}](../../assets/images/placeholder.jpg)"
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={api_key}"
                    payload = {
                        "instances": [{"prompt": prompt}],
                        "parameters": {"sampleCount": 1}
                    }
                    res = requests.post(url, json=payload)
                    data = res.json()
                    if "predictions" in data:
                        b64 = data["predictions"][0]["bytesBase64Encoded"]
                        img_data = base64.b64decode(b64)
                        out_path = Path("src/assets/images") / f"{filename}.jpg"
                        out_path.parent.mkdir(parents=True, exist_ok=True)
                        out_path.write_bytes(img_data)
                        return f"![{filename}](../../assets/images/{filename}.jpg)"
                    else:
                        err = data.get('error', {}).get('message', 'unknown')
                        return f"![Image Gen Failed: {err}](../../assets/images/placeholder.jpg)"
                except Exception as e:
                    return f"![Image Error: {e}](../../assets/images/placeholder.jpg)"
        return GeminiImageTool()
    except Exception as e:
        return None


# =============================================================================
# CONFIG
# =============================================================================

OUTPUT_ROOT = Path(os.environ.get("FINSIGHT_CONTENT_OUT", "src/content/direct-tax"))
PACKAGE_ROOT = Path(os.environ.get("FINSIGHT_PACKAGE_OUT", "content_packages"))
MODEL_RIGID = os.environ.get("FINSIGHT_LLM_RIGID", "gemini/gemini-3.6-flash")
MODEL_CREATIVE = os.environ.get("FINSIGHT_LLM_CREATIVE", "gemini/gemini-3.6-flash")
MAX_STYLE_RETRIES = int(os.environ.get("FINSIGHT_MAX_STYLE_RETRIES", "2"))
FORCE_PUBLISH_ON_FAIL = os.environ.get("FINSIGHT_FORCE_PUBLISH_ON_FAIL", "0") == "1"


# =============================================================================
# DATA
# =============================================================================

@dataclass
class ArticleJob:
    topic: str
    filename: str
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
    if not CREWAI_AVAILABLE: return None
    return LLM(model=model, api_key=os.environ.get("GEMINI_API_KEY"), temperature=temperature)

def extract_json_block(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        try: return json.loads(m.group(1))
        except: pass
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try: return json.loads(m.group(0))
        except: pass
    return {}

def task_raw(task: Any) -> str:
    out = getattr(task, "output", None)
    if out is None: return ""
    return getattr(out, "raw", None) or str(out)

def run_crew(agents: list[Any], tasks: list[Any], label: str) -> str:
    print(f"\n── Crew segment: {label} ({len(tasks)} task(s)) ──")
    crew = Crew(agents=agents, tasks=tasks, process=Process.sequential, verbose=True)
    result = crew.kickoff()
    return getattr(result, "raw", None) or str(result)

def ensure_frontmatter(mdx: str, job: ArticleJob, seo: dict[str, Any]) -> str:
    title = seo.get("title") or job.topic
    summary = seo.get("description") or job.primary_fear or job.topic
    fm = {
        "title": title,
        "category": job.category,
        "categoryName": job.category_name,
        "readTime": seo.get("readTime", "15 min read"),
        "updatedDate": "FY 2025-26",
        "statutoryAct": job.statutory_hint or seo.get("statutoryAct", "Income Tax Act"),
        "summary": summary,
        "writingStyle": seo.get("vibe", "First Principles Analysis"),
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
    return "\n".join(lines) + "\n\n" + body


# =============================================================================
# AGENTS
# =============================================================================

def build_agents(search_tool: Any, image_tool: Any) -> dict[str, Any]:
    llm_rigid = make_llm(MODEL_RIGID, 0.1)
    llm_creative = make_llm(MODEL_CREATIVE, 0.65)
    llm_critic = make_llm(MODEL_CREATIVE, 0.3)

    return {
        "quant": Agent(
            role="Research & Competitive Gap Analyst",
            goal="1. Search the web for existing articles on this topic. 2. Extract current tax mechanics. 3. Identify the 'delta'—what generic articles missed, edge cases, underlying mechanics. Pass these gaps to the Novelist so our article is vastly superior.",
            backstory="You are a ruthless researcher building the foundation for demystifying India's top 100 direct tax topics. Your job is to find the gap in the current internet knowledge.",
            llm=llm_rigid,
            tools=[search_tool] if search_tool else [],
            allow_delegation=False,
            verbose=True,
        ),
        "seo": Agent(
            role="SEO & Vibe Strategist",
            goal="JSON: high-anxiety title, description, slug, faqs, intent, and define the 'vibe' (e.g., The Coffee Shop Chat, The Narrative Arc, The Brutal Truth) based solely on the topic.",
            backstory="You ensure the article catches attention and sets the creative direction without being boxed into rigid styles.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "novelist": Agent(
            role="First Principles Narrative Architect",
            goal="Write the full article using First Principles. Embody the vibe set by SEO. Comprehensively cover all competitive gaps identified by the Researcher. Focus on mechanics and causality.",
            backstory=FIRST_PRINCIPLES_PROMPT,
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
        "style_critic": Agent(
            role="First Principles & Creativity Critic",
            goal="PASS or FAIL with rewrites. Did they trace the mechanics? Is it deep and analytical? Did they cover the competitive gaps? Reject superficial tax-blog prose.",
            backstory=FIRST_PRINCIPLES_PROMPT,
            llm=llm_critic,
            allow_delegation=False,
            verbose=True,
        ),
        "visual": Agent(
            role="Art Director",
            goal="Use the generate_illustration tool to create 1-2 vivid, engrossing images that make the article come alive. Insert the exact Markdown tags returned by the tool into the article body.",
            backstory="You are a master illustrator. Use the tool to summon real images. Do not write text placeholders.",
            llm=llm_creative,
            tools=[image_tool] if image_tool else [],
            allow_delegation=False,
            verbose=True,
        ),
        "ui": Agent(
            role="Astro MDX Architect",
            goal="Fix MDX formatting: 1. NEVER use raw LaTeX ($$ or \\frac). Wrap math in standard markdown code blocks. 2. Ensure EXACTLY one blank line immediately after any 'import' statement. 3. Wrap traps in <NoticeTrap>.",
            backstory="You protect the Astro compiler from crashing while keeping the content gorgeous.",
            llm=llm_rigid,
            allow_delegation=False,
            verbose=True,
        ),
        "youtube": Agent(
            role="YouTube Reel Producer",
            goal="60–100s spoken script (hook in first 3s) + thumbnail thesis (5–8 word overlay).",
            backstory="Short-form tax content that stops the scroll.",
            llm=llm_creative,
            allow_delegation=False,
            verbose=True,
        ),
    }

# =============================================================================
# TASKS
# =============================================================================

def task_quant(job: ArticleJob, agent: Any) -> Any:
    return Task(
        description=f"Topic: {job.topic}\nSearch the web. What are competitors missing? Identify the gaps, edge cases, and current rules.",
        expected_output="Bulleted list of rules AND specific competitive gaps to fill.",
        agent=agent,
    )

def task_seo(job: ArticleJob, agent: Any, quant_task: Any) -> Any:
    return Task(
        description=f"Topic: {job.topic}\nFear: {job.primary_fear}\nReturn JSON: title, title_alts, description, slug, intent, faqs, readTime, vibe.",
        expected_output="Single JSON object.",
        agent=agent,
        context=[quant_task],
    )

def task_novelist_draft(job: ArticleJob, agent: Any, quant_task: Any, seo_task: Any) -> Any:
    return Task(
        description=f"Write the FULL article: {job.topic}\nProtagonist: {job.protagonist}\nFear: {job.primary_fear}\nAlpha: {job.alpha}\nGround truth = quant facts and competitive gaps. Markdown body only.",
        expected_output="Full markdown article body.",
        agent=agent,
        context=[quant_task, seo_task],
    )

def task_style_critique(agent: Any, draft_text: str) -> Any:
    draft_for_prompt = draft_text if len(draft_text) < 120_000 else draft_text[:120_000] + "\n…[truncated]"
    return Task(
        description=f"Critique this article against First Principles.\nDRAFT:\n```markdown\n{draft_for_prompt}\n```\nReturn JSON: verdict (PASS/FAIL), score (0-10), drift_sentences, rewrites, notes. FAIL if it is generic, superficial, or lacks deep mechanics.",
        expected_output="JSON critique with PASS or FAIL.",
        agent=agent,
    )

def task_novelist_revise(job: ArticleJob, agent: Any, previous_draft: str, critique: dict[str, Any], quant_summary: str) -> Any:
    rewrites = json.dumps(critique.get("rewrites", []), ensure_ascii=False)[:8000]
    notes = critique.get("notes", "")
    return Task(
        description=f"REVISE the article.\nTopic: {job.topic}\nQUANT & GAPS:\n{quant_summary[:6000]}\nCRITIQUE:\n{notes}\nREWRITES:\n{rewrites}\nPREVIOUS DRAFT:\n{previous_draft[:100000]}\nFix drifts. Deepen the mechanics. Output full revised markdown.",
        expected_output="Full revised markdown article body.",
        agent=agent,
    )

def task_visual(agent: Any, article: str) -> Any:
    return Task(
        description=f"Use the generate_illustration tool to create 1 or 2 vivid, engrossing images for this article. Inject the exact returned MDX tags directly into the text. ARTICLE:\n{article[:100000]}",
        expected_output="Article markdown with injected image tags.",
        agent=agent,
    )

def task_ui(agent: Any, article: str) -> Any:
    return Task(
        description=f"Format for Astro MDX.\n1. Convert all LaTeX math ($$ etc) to standard inline markdown code.\n2. Ensure a blank line after imports.\nARTICLE:\n{article[:100000]}",
        expected_output="Production MDX body.",
        agent=agent,
    )

def task_youtube(job: ArticleJob, agent: Any, article: str, seo: dict[str, Any]) -> Any:
    return Task(
        description=f"Topic: {job.topic}\nWrite ## reel_60s and ## thumbnail_thesis based on:\n{article[:80000]}",
        expected_output="Markdown with ## reel_60s and ## thumbnail_thesis.",
        agent=agent,
    )

# =============================================================================
# CORE ENGINE
# =============================================================================

def write_package(job: ArticleJob, result: FactoryResult, write_to_collection: bool) -> Path:
    slug = job.filename
    pkg_dir = PACKAGE_ROOT / slug
    pkg_dir.mkdir(parents=True, exist_ok=True)
    mdx = ensure_frontmatter(result.article_mdx, job, result.seo)
    (pkg_dir / "article.mdx").write_text(mdx, encoding="utf-8")
    if write_to_collection:
        OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
        (OUTPUT_ROOT / f"{slug}.mdx").write_text(mdx, encoding="utf-8")
    
    seo_data = {
        "slug": slug, "title": result.seo.get("title", job.topic),
        "vibe": result.seo.get("vibe", "First Principles"),
        "style_pass": result.style_pass, "revision_rounds": result.revision_rounds,
    }
    (pkg_dir / "seo.json").write_text(json.dumps(seo_data, indent=2, ensure_ascii=False), encoding="utf-8")
    (pkg_dir / "reel_60s.md").write_text(result.reel or "# reel missing\n", encoding="utf-8")
    (pkg_dir / "thumbnail_thesis.txt").write_text(result.thumbnail or "missing\n", encoding="utf-8")
    (pkg_dir / "constants.json").write_text("{}", encoding="utf-8")
    (pkg_dir / "factory_notes.txt").write_text("\n".join(result.notes) or "ok", encoding="utf-8")
    return pkg_dir

def run_factory(job: ArticleJob, interactive_alpha: bool = True) -> FactoryResult:
    print(f"\n================================================================")
    print(f"🏭 FinSight Factory v4 (First-Principles Engine)")
    print(f"   {job.topic} | slug: {job.filename}")
    print(f"================================================================")

    if interactive_alpha:
        injected = input("💡 INJECT ALPHA (or Enter): ").strip()
        if injected: job.alpha = injected
        if not job.protagonist: job.protagonist = input("👤 Protagonist: ").strip() or "the taxpayer"
        if not job.primary_fear: job.primary_fear = input("😨 Primary fear: ").strip() or "unexpected tax demand"

    search_tool = build_search_tool()
    image_tool = build_image_tool()
    agents = build_agents(search_tool, image_tool)
    notes: list[str] = []

    t_quant = task_quant(job, agents["quant"])
    t_seo = task_seo(job, agents["seo"], t_quant)
    t_draft = task_novelist_draft(job, agents["novelist"], t_quant, t_seo)
    run_crew([agents["quant"], agents["seo"], agents["novelist"]], [t_quant, t_seo, t_draft], "A · RESEARCH & DRAFT")

    quant_text = task_raw(t_quant)
    seo = extract_json_block(task_raw(t_seo))
    draft = task_raw(t_draft)
    
    style_pass, revision_rounds = False, 0
    for attempt in range(MAX_STYLE_RETRIES + 1):
        t_crit = task_style_critique(agents["style_critic"], draft)
        run_crew([agents["style_critic"]], [t_crit], f"B · EVALUATE (round {attempt})")
        critique = extract_json_block(task_raw(t_crit))
        verdict = str(critique.get("verdict", "")).upper()
        
        if verdict == "PASS":
            style_pass = True
            break
        
        if attempt >= MAX_STYLE_RETRIES: break
        
        revision_rounds += 1
        t_rev = task_novelist_revise(job, agents["novelist"], draft, critique, quant_text)
        run_crew([agents["novelist"]], [t_rev], f"B · ITERATE revise #{revision_rounds}")
        revised = task_raw(t_rev)
        if revised.strip(): draft = revised

    t_vis = task_visual(agents["visual"], draft)
    run_crew([agents["visual"]], [t_vis], "C · ART DIRECTION")
    with_visual = task_raw(t_vis) or draft

    t_ui = task_ui(agents["ui"], with_visual)
    run_crew([agents["ui"]], [t_ui], "C · MDX COMPILER")
    mdx_body = task_raw(t_ui) or with_visual

    t_yt = task_youtube(job, agents["youtube"], mdx_body, seo)
    run_crew([agents["youtube"]], [t_yt], "C · YOUTUBE")
    yt_raw = task_raw(t_yt)
    reel = yt_raw.split("## thumbnail_thesis")[0].replace("## reel_60s", "").strip() if "## thumbnail_thesis" in yt_raw else yt_raw
    thumbnail = yt_raw.split("## thumbnail_thesis")[1].strip() if "## thumbnail_thesis" in yt_raw else ""

    result = FactoryResult(slug=job.filename, article_mdx=mdx_body, seo=seo, reel=reel, thumbnail=thumbnail, style_pass=style_pass, revision_rounds=revision_rounds, notes=notes)
    pkg = write_package(job, result, write_to_collection=(style_pass or FORCE_PUBLISH_ON_FAIL))
    print(f"\n📦 Package: {pkg}\n   Published: {style_pass or FORCE_PUBLISH_ON_FAIL}\n")
    return result

if __name__ == "__main__":
    print("\n--- Finsight Interactive Content Factory ---")
    while True:
        topic = input("📝 Enter Topic (or 'q' to quit): ").strip()
        if topic.lower() == 'q':
            break
        if not topic:
            continue
            
        filename = input("📁 Enter Filename Slug (e.g., freelance-tax-trap): ").strip()
        category = input("📂 Enter Category [default: tds]: ").strip() or "tds"
        category_name = input("🏷️  Enter Category Name [default: Compliance]: ").strip() or "Compliance"
        
        job = ArticleJob(
            topic=topic,
            filename=filename,
            category=category,
            category_name=category_name,
        )
        
        run_factory(job, interactive_alpha=True)
        
        cont = input("\n🔁 Generate another article? (y/n): ").strip().lower()
        if cont != 'y':
            break
