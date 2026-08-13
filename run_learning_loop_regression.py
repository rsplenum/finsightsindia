import json
import sys
from pathlib import Path
from google import genai
from google.genai import types
import os

# Import the regression harness from the new skill
sys.path.append(".agents/skills/finsight-learning-loop")
from learning_loop import run_regression_set

# Read the latest evaluator prompt directly from SKILL.md to ensure it tests the current rules
def extract_evaluator_prompt():
    skill_content = Path(".agents/skills/finsight-drafting-workflow/SKILL.md").read_text()
    # Basic parsing to grab the prompt text for content_evaluator
    start = skill_content.find("### 3. `content_evaluator`")
    sys_prompt_start = skill_content.find("- **System Prompt:**", start)
    sys_prompt_end = skill_content.find("### 4.", sys_prompt_start)
    prompt = skill_content[sys_prompt_start:sys_prompt_end].strip()
    return prompt.replace("- **System Prompt:**", "").strip(' \n"')

def evaluate_fn(input_text: str) -> str:
    client = genai.Client()
    system_instruction = extract_evaluator_prompt()
    
    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=[f"Audit the following input:\n{input_text}"],
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.0
        )
    )
    
    # Parse output to return strictly "PASS" or "FAIL"
    text = response.text.upper()
    if "FAIL" in text:
        return "FAIL"
    elif "PASS" in text:
        return "PASS"
    return "UNKNOWN"

if __name__ == "__main__":
    report = run_regression_set(evaluate_fn)
    print(json.dumps(report, indent=2))
