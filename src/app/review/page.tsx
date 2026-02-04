"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Home, Edit2, CheckCircle, AlertTriangle } from "lucide-react";

import { useQuestionnaireStore } from "@/lib/store/questionnaire-store";
import { sections } from "@/config/questions";
import { checkpoints } from "@/config/checkpoints";
import EvaluationFeedback from "@/components/questionnaire/EvaluationFeedback";

export default function ReviewPage() {
  const router = useRouter();
  const { answers, checkpointResults, setCurrentSection } = useQuestionnaireStore();

  // Check if all required sections are complete
  const completionStatus = useMemo(() => {
    const status: { sectionId: string; complete: boolean; missingQuestions: string[] }[] = [];

    for (const section of sections) {
      const missingQuestions: string[] = [];

      for (const question of section.questions) {
        if (question.required) {
          const answer = answers[question.id];
          const isEmpty =
            !answer ||
            (typeof answer === "string" && answer.trim() === "") ||
            (Array.isArray(answer) && answer.length === 0);

          if (isEmpty) {
            missingQuestions.push(question.label);
          }
        }
      }

      status.push({
        sectionId: section.id,
        complete: missingQuestions.length === 0,
        missingQuestions,
      });
    }

    return status;
  }, [answers]);

  const allComplete = completionStatus.every((s) => s.complete);

  // Group answers by section
  const answersBySection = useMemo(() => {
    return sections.map((section) => {
      const sectionAnswers: { questionLabel: string; value: string | string[] }[] = [];

      for (const question of section.questions) {
        const value = answers[question.id];
        if (value !== undefined && value !== "") {
          sectionAnswers.push({
            questionLabel: question.label,
            value,
          });
        }
      }

      const checkpoint = checkpoints.find((c) => c.afterSectionId === section.id);
      const checkpointResult = checkpoint ? checkpointResults[checkpoint.id] : undefined;

      return {
        section,
        answers: sectionAnswers,
        checkpointResult,
        status: completionStatus.find((s) => s.sectionId === section.id),
      };
    });
  }, [answers, checkpointResults, completionStatus]);

  const handleEditSection = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    router.push("/questionnaire");
  };

  const handleGenerate = () => {
    router.push("/generate");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <div className="text-sm text-slate-500">Review & Generate</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Review Your Course Design</h1>
          <p className="text-slate-600 mt-2">
            Review your responses before generating the Canvas course. You can edit any section.
          </p>
        </div>

        {/* Completion status */}
        {!allComplete && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <AlertTriangle className="h-5 w-5" />
              Some sections are incomplete
            </div>
            <p className="text-sm text-amber-600 mt-1">
              Please complete all required fields before generating your course.
            </p>
          </div>
        )}

        {/* Sections review */}
        <div className="space-y-6">
          {answersBySection.map(({ section, answers: sectionAnswers, checkpointResult, status }, index) => (
            <div key={section.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {section.title}
                    </h2>
                    {status?.complete ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  {!status?.complete && status?.missingQuestions && (
                    <p className="text-sm text-amber-600 mt-1">
                      Missing: {status.missingQuestions.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleEditSection(index)}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </div>

              {/* Checkpoint result */}
              {checkpointResult && (
                <div className="mb-4">
                  <EvaluationFeedback result={checkpointResult} compact />
                </div>
              )}

              {/* Answers preview */}
              {sectionAnswers.length > 0 ? (
                <div className="space-y-3">
                  {sectionAnswers.map(({ questionLabel, value }) => (
                    <div key={questionLabel} className="border-l-2 border-slate-200 pl-3">
                      <div className="text-sm font-medium text-slate-700">
                        {questionLabel}
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        {Array.isArray(value) ? value.join(", ") : (
                          value.length > 200 ? `${value.slice(0, 200)}...` : value
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No responses yet</p>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link href="/questionnaire" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </Link>

          <button
            onClick={handleGenerate}
            disabled={!allComplete}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Canvas Course
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {!allComplete && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Complete all sections to enable course generation
          </p>
        )}
      </main>
    </div>
  );
}
