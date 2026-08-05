import os
import time
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM

# 1. INITIALIZE ENVIRONMENT & TOOLS
load_dotenv()

# 2. THE POLYMORPHIC STYLES CATALOG
POLYMORPHIC_STYLES = {
    "1": {"name": "The Brutal Truth", "rules": "Direct, authoritative, highly mathematical, and devoid of fluff. Fast, punchy sentences."},
    "2": {"name": "The Forensic Auditor", "rules": "Procedural, investigative. Follows a complex trail of money or paperwork step-by-step. Cold, stark, and precise."},
    "3": {"name": "The Myth-Buster", "rules": "Systematic and logical. Direct, myth-busting, and slightly sarcastic. Functions as a harsh wake-up call."},
    "4": {"name": "The Coffee Shop Chat", "rules": "Conversational, uses 'we' and 'you.' Addresses the psychological paranoia directly before fixing the math. Highly relatable."},
    "5": {"name": "The Scenario Wargamer", "rules": "Analytical, branching. Focused on optimizing outcomes based on different variables. Matrix-heavy. 'If X, then Y.'"},
    "6": {"name": "The Narrative Arc", "rules": "Persona-driven. Story-driven, with a clear beginning, middle, and end."},
    "7": {"name": "The Diplomat", "rules": "Reassuring, bridging gaps, and highly structured. Uses metaphors of 'safe harbors' and 'smooth transitions.'"},
    "8": {"name": "The Chess Grandmaster", "rules": "Forward-looking, calculating, and ruthless. Focuses on mathematical 'counter-moves' to government policies."},
    "9": {"name": "The Alchemist", "rules": "Transformative, energetic, and slightly euphoric. Focuses on the magic of turning a heavy liability into a tangible, tax-free asset."},
    "10": {"name": "The Trench Survivor", "rules": "Gritty, highly realistic, and brutally honest about the mathematical disadvantage. Validates the reader's frustration."}
}

# 3. CONFIGURE THE ENGINES
# Rigid Engine for facts and code
llm_rigid = LLM(
    model="gemini/gemini-flash-latest",
    api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0.1 
)

# Creative Engine for narrative and hooks
llm_creative = LLM(
    model="gemini/gemini-flash-latest",
    api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0.6 
)

# 4. THE 5-AGENT WORKFORCE
quant_agent = Agent(
    role="Principal Tax Quant",
    goal="Search the live internet for current Indian tax laws and extract the exact legal mechanics, Section codes, and limits.",
    backstory="You are a ruthless financial quant enforcing the 'Structure' pillar. Use the search tool to verify live laws. Output raw, bulleted legal constraints. No fluff.",
    llm=llm_rigid,
    allow_delegation=False,
    verbose=True
)

seo_agent = Agent(
    role="SEO Forensic Strategist",
    goal="Draft high-anxiety H1s based on the legal threat.",
    backstory="You design headlines that map directly to the panic of receiving a tax notice. Avoid boring definitions.",
    llm=llm_creative,
    allow_delegation=False
)

novelist_agent = Agent(
    role="Narrative Architect",
    goal="Write the core 4-Pillar article (Scenario, Principles, Traps, Way Out) while flawlessly executing the assigned writing persona.",
    backstory="You are a master chameleon of financial prose. You adapt your tone entirely based on the specific style rules assigned to you for this task.",
    llm=llm_creative,
    allow_delegation=False
)

visual_agent = Agent(
    role="Art Director",
    goal="Map visual concepts to the narrative text.",
    backstory="You read the draft and insert exactly two Varsity-style image markers [Illustration: Description] where the emotional weight is heaviest.",
    llm=llm_creative,
    allow_delegation=False
)

ui_agent = Agent(
    role="Astro UI Architect",
    goal="Wrap the final markdown text in custom MDX React components.",
    backstory="You take the final draft and inject <NoticeTrap> and <CardPremium> components around the CPC tripwires and checklists. Output raw, production-ready MDX.",
    llm=llm_rigid,
    allow_delegation=False
)

def run_factory(topic: str, file_name: str, style_key: str):
    print(f"\n==================================================")
    print(f"🏭 FACTORY BOOT SEQUENCE: {topic}")
    print(f"==================================================\n")
    
    # Configure the chosen style
    chosen_style = POLYMORPHIC_STYLES.get(style_key, POLYMORPHIC_STYLES["2"])
    style_name = chosen_style["name"]
    style_rules = chosen_style["rules"]
    
    # Feedback Loop: Alpha Injection
    print(f"Selected Persona: {style_name}\n")
    user_alpha = input("💡 INJECT ALPHA (Type your proprietary edge/thesis, or press Enter to skip): ")

    # Task 1: RAG Search + HITL Checkpoint
    task_1_quant = Task(
        description=f"Use your internal knowledge to extract the exact Indian tax math, limits, and penalties for: {topic}.",
        expected_output="A strict bulleted list of current tax rules.",
        agent=quant_agent,
        human_input=True # The script will PAUSE here to ask for your approval!
    )
    
    task_2_seo = Task(
        description="Review the approved legal mechanics and write 3 high-anxiety H1 headline options.",
        expected_output="3 visceral headlines.",
        agent=seo_agent
    )
    
    task_3_novelist = Task(
        description=f"""Write the 4-Pillar article using the approved math. 
        Build the narrative around this specific Alpha thesis: '{user_alpha}'.
        
        CRITICAL STYLE ENFORCEMENT:
        You must adopt the '{style_name}' persona. 
        Execution Rules: {style_rules}""",
        expected_output="A structured markdown article reflecting the assigned emotional tone.",
        agent=novelist_agent
    )
    
    task_4_visual = Task(
        description="Read the drafted article. Insert two [Illustration: ...] markers.",
        expected_output="The updated article with visual markers included.",
        agent=visual_agent
    )
    
    task_5_ui = Task(
        description="Format the final article. Wrap the 'Scrutiny Traps' in <NoticeTrap> and the final checklist in <CardPremium>.",
        expected_output="The final, pristine .mdx file text.",
        agent=ui_agent
    )

    # Assemble and run the factory line
    factory_crew = Crew(
        agents=[quant_agent, seo_agent, novelist_agent, visual_agent, ui_agent],
        tasks=[task_1_quant, task_2_seo, task_3_novelist, task_4_visual, task_5_ui],
        process=Process.sequential,
        verbose=True
    )
    
    final_result = factory_crew.kickoff()

    # Save to disk
    output_dir = "src/content/articles"
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, f"{file_name}.mdx")
    
    with open(file_path, "w") as f:
        f.write(final_result.raw)
    
    print(f"\n✅ SUCCESS: Manufactured and saved to {file_path}")

# ==========================================
# BATCH PROCESSOR
# ==========================================
if __name__ == "__main__":
    
    # We load Article 21, and select Style '2' (The Forensic Auditor)
    articles = [
        {"topic": "The Influencer Barter Trap: Section 194R and 10% TDS", "filename": "influencer-barter-trap-194r", "style": "2"}
    ]
    
    for i, article in enumerate(articles):
        run_factory(article['topic'], article['filename'], article['style'])
        
        if i < len(articles) - 1:
            print("\n⏳ Cooldown initiated. Sleeping for 60 seconds...\n")
            time.sleep(60)
            
    print("\n🎉 Factory run complete. Check your content folder!")
