ALTER TABLE nutrient 
	ADD COLUMN IF NOT EXISTS old_id INT;
select setval('nutrient_id_seq', 1, false);
INSERT INTO nutrient (name, unit, nutrient_nbr, old_id)
SELECT name,
       upper(unit_name)::unit_name,
       nutrient_nbr::numeric::int,
	   id::int
FROM raw_nutrient;

ALTER TABLE branded_food
    ADD COLUMN IF NOT EXISTS old_id INT;

INSERT INTO branded_food (brand_owner, brand_name, subbrand_name, gtin_upc, ingredients, old_id)
SELECT brand_owner,
       brand_name,
       subbrand_name,
       gtin_upc,
       UPPER(ingredients),
       fdc_id::INT
FROM raw_branded_food
ON CONFLICT (gtin_upc) DO NOTHING;

INSERT INTO food_category (id, name)
VALUES (1, 'Dairy and Egg Products'),
       (2, 'Spices and Herbs'),
       (3, 'Baby Foods'),
       (4, 'Fats and Oils'),
       (5, 'Poultry Products'),
       (6, 'Soups, Sauces, and Gravies'),
       (7, 'Sausages and Luncheon Meats'),
       (8, 'Breakfast Cereals'),
       (9, 'Fruits and Fruit Juices'),
       (10, 'Pork Products'),
       (11, 'Vegetables and Vegetable Products'),
       (12, 'Nut and Seed Products'),
       (13, 'Beef Products'),
       (14, 'Beverages'),
       (15, 'Finfish and Shellfish Products'),
       (16, 'Legumes and Legume Products'),
       (17, 'Lamb, Veal, and Game Products'),
       (18, 'Baked Products'),
       (19, 'Sweets'),
       (20, 'Cereal Grains and Pasta'),
       (21, 'Fast Foods'),
       (22, 'Meals, Entrees, and Side Dishes'),
       (23, 'Snacks'),
       (24, 'American Indian/Alaska Native Foods'),
       (25, 'Restaurant Foods'),
       (26, 'Branded Food Products Database'),
       (27, 'Quality Control Materials'),
       (28, 'Alcoholic Beverages'),
       (29, 'Supplements'),
       (30, 'Baking Supplies'),
       (31, 'Meat - Other/Processed'),
       (32, 'Uncategorized')
ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name;
SELECT setval('food_category_id_seq', (SELECT MAX(id) FROM food_category));

ALTER TABLE food
    ADD COLUMN IF NOT EXISTS old_id INT;

SELECT setval('food_id_seq', 1, false);
WITH string_to_id_mapping AS (SELECT category_name, new_id
                              FROM (VALUES
                                        -- Category 1: Dairy Foods
                                        ('Dairy Foods/Yoghurts', '1'),
                                        ('Cheese', '1'),
                                        ('Cheese - Block', '1'),
                                        ('Cheese/Cheese Substitutes', '1'),
                                        ('Cheese - Speciality ', '1'),
                                        ('Processed Cheese & Cheese Novelties', '1'),
                                        ('Milk', '1'),
                                        ('Milk/Cream', '1'),
                                        ('Milk/Cream - Shelf Stable', '1'),
                                        ('Milk/Milk Substitutes', '1'),
                                        ('Plant Based Milk', '1'),
                                        ('Cream', '1'),
                                        ('Cream/Cream Substitutes', '1'),
                                        ('Yogurt', '1'),
                                        ('Yogurt (Perishable)', '1'),
                                        ('Yogurt/Yogurt Substitutes', '1'),
                                        ('Yogurt/Yogurt Substitutes (Perishable)', '1'),
                                        ('Butter/Butter Substitutes', '1'),
                                        ('Butter & Spread', '1'),
                                        ('Margarine/Butter', '1'),
                                        ('Eggs', '1'),
                                        ('Eggs/Eggs Substitutes', '1'),
                                        ('Eggs & Egg Substitutes', '1'),
                                        ('Eggs Products/Substitutes', '1'),
                                        ('Dairy/Egg Based Products / Meals', '1'),

                                        -- Category 2: Spices and Herbs
                                        ('Spices and Herbs', '2'),
                                        ('Herbs And Spices', '2'),
                                        ('Herbs & Spices', '2'),
                                        ('Herbs/Spices/Extracts', '2'),
                                        ('Herbs/Spices (Shelf Stable)', '2'),
                                        ('Seasoning Mixes, Salts, Marinades & Tenderizers', '2'),
                                        ('Extracts/Salt/Meat Tenderisers (Shelf Stable)', '2'),

                                        -- Category 3: Baby Foods
                                        ('Baby Foods', '3'),
                                        ('Baby/Infant  Foods/Beverages', '3'),
                                        ('Baby/Infant – Foods/Beverages', '3'),
                                        ('Infant Formula', '3'),

                                        -- Category 4: Fats and Oils
                                        ('Fats and Oils', '4'),
                                        ('Fats Edible', '4'),
                                        ('Oils Edible', '4'),
                                        ('Oils Edible - Vegetable or Plant (Shelf Stable)', '4'),
                                        ('Vegetable & Cooking Oils', '4'),
                                        ('Cooking Oils and Fats', '4'),

                                        -- Category 5: Poultry Products
                                        ('Poultry Products', '5'),
                                        ('Chicken - Prepared/Processed', '5'),
                                        ('Chicken - Unprepared/Unprocessed', '5'),
                                        ('Fresh Chicken - Portions', '5'),
                                        ('Fresh Chicken - Processed', '5'),
                                        ('Fresh Chicken - Whole', '5'),
                                        ('Frozen Chicken - Portions', '5'),
                                        ('Frozen Chicken - Processed', '5'),
                                        ('Poultry, Chicken & Turkey', '5'),
                                        ('Turkey - Prepared/Processed', '5'),
                                        ('Turkey - Unprepared/Unprocessed', '5'),
                                        ('Frozen Poultry, Chicken & Turkey', '5'),

                                        -- Category 6: Soups, Sauces, and Gravies
                                        ('Soups, Sauces, and Gravies', '6'),
                                        ('Canned Condensed Soup', '6'),
                                        ('Canned Soup', '6'),
                                        ('Prepared Soups', '6'),
                                        ('Soups - Prepared (Shelf Stable)', '6'),
                                        ('Other Soups', '6'),
                                        ('Sauces', '6'),
                                        ('Sauces- Cooking', '6'),
                                        ('Sauces - Cooking (Frozen)', '6'),
                                        ('Sauces - Cooking (Shelf Stable)', '6'),
                                        ('Prepared Pasta & Pizza Sauces', '6'),
                                        ('Ketchup, Mustard, BBQ & Cheese Sauce', '6'),
                                        ('Oriental, Mexican & Ethnic Sauces', '6'),
                                        ('Other Cooking Sauces', '6'),
                                        ('Gravy Mix', '6'),
                                        ('Dips/Hummus/Pate', '6'),
                                        ('Dips & Salsa', '6'),
                                        ('Dips - Shelf Stable', '6'),
                                        ('Salad Dressing & Mayonnaise', '6'),
                                        ('Salad Dressings', '6'),
                                        ('Dressings/Dips (Shelf Stable)', '6'),
                                        ('Sauces/Spreads/Dips/Condiments', '6'),

                                        -- Category 7: Sausages and Luncheon Meats
                                        ('Sausages and Luncheon Meats', '7'),
                                        ('Bacon', '7'),
                                        ('Bacon, Sausages & Ribs', '7'),
                                        ('Frozen Bacon, Sausages & Ribs', '7'),
                                        ('Sausages, Hotdogs & Brats', '7'),
                                        ('Frozen Sausages, Hotdogs & Brats', '7'),
                                        ('Sausages/Smallgoods', '7'),
                                        ('Beef Sausages - Prepared/Processed', '7'),
                                        ('Pork Sausages - Prepared/Processed', '7'),
                                        ('Meat/Poultry/Other Animals Sausages  Prepared/Processed', '7'),
                                        ('Meat/Poultry/Other Animals Sausages - Prepared/Processed', '7'),
                                        ('Meat/Poultry/Other Animals Sausages – Prepared/Processed', '7'),
                                        ('Pepperoni, Salami & Cold Cuts', '7'),
                                        ('Salami / Cured Meat', '7'),
                                        ('Ham/Cold Meats', '7'),

                                        -- Category 8: Breakfast Cereals
                                        ('Breakfast Cereals', '8'),
                                        ('Cereal', '8'),
                                        ('Breakfast Cereals - Hot And Cold', '8'),
                                        ('Cereal/Muesli Bars', '8'),

                                        -- Category 9: Fruits and Fruit Juices
                                        ('Fruits and Fruit Juices', '9'),
                                        ('Fruit', '9'),
                                        ('Canned Fruit', '9'),
                                        ('Frozen Fruit', '9'),
                                        ('Pre-Packaged Fruit & Vegetables', '9'),
                                        ('Fresh Fruit and Vegetables', '9'),
                                        ('Fruits, Vegetables & Produce', '9'),
                                        ('Berries/Small Fruit', '9'),
                                        ('Fruit Juice - Not Ready to Drink (Frozen)', '9'),
                                        ('Fruit Juice - Ready to Drink (Shelf Stable)', '9'),
                                        ('Fruit & Vegetable Juice, Nectars & Fruit Drinks', '9'),
                                        ('Fruit  Prepared/Processed', '9'),
                                        ('Fruit - Prepared/Processed', '9'),
                                        ('Fruit – Prepared/Processed', '9'),

                                        -- Category 10: Pork Products
                                        ('Pork Products', '10'),
                                        ('Pork - Prepared/Processed', '10'),
                                        ('Pork - Unprepared/Unprocessed', '10'),

                                        -- Category 11: Vegetables and Vegetable Products
                                        ('Vegetables and Vegetable Products', '11'),
                                        ('Canned/Dried Veges', '11'),
                                        ('Canned Vegetables', '11'),
                                        ('Frozen Vegetables', '11'),
                                        ('Pickled Vegetables', '11'),
                                        ('Vegetables', '11'),
                                        ('Tomatoes', '11'),
                                        ('Peppers', '11'),
                                        ('Pickles, Olives, Peppers & Relishes', '11'),
                                        ('Vegetable and Lentil Mixes', '11'),
                                        ('Vegetables  Prepared/Processed', '11'),
                                        ('Vegetables - Prepared/Processed', '11'),
                                        ('Vegetables – Prepared/Processed', '11'),

                                        -- Category 12: Nut and Seed Products
                                        ('Nut and Seed Products', '12'),
                                        ('Nut & Seed Butters', '12'),
                                        ('Nuts/Seeds  Prepared/Processed', '12'),
                                        ('Nuts/Seeds - Prepared/Processed', '12'),
                                        ('Nuts/Seeds – Prepared/Processed', '12'),
                                        ('Popcorn, Peanuts, Seeds & Related Snacks', '12'),

                                        -- Category 13: Beef Products
                                        ('Beef Products', '13'),
                                        ('Beef - Prepared/Processed', '13'),

                                        -- Category 14: Beverages
                                        ('Beverages', '14'),
                                        ('Coffee', '14'),
                                        ('Coffee/Coffee Substitutes', '14'),
                                        ('Coffee - Instant, Roast and Ground', '14'),
                                        ('Coffee/Tea/Substitutes', '14'),
                                        ('Tea and Infusions/Tisanes', '14'),
                                        ('Tea Bags', '14'),
                                        ('Tea - Bags, Loose Leaf, Speciality', '14'),
                                        ('Iced & Bottle Tea', '14'),
                                        ('Non Alcoholic Beverages  Not Ready to Drink', '14'),
                                        ('Non Alcoholic Beverages - Not Ready to Drink', '14'),
                                        ('Non Alcoholic Beverages – Not Ready to Drink', '14'),
                                        ('Non Alcoholic Beverages  Ready to Drink', '14'),
                                        ('Non Alcoholic Beverages - Ready to Drink', '14'),
                                        ('Non Alcoholic Beverages – Ready to Drink', '14'),
                                        ('Drinks', '14'),
                                        ('Drinks - Energy Drinks', '14'),
                                        ('Drinks Flavoured - Ready to Drink', '14'),
                                        ('Drinks - Juices, Drinks and Cordials', '14'),
                                        ('Drinks - Powdered', '14'),
                                        ('Drinks - Soft Drinks', '14'),
                                        ('Soda', '14'),
                                        ('Ready To Drink', '14'),
                                        ('Sport Drinks', '14'),
                                        ('Water', '14'),
                                        ('Packaged Water', '14'),
                                        ('Plant Based Water', '14'),
                                        ('Breakfast Drinks', '14'),
                                        ('Liquid Water Enhancer', '14'),
                                        ('Powdered Drinks', '14'),

                                        -- Category 15: Finfish and Shellfish Products
                                        ('Finfish and Shellfish Products', '15'),
                                        ('Aquatic Invertebrates/Fish/Shellfish/Seafood Combination', '15'),
                                        ('Canned Fish and Meat', '15'),
                                        ('Canned Seafood', '15'),
                                        ('Canned Tuna', '15'),
                                        ('Fish  Prepared/Processed', '15'),
                                        ('Fish - Prepared/Processed', '15'),
                                        ('Fish – Prepared/Processed', '15'),
                                        ('Fish & Seafood', '15'),
                                        ('Frozen Fish & Seafood', '15'),
                                        ('Frozen Fish/Seafood', '15'),
                                        ('Smoked fish', '15'),
                                        ('Mussels', '15'),
                                        ('Shellfish Prepared/Processed', '15'),
                                        ('Shellfish Unprepared/Unprocessed', '15'),
                                        ('Seafood Miscellaneous', '15'),

                                        -- Category 16: Legumes and Legume Products
                                        ('Legumes and Legume Products', '16'),
                                        ('Canned & Bottled Beans', '16'),
                                        ('Chickpeas', '16'),
                                        ('Tofu', '16'),

                                        -- Category 18: Baked Products
                                        ('Baked Products', '18'),
                                        ('Biscuits/Cookies', '18'),
                                        ('Biscuits/Cookies (Frozen)', '18'),
                                        ('Biscuits/Cookies (Shelf Stable)', '18'),
                                        ('Biscuits Chocolate', '18'),
                                        ('Biscuits Cracker', '18'),
                                        ('Biscuits Kids', '18'),
                                        ('Biscuits Plain/Sweet', '18'),
                                        ('Cookies & Biscuits', '18'),
                                        ('Bread', '18'),
                                        ('Bread (Frozen)', '18'),
                                        ('Bread (Shelf Stable)', '18'),
                                        ('Frozen Bread & Dough', '18'),
                                        ('Breads & Buns', '18'),
                                        ('Cakes and Slices', '18'),
                                        ('Cakes, Cupcakes, Snack Cakes', '18'),
                                        ('Cakes/Slices/Biscuits', '18'),
                                        ('Cakes - Sweet (Frozen)', '18'),
                                        ('Cakes - Sweet (Shelf Stable)', '18'),
                                        ('Croissants, Sweet Rolls, Muffins & Other Pastries', '18'),
                                        ('Pastry', '18'),
                                        ('Pizza', '18'),
                                        ('Taco Shells', '18'),
                                        ('Savoury Bakery Products', '18'),
                                        ('Sweet Bakery Products', '18'),
                                        ('Pies/Pastries/Pizzas/Quiches - Savoury (Frozen)', '18'),
                                        ('Pies/Pastries - Sweet (Frozen)', '18'),
                                        ('Pies/Pastries - Sweet (Shelf Stable)', '18'),
                                        ('Dried Breads (Shelf Stable)', '18'),

                                        -- Category 19: Sweets
                                        ('Sweets', '19'),
                                        ('Candy', '19'),
                                        ('Chocolate', '19'),
                                        ('Chewing Gum & Mints', '19'),
                                        ('Confectionery', '19'),
                                        ('Jam, Jelly & Fruit Spreads', '19'),
                                        ('Puddings and desserts', '19'),
                                        ('Puddings & Custards', '19'),
                                        ('Desserts & Custard', '19'),
                                        ('Frozen Desserts', '19'),
                                        ('Ice Cream & Frozen Yogurt', '19'),
                                        ('Other Frozen Desserts', '19'),
                                        ('Honey', '19'),
                                        ('Syrups & Molasses', '19'),
                                        ('Sugar And Flour', '19'),
                                        ('Sugars/Sugar Substitute Products', '19'),
                                        ('Sweet Spreads', '19'),

                                        -- Category 20: Cereal Grains and Pasta
                                        ('Cereal Grains and Pasta', '20'),
                                        ('All Noodles', '20'),
                                        ('Noodles', '20'),
                                        ('Pasta', '20'),
                                        ('Pasta by Shape & Type', '20'),
                                        ('Pasta/Noodles', '20'),
                                        ('Pasta - Instant Meals', '20'),
                                        ('Fresh Pasta', '20'),
                                        ('Rice', '20'),
                                        ('Rice & Grains', '20'),
                                        ('Flavored Rice Dishes', '20'),
                                        ('Flour - Cereal/Pulse (Shelf Stable)', '20'),
                                        ('Flours & Corn Meal', '20'),
                                        ('Grains', '20'),
                                        ('Other Grains & Seeds', '20'),
                                        ('Processed Cereal Products', '20'),
                                        ('Grains/Cereal - Not Ready to Eat - (Shelf Stable)', '20'),
                                        ('Grains/Flour', '20'),
                                        ('Pasta Dinners', '20'),

                                        -- Category 21: Fast Foods
                                        ('Fast Foods', '21'),
                                        ('Sandwiches/Filled Rolls/Wraps', '21'),
                                        ('Prepared Subs & Sandwiches', '21'),
                                        ('Sandwiches/Filled Rolls/Wraps (Frozen)', '21'),
                                        ('Prepared Wraps and Burittos', '21'),
                                        ('Lunch Snacks & Combinations', '21'),

                                        -- Category 22: Meals, Entrees, and Side Dishes
                                        ('Meals, Entrees, and Side Dishes', '22'),
                                        ('Frozen Dinners & Entrees', '22'),
                                        ('Frozen Meals', '22'),
                                        ('Prepared Meals', '22'),
                                        ('Deli Salads', '22'),
                                        ('Chili & Stew', '22'),
                                        ('Entrees, Sides & Small Meals', '22'),
                                        ('French Fries, Potatoes & Onion Rings', '22'),
                                        ('Frozen Potato', '22'),
                                        ('Frozen Prepared Sides', '22'),
                                        ('Ready-made combination meal...', '22'),
                                        ('Ready-Made Combination Meals', '22'),

                                        -- Category 23: Snacks
                                        ('Snacks', '23'),
                                        ('Chips, Pretzels & Snacks', '23'),
                                        ('Chips/Crisps/Snack Mixes - Natural/Extruded (Shelf Stable)', '23'),
                                        ('Crackers & Biscotti', '23'),
                                        ('Flavored Snack Crackers', '23'),
                                        ('Popcorn (Shelf Stable)', '23'),
                                        ('Snack, Energy & Granola Bars', '23'),
                                        ('Other Snacks', '23'),
                                        ('Snack Foods - Cereal Snacks', '23'),
                                        ('Snack Foods - Chips', '23'),
                                        ('Snack Foods - Corn Chips', '23'),
                                        ('Snack Foods - Dried Fruit', '23'),
                                        ('Snack Foods - Multi Packs', '23'),
                                        ('Snack Foods - Nuts', '23'),
                                        ('Snack Foods - Other', '23'),
                                        ('Wholesome Snacks', '23'),
                                        ('Wrapped Snacks - Cereal', '23'),
                                        ('Wrapped Snacks - Fruit Bars', '23'),
                                        ('Wrapped Snacks - Muesli Bars', '23'),
                                        ('Wrapped Snacks - Nut Bars', '23'),

                                        -- Category 25: Restaurant Foods
                                        ('Restaurant Foods', '25'),

                                        -- Category 28: Alcoholic Beverages
                                        ('Alcoholic Beverages', '28'),
                                        ('Alcohol', '28'),
                                        ('Beer', '28'),

                                        -- Category 29: Supplements
                                        ('Amino Acid Supplements', '29'),
                                        ('Antioxidant Supplements', '29'),
                                        ('Ayurvedic Supplements', '29'),
                                        ('Children''s Nutritional Supplements', '29'),
                                        ('Children''s Natural Remedies', '29'),
                                        ('Digestive & Fiber Supplements', '29'),
                                        ('Fatty Acid Supplements', '29'),
                                        ('Green Supplements', '29'),
                                        ('Health Supplements and Vitamins', '29'),
                                        ('Herbal Supplements', '29'),
                                        ('Meal Replacement Supplements', '29'),
                                        ('Nutritional Supplements', '29'),
                                        ('Specialty Formula Supplements', '29'),
                                        ('Vitamins', '29'),
                                        ('Vitamins/Minerals/Nutritional Supplements', '29'),
                                        ('Energy, Protein & Muscle Recovery Drinks', '29'),
                                        ('Sports and Weight Management', '29'),
                                        ('Minerals', '29'),

                                        -- Category 30: Baking
                                        ('Baking', '30'),
                                        ('Baking Accessories', '30'),
                                        ('Baking Additives & Extracts', '30'),
                                        ('Baking/Cooking Mixes (Frozen)', '30'),
                                        ('Baking/Cooking Mixes (Perishable)', '30'),
                                        ('Baking/Cooking Mixes (Shelf Stable)', '30'),
                                        ('Baking/Cooking Mixes/Supplies', '30'),
                                        ('Baking/Cooking Mixes/Supplies Variety Packs', '30'),
                                        ('Baking/Cooking Supplies (Shelf Stable)', '30'),
                                        ('Baking Needs', '30'),
                                        ('Baking Decorations & Dessert Toppings', '30'),
                                        ('Bread & Muffin Mixes', '30'),
                                        ('Cake, Cookie & Cupcake Mixes', '30'),
                                        ('Pastry Shells & Fillings', '30'),

                                        -- Category 31: Meat Products
                                        ('Meat/Poultry/Other Animals  Prepared/Processed', '31'),
                                        ('Meat/Poultry/Other Animals - Prepared/Processed', '31'),
                                        ('Meat/Poultry/Other Animals – Prepared/Processed', '31'),
                                        ('Meat Substitutes', '31'),
                                        ('Vegetarian Frozen Meats', '31'),
                                        ('Other Meats', '31'),
                                        ('Other Frozen Meats', '31'),
                                        ('Canned Meat', '31'),
                                        ('Fresh Meat', '31'),
                                        ('Frozen Meat', '31'),
                                        ('Fresh Meat, Poultry and Seafood', '31')) AS mapping(category_name, new_id))
INSERT INTO food (branded_food_id, food_category_id, description, old_id)
SELECT bf.id,
       CASE
           WHEN f.food_category_id IN (SELECT category_name FROM string_to_id_mapping) THEN CAST((SELECT new_id
                                                                                                  FROM string_to_id_mapping
                                                                                                  WHERE category_name = f.food_category_id) AS INTEGER)
           WHEN f.food_category_id ~ '^[0-9]+$' THEN CASE
                                                         WHEN LENGTH(f.food_category_id) <= 2
                                                             THEN CAST(f.food_category_id AS INTEGER)
                                                         ELSE CAST(f.food_category_id AS INTEGER) / 1000 END
           ELSE 32 END,
       f.description,
       f.fdc_id::int
FROM raw_food AS f
         LEFT JOIN branded_food AS bf ON bf.old_id = f.fdc_id::int
WHERE f.description IS NOT NULL;


SELECT setval('nutrient_value_id_seq', 1, false);
INSERT INTO nutrient_value (food_id, nutrient_id, amount)
SELECT f.id,
       n.id,
       rfn.amount::NUMERIC
FROM raw_food_nutrient AS rfn
         JOIN food AS f ON f.old_id = rfn.fdc_id::INT
         JOIN nutrient AS n ON n.old_id = rfn.nutrient_id::INT
WHERE rfn.amount IS NOT NULL
  AND rfn.amount ~ '^[0-9.]+$';

ALTER TABLE portion
	ADD COLUMN IF NOT EXISTS old_id INT;
SELECT setval('nutrient_value_id_seq', 1, false);
INSERT INTO portion (food_id, gram_weight, portion_amount, portion_unit, description, modifier, old_id)
SELECT f.id,
       rfp.gram_weight::NUMERIC,
       rfp.amount::NUMERIC,
       CASE 
           WHEN rmu.name = 'undetermined' THEN NULL 
           ELSE rmu.name 
       END AS portion_unit,
       rfp.portion_description,
       rfp.modifier,
       rfp.id::INT
FROM raw_food_portion AS rfp
JOIN food AS f 
  ON f.old_id = rfp.fdc_id::INT
JOIN raw_measure_unit AS rmu 
  ON rfp.measure_unit_id::INT = rmu.id::INT
WHERE rfp.gram_weight IS NOT NULL
  AND rfp.gram_weight ~ '^[0-9.]+$';
