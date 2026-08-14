import os
import glob
import json
import datetime
from pathlib import Path

# Paths
CONTENT_DIR = Path("src/content/direct-tax")
MEMORY_DIR = Path("content_factory_memory")
CONTENT_GRAPH = MEMORY_DIR / "content_graph.json"

def main():
    if not CONTENT_GRAPH.exists():
        print("content_graph.json not found.")
        return

    with open(CONTENT_GRAPH, "r", encoding="utf-8") as f:
        graph = json.loads(f.read())
    
    pillars = graph.get("pillars", {})

    mdx_files = glob.glob(str(CONTENT_DIR / "*.mdx"))
    
    added_count = 0
    for file_path in mdx_files:
        filename = os.path.basename(file_path)
        slug = filename.replace(".mdx", "")
        
        # We can extract the title from frontmatter, but for backfill slug is close enough
        # or we just read the first few lines
        title = slug.replace("-", " ").title()
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("title:"):
                    title = line.replace("title:", "").strip().strip('"').strip("'")
                    break
        
        # Check if already in graph (either as pillar or spoke)
        already_exists = False
        for p_id, p_data in pillars.items():
            if p_data["slug"] == slug:
                already_exists = True
                break
            for spoke in p_data.get("spokes", []):
                if spoke["slug"] == slug:
                    already_exists = True
                    break
        
        if not already_exists:
            # Register as a standalone pillar
            topic_id = slug.replace("-", "_")
            pillars[topic_id] = {
                "slug": slug,
                "title": title,
                "registered": datetime.datetime.utcnow().isoformat() + "Z",
                "spokes": []
            }
            added_count += 1
            print(f"Registered pillar: {topic_id}")
            
    graph["pillars"] = pillars
    
    with open(CONTENT_GRAPH, "w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
        
    print(f"\nBackfill complete. Added {added_count} articles to content_graph.json.")

if __name__ == "__main__":
    main()
