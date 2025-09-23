WITH unit_conversions AS (
    SELECT *
    FROM (VALUES ('ONZ', 28.3495),   -- Ounces
                 ('OZ', 28.3495),    -- Ounces
                 ('OZA', 28.3495),   -- Ounces (fluid)
                 ('LBR', 453.592),   -- Pounds
                 ('LB', 453.592),    -- Pounds
                 ('g', 1.0),         -- Grams
                 ('G', 1.0),         -- Grams
                 ('FL', 29.5735),    -- Fluid ounces (assuming water density)
                 ('L', 1000.0),      -- Liters (assuming water density)
                 ('mL', 1.0),        -- Milliliters (assuming water density)
                 ('ml', 1.0),        -- Milliliters (assuming water density)
                 ('GAL', 3785.41),   -- Gallons (assuming water density)
                 ('PT', 473.176),    -- Pints (assuming water density)
                 ('fl', 29.5735),    -- Fluid ounces
                 ('GLL', 3785.41),   -- Gallons
                 ('GRM', 1.0),       -- Grams
                 ('Quart', 946.353), -- Quarts
                 ('O', 28.3495),     -- Ounces (typo in data)
                 ('Z', 28.3495) -- Ounces (typo in data, missing O)
         ) AS conversions(unit, grams_per_unit)),

     parsed_weights AS (SELECT DISTINCT rbf.fdc_id,
                                        rbf.package_weight,
                                        -- Extract the first number and unit (primary measurement)
                                        CAST(substring(rbf.package_weight from '^([0-9]+\.?[0-9]*)') AS NUMERIC) as amount_1,
                                        substring(rbf.package_weight from '^[0-9]+\.?[0-9]*\s*([A-Za-z]+)')      as unit_1,

                                        -- Extract second measurement (after first slash)
                                        CASE
                                            WHEN rbf.package_weight ~ '/' THEN
                                                CAST(substring(rbf.package_weight from '/([0-9]+\.?[0-9]*)') AS NUMERIC)
                                            END                                                                  as amount_2,

                                        CASE
                                            WHEN rbf.package_weight ~ '/' THEN
                                                substring(rbf.package_weight from '/[0-9]+\.?[0-9]*\s*([A-Za-z]+)')
                                            END                                                                  as unit_2,

                                        -- Extract third measurement (after second slash)
                                        CASE
                                            WHEN rbf.package_weight ~ '/.*/' THEN
                                                CAST(substring(rbf.package_weight from '/[^/]*/([0-9]+\.?[0-9]*)') AS NUMERIC)
                                            END                                                                  as amount_3,

                                        CASE
                                            WHEN rbf.package_weight ~ '/.*/' THEN
                                                substring(rbf.package_weight from
                                                          '/[^/]*/[0-9]+\.?[0-9]*\s*([A-Za-z]+)')
                                            END                                                                  as unit_3

                        FROM raw_branded_food rbf
                        WHERE rbf.package_weight IS NOT NULL
                          AND rbf.package_weight ~ '^[0-9]+\.?[0-9]*\s*[A-Za-z]'),

     exploded_measurements AS (
         -- First measurement
         SELECT pw.fdc_id,
                pw.amount_1                     as amount,
                pw.unit_1                       as unit,
                pw.amount_1 || ' ' || pw.unit_1 as description,
                1                               as measurement_sequence
         FROM parsed_weights pw
         WHERE pw.amount_1 IS NOT NULL
           AND pw.unit_1 IS NOT NULL

         UNION ALL

         -- Second measurement
         SELECT pw.fdc_id,
                pw.amount_2                     as amount,
                pw.unit_2                       as unit,
                pw.amount_2 || ' ' || pw.unit_2 as description,
                2                               as measurement_sequence
         FROM parsed_weights pw
         WHERE pw.amount_2 IS NOT NULL
           AND pw.unit_2 IS NOT NULL

         UNION ALL

         -- Third measurement
         SELECT pw.fdc_id,
                pw.amount_3                     as amount,
                pw.unit_3                       as unit,
                pw.amount_3 || ' ' || pw.unit_3 as description,
                3                               as measurement_sequence
         FROM parsed_weights pw
         WHERE pw.amount_3 IS NOT NULL
           AND pw.unit_3 IS NOT NULL),

     measurements_with_grams AS (SELECT em.fdc_id,
                                        em.amount,
                                        em.unit,
                                        em.description,
                                        em.measurement_sequence,
                                        ROUND((em.amount * COALESCE(uc.grams_per_unit, 28.3495))::NUMERIC,
                                              2) as gram_weight
                                 FROM exploded_measurements em
                                          LEFT JOIN unit_conversions uc ON em.unit = uc.unit)

INSERT
INTO portion (food_id, gram_weight, portion_amount, portion_unit, description, modifier)
SELECT f.id      as food_id,
       mwg.gram_weight,
       1.0       as portion_amount,
       'package' as portion_unit,
       mwg.description,
       NULL      as modifier
FROM measurements_with_grams mwg
         JOIN food f ON f.old_id = mwg.fdc_id::int
WHERE mwg.gram_weight > 0
ORDER BY f.id, mwg.measurement_sequence;


WITH unit_conversions AS (SELECT *
                          FROM (VALUES ('ONZ', 28.3495),   -- Ounces
                                       ('OZ', 28.3495),    -- Ounces
                                       ('OZA', 28.3495),   -- Ounces (fluid)
                                       ('LBR', 453.592),   -- Pounds
                                       ('LB', 453.592),    -- Pounds
                                       ('g', 1.0),         -- Grams
                                       ('G', 1.0),         -- Grams
                                       ('FL', 29.5735),    -- Fluid ounces (assuming water density)
                                       ('L', 1000.0),      -- Liters (assuming water density)
                                       ('mL', 1.0),        -- Milliliters (assuming water density)
                                       ('ml', 1.0),        -- Milliliters (assuming water density)
                                       ('GAL', 3785.41),   -- Gallons (assuming water density)
                                       ('PT', 473.176),    -- Pints (assuming water density)
                                       ('fl', 29.5735),    -- Fluid ounces
                                       ('GLL', 3785.41),   -- Gallons
                                       ('GRM', 1.0),       -- Grams
                                       ('Quart', 946.353), -- Quarts
                                       ('O', 28.3495),     -- Ounces (typo in data)
                                       ('Z', 28.3495) -- Ounces (typo in data, missing O)
                               ) AS conversions(unit, grams_per_unit)),

     measurements_with_grams AS (SELECT rbf.fdc_id,
                                        rbf.serving_size                                                             as amount,
                                        rbf.serving_size_unit                                                        as unit,
                                        rbf.serving_size || ' ' || rbf.serving_size_unit                             as description,
                                        ROUND((rbf.serving_size::numeric * COALESCE(uc.grams_per_unit, 28.3495))::NUMERIC,
                                              2)                                                                     as gram_weight
                                 FROM raw_branded_food rbf
                                          LEFT JOIN unit_conversions uc ON rbf.serving_size_unit = uc.unit
                                 WHERE rbf.serving_size IS NOT NULL
                                   AND rbf.serving_size_unit IS NOT NULL)

INSERT
INTO portion (food_id, gram_weight, portion_amount, portion_unit, description, modifier)
SELECT f.id      as food_id,
       mwg.gram_weight,
       1.0       as portion_amount,
       'serving' as portion_unit,
       mwg.description,
       'serving' as modifier
FROM measurements_with_grams mwg
         JOIN food f ON f.old_id = mwg.fdc_id::int
WHERE mwg.gram_weight > 0
ORDER BY f.id;
