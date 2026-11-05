
import json
import subprocess
from pathlib import Path

project_dir = Path(__file__).resolve().parent.parent
json_file = Path(__file__).resolve().parent / "recipes.json"

with open(json_file, "r", encoding="utf-8") as file:
    recipes = json.load(file)

def sql_string(value):
    return "'" + str(value).replace("'", "''") + "'"

sql_commands = ["BEGIN;"]

for recipe in recipes:
    name = sql_string(recipe["name"])
    description = sql_string(recipe["description"])
    instructions = sql_string(recipe["instructions"])

    prep_time = int(recipe["prep_time"])
    cook_time = int(recipe["cook_time"])
    servings = int(recipe["servings"])

    ingredient_rows = []

    for ingredient in recipe["ingredients"]:
        ingredient_rows.append(
            f"({sql_string(ingredient['name'])}, "
            f"{float(ingredient['quantity'])}, "
            f"{sql_string(ingredient['unit'])})"
        )

    values = ",\n".join(ingredient_rows)

    
    sql_commands.append(f"""
WITH new_recipe AS (
    INSERT INTO recipes (
        name, description, instructions,
        prep_time, cook_time, servings
    )
    SELECT
        {name}, {description}, {instructions},
        {prep_time}, {cook_time}, {servings}
    WHERE NOT EXISTS (
        SELECT 1
        FROM recipes
        WHERE LOWER(name) = LOWER({name})
    )
    RETURNING recipe_id
)
INSERT INTO recipe_ingredients (
    recipe_id, ingredient_name, quantity, unit
)
SELECT
    new_recipe.recipe_id,
    ingredient_name,
    quantity,
    unit
FROM new_recipe
CROSS JOIN (
    VALUES {values}
) AS ingredient_list(ingredient_name, quantity, unit);
""")


sql_commands.append("COMMIT;")


result = subprocess.run(
    [
        "docker", "compose", "exec", "-T",
        "db", "psql",
        "-v", "ON_ERROR_STOP=1",
        "-U", "postgres",
        "-d", "cookly"
    ],
    input="\n".join(sql_commands),
    text=True,
    encoding="utf-8",
    cwd=project_dir
)


if result.returncode == 0:
    print(f"Successfully imported {len(recipes)} recipes!")
else:
    print("Recipe import failed.")
