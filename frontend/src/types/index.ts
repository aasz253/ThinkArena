export interface User {
  id: string;
  email: string;
  username: string;
  role: "student" | "teacher" | "administrator";
  is_active: boolean;
  is_verified: boolean;
  profile?: UserProfile;
  created_at: string;
}

export interface UserProfile {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  xp: number;
  level: number;
  games_played: number;
  games_hosted: number;
  quizzes_created: number;
  total_score: number;
  highest_score: number;
  accuracy: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  is_public: boolean;
  difficulty: string;
  category_id?: string;
  creator_id: string;
  creator_name: string;
  time_per_question: number;
  points_per_question: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  play_count: number;
  likes: number;
  question_count: number;
  created_at: string;
  updated_at?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  explanation?: string;
  image_url?: string;
  order: number;
  points: number;
  time_limit: number;
  choices: Choice[];
}

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "checkbox"
  | "fill_in_blank"
  | "short_answer";

export interface Choice {
  id: string;
  choice_text: string;
  is_correct: boolean;
  order: number;
}

export interface Game {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  status: "waiting" | "live" | "finished";
  current_question: number;
  total_questions: number;
  started_at?: string;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  user_id?: string;
  nickname: string;
  score: number;
  streak: number;
  correct_count: number;
  total_answered: number;
  is_connected: boolean;
  joined_at: string;
}

export interface LeaderboardEntry {
  id: string;
  player_id: string;
  player_nickname: string;
  score: number;
  correct_count: number;
  total_questions: number;
  rank: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  unlocked_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  badge_type?: string;
  unlocked_at: string;
}
