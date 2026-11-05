"""Download 100 CC BY-SA 4.0 recipes and convert them for Cookly.

Run from ProjectSourceCode:
    py recipe_dataset\fetch_100_recipes.py

The original UniTools dataset is © its contributors, CC BY-SA 4.0.
Source: https://theunitools.com/en/data
License: https://creativecommons.org/licenses/by-sa/4.0/
"""

import json
from collections import Counter, defaultdict, deque
from pathlib import Path
from urllib.request import Request, urlopen

SOURCE_URL = "https://theunitools.com/data/unitools-recipes-v1.json"
SOURCE_PAGE = "https://theunitools.com/en/data"
LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/"
TARGET_COUNT = 100
OUTPUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = OUTPUT_DIR / "recipes.json"
ATTRIBUTION_FILE = OUTPUT_DIR / "RECIPE_DATA_ATTRIBUTION.md"


def get_en(value):
    if isinstance(value, dict):
        return str(value.get("en") or "").strip()
    return str(value or "").strip()


def is_usable(recipe):
    return (
        isinstance(recipe, dict)
        and get_en(recipe.get("name"))
        and get_en(recipe.get("summary"))
        and recipe.get("ingredients")
        and recipe.get("steps")
        and all(get_en(step.get("text")) for step in recipe["steps"])
    )


def convert_recipe(raw):
    ingredient_rows = []
    seen = set()
    for item in raw["ingredients"]:
        name = get_en(item.get("name")).lower()
        if not name:
            continue
        # A repeated name should be a single requirement for the recipe.
        # Retain entries separately only if the name differs.
        if name in seen:
            continue
        seen.add(name)
        amount = item.get("quantity")
        unit = str(item.get("unit") or "piece").strip()
        # The source sometimes says "to taste" without a numeric quantity.
        # Cookly's current importer requires numbers; represent this as
        # 1 'to taste' measure (a placeholder, not an exact physical amount).
        if amount is None:
            amount, unit = 1, "to taste"
        else:
            amount = float(amount)
            if amount <= 0:
                amount, unit = 1, "to taste"
        ingredient_rows.append({
            "name": name[:100],
            "quantity": round(amount, 2),
            "unit": ("each" if unit == "piece" else unit)[:50],
        })

    instructions = "\n".join(
        f"{i}. {get_en(step['text'])}"
        for i, step in enumerate(raw["steps"], start=1)
    )
    return {
        "name": get_en(raw["name"])[:150],
        "description": get_en(raw["summary"]),
        "instructions": instructions,
        "prep_time": max(0, int(raw.get("prepMinutes") or 0)),
        "cook_time": max(0, int(raw.get("cookMinutes") or 0)),
        "servings": max(1, int(raw.get("baseServings") or 1)),
        "ingredients": ingredient_rows,
    }


def pick_diverse_recipes(source_recipes):
    """Round-robin countries to avoid picking 100 from one cuisine."""
    by_country = defaultdict(deque)
    for rec in source_recipes:
        if is_usable(rec):
            by_country[rec.get("country") or "other"].append(rec)
    countries = list(by_country)
    chosen = []
    seen_names = set()
    while countries and len(chosen) < TARGET_COUNT:
        remaining = []
        for country in countries:
            queue = by_country[country]
            while queue:
                item = queue.popleft()
                name = get_en(item["name"]).casefold()
                if name in seen_names:
                    continue
                candidate = convert_recipe(item)
                if not candidate["ingredients"]:
                    continue
                seen_names.add(name)
                chosen.append(candidate)
                break
            if queue:
                remaining.append(country)
            if len(chosen) >= TARGET_COUNT:
                break
        countries = remaining
    return chosen


def main():
    if OUTPUT_FILE.exists():
        answer = input("recipes.json already exists. Replace it? [y/N]: ").strip().lower()
        if answer != "y":
            print("Cancelled; your existing recipes.json is unchanged.")
            return

    request = Request(SOURCE_URL, headers={"User-Agent": "CooklyStudentProject/1.0"})
    try:
        with urlopen(request, timeout=45) as response:
            source = json.load(response)
    except Exception as exc:
        print(f"Could not download source recipe data: {exc}")
        print(f"Open this URL in your browser to check access: {SOURCE_URL}")
        return

    if not isinstance(source, dict) or not isinstance(source.get("recipes"), list):
        raise ValueError("Unexpected source JSON structure; no recipes array found")
    recipes = pick_diverse_recipes(source["recipes"])
    if len(recipes) != TARGET_COUNT:
        raise ValueError(f"Only found {len(recipes)} usable recipes; expected {TARGET_COUNT}")

    # Validate importer-compatible types before touching the output.
    names = set()
    for recipe in recipes:
        assert recipe["name"] not in names
        names.add(recipe["name"])
        assert recipe["ingredients"]
        assert recipe["instructions"] and recipe["servings"] > 0
        for ingredient in recipe["ingredients"]:
            assert len(ingredient["name"]) <= 100
            assert isinstance(ingredient["quantity"], (int, float))
            assert ingredient["quantity"] > 0

    OUTPUT_FILE.write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ATTRIBUTION_FILE.write_text(
        "# Recipe dataset attribution\n\n"
        "These 100 recipes are adapted from **UniTools World Recipes**, "
        "published by UniTools and licensed under **CC BY-SA 4.0**.\n\n"
        f"- Original dataset and attribution: {SOURCE_PAGE}\n"
        f"- Full source JSON: {SOURCE_URL}\n"
        f"- License: {LICENSE_URL}\n\n"
        "Changes made for Cookly: selected 100 records with varied cuisines; "
        "converted names, description, times, serving counts, ingredient amounts, "
        "and cooking steps into the existing Cookly JSON schema; lowercased "
        "ingredient names; converted 'piece' to 'each'; for ingredients "
        "without numeric amounts (such as salt to taste), the numeric quantity "
        "is a placeholder 1 with unit 'to taste'. These are **not** reliable "
        "amounts for pantry-quantity matching and need special handling later.\n\n"
        "This transformed recipe dataset is distributed under CC BY-SA 4.0; "
        "retain this attribution and share-alike license when distributing it. "
        "The Cookly application's own source code may use its own license.\n",
        encoding="utf-8",
    )
    print(f"Saved {len(recipes)} recipes to {OUTPUT_FILE}")
    print(f"Saved license and source attribution to {ATTRIBUTION_FILE}")
    print(f"Total ingredient requirements: {sum(len(r['ingredients']) for r in recipes)}")
    print("Examples: " + ", ".join(r["name"] for r in recipes[:5]))
    print("Next: py recipe_dataset\\import_recipes.py")


if __name__ == "__main__":
    main()
