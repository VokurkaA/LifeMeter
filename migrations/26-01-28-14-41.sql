ALTER TABLE food
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (to_tsvector('english', description)) STORED;

CREATE INDEX idx_food_search_vector ON food USING GIN (search_vector);
