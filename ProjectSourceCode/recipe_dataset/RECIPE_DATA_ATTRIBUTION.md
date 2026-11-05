# Recipe dataset attribution

These 100 recipes are adapted from **UniTools World Recipes**, published by UniTools and licensed under **CC BY-SA 4.0**.

- Original dataset and attribution: https://theunitools.com/en/data
- Full source JSON: https://theunitools.com/data/unitools-recipes-v1.json
- License: https://creativecommons.org/licenses/by-sa/4.0/

Changes made for Cookly: selected 100 records with varied cuisines; converted names, description, times, serving counts, ingredient amounts, and cooking steps into the existing Cookly JSON schema; lowercased ingredient names; converted 'piece' to 'each'; for ingredients without numeric amounts (such as salt to taste), the numeric quantity is a placeholder 1 with unit 'to taste'. These are **not** reliable amounts for pantry-quantity matching and need special handling later.

This transformed recipe dataset is distributed under CC BY-SA 4.0; retain this attribution and share-alike license when distributing it. The Cookly application's own source code may use its own license.
