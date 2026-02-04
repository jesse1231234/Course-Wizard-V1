"use client";

import { useState } from "react";
import type { Checkpoint, EvaluationResult } from "@/types";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";

interface GateCheckpointProps {
  checkpoint: Checkpoint;
  sectionId: string;
  answers: Record<string, string | string[]>;
  onEvaluationComplete: (result: EvaluationResult) => void;
  onProceed: () => void;
  onRevise: () => void;
  existingResult?: EvaluationResult;
}

export default function GateCheckpoint({
  checkpoint,
  sectionId,
  answers,
  onEvaluationComplete,
  onProceed,
  onRevise,
  existingResult,
}: GateCheckpointProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(existingResult || null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<string[]>([]);

  const toggleCriterion = (id: string) => {
    setExpandedCriteria((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointId: checkpoint.id,
          sectionId,
          answers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Evaluation failed");
      }

      const data = await response.json();
      setResult(data.result);
      onEvaluationComplete(data.result);

      // Expand failed criteria by default
      const failedIds = data.result.criteriaResults
        .filter((c: any) => !c.passed)
        .map((c: any) => c.criterionId);
      setExpandedCriteria(failedIds);
    } catch (err: any) {
      setError(err.message || "An error occurred during evaluation");
    } finally {
      setIsEvaluating(false);
    }
  };

  const passedCount = result?.criteriaResults.filter((c) => c.passed).length || 0;
  const totalCount = result?.criteriaResults.length || checkpoint.rubric.length;
  const scorePercent = result ? Math.round(result.overallScore * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            result
              ? result.passed
                ? "bg-emerald-100 text-emerald-600"
                : scorePercent >= checkpoint.passingThreshold * 100 * 0.5
                ? "bg-amber-100 text-amber-600"
                : "bg-red-100 text-red-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {result ? (
            result.passed ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )
          ) : (
            <Lightbulb className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {checkpoint.name}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {checkpoint.description}
          </p>
        </div>
      </div>

      {!result && !isEvaluating && (
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-600">
            Before proceeding, your responses will be evaluated against{" "}
            {checkpoint.rubric.length} criteria. You need to pass at least{" "}
            {Math.round(checkpoint.passingThreshold * 100)}% to continue.
          </p>
        </div>
      )}

      {isEvaluating && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
          <p className="text-sm text-slate-600">Evaluating your responses...</p>
          <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Evaluation Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={handleEvaluate}
            className="btn-secondary mt-3 text-red-700 border-red-300 hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      )}

      {result && (
        <>
          {/* Score summary */}
          <div
            className={`rounded-xl p-4 mb-6 ${
              result.passed
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-900">Overall Score</span>
              <span
                className={`text-lg font-bold ${
                  result.passed ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {scorePercent}%
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  result.passed ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>

            <p className="text-sm text-slate-600">
              {passedCount} of {totalCount} criteria passed (
              {Math.round(checkpoint.passingThreshold * 100)}% required)
            </p>
          </div>

          {/* Overall feedback */}
          <div className="mb-6">
            <h4 className="font-medium text-slate-900 mb-2">Feedback</h4>
            <p className="text-sm text-slate-700">{result.overallFeedback}</p>
          </div>

          {/* Criteria details */}
          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-slate-900">Criteria Details</h4>

            {result.criteriaResults.map((criterion) => {
              const rubricItem = checkpoint.rubric.find(
                (r) => r.id === criterion.criterionId
              );
              const isExpanded = expandedCriteria.includes(criterion.criterionId);

              return (
                <div
                  key={criterion.criterionId}
                  className={`border rounded-xl overflow-hidden ${
                    criterion.passed
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  <button
                    onClick={() => toggleCriterion(criterion.criterionId)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {criterion.passed ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-600" />
                      )}
                      <span className="font-medium text-slate-900">
                        {rubricItem?.name || criterion.criterionId}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-slate-200/50">
                      <p className="text-sm text-slate-700 mt-3">
                        {criterion.feedback}
                      </p>

                      {criterion.suggestions && criterion.suggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">
                            Suggestions:
                          </p>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {criterion.suggestions.map((suggestion, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary-500">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {result.passed ? (
              <button onClick={onProceed} className="btn-primary flex-1">
                Continue to Next Section
              </button>
            ) : (
              <>
                <button onClick={onRevise} className="btn-secondary flex-1">
                  Revise Answers
                </button>
                {scorePercent >= checkpoint.passingThreshold * 100 && (
                  <button onClick={onProceed} className="btn-primary flex-1">
                    Continue Anyway
                  </button>
                )}
              </>
            )}
          </div>

          {!result.passed && scorePercent >= checkpoint.passingThreshold * 100 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              You met the minimum threshold but there's room for improvement.
            </p>
          )}
        </>
      )}

      {!result && !isEvaluating && !error && (
        <button onClick={handleEvaluate} className="btn-primary w-full">
          Evaluate My Responses
        </button>
      )}
    </div>
  );
}
