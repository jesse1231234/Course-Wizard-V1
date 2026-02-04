"use client";

import type { EvaluationResult } from "@/types";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface EvaluationFeedbackProps {
  result: EvaluationResult;
  compact?: boolean;
}

export default function EvaluationFeedback({
  result,
  compact = false,
}: EvaluationFeedbackProps) {
  const scorePercent = Math.round(result.overallScore * 100);
  const passedCount = result.criteriaResults.filter((c) => c.passed).length;
  const totalCount = result.criteriaResults.length;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          result.passed
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {result.passed ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <span>
          {scorePercent}% ({passedCount}/{totalCount} criteria)
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-4 ${
        result.passed
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-amber-50 border border-amber-200"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {result.passed ? (
          <CheckCircle className="h-6 w-6 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        )}
        <div>
          <div className="font-medium text-slate-900">
            {result.passed ? "Checkpoint Passed" : "Needs Improvement"}
          </div>
          <div className="text-sm text-slate-600">
            Score: {scorePercent}% • {passedCount}/{totalCount} criteria passed
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-700">{result.overallFeedback}</p>

      {!result.passed && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Areas needing attention:
          </p>
          {result.criteriaResults
            .filter((c) => !c.passed)
            .map((criterion) => (
              <div
                key={criterion.criterionId}
                className="flex items-start gap-2 text-sm text-amber-700"
              >
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{criterion.feedback}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
