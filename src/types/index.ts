// Question types
export type QuestionType = "text" | "textarea" | "select" | "multiselect" | "number";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: QuestionOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  checkpointId?: string; // If present, triggers checkpoint after this section
}

// Checkpoint/Rubric types
export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  evaluationPrompt: string;
  weight: number;
}

export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  afterSectionId: string;
  rubric: RubricCriterion[];
  passingThreshold: number; // 0-1, e.g., 0.75 for 75%
}

// Evaluation types
export interface CriterionResult {
  criterionId: string;
  passed: boolean;
  score: number; // 0-1
  feedback: string;
  suggestions?: string[];
}

export interface EvaluationResult {
  checkpointId: string;
  passed: boolean;
  overallScore: number; // 0-1
  criteriaResults: CriterionResult[];
  overallFeedback: string;
  timestamp: string;
}

// Canvas generation types
export interface CanvasModule {
  id: string;
  name: string;
  position: number;
  items: CanvasModuleItem[];
}

export interface CanvasModuleItem {
  id: string;
  type: "page" | "assignment" | "discussion" | "quiz" | "file" | "header";
  title: string;
  content?: string;
  position: number;
  // Assignment-specific
  points?: number;
  dueDate?: string;
  rubric?: CanvasRubric;
  // Quiz-specific
  questions?: QuizQuestion[];
  // Discussion-specific
  prompt?: string;
}

export interface CanvasRubric {
  title: string;
  criteria: CanvasRubricCriterion[];
}

export interface CanvasRubricCriterion {
  description: string;
  points: number;
  ratings: {
    description: string;
    points: number;
  }[];
}

export interface QuizQuestion {
  type: "multiple_choice" | "short_answer" | "essay";
  text: string;
  points: number;
  answers?: {
    text: string;
    correct: boolean;
  }[];
}

export interface GeneratedCourse {
  title: string;
  description: string;
  welcomeMessage: string;
  modules: CanvasModule[];
}

// Store types
export interface QuestionnaireState {
  currentSectionIndex: number;
  answers: Record<string, string | string[]>;
  checkpointResults: Record<string, EvaluationResult>;
  completedSectionIds: string[];
  generatedCourse: GeneratedCourse | null;
}

export interface QuestionnaireActions {
  setAnswer: (questionId: string, value: string | string[]) => void;
  setCurrentSection: (index: number) => void;
  markSectionComplete: (sectionId: string) => void;
  setCheckpointResult: (checkpointId: string, result: EvaluationResult) => void;
  setGeneratedCourse: (course: GeneratedCourse) => void;
  reset: () => void;
  getAnswersForSection: (sectionId: string, sections: Section[]) => Record<string, string | string[]>;
}

// API types
export interface EvaluateRequest {
  checkpointId: string;
  sectionId: string;
  answers: Record<string, string | string[]>;
}

export interface EvaluateResponse {
  result: EvaluationResult;
}

export interface GenerateCanvasRequest {
  answers: Record<string, string | string[]>;
  checkpointResults: Record<string, EvaluationResult>;
}

export interface GenerateCanvasResponse {
  course: GeneratedCourse;
}
