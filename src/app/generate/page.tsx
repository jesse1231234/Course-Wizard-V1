"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Loader2,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { useQuestionnaireStore } from "@/lib/store/questionnaire-store";
import { exportToIMSCC } from "@/lib/canvas/imscc-export";
import CoursePreview from "@/components/canvas-preview/CoursePreview";
import type { GeneratedCourse } from "@/types";

export default function GeneratePage() {
  const router = useRouter();
  const { answers, generatedCourse, setGeneratedCourse, reset } = useQuestionnaireStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Start generation on mount if no existing course
  useEffect(() => {
    if (!generatedCourse && Object.keys(answers).length > 0) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();
      setGeneratedCourse(data.course);
    } catch (err: any) {
      setError(err.message || "An error occurred during generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleExport = async () => {
    if (!generatedCourse) return;

    setIsExporting(true);

    try {
      const blob = await exportToIMSCC(generatedCourse);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${generatedCourse.title.replace(/[^a-zA-Z0-9]/g, "_")}.imscc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartOver = () => {
    if (confirm("Are you sure you want to start over? All your progress will be lost.")) {
      reset();
      router.push("/");
    }
  };

  // Redirect if no answers
  if (Object.keys(answers).length === 0 && !isGenerating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="card text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No Course Data</h2>
          <p className="text-slate-600 mb-4">
            Please complete the questionnaire before generating a course.
          </p>
          <Link href="/questionnaire" className="btn-primary">
            Start Questionnaire
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <div className="text-sm text-slate-500">Generate Course</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {generatedCourse ? "Your Canvas Course" : "Generating Course"}
          </h1>
          <p className="text-slate-600 mt-2">
            {generatedCourse
              ? "Review your generated course and export to Canvas."
              : "Please wait while we generate your course content..."}
          </p>
        </div>

        {/* Generating state */}
        {isGenerating && (
          <div className="card flex flex-col items-center py-16">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-6" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Generating Your Course
            </h2>
            <p className="text-slate-600 text-center max-w-md">
              Our AI is creating your complete course content including modules,
              assignments, rubrics, and quizzes. This may take a minute or two.
            </p>
            <div className="mt-6 w-full max-w-xs">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 animate-pulse bg-[length:200%_100%]" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isGenerating && (
          <div className="card bg-red-50 border-red-200 mb-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Generation Error</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={handleRegenerate} className="btn-primary">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <Link href="/review" className="btn-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Review
              </Link>
            </div>
          </div>
        )}

        {/* Success state with preview */}
        {generatedCourse && !isGenerating && (
          <>
            {/* Success banner */}
            <div className="card bg-emerald-50 border-emerald-200 mb-6">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Course Generated Successfully!</h3>
                  <p className="text-sm mt-1">
                    Your Canvas course is ready. Review it below and export when ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn-primary flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? "Exporting..." : "Export IMSCC for Canvas"}
              </button>

              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>

              <Link href="/review" className="btn-secondary flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Review
              </Link>
            </div>

            {/* Course preview */}
            <CoursePreview course={generatedCourse} />

            {/* Start over */}
            <div className="mt-12 pt-8 border-t border-slate-200 text-center">
              <button
                onClick={handleStartOver}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Start Over with a New Course
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
