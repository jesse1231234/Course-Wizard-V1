import { NextRequest, NextResponse } from "next/server";
import { generateJSONResponse } from "@/lib/llm/client";
import {
  buildCourseStructureSystemPrompt,
  buildCourseStructureUserPrompt,
  buildModuleContentSystemPrompt,
  buildModuleContentUserPrompt,
} from "@/lib/llm/prompts";
import type { GeneratedCourse, CanvasModule, CanvasModuleItem } from "@/types";

// Types for chunked generation
interface CourseStructure {
  title: string;
  description: string;
  welcomeMessage: string;
  modules: Array<{
    id: string;
    name: string;
    position: number;
    items: Array<{
      id: string;
      type: string;
      title: string;
      position: number;
    }>;
  }>;
}

interface ModuleContentResponse {
  moduleId: string;
  items: CanvasModuleItem[];
}

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

    // STEP 1: Generate course structure (lightweight, fast)
    console.log("Step 1: Generating course structure...");
    const structureSystemPrompt = buildCourseStructureSystemPrompt();
    const structureUserPrompt = buildCourseStructureUserPrompt(answers);

    const structure = await generateJSONResponse<CourseStructure>(
      [
        { role: "system", content: structureSystemPrompt },
        { role: "user", content: structureUserPrompt },
      ],
      { temperature: 0.7, maxTokens: 4000 }
    );

    // Validate structure
    if (!structure.title || !structure.modules || !Array.isArray(structure.modules)) {
      throw new Error("Invalid course structure returned from LLM");
    }

    console.log(`Structure generated: ${structure.modules.length} modules`);

    // STEP 2: Generate content for each module
    const modulesWithContent: CanvasModule[] = [];

    for (let i = 0; i < structure.modules.length; i++) {
      const moduleStructure = structure.modules[i];
      console.log(`Step 2.${i + 1}: Generating content for module "${moduleStructure.name}"...`);

      const contentSystemPrompt = buildModuleContentSystemPrompt();
      const contentUserPrompt = buildModuleContentUserPrompt(
        answers,
        moduleStructure,
        structure.title
      );

      const moduleContent = await generateJSONResponse<ModuleContentResponse>(
        [
          { role: "system", content: contentSystemPrompt },
          { role: "user", content: contentUserPrompt },
        ],
        { temperature: 0.7, maxTokens: 8000 }
      );

      // Merge structure with content
      const moduleWithContent: CanvasModule = {
        id: moduleStructure.id,
        name: moduleStructure.name,
        position: moduleStructure.position,
        items: moduleContent.items.map((item, itemIndex) => ({
          id: item.id || `${moduleStructure.id}-item-${itemIndex + 1}`,
          type: item.type || "page",
          title: item.title || `Item ${itemIndex + 1}`,
          content: item.content,
          position: item.position ?? itemIndex + 1,
          points: item.points,
          rubric: item.rubric,
          questions: item.questions,
          prompt: item.prompt,
        })),
      };

      modulesWithContent.push(moduleWithContent);
    }

    // STEP 3: Assemble final course
    const course: GeneratedCourse = {
      title: structure.title,
      description: structure.description,
      welcomeMessage: structure.welcomeMessage,
      modules: modulesWithContent,
    };

    console.log("Course generation complete!");
    return NextResponse.json({ course });
  } catch (error: any) {
    console.error("Canvas generation error:", error);
    return NextResponse.json(
      { error: error.message || "Course generation failed" },
      { status: 500 }
    );
  }
}
