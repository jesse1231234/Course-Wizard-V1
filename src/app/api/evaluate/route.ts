import { NextRequest, NextResponse } from "next/server";
import { generateJSONResponse } from "@/lib/llm/client";
import {
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
} from "@/lib/llm/prompts";
import { getCheckpointById } from "@/config/checkpoints";
import type { EvaluationResult, CriterionResult } from "@/types";

interface EvaluationLLMResponse {
  overallScore: number;
  overallFeedback: string;
  criteriaResults: {
    criterionId: string;
    passed: boolean;
    score: number;
    feedback: string;
    suggestions?: string[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkpointId, sectionId, answers } = body;

    if (!checkpointId || !sectionId || !answers) {
      return NextResponse.json(
        { error: "Missing required fields: checkpointId, sectionId, answers" },
        { status: 400 }
      );
    }

    // Get checkpoint configuration
    const checkpoint = getCheckpointById(checkpointId);
    if (!checkpoint) {
      return NextResponse.json(
        { error: `Checkpoint not found: ${checkpointId}` },
        { status: 404 }
      );
    }

    // Build prompts
    const systemPrompt = buildEvaluationSystemPrompt();
    const userPrompt = buildEvaluationUserPrompt(checkpoint, answers);

    // Call LLM
    const llmResponse = await generateJSONResponse<EvaluationLLMResponse>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 2000 }
    );

    // Validate and normalize the response
    const criteriaResults: CriterionResult[] = llmResponse.criteriaResults.map(
      (cr) => ({
        criterionId: cr.criterionId,
        passed: cr.passed ?? cr.score >= 0.7,
        score: Math.max(0, Math.min(1, cr.score)),
        feedback: cr.feedback || "No feedback provided",
        suggestions: cr.suggestions,
      })
    );

    // Calculate weighted overall score if not provided or invalid
    let overallScore = llmResponse.overallScore;
    if (typeof overallScore !== "number" || overallScore < 0 || overallScore > 1) {
      const totalWeight = checkpoint.rubric.reduce((sum, c) => sum + c.weight, 0);
      overallScore = criteriaResults.reduce((sum, cr) => {
        const criterion = checkpoint.rubric.find((c) => c.id === cr.criterionId);
        const weight = criterion?.weight || 1;
        return sum + (cr.score * weight) / totalWeight;
      }, 0);
    }

    // Determine if checkpoint is passed
    const passed = overallScore >= checkpoint.passingThreshold;

    const result: EvaluationResult = {
      checkpointId,
      passed,
      overallScore,
      criteriaResults,
      overallFeedback:
        llmResponse.overallFeedback || (passed ? "Good work!" : "Needs improvement."),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: error.message || "Evaluation failed" },
      { status: 500 }
    );
  }
}
