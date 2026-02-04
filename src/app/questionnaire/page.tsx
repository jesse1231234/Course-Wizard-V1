"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";

import { useQuestionnaireStore } from "@/lib/store/questionnaire-store";
import { sections } from "@/config/questions";
import { getCheckpointForSection } from "@/config/checkpoints";

import ProgressBar from "@/components/ui/ProgressBar";
import QuestionCard from "@/components/questionnaire/QuestionCard";
import GateCheckpoint from "@/components/questionnaire/GateCheckpoint";
import EvaluationFeedback from "@/components/questionnaire/EvaluationFeedback";
import type { EvaluationResult } from "@/types";

export default function QuestionnairePage() {
  const router = useRouter();

  const {
    currentSectionIndex,
    answers,
    checkpointResults,
    completedSectionIds,
    setAnswer,
    setCurrentSection,
    markSectionComplete,
    setCheckpointResult,
    getAnswersForSection,
  } = useQuestionnaireStore();

  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const currentSection = sections[currentSectionIndex];
  const checkpoint = currentSection ? getCheckpointForSection(currentSection.id) : null;
  const existingCheckpointResult = checkpoint
    ? checkpointResults[checkpoint.id]
    : null;

  // Validate a single question
  const validateQuestion = (questionId: string, value: string | string[]): string | null => {
    const question = currentSection?.questions.find((q) => q.id === questionId);
    if (!question) return null;

    const stringValue = Array.isArray(value) ? value.join("") : value;

    if (question.required && (!stringValue || stringValue.trim() === "")) {
      return "This field is required";
    }

    if (question.validation?.minLength && stringValue.length < question.validation.minLength) {
      return `Minimum ${question.validation.minLength} characters required`;
    }

    if (question.validation?.maxLength && stringValue.length > question.validation.maxLength) {
      return `Maximum ${question.validation.maxLength} characters allowed`;
    }

    if (question.type === "multiselect" && question.required) {
      if (!Array.isArray(value) || value.length === 0) {
        return "Please select at least one option";
      }
    }

    return null;
  };

  // Validate all questions in current section
  const validateSection = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const question of currentSection?.questions || []) {
      const value = answers[question.id] || "";
      const error = validateQuestion(question.id, value);
      if (error) {
        errors[question.id] = error;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Section answers for checkpoint
  const sectionAnswers = useMemo(() => {
    if (!currentSection) return {};
    return getAnswersForSection(currentSection.id, sections);
  }, [currentSection, getAnswersForSection, answers]);

  // Handle continue button
  const handleContinue = () => {
    if (!validateSection()) {
      return;
    }

    // If there's a checkpoint and we haven't passed it yet
    if (checkpoint && !existingCheckpointResult?.passed) {
      setShowCheckpoint(true);
      return;
    }

    // Mark current section complete and move to next
    markSectionComplete(currentSection.id);

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSection(currentSectionIndex + 1);
      setShowCheckpoint(false);
    } else {
      // All sections complete, go to review
      router.push("/review");
    }
  };

  // Handle going back
  const handleBack = () => {
    if (showCheckpoint) {
      setShowCheckpoint(false);
      return;
    }

    if (currentSectionIndex > 0) {
      setCurrentSection(currentSectionIndex - 1);
    }
  };

  // Handle checkpoint completion
  const handleCheckpointComplete = (result: EvaluationResult) => {
    if (checkpoint) {
      setCheckpointResult(checkpoint.id, result);
    }
  };

  // Handle proceeding after checkpoint
  const handleProceed = () => {
    markSectionComplete(currentSection.id);

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSection(currentSectionIndex + 1);
      setShowCheckpoint(false);
    } else {
      router.push("/review");
    }
  };

  // Handle revising after failed checkpoint
  const handleRevise = () => {
    setShowCheckpoint(false);
  };

  // Handle section click in progress bar
  const handleSectionClick = (index: number) => {
    // Can only go back to completed sections or current
    if (index <= currentSectionIndex || completedSectionIds.includes(sections[index]?.id)) {
      setCurrentSection(index);
      setShowCheckpoint(false);
    }
  };

  if (!currentSection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

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
            <div className="text-sm text-slate-500">
              Section {currentSectionIndex + 1} of {sections.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress bar */}
        <ProgressBar
          sections={sections.map((s) => ({ id: s.id, title: s.title }))}
          currentIndex={currentSectionIndex}
          completedSectionIds={completedSectionIds}
          onSectionClick={handleSectionClick}
        />

        {/* Section content or checkpoint */}
        {showCheckpoint && checkpoint ? (
          <GateCheckpoint
            checkpoint={checkpoint}
            sectionId={currentSection.id}
            answers={sectionAnswers}
            onEvaluationComplete={handleCheckpointComplete}
            onProceed={handleProceed}
            onRevise={handleRevise}
            existingResult={existingCheckpointResult || undefined}
          />
        ) : (
          <>
            {/* Section header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                {currentSection.title}
              </h1>
              <p className="text-slate-600 mt-2">{currentSection.description}</p>

              {/* Show existing checkpoint result if any */}
              {existingCheckpointResult && (
                <div className="mt-4">
                  <EvaluationFeedback result={existingCheckpointResult} compact />
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="card mb-8">
              {currentSection.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  value={answers[question.id] || ""}
                  onChange={(value) => {
                    setAnswer(question.id, value);
                    // Clear validation error when user types
                    if (validationErrors[question.id]) {
                      setValidationErrors((prev) => {
                        const updated = { ...prev };
                        delete updated[question.id];
                        return updated;
                      });
                    }
                  }}
                  error={validationErrors[question.id]}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentSectionIndex === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={handleContinue}
                className="btn-primary flex items-center gap-2"
              >
                {currentSectionIndex === sections.length - 1 ? (
                  "Review & Generate"
                ) : checkpoint ? (
                  "Continue to Checkpoint"
                ) : (
                  "Continue"
                )}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
