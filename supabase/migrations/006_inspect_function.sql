CREATE TABLE IF NOT EXISTS inspect_function_def (
  id SERIAL PRIMARY KEY,
  name TEXT,
  definition TEXT
);

TRUNCATE TABLE inspect_function_def;

INSERT INTO inspect_function_def (name, definition)
SELECT proname, prosrc FROM pg_proc WHERE proname = 'calculate_evaluation_result';
