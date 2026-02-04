import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  QuestionnaireState,
  QuestionnaireActions,
  EvaluationResult,
  GeneratedCourse,
  Section,
} from "@/types";

const initialState: QuestionnaireState = {
  currentSectionIndex: 0,
  answers: {},
  checkpointResults: {},
  completedSectionIds: [],
  generatedCourse: null,
};

export const useQuestionnaireStore = create<QuestionnaireState & QuestionnaireActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAnswer: (questionId: string, value: string | string[]) => {
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: value,
          },
        }));
      },

      setCurrentSection: (index: number) => {
        set({ currentSectionIndex: index });
      },

      markSectionComplete: (sectionId: string) => {
        set((state) => ({
          completedSectionIds: state.completedSectionIds.includes(sectionId)
            ? state.completedSectionIds
            : [...state.completedSectionIds, sectionId],
        }));
      },

      setCheckpointResult: (checkpointId: string, result: EvaluationResult) => {
        set((state) => ({
          checkpointResults: {
            ...state.checkpointResults,
            [checkpointId]: result,
          },
        }));
      },

      setGeneratedCourse: (course: GeneratedCourse) => {
        set({ generatedCourse: course });
      },

      reset: () => {
        set(initialState);
      },

      getAnswersForSection: (sectionId: string, sections: Section[]) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return {};

        const state = get();
        const sectionAnswers: Record<string, string | string[]> = {};

        for (const question of section.questions) {
          if (state.answers[question.id] !== undefined) {
            sectionAnswers[question.id] = state.answers[question.id];
          }
        }

        return sectionAnswers;
      },
    }),
    {
      name: "canvas-course-wizard-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
