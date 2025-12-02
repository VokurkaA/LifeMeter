-- 1. Units
INSERT INTO unit (name, gram_conversion_factor)
VALUES ('kg', 1000.00),
       ('lbs', 453.59237),
       ('st', 6350.293)
ON CONFLICT (name) DO NOTHING;

-- 2. Set Types
INSERT INTO set_type (name)
VALUES ('Warm Up'),
       ('Dropset'),
       ('Superset'),
       ('Myo-reps')
ON CONFLICT (name) DO NOTHING;

-- 3. Set Styles
INSERT INTO set_style (name)
VALUES ('Controlled'),
       ('Paused'),
       ('Explosive'),
       ('Static Hold'),
       ('Negative'),
       ('Assisted'),
       ('Partial'),
       ('Unilateral')
ON CONFLICT (name) DO NOTHING;

-- 4. Exercise Variants (Equipment)
INSERT INTO exercise_variant (name)
VALUES ('Dumbbell'),
       ('Barbell'),
       ('Machine'),
       ('Smith Machine'),
       ('Cable'),
       ('Bodyweight'),
       ('Weighted'),
       ('EZ-Bar'),
       ('Kettlebell'),
       ('Trap Bar'),
       ('Safety Bar')
ON CONFLICT (name) DO NOTHING;

-- 5. Exercise Types (Movements)
INSERT INTO exercise_type (name)
VALUES
-- Shoulders
('Shoulder Press'),
('Viking Press'),
('Lateral Raise'),
('Front Raise'),
('Upright Row'),
('Rear Delt Fly'),
('Face Pull'),
-- Triceps
('Triceps Extension'),
('Dips'),
('Push Down'),
('Triceps Press'),
('JM Press'),
('Skull Crusher'),
-- Biceps
('Bicep Curl'),
('Hammer Curl'),
('Bajan Curl'),
('Preacher Curl'),
('Spider Curl'),
('Cheat Curl'),
('Strict Curl'),
-- Forearms
('Reverse Curl'),
('Wrist Curl'),
-- Chest
('Chest Press'),
('Chest Fly'),
('Incline Chest Press'),
('Decline Chest Press'),
-- Back
('Bent Over Row'),
('High Row'),
('Low Row'),
('Pull Up'),
('Pull Down'),
('T-Bar Row'),
('Pullover'),
('Keenan Flaps'),
-- Core
('Plank'),
('Crunch'),
('Russian Twist'),
('Leg Raise'),
-- Glutes
('Adductor'),
('Abductor'),
('Hip Thrust'),
-- Quads
('Squat'),
('Sissy Squat'),
('Goblet Squat'),
('Leg Extension'),
('Leg Press'),
('Bulgarian Split Squat'),
('Lunge'),
-- Hamstrings
('Seated Hamstring Curl'),
('Standing Hamstring Curl'),
('Lying Hamstring Curl'),
('RDL'),
('Deadlift'),
('Stiff Leg Deadlift'),
-- Calves
('Standing Calf Raise'),
('Seated Calf Raise'),
-- Other/Strongman
('Clean & Jerk'),
('Clean'),
('Snatch'),
('Farmers Walk'),
('Log Press'),
('Atlas Stone')
ON CONFLICT (name) DO NOTHING;

-- 6. Link Exercises (The Config Object)
WITH raw_config (type_name, variant_names) AS (VALUES
                                                   -- Shoulders
                                                   ('Shoulder Press',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine', 'Kettlebell']),
                                                   ('Viking Press', ARRAY ['Machine', 'Barbell', 'Dumbbell']),
                                                   ('Lateral Raise', ARRAY ['Dumbbell', 'Cable', 'Machine']),
                                                   ('Front Raise', ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Cable']),
                                                   ('Upright Row', ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Cable']),
                                                   ('Rear Delt Fly', ARRAY ['Dumbbell', 'Cable', 'Machine']),
                                                   ('Face Pull', ARRAY ['Cable', 'Machine']),

                                                   -- Triceps
                                                   ('Triceps Extension', ARRAY ['Cable', 'Machine']),
                                                   ('Dips', ARRAY ['Machine', 'Bodyweight', 'Weighted']),
                                                   ('Push Down', ARRAY ['Machine', 'Cable']),
                                                   ('Triceps Press', ARRAY ['Cable', 'Machine']),
                                                   ('JM Press',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine', 'EZ-Bar']),
                                                   ('Skull Crusher',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine', 'EZ-Bar']),

                                                   -- Biceps
                                                   ('Bicep Curl',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Cable', 'EZ-Bar']),
                                                   ('Hammer Curl', ARRAY ['Dumbbell', 'Machine', 'Cable', 'EZ-Bar']),
                                                   ('Bajan Curl', ARRAY ['Dumbbell','Machine', 'Cable']),
                                                   ('Preacher Curl',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'EZ-Bar']),
                                                   ('Spider Curl', ARRAY ['Dumbbell', 'Barbell', 'EZ-Bar', 'Machine']),
                                                   ('Cheat Curl', ARRAY ['Dumbbell', 'Barbell', 'Cable', 'EZ-Bar']),
                                                   ('Strict Curl', ARRAY ['Dumbbell', 'Barbell', 'Cable', 'EZ-Bar']),

                                                   -- Forearms
                                                   ('Reverse Curl', ARRAY ['Dumbbell', 'Barbell', 'Cable', 'EZ-Bar']),
                                                   ('Wrist Curl',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Cable', 'EZ-Bar', 'Machine']),

                                                   -- Chest
                                                   ('Chest Press',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine']),
                                                   ('Chest Fly', ARRAY ['Dumbbell', 'Machine', 'Cable']),
                                                   ('Incline Chest Press',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine']),
                                                   ('Decline Chest Press',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine']),

                                                   -- Back
                                                   ('Bent Over Row',
                                                    ARRAY ['Dumbbell', 'Barbell', 'Machine', 'Smith Machine']),
                                                   ('High Row', ARRAY ['Machine', 'Cable']),
                                                   ('Low Row', ARRAY ['Machine', 'Cable']),
                                                   ('Pull Up', ARRAY ['Bodyweight', 'Machine', 'Weighted']),
                                                   ('Pull Down', ARRAY ['Machine', 'Cable']),
                                                   ('T-Bar Row', ARRAY ['Machine']),
                                                   ('Pullover',
                                                    ARRAY ['Dumbbell', 'Machine', 'Cable', 'EZ-Bar']), -- Added Dumbbell
                                                   ('Keenan Flaps', ARRAY ['Machine', 'Cable']),

                                                   -- Core
                                                   ('Plank', ARRAY ['Bodyweight', 'Weighted']),
                                                   ('Crunch', ARRAY ['Bodyweight', 'Weighted', 'Machine', 'Cable']),
                                                   ('Russian Twist', ARRAY ['Bodyweight', 'Weighted']),
                                                   ('Leg Raise', ARRAY ['Bodyweight']),

                                                   -- Glutes
                                                   ('Adductor', ARRAY ['Machine']),
                                                   ('Abductor', ARRAY ['Machine']),
                                                   ('Hip Thrust', ARRAY ['Barbell', 'Machine', 'Smith Machine']),

                                                   -- Quads
                                                   ('Squat',
                                                    ARRAY ['Barbell', 'Machine', 'Smith Machine', 'Bodyweight', 'Safety Bar']),
                                                   ('Sissy Squat', ARRAY ['Bodyweight', 'Weighted', 'Smith Machine']),
                                                   ('Goblet Squat',
                                                    ARRAY ['Kettlebell', 'Dumbbell', 'Cable']),        -- Added Kettlebell
                                                   ('Leg Extension', ARRAY ['Machine']),
                                                   ('Leg Press', ARRAY ['Machine']),
                                                   ('Bulgarian Split Squat',
                                                    ARRAY ['Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Safety Bar', 'Kettlebell', 'Smith Machine']),
                                                   ('Lunge',
                                                    ARRAY ['Dumbbell', 'Bodyweight', 'Machine', 'Kettlebell', 'Safety Bar', 'Smith Machine']),

                                                   -- Hamstrings
                                                   ('Seated Hamstring Curl', ARRAY ['Machine']),
                                                   ('Standing Hamstring Curl', ARRAY ['Machine']),
                                                   ('Lying Hamstring Curl',
                                                    ARRAY ['Machine', 'Dumbbell', 'Kettlebell']),
                                                   ('RDL',
                                                    ARRAY ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine']),
                                                   ('Deadlift',
                                                    ARRAY ['Barbell', 'Trap Bar', 'Machine', 'Smith Machine']),
                                                   ('Stiff Leg Deadlift',
                                                    ARRAY ['Barbell', 'Trap Bar', 'Machine', 'Smith Machine']),

                                                   -- Calves
                                                   ('Standing Calf Raise', ARRAY ['Machine', 'Bodyweight', 'Weighted']),
                                                   ('Seated Calf Raise', ARRAY ['Machine']),

                                                   -- Other/Strongman
                                                   ('Clean & Jerk', ARRAY ['Barbell']),
                                                   ('Clean', ARRAY ['Barbell']),
                                                   ('Snatch', ARRAY ['Barbell']),
                                                   ('Farmers Walk',
                                                    ARRAY ['Barbell','Dumbbell', 'Kettlebell', 'Trap Bar'])),
     flattened_exercises AS (SELECT type_name, unnest(variant_names) AS variant_name
                             FROM raw_config)
INSERT
INTO public.exercise (exercise_type_id, exercise_variant_id)
SELECT t.id, v.id
FROM flattened_exercises fe
         JOIN public.exercise_type t ON t.name = fe.type_name
         JOIN public.exercise_variant v ON v.name = fe.variant_name
ON CONFLICT DO NOTHING;