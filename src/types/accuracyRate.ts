export interface AccuracyRate {
  problem_id: string;
  correct_answer: string;
  difficulty: string;
  score: number;
  accuracy_rate: number;
  selection_rates: Record<string, number>;
  created_at: string;
  updated_at: string;
}
