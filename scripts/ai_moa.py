import json, os, pathlib, openai, re
from dotenv import load_dotenv; load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

CACHE = pathlib.Path("data/moa_ai_cache.json")
cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}

def ai_moa(name: str) -> str:
    if name.lower() in cache:
        return cache[name.lower()]

    prompt = (
        f"Give the primary mechanism of action of {name} in ≤15 words. "
        "If unknown, answer 'Unclassified'."
    )
    try:
        rsp = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=30,
        )
        cls = rsp.choices[0].message.content.strip()
    except Exception:
        cls = "Unclassified"

    cache[name.lower()] = cls
    CACHE.write_text(json.dumps(cache, indent=2))
    return cls
