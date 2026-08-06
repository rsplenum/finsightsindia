import os
import re

file_path = "src/content/direct-tax/the-section-270a-200-penalty-trap.mdx"

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add TL;DR to 270A
tldr = """
<CardPremium>
### TL;DR
- **The Core Distinction:** Section 270A categorizes tax additions into 50% penalty (Under-reporting) and 200% penalty (Misreporting).
- **The Safe Harbor Shield:** A bona fide explanation with full disclosure of facts (Section 270A(6)) entirely shields you from penalties, reducing it to 0%.
- **The Notice Defect:** If the AO's Show Cause Notice fails to specify whether the penalty is for under-reporting or misreporting, the notice is void ab initio.
</CardPremium>
"""
parts = content.split('---', 2)
if len(parts) == 3:
    frontmatter = parts[1]
    body = parts[2]
    
    import_end = body.rfind('import CardPremium')
    if import_end != -1:
        next_newline = body.find('\n', import_end)
        body = body[:next_newline+1] + '\n' + tldr + '\n' + body[next_newline+1:]
    
    content = '---' + frontmatter + '---' + body

# 2. Fix ASCII Tables
# Find the paradigm shift matrix
ascii_table_1 = """+----------------------------------------------------------------------------------------------------+
|                                PARADIGM SHIFT COMPARISON MATRIX                                    |
+------------------------+------------------------------------+--------------------------------------+
| Feature                | Legacy Section 271(1)(c)           | Current Section 270A                 |
+------------------------+------------------------------------+--------------------------------------+
| Core Benchmark         | Concealment of income OR           | Under-reporting OR                   |
|                        | Furnishing inaccurate particulars  | Misreporting of income               |
+------------------------+------------------------------------+--------------------------------------+
| Nature of Power        | Subjective AO satisfaction         | Objective, formulaic mathematical    |
|                        | ("If the AO is satisfied...")      | trigger based on variance            |
+------------------------+------------------------------------+--------------------------------------+
| Role of Mens Rea       | Pervasive litigation over intent;  | Completely eliminated; replaced by   |
|                        | Reliance Petrochem protection      | strict statutory safe harbors u/s    |
|                        | against bona fide claims           | 270A(6)                              |
+------------------------+------------------------------------+--------------------------------------+
| Penalty Quantum        | 100% to 300% of tax sought to      | Strict bifurcated fixed rate:        |
|                        | be evaded (AO Discretion)          | 50% (Under-reporting) / 200% (Mis-   |
|                        |                                    | reporting)                           |
+------------------------+------------------------------------+--------------------------------------+
| Statutory Immunity     | Discretionary via Sec 273AA /      | Mandatory statutory entitlement      |
|                        | Settlement Commission (Sec 245D)   | u/s 270AA (Only for Under-reporting) |
+------------------------+------------------------------------+--------------------------------------+"""

md_table_1 = """| Feature | Legacy Section 271(1)(c) | Current Section 270A |
| :--- | :--- | :--- |
| **Core Benchmark** | Concealment of income OR Furnishing inaccurate particulars | Under-reporting OR Misreporting of income |
| **Nature of Power** | Subjective AO satisfaction ("If the AO is satisfied...") | Objective, formulaic mathematical trigger based on variance |
| **Role of Mens Rea** | Pervasive litigation over intent; Reliance Petrochem protection against bona fide claims | Completely eliminated; replaced by strict statutory safe harbors u/s 270A(6) |
| **Penalty Quantum** | 100% to 300% of tax sought to be evaded (AO Discretion) | Strict bifurcated fixed rate: 50% (Under-reporting) / 200% (Misreporting) |
| **Statutory Immunity** | Discretionary via Sec 273AA / Settlement Commission (Sec 245D) | Mandatory statutory entitlement u/s 270AA (Only for Under-reporting) |"""
content = content.replace(ascii_table_1, md_table_1)


ascii_table_2 = """+--------------------------------------------------------------------------------------------------+
|                                SECTION 270A(6) SAFE HARBOR MATRIX                                |
+------------------+------------------------------------------+------------------------------------+
| Statutory Sub-cl | Safe Harbor Description                  | Legal Trigger Requirement          |
+------------------+------------------------------------------+------------------------------------+
| 270A(6)(a)       | Bona Fide Explanation & Material Facts   | Taxpayer offers a bona fide legal  |
|                  | Disclosed                                | view and reveals all primary facts.|
+------------------+------------------------------------------+------------------------------------+
| 270A(6)(b)       | Estimated Additions (Incomplete Books)   | Books rejected, but accounting     |
|                  |                                          | method applied consistently.       |
+------------------+------------------------------------------+------------------------------------+
| 270A(6)(c)       | Estimated Additions on Own Variance      | Taxpayer estimated a lower         |
|                  |                                          | addition/disallowance in return.   |
+------------------+------------------------------------------+------------------------------------+
| 270A(6)(d)       | Transfer Pricing Compliance              | Maintained Sec 92D docs AND        |
|                  |                                          | disclosed in Form 3CEB.            |
+------------------+------------------------------------------+------------------------------------+
| 270A(6)(e)       | Discrepancy in TDS/TCS Data              | Income omitted due to matching     |
|                  |                                          | TDS/TCS with no prior control.     |
+------------------+------------------------------------------+------------------------------------+"""

md_table_2 = """| Statutory Sub-cl | Safe Harbor Description | Legal Trigger Requirement |
| :--- | :--- | :--- |
| **270A(6)(a)** | Bona Fide Explanation & Material Facts Disclosed | Taxpayer offers a bona fide legal view and reveals all primary facts. |
| **270A(6)(b)** | Estimated Additions (Incomplete Books) | Books rejected, but accounting method applied consistently. |
| **270A(6)(c)** | Estimated Additions on Own Variance | Taxpayer estimated a lower addition/disallowance in return. |
| **270A(6)(d)** | Transfer Pricing Compliance | Maintained Sec 92D docs AND disclosed in Form 3CEB. |
| **270A(6)(e)** | Discrepancy in TDS/TCS Data | Income omitted due to matching TDS/TCS with no prior control. |"""
content = content.replace(ascii_table_2, md_table_2)

# Remove all other ``` wrappers around ASCII diagrams and just leave them as code blocks if they are flowcharts.
# Wait, the user said "remove the ascii from the articles".
# The flowcharts are ASCII. Let's replace the flowcharts with Markdown bullet points or just remove them.
# Removing the ASCII flowcharts entirely to clean it up.

def strip_ascii_block(text, start_pattern, end_pattern):
    return re.sub(f"```\n.*?{start_pattern}.*?{end_pattern}.*?```\n", "", text, flags=re.DOTALL)

# Delete all code blocks that have large ASCII boxes
content = re.sub(r'```\n\s*\[ TAXABLE INCOME DISCREPANCY DETECTED \].*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*THE ALGORITHMIC DETECTION PIPELINE.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*SECTION 270A STATUTORY BIFURCATION.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+---------------------------------------\+\n\s*\|\s*AO Proposes Addition / Disallowance.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*SECTION 270A COMPUTATIONAL WORKFLOW.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\[ Claimed Loss: -₹20,00,000 \].*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*SECTION 270AA IMMUNITY ELIGIBILITY MATRIX.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*THE 270AA PROCEDURAL TRAP.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*SCN JURISDICTIONAL DEFECT CHECKLIST.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+----------------------------------------------\+\n\s*\|\s*SHOW CAUSE NOTICE ISSUED u/s 274 r.w\. 270A.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\[ DEFECTIVE SCN RECEIVED \].*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*CASE STUDY BACKGROUND.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\+-----------------------------------------------------------------------------------\+\n\s*\|\s*ASSESSMENT EVIDENTIARY AUDIT.*?```\n', '', content, flags=re.DOTALL)
content = re.sub(r'```\n\s*\[ ₹18,00,000 ADDITION MADE \].*?```\n', '', content, flags=re.DOTALL)

# 3. Fix NoticeTraps in 270A
# The AI Factory generated <NoticeTrap>\n### Formula 4: The Loss Return Trap\n...
# Let's replace <NoticeTrap>\n### Formula 4: The Loss Return Trap with <NoticeTrap title="The Loss Return Trap">
content = re.sub(r'<NoticeTrap>\s*### Formula 4: The Loss Return Trap', r'<NoticeTrap title="The Loss Return Trap">', content)
content = re.sub(r'<NoticeTrap>\s*### The Section 270AA Procedural Trap', r'<NoticeTrap title="The Section 270AA Procedural Trap">', content)
content = re.sub(r'<NoticeTrap>\s*### Statutory Jurisdictional Requirements', r'<NoticeTrap title="Statutory Jurisdictional Requirements">', content)
# It seems there is an empty <NoticeTrap> block wrapping the SCN defect checklist, but we just deleted the checklist above.
content = re.sub(r'<NoticeTrap>\s*</NoticeTrap>', '', content)

with open(file_path, 'w') as f:
    f.write(content)

print(f"Fixed {file_path}")
