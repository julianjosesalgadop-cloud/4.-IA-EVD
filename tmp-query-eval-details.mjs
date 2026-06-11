import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envFile = path.resolve(process.cwd(), '.env.local');
const env = fs.readFileSync(envFile, 'utf8');
const vars = Object.fromEntries(env.split(/\r?\n/).filter(Boolean).map(line => line.split('=', 2)));

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const query = async () => {
  const evaluationId = "a50cd5b6-1b85-48b5-8407-5a41633fae64";
  const { data, error } = await supabase
    .from("evaluations")
    .select(`
      *,
      collaborator:collaborators(
        id,
        full_name,
        document_type,
        document_number,
        position_id,
        area_id,
        email,
        workplace_city,
        workplace,
        contract_type,
        hire_date,
        status,
        position:positions(name),
        areas:areas(name)
      ),
      evaluator:profiles!evaluations_evaluator_id_fkey(first_name, last_name, email, role:roles(display_name)),
      version:evaluation_versions(name),
      result:evaluation_results(*),
      answers:evaluation_answers(
        question_id,
        category_id,
        score,
        comment,
        question:evaluation_questions(question, code, is_critical)
      )
    `)
    .eq("id", evaluationId)
    .single();

  console.log('error:', error);
  if (data) {
    console.log('collaborator:', JSON.stringify(data.collaborator, null, 2));
    console.log('evaluator:', JSON.stringify(data.evaluator, null, 2));
    console.log('result:', JSON.stringify(data.result, null, 2));
    console.log('version:', JSON.stringify(data.version, null, 2));
    console.log('answers count:', data.answers?.length);
    if (data.answers?.length > 0) {
      console.log('first answer sample:', JSON.stringify(data.answers[0], null, 2));
    }
  }
};

query().catch((err) => {
  console.error(err);
  process.exit(1);
});
