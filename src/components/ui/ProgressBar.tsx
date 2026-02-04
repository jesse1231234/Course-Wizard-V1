"use client";

import { CheckCircle } from "lucide-react";

interface ProgressBarProps {
  sections: { id: string; title: string }[];
  currentIndex: number;
  completedSectionIds: string[];
  onSectionClick?: (index: number) => void;
}

export default function ProgressBar({
  sections,
  currentIndex,
  completedSectionIds,
  onSectionClick,
}: ProgressBarProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {sections.map((section, index) => {
          const isCompleted = completedSectionIds.includes(section.id);
          const isCurrent = index === currentIndex;
          const isClickable = isCompleted || index <= currentIndex;

          return (
            <li
              key={section.id}
              className={`relative flex-1 ${index !== sections.length - 1 ? "pr-8 sm:pr-20" : ""}`}
            >
              {/* Connector line */}
              {index !== sections.length - 1 && (
                <div
                  className="absolute top-4 left-6 -right-2 sm:-right-12 h-0.5"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full ${
                      isCompleted ? "bg-primary-600" : "bg-slate-200"
                    }`}
                  />
                </div>
              )}

              {/* Step indicator */}
              <button
                onClick={() => isClickable && onSectionClick?.(index)}
                disabled={!isClickable}
                className={`group relative flex items-center ${
                  isClickable ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <span className="flex items-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isCompleted
                        ? "bg-primary-600 text-white"
                        : isCurrent
                        ? "border-2 border-primary-600 bg-white text-primary-600"
                        : "border-2 border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                </span>

                <span className="ml-3 hidden sm:block">
                  <span
                    className={`text-sm font-medium ${
                      isCurrent
                        ? "text-primary-600"
                        : isCompleted
                        ? "text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    {section.title}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile section title */}
      <div className="mt-4 sm:hidden">
        <span className="text-sm font-medium text-primary-600">
          Step {currentIndex + 1}: {sections[currentIndex]?.title}
        </span>
      </div>
    </nav>
  );
}
