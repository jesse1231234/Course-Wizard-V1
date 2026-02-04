"use client";

import { useState } from "react";
import type { GeneratedCourse, CanvasModule, CanvasModuleItem } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  ClipboardList,
  MessageSquare,
  HelpCircle,
  Layers,
} from "lucide-react";

interface CoursePreviewProps {
  course: GeneratedCourse;
}

function getItemIcon(type: CanvasModuleItem["type"]) {
  switch (type) {
    case "page":
      return <FileText className="h-4 w-4" />;
    case "assignment":
      return <ClipboardList className="h-4 w-4" />;
    case "discussion":
      return <MessageSquare className="h-4 w-4" />;
    case "quiz":
      return <HelpCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getItemTypeLabel(type: CanvasModuleItem["type"]) {
  switch (type) {
    case "page":
      return "Page";
    case "assignment":
      return "Assignment";
    case "discussion":
      return "Discussion";
    case "quiz":
      return "Quiz";
    default:
      return "Item";
  }
}

function ModuleItem({ item }: { item: CanvasModuleItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-400">{getItemIcon(item.type)}</span>
        <span className="flex-1 font-medium text-slate-900">{item.title}</span>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {getItemTypeLabel(item.type)}
        </span>
        {item.points && (
          <span className="text-xs text-slate-500">{item.points} pts</span>
        )}
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          {/* Content preview */}
          {item.content && (
            <div className="prose prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: item.content.slice(0, 1000) + (item.content.length > 1000 ? "..." : ""),
                }}
              />
            </div>
          )}

          {/* Discussion prompt */}
          {item.prompt && (
            <div className="text-sm text-slate-700">
              <strong className="text-slate-900">Prompt:</strong>{" "}
              {item.prompt}
            </div>
          )}

          {/* Rubric preview */}
          {item.rubric && (
            <div className="mt-4">
              <h4 className="font-medium text-slate-900 mb-2">
                Rubric: {item.rubric.title}
              </h4>
              <div className="space-y-2">
                {item.rubric.criteria.map((criterion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm p-2 bg-white rounded border border-slate-200"
                  >
                    <span className="text-slate-700">{criterion.description}</span>
                    <span className="text-slate-500">{criterion.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz questions preview */}
          {item.questions && item.questions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-slate-900 mb-2">
                Questions ({item.questions.length})
              </h4>
              <div className="space-y-2">
                {item.questions.slice(0, 3).map((question, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 bg-white rounded border border-slate-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {question.type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {question.points} pts
                      </span>
                    </div>
                    <p className="text-slate-700">{question.text}</p>
                  </div>
                ))}
                {item.questions.length > 3 && (
                  <p className="text-sm text-slate-500 italic">
                    + {item.questions.length - 3} more questions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleSection({ module }: { module: CanvasModule }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <Layers className="h-5 w-5 text-primary-600" />
        <span className="flex-1 font-semibold text-slate-900">{module.name}</span>
        <span className="text-sm text-slate-500">{module.items.length} items</span>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-2">
          {module.items.map((item) => (
            <ModuleItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursePreview({ course }: CoursePreviewProps) {
  const [showWelcome, setShowWelcome] = useState(false);

  // Count items by type
  const itemCounts = course.modules.reduce(
    (acc, module) => {
      for (const item of module.items) {
        acc[item.type] = (acc[item.type] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Course header */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900">{course.title}</h2>
        <p className="text-slate-600 mt-2">{course.description}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm">
            <span className="text-slate-500">Modules:</span>{" "}
            <span className="font-medium text-slate-900">{course.modules.length}</span>
          </div>
          {Object.entries(itemCounts).map(([type, count]) => (
            <div key={type} className="text-sm">
              <span className="text-slate-500">{getItemTypeLabel(type as any)}s:</span>{" "}
              <span className="font-medium text-slate-900">{count}</span>
            </div>
          ))}
        </div>

        {/* Welcome message toggle */}
        {course.welcomeMessage && (
          <div className="mt-4">
            <button
              onClick={() => setShowWelcome(!showWelcome)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              {showWelcome ? "Hide" : "Show"} Welcome Message
              {showWelcome ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {showWelcome && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: course.welcomeMessage }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Course Modules</h3>
        {course.modules.map((module) => (
          <ModuleSection key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}
