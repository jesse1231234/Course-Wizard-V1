import type { Checkpoint, RubricCriterion } from "@/types";
import { sections } from "@/config/questions";

export function buildEvaluationSystemPrompt(): string {
  return `You are an expert instructional designer and course evaluator. Your role is to evaluate course design elements against established rubric criteria.

When evaluating, consider:
- Best practices in instructional design
- Bloom's taxonomy for learning objectives
- Alignment between objectives, content, and assessments
- Clarity and specificity of descriptions
- Feasibility and appropriateness for the stated context

Be constructive in your feedback. When something doesn't meet criteria, explain why and provide specific suggestions for improvement.

CRITICAL: You must respond with raw JSON only. Do NOT wrap your response in markdown code blocks. Do NOT include any text before or after the JSON. Start your response with { and end with }.`;
}

export function buildEvaluationUserPrompt(
  checkpoint: Checkpoint,
  answers: Record<string, string | string[]>
): string {
  // Get the section this checkpoint is for
  const section = sections.find((s) => s.id === checkpoint.afterSectionId);

  // Format answers with question labels
  const formattedAnswers = Object.entries(answers)
    .map(([questionId, value]) => {
      const question = section?.questions.find((q) => q.id === questionId);
      const label = question?.label || questionId;
      const displayValue = Array.isArray(value) ? value.join(", ") : value;
      return `**${label}:**\n${displayValue}`;
    })
    .join("\n\n");

  // Format rubric criteria
  const criteriaList = checkpoint.rubric
    .map(
      (c, i) =>
        `${i + 1}. **${c.name}** (weight: ${c.weight})\n   ${c.description}\n   Evaluation focus: ${c.evaluationPrompt}`
    )
    .join("\n\n");

  return `## Evaluation Task

Evaluate the following course design responses against the rubric criteria below.

### Submitted Responses:

${formattedAnswers}

### Rubric Criteria:

${criteriaList}

### Required Output Format:

Provide your evaluation as a JSON object with this exact structure:

{
  "overallScore": <number between 0 and 1>,
  "overallFeedback": "<2-3 sentence summary of the evaluation>",
  "criteriaResults": [
    {
      "criterionId": "<criterion id from rubric>",
      "passed": <true or false>,
      "score": <number between 0 and 1>,
      "feedback": "<specific feedback for this criterion>",
      "suggestions": ["<suggestion 1>", "<suggestion 2>"] // optional, include if criterion did not pass
    }
  ]
}

The overallScore should be the weighted average of individual criterion scores.
A criterion passes if its score is >= 0.7.
The passing threshold for the checkpoint is ${checkpoint.passingThreshold * 100}%.`;
}

export function buildCanvasGenerationSystemPrompt(): string {
  return `You are an expert instructional designer specializing in Canvas LMS course development. Your role is to generate complete, ready-to-use course content based on the instructor's design specifications.

When generating content:
- Create professional, engaging content appropriate for the course level
- Ensure all content aligns with stated learning objectives
- Use clear, accessible language
- Include relevant examples and explanations
- Create detailed rubrics with clear criteria
- Design assessment items that measure learning objectives
- Maintain consistent formatting and structure

CRITICAL: You must respond with raw JSON only. Do NOT wrap your response in markdown code blocks (no \`\`\`). Do NOT include any text before or after the JSON. Start your response with { and end with }.`;
}

export function buildCanvasGenerationUserPrompt(
  answers: Record<string, string | string[]>
): string {
  // Helper to safely get answers
  const getAnswer = (id: string): string => {
    const val = answers[id];
    return Array.isArray(val) ? val.join(", ") : val || "";
  };

  return `## Course Generation Task

Based on the following course design specifications, generate a complete Canvas course structure with full content.

### Course Overview:
- **Title:** ${getAnswer("course-title")}
- **Code:** ${getAnswer("course-code")}
- **Description:** ${getAnswer("course-description")}
- **Target Audience:** ${getAnswer("target-audience")}
- **Delivery Format:** ${getAnswer("delivery-format")}
- **Duration:** ${getAnswer("course-duration")}
- **Credit Hours:** ${getAnswer("credit-hours")}

### Learning Objectives:
${getAnswer("learning-objectives")}

### Module Structure:
${getAnswer("module-details")}

### Pacing:
${getAnswer("module-pacing")}

### Resources:
${getAnswer("key-resources")}

### Assessment Types:
${getAnswer("assignment-types")}

### Major Assignments:
${getAnswer("assignment-details")}

### Quiz Structure:
${getAnswer("quiz-structure")}

### Discussion Strategy:
${getAnswer("discussion-prompts")}

### Grading:
${getAnswer("grading-weights")}

### Rubric Criteria:
${getAnswer("rubric-criteria")}

### Welcome Message Draft:
${getAnswer("welcome-message")}

### Instructor Introduction:
${getAnswer("instructor-intro")}

### Communication Policy:
${getAnswer("communication-policy")}

### Support Resources:
${getAnswer("support-resources")}

### Late Policy:
${getAnswer("late-policy")}

### Accessibility Statement:
${getAnswer("accessibility-statement")}

---

## Required Output Format:

Generate a JSON object with this structure:

{
  "title": "<course title>",
  "description": "<course description for Canvas>",
  "welcomeMessage": "<complete welcome message HTML>",
  "modules": [
    {
      "id": "<unique id>",
      "name": "<module name>",
      "position": <number>,
      "items": [
        {
          "id": "<unique id>",
          "type": "page" | "assignment" | "discussion" | "quiz",
          "title": "<item title>",
          "content": "<full HTML content for pages>",
          "position": <number>,
          "points": <number for assignments/quizzes>,
          "rubric": {
            "title": "<rubric title>",
            "criteria": [
              {
                "description": "<criterion description>",
                "points": <max points>,
                "ratings": [
                  {"description": "<rating level>", "points": <points>}
                ]
              }
            ]
          },
          "questions": [
            {
              "type": "multiple_choice" | "short_answer" | "essay",
              "text": "<question text>",
              "points": <points>,
              "answers": [{"text": "<answer>", "correct": true|false}]
            }
          ],
          "prompt": "<discussion prompt for discussion items>"
        }
      ]
    }
  ]
}

Generate complete, substantive content for each item:
- For pages: Include clear lesson content (200-300 words) covering key concepts
- For assignments: Include clear instructions and requirements
- For discussions: Include engaging prompts with 2-3 guiding questions
- For quizzes: Include 3-5 questions per quiz

IMPORTANT: Keep the JSON response concise to avoid truncation. Focus on quality over quantity.`;
}

// ============================================
// CHUNKED GENERATION PROMPTS
// ============================================

export function buildCourseStructureSystemPrompt(): string {
  return `You are an expert instructional designer. Your role is to design the structure of a Canvas LMS course based on instructor specifications.

CRITICAL: You must respond with raw JSON only. Do NOT wrap your response in markdown code blocks. Do NOT include any text before or after the JSON. Start your response with { and end with }.`;
}

export function buildCourseStructureUserPrompt(
  answers: Record<string, string | string[]>
): string {
  const getAnswer = (id: string): string => {
    const val = answers[id];
    return Array.isArray(val) ? val.join(", ") : val || "";
  };

  return `## Course Structure Generation

Based on the following specifications, generate ONLY the course structure (no detailed content yet).

### Course Overview:
- **Title:** ${getAnswer("course-title")}
- **Code:** ${getAnswer("course-code")}
- **Description:** ${getAnswer("course-description")}
- **Target Audience:** ${getAnswer("target-audience")}
- **Duration:** ${getAnswer("course-duration")}

### Learning Objectives:
${getAnswer("learning-objectives")}

### Module Structure:
${getAnswer("module-details")}

### Assessment Types:
${getAnswer("assignment-types")}

### Welcome Message Draft:
${getAnswer("welcome-message")}

---

## Required Output Format:

Generate a JSON object with this structure (NO detailed content, just structure):

{
  "title": "<course title>",
  "description": "<course description>",
  "welcomeMessage": "<welcome message HTML>",
  "modules": [
    {
      "id": "module-1",
      "name": "<module name>",
      "position": 1,
      "items": [
        {
          "id": "item-1-1",
          "type": "page" | "assignment" | "discussion" | "quiz",
          "title": "<item title>",
          "position": 1
        }
      ]
    }
  ]
}

Create a logical structure with appropriate item types for each module. Do NOT include content, rubrics, or questions yet - just the skeleton.`;
}

export function buildModuleContentSystemPrompt(): string {
  return `You are an expert instructional designer. Your role is to generate detailed content for a specific module in a Canvas LMS course.

When generating content:
- Create professional, engaging content appropriate for the course level
- Ensure content aligns with learning objectives
- Use clear, accessible language
- Include relevant examples

CRITICAL: You must respond with raw JSON only. Do NOT wrap your response in markdown code blocks. Do NOT include any text before or after the JSON. Start your response with { and end with }.`;
}

export function buildModuleContentUserPrompt(
  answers: Record<string, string | string[]>,
  moduleStructure: {
    id: string;
    name: string;
    position: number;
    items: Array<{ id: string; type: string; title: string; position: number }>;
  },
  courseTitle: string
): string {
  const getAnswer = (id: string): string => {
    const val = answers[id];
    return Array.isArray(val) ? val.join(", ") : val || "";
  };

  const itemsList = moduleStructure.items
    .map((item) => `- ${item.title} (${item.type})`)
    .join("\n");

  return `## Module Content Generation

Generate detailed content for Module ${moduleStructure.position}: "${moduleStructure.name}" in the course "${courseTitle}".

### Course Context:
- **Learning Objectives:** ${getAnswer("learning-objectives")}
- **Target Audience:** ${getAnswer("target-audience")}
- **Assessment Approach:** ${getAnswer("assignment-types")}
- **Rubric Criteria:** ${getAnswer("rubric-criteria")}

### Module Items to Generate Content For:
${itemsList}

---

## Required Output Format:

Generate a JSON object with detailed content for each item:

{
  "moduleId": "${moduleStructure.id}",
  "items": [
    {
      "id": "<item id>",
      "type": "page" | "assignment" | "discussion" | "quiz",
      "title": "<item title>",
      "content": "<full HTML content for pages, or instructions for assignments>",
      "position": <number>,
      "points": <number for assignments/quizzes, omit for pages>,
      "rubric": {
        "title": "<rubric title>",
        "criteria": [
          {
            "description": "<criterion>",
            "points": <max points>,
            "ratings": [{"description": "<level>", "points": <points>}]
          }
        ]
      },
      "questions": [
        {
          "type": "multiple_choice" | "short_answer" | "essay",
          "text": "<question>",
          "points": <points>,
          "answers": [{"text": "<answer>", "correct": true|false}]
        }
      ],
      "prompt": "<discussion prompt if type is discussion>"
    }
  ]
}

Content guidelines:
- Pages: 200-300 words covering key concepts
- Assignments: Clear instructions, include rubric with 3-4 criteria
- Discussions: Engaging prompt with 2-3 guiding questions
- Quizzes: 3-5 questions with answers`;
}
