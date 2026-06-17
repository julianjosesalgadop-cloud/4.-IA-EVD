-- Migration: Update calculate_evaluation_result trigger function to check category-level average for critical criteria
CREATE OR REPLACE FUNCTION calculate_evaluation_result(p_evaluation_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_overall_avg NUMERIC(4,2);
  v_result_status evaluation_result;
  v_category_scores JSONB := '{}';
  v_critical_fails JSONB := '[]';
  v_has_critical_fails BOOLEAN := false;
  v_pmi_required BOOLEAN := false;
  v_pmi_reason TEXT := '';
  v_version_id UUID;
  v_approved_threshold NUMERIC(3,1);
  v_pmi_threshold NUMERIC(3,1);
BEGIN
  -- Obtener version y umbrales
  SELECT ev.id, ev.approved_threshold, ev.pmi_threshold
  INTO v_version_id, v_approved_threshold, v_pmi_threshold
  FROM evaluations e
  JOIN evaluation_versions ev ON e.version_id = ev.id
  WHERE e.id = p_evaluation_id;

  -- Calcular promedio general ponderado
  SELECT ROUND(
    SUM(ea.score * COALESCE(eq.weight, 1.0)) / NULLIF(SUM(COALESCE(eq.weight, 1.0)), 0),
    2
  )
  INTO v_overall_avg
  FROM evaluation_answers ea
  JOIN evaluation_questions eq ON ea.question_id = eq.id
  WHERE ea.evaluation_id = p_evaluation_id;

  -- Calcular promedios por categoría
  SELECT jsonb_object_agg(cat_id, cat_data)
  INTO v_category_scores
  FROM (
    SELECT
      ec.id::TEXT AS cat_id,
      jsonb_build_object(
        'name', ec.name,
        'average', ROUND(AVG(ea.score), 2),
        'count', COUNT(*)
      ) AS cat_data
    FROM evaluation_answers ea
    JOIN evaluation_questions eq ON ea.question_id = eq.id
    JOIN evaluation_categories ec ON eq.category_id = ec.id
    WHERE ea.evaluation_id = p_evaluation_id
    GROUP BY ec.id, ec.name
  ) cats;

  -- Detectar incumplimientos críticos por promedio de categoría
  SELECT jsonb_agg(fail_data)
  INTO v_critical_fails
  FROM (
    SELECT jsonb_build_object(
      'question_id', ec.id, -- map category_id to question_id for frontend compatibility
      'question', ec.name,  -- map category_name to question for frontend compatibility
      'score', ROUND(AVG(ea.score), 2),
      'min_required', 4.00
    ) AS fail_data
    FROM evaluation_answers ea
    JOIN evaluation_questions eq ON ea.question_id = eq.id
    JOIN evaluation_categories ec ON eq.category_id = ec.id
    WHERE ea.evaluation_id = p_evaluation_id
    GROUP BY ec.id, ec.name
    HAVING ec.id IN (
      SELECT DISTINCT category_id 
      FROM evaluation_questions 
      WHERE is_critical = true
    ) AND AVG(ea.score) < 4.00
  ) fails;

  v_has_critical_fails := (v_critical_fails IS NOT NULL AND jsonb_array_length(COALESCE(v_critical_fails, '[]')) > 0);

  -- Determinar resultado
  IF v_overall_avg >= v_approved_threshold THEN
    v_result_status := 'aprobado';
    v_pmi_required := false;
  ELSIF v_overall_avg >= v_pmi_threshold THEN
    v_result_status := 'plan_mejoramiento';
    v_pmi_required := true;
    v_pmi_reason := 'Promedio general entre 3.1 y 3.9';
  ELSE
    v_result_status := 'no_aprobado';
    v_pmi_required := true;
    v_pmi_reason := 'Promedio general inferior a 3.1';
  END IF;

  -- Criterios críticos generan PMI aunque el promedio sea aprobado (se cambia a plan_mejoramiento)
  IF v_has_critical_fails THEN
    v_pmi_required := true;
    IF v_result_status = 'aprobado' THEN
      v_result_status := 'plan_mejoramiento';
      v_pmi_reason := 'Incumplimiento de criterio(s) crítico(s)';
    ELSE
      v_pmi_reason := v_pmi_reason || '. Además: incumplimiento de criterio(s) crítico(s)';
    END IF;
  END IF;

  -- Insertar o actualizar resultado
  INSERT INTO evaluation_results (
    evaluation_id, overall_average, result, category_scores,
    has_critical_fails, critical_fails_detail, pmi_required, pmi_reason,
    calculated_at
  ) VALUES (
    p_evaluation_id, v_overall_avg, v_result_status, v_category_scores,
    v_has_critical_fails, COALESCE(v_critical_fails, '[]'),
    v_pmi_required, v_pmi_reason, NOW()
  )
  ON CONFLICT (evaluation_id) DO UPDATE SET
    overall_average = EXCLUDED.overall_average,
    result = EXCLUDED.result,
    category_scores = EXCLUDED.category_scores,
    has_critical_fails = EXCLUDED.has_critical_fails,
    critical_fails_detail = EXCLUDED.critical_fails_detail,
    pmi_required = EXCLUDED.pmi_required,
    pmi_reason = EXCLUDED.pmi_reason,
    calculated_at = EXCLUDED.calculated_at;

  -- Marcar respuestas críticas fallidas
  UPDATE evaluation_answers ea
  SET is_critical_fail = true
  FROM evaluation_questions eq
  WHERE ea.question_id = eq.id
    AND ea.evaluation_id = p_evaluation_id
    AND eq.is_critical = true
    AND ea.score < eq.min_score_required;

  RETURN jsonb_build_object(
    'overall_average', v_overall_avg,
    'result', v_result_status,
    'pmi_required', v_pmi_required,
    'has_critical_fails', v_has_critical_fails
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
