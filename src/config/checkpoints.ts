import type { Checkpoint } from "@/types";

export const checkpoints: Checkpoint[] = [
  {
    id: "checkpoint-1",
    name: "Course Foundation Review",
    description: "Evaluating your course overview, objectives, and target audience.",
    afterSectionId: "course-overview",
    passingThreshold: 0.75,
    rubric: [
      {
        id: "objectives-measurable",
        name: "Measurable Learning Objectives",
        description: "Learning objectives are specific, measurable, and use action verbs.",
        evaluationPrompt: `Evaluate whether the learning objectives are well-written:
- Do they start with measurable action verbs (Bloom's taxonomy)?
- Are they specific enough to assess?
- Are there 4-6 objectives appropriate for the course scope?
- Do they avoid vague terms like "understand" or "know"?`,
        weight: 1.5,
      },
      {
        id: "objectives-achievable",
        name: "Achievable Objectives",
        description: "Objectives are realistic given the course duration and student level.",
        evaluationPrompt: `Evaluate whether the learning objectives are achievable:
- Are they appropriate for the target audience level?
- Can they reasonably be achieved in the stated course duration?
- Is the scope appropriate for the credit hours?`,
        weight: 1,
      },
      {
        id: "audience-clarity",
        name: "Clear Target Audience",
        description: "Target audience is clearly defined with prerequisites stated.",
        evaluationPrompt: `Evaluate the target audience definition:
- Is the intended student clearly described?
- Are prerequisites clearly stated?
- Is the expected background knowledge specified?`,
        weight: 1,
      },
      {
        id: "description-compelling",
        name: "Compelling Course Description",
        description: "Course description clearly explains value and content.",
        evaluationPrompt: `Evaluate the course description:
- Does it clearly explain what the course covers?
- Does it communicate why this matters to students?
- Is it engaging and professional?`,
        weight: 0.75,
      },
      {
        id: "format-appropriate",
        name: "Appropriate Delivery Format",
        description: "The delivery format matches the content and objectives.",
        evaluationPrompt: `Evaluate whether the delivery format is appropriate:
- Does the format support the stated learning objectives?
- Is it appropriate for the course content?`,
        weight: 0.75,
      },
    ],
  },
  {
    id: "checkpoint-2",
    name: "Module Structure Review",
    description: "Evaluating your module organization, content, and pacing.",
    afterSectionId: "module-structure",
    passingThreshold: 0.75,
    rubric: [
      {
        id: "logical-sequence",
        name: "Logical Sequencing",
        description: "Modules follow a logical progression that builds knowledge incrementally.",
        evaluationPrompt: `Evaluate the module sequence:
- Do modules build on each other logically?
- Is there a clear progression from foundational to advanced?
- Are prerequisites between modules clear?`,
        weight: 1.5,
      },
      {
        id: "objective-alignment",
        name: "Alignment with Objectives",
        description: "Module content maps to and supports the learning objectives.",
        evaluationPrompt: `Evaluate alignment with learning objectives:
- Does each module contribute to one or more learning objectives?
- Are all objectives covered by the end of the course?
- Is there appropriate depth for each objective?`,
        weight: 1.5,
      },
      {
        id: "appropriate-depth",
        name: "Appropriate Depth",
        description: "Each module has sufficient depth without being overwhelming.",
        evaluationPrompt: `Evaluate module depth:
- Does each module have enough topics to be substantive?
- Are any modules too overloaded?
- Is the workload balanced across modules?`,
        weight: 1,
      },
      {
        id: "pacing-realistic",
        name: "Realistic Pacing",
        description: "The pacing is realistic for the course duration.",
        evaluationPrompt: `Evaluate the pacing:
- Can the content be covered in the stated timeframe?
- Is there time for practice and assessment?
- Is the weekly workload reasonable?`,
        weight: 1,
      },
      {
        id: "resources-adequate",
        name: "Adequate Resources",
        description: "Resources are specified and appropriate for each module.",
        evaluationPrompt: `Evaluate the resources:
- Are resources specified for each module?
- Are they appropriate for the content?
- Is there variety in resource types?`,
        weight: 0.75,
      },
    ],
  },
  {
    id: "checkpoint-3",
    name: "Assessment Strategy Review",
    description: "Evaluating your assessment approach, grading, and alignment with objectives.",
    afterSectionId: "assessment-strategy",
    passingThreshold: 0.75,
    rubric: [
      {
        id: "assessment-objective-alignment",
        name: "Assessment-Objective Alignment",
        description: "Assessments directly measure the stated learning objectives.",
        evaluationPrompt: `Evaluate assessment alignment:
- Do assessments measure the learning objectives?
- Is each objective assessed at least once?
- Are assessment types appropriate for the objectives?`,
        weight: 1.5,
      },
      {
        id: "assessment-variety",
        name: "Assessment Variety",
        description: "Multiple assessment types accommodate different learning styles.",
        evaluationPrompt: `Evaluate assessment variety:
- Are there multiple types of assessments?
- Do they address different levels of Bloom's taxonomy?
- Is there a mix of formative and summative assessments?`,
        weight: 1,
      },
      {
        id: "grading-clarity",
        name: "Grading Clarity",
        description: "Grading weights and criteria are clear and fair.",
        evaluationPrompt: `Evaluate grading clarity:
- Do grading weights add up to 100%?
- Is the weight distribution appropriate?
- Are rubric criteria clear and measurable?`,
        weight: 1,
      },
      {
        id: "appropriate-rigor",
        name: "Appropriate Rigor",
        description: "Assessments are rigorous but achievable.",
        evaluationPrompt: `Evaluate assessment rigor:
- Are assessments challenging enough for the course level?
- Are expectations realistic?
- Is there scaffolding for complex assignments?`,
        weight: 1,
      },
      {
        id: "feedback-opportunities",
        name: "Feedback Opportunities",
        description: "Students have opportunities for feedback before high-stakes assessments.",
        evaluationPrompt: `Evaluate feedback structure:
- Are there low-stakes assessments early in the course?
- Do students receive feedback before major assignments?
- Are discussions or peer review included?`,
        weight: 0.75,
      },
    ],
  },
];

export function getCheckpointById(id: string): Checkpoint | undefined {
  return checkpoints.find((c) => c.id === id);
}

export function getCheckpointForSection(sectionId: string): Checkpoint | undefined {
  return checkpoints.find((c) => c.afterSectionId === sectionId);
}
