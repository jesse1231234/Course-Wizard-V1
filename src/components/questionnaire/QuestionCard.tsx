"use client";

import { useState } from "react";
import type { Question } from "@/types";
import { AlertCircle } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
}

export default function QuestionCard({
  question,
  value,
  onChange,
  error,
}: QuestionCardProps) {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => setTouched(true);

  const showError = touched && error;

  return (
    <div className="mb-6">
      <label className="label">
        {question.label}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {question.description && (
        <p className="text-sm text-slate-500 mb-2">{question.description}</p>
      )}

      {question.type === "text" && (
        <input
          type="text"
          className={`input ${showError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          placeholder={question.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
        />
      )}

      {question.type === "number" && (
        <input
          type="number"
          className={`input ${showError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          placeholder={question.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          min={question.validation?.min}
          max={question.validation?.max}
        />
      )}

      {question.type === "textarea" && (
        <textarea
          className={`textarea min-h-[120px] ${showError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          placeholder={question.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          rows={5}
        />
      )}

      {question.type === "select" && question.options && (
        <select
          className={`input ${showError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
        >
          <option value="">Select an option...</option>
          {question.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {question.type === "multiselect" && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => {
            const selectedValues = Array.isArray(value) ? value : [];
            const isChecked = selectedValues.includes(option.value);

            return (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option.value));
                    }
                  }}
                />
                <span className="text-sm text-slate-700">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {showError && (
        <div className="flex items-center gap-1.5 mt-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {question.validation && (
        <div className="mt-1.5 text-xs text-slate-400">
          {question.validation.minLength && (
            <span>Min {question.validation.minLength} characters</span>
          )}
          {question.validation.minLength && question.validation.maxLength && (
            <span> • </span>
          )}
          {question.validation.maxLength && (
            <span>Max {question.validation.maxLength} characters</span>
          )}
        </div>
      )}
    </div>
  );
}
