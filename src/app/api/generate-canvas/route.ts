import { NextRequest, NextResponse } from "next/server";
import { generateJSONResponse } from "@/lib/llm/client";
import {
  buildCanvasGenerationSystemPrompt,
  buildCanvasGenerationUserPrompt,
} from "@/lib/llm/prompts";
import type { GeneratedCourse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Missing required field: answers" },
        { status: 400 }
      );
    }

    // Build prompts
    const systemPrompt = buildCanvasGenerationSystemPrompt();
    const userPrompt = buildCanvasGenerationUserPrompt(answers);

    // Call LLM with higher token limit for course generation
    // Using 16000 to allow for comprehensive course content
    const course = await generateJSONResponse<GeneratedCourse>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 16000 }
    );

    // Validate the response structure
    if (!course.title || !course.modules || !Array.isArray(course.modules)) {
      throw new Error("Invalid course structure returned from LLM");
    }

    // Ensure all modules have required fields
    course.modules = course.modules.map((module, moduleIndex) => ({
      id: module.id || `module-${moduleIndex + 1}`,
      name: module.name || `Module ${moduleIndex + 1}`,
      position: module.position ?? moduleIndex + 1,
      items: (module.items || []).map((item, itemIndex) => ({
        id: item.id || `item-${moduleIndex + 1}-${itemIndex + 1}`,
        type: item.type || "page",
        title: item.title || `Item ${itemIndex + 1}`,
        content: item.content,
        position: item.position ?? itemIndex + 1,
        points: item.points,
        rubric: item.rubric,
        questions: item.questions,
        prompt: item.prompt,
      })),
    }));

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error("Canvas generation error:", error);
    return NextResponse.json(
      { error: error.message || "Course generation failed" },
      { status: 500 }
    );
  }
}
