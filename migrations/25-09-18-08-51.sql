ALTER TABLE portion
	DROP COLUMN IF EXISTS old_id;
ALTER TABLE nutrient
	DROP COLUMN IF EXISTS old_id;
ALTER TABLE branded_food
    DROP COLUMN IF EXISTS old_id;
ALTER TABLE food
    DROP COLUMN IF EXISTS old_id;

DROP TABLE IF EXISTS raw_acquisition_samples;
DROP TABLE IF EXISTS raw_agricultural_samples;
DROP TABLE IF EXISTS raw_branded_food;
DROP TABLE IF EXISTS raw_fndds_derivation;
DROP TABLE IF EXISTS raw_fndds_ingredient_nutrient_value;
DROP TABLE IF EXISTS raw_food_attribute;
DROP TABLE IF EXISTS raw_food_attribute_type;
DROP TABLE IF EXISTS raw_food_calorie_conversion_factor;
DROP TABLE IF EXISTS raw_food_category;
DROP TABLE IF EXISTS raw_food_component;
DROP TABLE IF EXISTS raw_food;
DROP TABLE IF EXISTS raw_food_nutrient_conversion_factor;
DROP TABLE IF EXISTS raw_food_nutrient;
DROP TABLE IF EXISTS raw_food_nutrient_derivation;
DROP TABLE IF EXISTS raw_food_nutrient_source;
DROP TABLE IF EXISTS raw_food_portion;
DROP TABLE IF EXISTS raw_food_protein_conversion_factor;
DROP TABLE IF EXISTS raw_food_update_log_entry;
DROP TABLE IF EXISTS raw_foundation_food;
DROP TABLE IF EXISTS raw_input_food;
DROP TABLE IF EXISTS raw_lab_method_code;
DROP TABLE IF EXISTS raw_lab_method;
DROP TABLE IF EXISTS raw_lab_method_nutrient;
DROP TABLE IF EXISTS raw_market_acquisition;
DROP TABLE IF EXISTS raw_measure_unit;
DROP TABLE IF EXISTS raw_microbe;
DROP TABLE IF EXISTS raw_nutrient;
DROP TABLE IF EXISTS raw_retention_factor;
DROP TABLE IF EXISTS raw_sample_food;
DROP TABLE IF EXISTS raw_sr_legacy_food;
DROP TABLE IF EXISTS raw_sub_sample_food;
DROP TABLE IF EXISTS raw_sub_sample_result;
DROP TABLE IF EXISTS raw_survey_fndds_food;
DROP TABLE IF EXISTS raw_wweia_food_category;


CREATE INDEX IF NOT EXISTS idx_branded_food_gtin_upc ON branded_food (gtin_upc);

CREATE INDEX IF NOT EXISTS idx_food_branded_food_id ON food (branded_food_id);
CREATE INDEX IF NOT EXISTS idx_food_food_category_id ON food (food_category_id);


CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_food_description_trgm ON food USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_nutrient_value_food_id ON nutrient_value (food_id);

CREATE INDEX IF NOT EXISTS idx_portion_food_id ON portion (food_id);

CREATE INDEX IF NOT EXISTS idx_nutrient_nutrient_nbr ON nutrient (nutrient_nbr);
