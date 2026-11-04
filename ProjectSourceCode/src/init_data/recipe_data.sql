-- Insert our first recipe
INSERT INTO recipes (
    name,
    description,
    instructions,
    prep_time,
    cook_time,
    servings
)
VALUES (
    'Scrambled Eggs',
    'Simple and fluffy scrambled eggs.',
    '1. Crack eggs into a bowl. 2. Whisk with milk. 3. Melt butter in a pan. 4. Add eggs and stir until cooked.',
    5,
    5,
    1
);

-- Insert ingredients for scrambled eggs
INSERT INTO recipe_ingredients (
    recipe_id,
    ingredient_name,
    quantity,
    unit
)
VALUES
    (1, 'eggs', 2, 'whole'),
    (1, 'milk', 2, 'tbsp'),
    (1, 'butter', 1, 'tbsp'),
    (1, 'salt', 0.25, 'tsp');
