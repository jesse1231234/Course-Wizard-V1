"use client";

import Link from "next/link";
import { BookOpen, CheckCircle, Sparkles, Download } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Canvas Course Wizard
          </h1>
          <p className="mt-4 text-xl text-primary-100 max-w-2xl">
            Design your course with AI-powered guidance. Answer questions about your course,
            receive feedback on your learning design, and generate a ready-to-import Canvas shell.
          </p>
          <div className="mt-8">
            <Link
              href="/questionnaire"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-lg font-semibold text-primary-700 shadow-lg hover:bg-primary-50 transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              Start Building Your Course
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="card">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">1. Answer Questions</h3>
            <p className="text-sm text-slate-600">
              Tell us about your course: objectives, structure, assessments, and content.
            </p>
          </div>

          <div className="card">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">2. Get Feedback</h3>
            <p className="text-sm text-slate-600">
              AI evaluates your design against best practices and provides suggestions.
            </p>
          </div>

          <div className="card">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">3. Generate Content</h3>
            <p className="text-sm text-slate-600">
              AI creates full course content: pages, assignments, rubrics, and quizzes.
            </p>
          </div>

          <div className="card">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">4. Import to Canvas</h3>
            <p className="text-sm text-slate-600">
              Download your course package and import directly into Canvas LMS.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Rubric-Based Evaluation</div>
                <div className="text-sm text-slate-600">
                  Your course design is evaluated against proven instructional design criteria
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Full Content Generation</div>
                <div className="text-sm text-slate-600">
                  AI writes actual lesson content, not just placeholders
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Canvas-Ready Export</div>
                <div className="text-sm text-slate-600">
                  Download IMSCC package that imports directly into Canvas
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Session Persistence</div>
                <div className="text-sm text-slate-600">
                  Your progress is saved automatically during your session
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-slate-500">
          Canvas Course Wizard • AI-Powered Course Design
        </div>
      </footer>
    </main>
  );
}
