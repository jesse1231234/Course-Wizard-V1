import JSZip from "jszip";
import type { GeneratedCourse, CanvasModuleItem, CanvasRubric } from "@/types";

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(): string {
  return `g${Math.random().toString(16).slice(2)}${Date.now().toString(16).slice(-8)}`;
}

function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Track identifiers for cross-referencing
interface ExportContext {
  rubrics: Map<string, { id: string; rubric: CanvasRubric; itemId: string }>;
  assignmentGroupId: string;
}

// ============================================
// COURSE SETTINGS GENERATORS
// ============================================

function generateModuleMeta(course: GeneratedCourse, itemRefs: Map<string, string>): string {
  let modules = "";
  let position = 1;

  for (const mod of course.modules) {
    const moduleId = `mod_${mod.id}`;
    let items = "";
    let itemPosition = 1;

    for (const item of mod.items) {
      const itemId = `item_${mod.id}_${item.id}`;
      const resourceRef = itemRefs.get(item.id) || "";

      let contentType = "WikiPage";
      if (item.type === "quiz") contentType = "Quizzes::Quiz";
      else if (item.type === "assignment") contentType = "Assignment";
      else if (item.type === "discussion") contentType = "DiscussionTopic";

      items += `
      <item identifier="${itemId}">
        <content_type>${contentType}</content_type>
        <workflow_state>active</workflow_state>
        <title>${escapeXml(item.title)}</title>
        <identifierref>${resourceRef}</identifierref>
        <position>${itemPosition}</position>
        <new_tab>false</new_tab>
        <indent>0</indent>
      </item>`;
      itemPosition++;
    }

    modules += `
  <module identifier="${moduleId}">
    <title>${escapeXml(mod.name)}</title>
    <workflow_state>active</workflow_state>
    <position>${position}</position>
    <require_sequential_progress>false</require_sequential_progress>
    <locked>false</locked>
    <items>${items}
    </items>
  </module>`;
    position++;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<modules xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">${modules}
</modules>`;
}

function generateRubricsXml(ctx: ExportContext): string {
  if (ctx.rubrics.size === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rubrics xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
</rubrics>`;
  }

  let rubricsXml = "";

  for (const rubricData of Array.from(ctx.rubrics.values())) {
    const { id, rubric } = rubricData;
    const totalPoints = rubric.criteria.reduce((sum: number, c: { points: number }) => sum + c.points, 0);

    let criteriaXml = "";
    for (const criterion of rubric.criteria) {
      const criterionId = `_${Math.random().toString(36).slice(2, 6)}`;

      let ratingsXml = "";
      for (const rating of criterion.ratings) {
        const ratingId = `_${Math.random().toString(36).slice(2, 6)}`;
        ratingsXml += `
          <rating>
            <description>${escapeXml(rating.description)}</description>
            <points>${rating.points}</points>
            <criterion_id>${criterionId}</criterion_id>
            <id>${ratingId}</id>
          </rating>`;
      }

      criteriaXml += `
      <criterion>
        <criterion_id>${criterionId}</criterion_id>
        <points>${criterion.points}</points>
        <description>${escapeXml(criterion.description)}</description>
        <ratings>${ratingsXml}
        </ratings>
      </criterion>`;
    }

    rubricsXml += `
  <rubric identifier="${id}">
    <read_only>false</read_only>
    <title>${escapeXml(rubric.title)}</title>
    <reusable>false</reusable>
    <public>false</public>
    <points_possible>${totalPoints}</points_possible>
    <hide_score_total>false</hide_score_total>
    <free_form_criterion_comments>false</free_form_criterion_comments>
    <criteria>${criteriaXml}
    </criteria>
  </rubric>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rubrics xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">${rubricsXml}
</rubrics>`;
}

function generateAssignmentGroupsXml(ctx: ExportContext): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<assignmentGroups xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <assignmentGroup identifier="${ctx.assignmentGroupId}">
    <title>Assignments</title>
    <position>1</position>
    <group_weight>100.0</group_weight>
  </assignmentGroup>
</assignmentGroups>`;
}

function generateCourseSettingsXml(course: GeneratedCourse): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<course xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd" identifier="course_settings">
  <title>${escapeXml(course.title)}</title>
  <course_code>${escapeXml(course.title)}</course_code>
  <default_view>modules</default_view>
  <hide_final_grade>false</hide_final_grade>
</course>`;
}

// ============================================
// CONTENT GENERATORS
// ============================================

function generateWikiPageHtml(item: CanvasModuleItem, resourceId: string): string {
  return `<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>${escapeXml(item.title)}</title>
<meta name="identifier" content="${resourceId}"/>
<meta name="editing_roles" content="teachers"/>
<meta name="workflow_state" content="active"/>
</head>
<body>
${item.content || "<p>Content coming soon.</p>"}
</body>
</html>`;
}

function generateDiscussionTopicXml(item: CanvasModuleItem): string {
  const prompt = item.prompt || item.content || "<p>Share your thoughts on this topic.</p>";

  return `<?xml version="1.0" encoding="UTF-8"?>
<topic xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imsdt_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imsdt_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imsdt_v1p1.xsd">
  <title>${escapeXml(item.title)}</title>
  <text texttype="text/html">${escapeXml(prompt)}</text>
</topic>`;
}

function generateAssignmentSettingsXml(
  item: CanvasModuleItem,
  resourceId: string,
  ctx: ExportContext
): string {
  const points = item.points || 100;
  const rubricId = ctx.rubrics.get(item.id)?.id;

  let rubricRef = "";
  if (rubricId) {
    rubricRef = `
  <rubric_identifierref>${rubricId}</rubric_identifierref>
  <rubric_use_for_grading>true</rubric_use_for_grading>
  <rubric_hide_points>false</rubric_hide_points>
  <rubric_hide_outcome_results>false</rubric_hide_outcome_results>
  <rubric_hide_score_total>false</rubric_hide_score_total>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<assignment identifier="${resourceId}" xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>${escapeXml(item.title)}</title>
  <due_at/>
  <lock_at/>
  <unlock_at/>
  <module_locked>false</module_locked>
  <workflow_state>published</workflow_state>
  <assignment_group_identifierref>${ctx.assignmentGroupId}</assignment_group_identifierref>${rubricRef}
  <assignment_overrides/>
  <allowed_extensions/>
  <has_group_category>false</has_group_category>
  <points_possible>${points}</points_possible>
  <grading_type>points</grading_type>
  <all_day>false</all_day>
  <submission_types>online_text_entry,online_upload</submission_types>
  <position>1</position>
  <peer_review_count>0</peer_review_count>
  <peer_reviews>false</peer_reviews>
  <automatic_peer_reviews>false</automatic_peer_reviews>
  <anonymous_peer_reviews>false</anonymous_peer_reviews>
  <grade_group_students_individually>false</grade_group_students_individually>
  <freeze_on_copy>false</freeze_on_copy>
  <omit_from_final_grade>false</omit_from_final_grade>
  <only_visible_to_overrides>false</only_visible_to_overrides>
  <post_to_sis>false</post_to_sis>
  <moderated_grading>false</moderated_grading>
  <grader_count>0</grader_count>
  <grader_comments_visible_to_graders>true</grader_comments_visible_to_graders>
  <anonymous_grading>false</anonymous_grading>
  <graders_anonymous_to_graders>false</graders_anonymous_to_graders>
  <grader_names_visible_to_final_grader>true</grader_names_visible_to_final_grader>
  <anonymous_instructor_annotations>false</anonymous_instructor_annotations>
  <post_policy>
    <post_manually>false</post_manually>
  </post_policy>
</assignment>`;
}

function generateAssignmentHtml(item: CanvasModuleItem): string {
  return `<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${escapeXml(item.title)}</title>
</head>
<body>
<h2>Instructions</h2>
${item.content || "<p>Complete this assignment according to the guidelines provided.</p>"}
</body>
</html>`;
}

// ============================================
// CLASSIC QUIZ GENERATORS
// ============================================

// Generate assessment_meta.xml - Canvas Classic Quiz format (matches actual Canvas export)
function generateQuizMetaXml(
  item: CanvasModuleItem,
  resourceId: string,
  ctx: ExportContext
): string {
  const points = item.points || (item.questions?.reduce((sum, q) => sum + (q.points || 1), 0)) || 4;
  const pointsDecimal = Number.isInteger(points) ? `${points}.0` : points.toString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<quiz identifier="${resourceId}" xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>${escapeXml(item.title)}</title>
  <description>${escapeXml(item.content || "<p>Please answer the following questions.</p>")}</description>
  <shuffle_answers>false</shuffle_answers>
  <scoring_policy>keep_highest</scoring_policy>
  <hide_results></hide_results>
  <quiz_type>assignment</quiz_type>
  <points_possible>${pointsDecimal}</points_possible>
  <require_lockdown_browser>false</require_lockdown_browser>
  <require_lockdown_browser_for_results>false</require_lockdown_browser_for_results>
  <require_lockdown_browser_monitor>false</require_lockdown_browser_monitor>
  <lockdown_browser_monitor_data/>
  <show_correct_answers>true</show_correct_answers>
  <anonymous_submissions>false</anonymous_submissions>
  <could_be_locked>false</could_be_locked>
  <disable_timer_autosubmission>false</disable_timer_autosubmission>
  <allowed_attempts>1</allowed_attempts>
  <one_question_at_a_time>false</one_question_at_a_time>
  <cant_go_back>false</cant_go_back>
  <available>false</available>
  <one_time_results>false</one_time_results>
  <show_correct_answers_last_attempt>false</show_correct_answers_last_attempt>
  <only_visible_to_overrides>false</only_visible_to_overrides>
  <module_locked>false</module_locked>
  <assignment identifier="${generateId()}">
    <title>${escapeXml(item.title)}</title>
    <due_at/>
    <lock_at/>
    <unlock_at/>
    <module_locked>false</module_locked>
    <assignment_group_identifierref>${ctx.assignmentGroupId}</assignment_group_identifierref>
    <workflow_state>unpublished</workflow_state>
    <assignment_overrides>
    </assignment_overrides>
    <quiz_identifierref>${resourceId}</quiz_identifierref>
    <allowed_extensions></allowed_extensions>
    <has_group_category>false</has_group_category>
    <points_possible>${pointsDecimal}</points_possible>
    <grading_type>points</grading_type>
    <all_day>false</all_day>
    <submission_types>online_quiz</submission_types>
    <position>1</position>
    <turnitin_enabled>false</turnitin_enabled>
    <vericite_enabled>false</vericite_enabled>
    <peer_review_count>0</peer_review_count>
    <peer_reviews>false</peer_reviews>
    <automatic_peer_reviews>false</automatic_peer_reviews>
    <anonymous_peer_reviews>false</anonymous_peer_reviews>
    <grade_group_students_individually>false</grade_group_students_individually>
    <freeze_on_copy>false</freeze_on_copy>
    <omit_from_final_grade>false</omit_from_final_grade>
    <hide_in_gradebook>false</hide_in_gradebook>
    <intra_group_peer_reviews>false</intra_group_peer_reviews>
    <only_visible_to_overrides>false</only_visible_to_overrides>
    <post_to_sis>false</post_to_sis>
    <moderated_grading>false</moderated_grading>
    <grader_count>0</grader_count>
    <grader_comments_visible_to_graders>true</grader_comments_visible_to_graders>
    <anonymous_grading>false</anonymous_grading>
    <graders_anonymous_to_graders>false</graders_anonymous_to_graders>
    <grader_names_visible_to_final_grader>true</grader_names_visible_to_final_grader>
    <anonymous_instructor_annotations>false</anonymous_instructor_annotations>
    <post_policy>
      <post_manually>false</post_manually>
    </post_policy>
  </assignment>
  <assignment_group_identifierref>${ctx.assignmentGroupId}</assignment_group_identifierref>
  <assignment_overrides>
  </assignment_overrides>
</quiz>`;
}

// Generate CC-profile QTI for assessment_qti.xml (IMS Common Cartridge compatible)
function generateCCProfileQtiXml(item: CanvasModuleItem, resourceId: string): string {
  const questions = item.questions || [];

  const questionItems = questions.map((q) => {
    const questionId = generateId();

    if (q.type === "multiple_choice" && q.answers) {
      const correctAnswer = q.answers.find((a) => a.correct);
      const correctIdx = correctAnswer ? q.answers.indexOf(correctAnswer) : 0;

      return `
      <item ident="${questionId}" title="Question">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>cc_profile</fieldlabel>
              <fieldentry>cc.multiple_choice.v0p1</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(q.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_lid ident="response1" rcardinality="Single">
            <render_choice>
${q.answers.map((a, aIndex) => `              <response_label ident="${1000 + aIndex}">
                <material>
                  <mattext texttype="text/plain">${escapeXml(a.text)}</mattext>
                </material>
              </response_label>`).join("\n")}
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          <respcondition continue="No">
            <conditionvar>
              <varequal respident="response1">${1000 + correctIdx}</varequal>
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>
        </resprocessing>
      </item>`;
    }

    // Essay question with cc_profile format
    return `
      <item ident="${questionId}" title="Question">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>cc_profile</fieldlabel>
              <fieldentry>cc.essay.v0p1</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>qmd_computerscored</fieldlabel>
              <fieldentry>No</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(q.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_str ident="response1" rcardinality="Single">
            <render_fib>
              <response_label ident="answer1" rshuffle="No"/>
            </render_fib>
          </response_str>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          <respcondition continue="No">
            <conditionvar>
              <other/>
            </conditionvar>
          </respcondition>
        </resprocessing>
      </item>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_qtiasiv1p2p1_v1p0.xsd">
  <assessment ident="${resourceId}" title="${escapeXml(item.title)}">
    <qtimetadata>
      <qtimetadatafield>
        <fieldlabel>cc_profile</fieldlabel>
        <fieldentry>cc.exam.v0p1</fieldentry>
      </qtimetadatafield>
      <qtimetadatafield>
        <fieldlabel>qmd_assessmenttype</fieldlabel>
        <fieldentry>Examination</fieldentry>
      </qtimetadatafield>
      <qtimetadatafield>
        <fieldlabel>qmd_scoretype</fieldlabel>
        <fieldentry>Percentage</fieldentry>
      </qtimetadatafield>
      <qtimetadatafield>
        <fieldlabel>cc_maxattempts</fieldlabel>
        <fieldentry>1</fieldentry>
      </qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">${questionItems}
    </section>
  </assessment>
</questestinterop>`;
}

// Generate Canvas-specific QTI for non_cc_assessments/*.xml.qti
function generateCanvasQtiXml(item: CanvasModuleItem, resourceId: string): string {
  const questions = item.questions || [];

  const questionItems = questions.map((q) => {
    const questionId = generateId();
    const points = q.points || 1;
    const pointsDecimal = Number.isInteger(points) ? `${points}.0` : points.toString();

    if (q.type === "multiple_choice" && q.answers) {
      const correctAnswer = q.answers.find((a) => a.correct);
      const correctIdx = correctAnswer ? q.answers.indexOf(correctAnswer) : 0;
      const answerIds = q.answers.map((_, i) => `${1000 + i}`).join(",");

      return `
      <item ident="${questionId}" title="Question">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>multiple_choice_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>${pointsDecimal}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>original_answer_ids</fieldlabel>
              <fieldentry>${answerIds}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>assessment_question_identifierref</fieldlabel>
              <fieldentry>${questionId}</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(q.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_lid ident="response1" rcardinality="Single">
            <render_choice>
${q.answers.map((a, aIndex) => `              <response_label ident="${1000 + aIndex}">
                <material>
                  <mattext texttype="text/plain">${escapeXml(a.text)}</mattext>
                </material>
              </response_label>`).join("\n")}
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          <respcondition continue="No">
            <conditionvar>
              <varequal respident="response1">${1000 + correctIdx}</varequal>
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>
        </resprocessing>
      </item>`;
    }

    // Essay question with Canvas format
    const qType = q.type === "essay" ? "essay_question" : "short_answer_question";
    return `
      <item ident="${questionId}" title="Question">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>${qType}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>${pointsDecimal}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>original_answer_ids</fieldlabel>
              <fieldentry></fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>assessment_question_identifierref</fieldlabel>
              <fieldentry>${questionId}</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">&lt;div&gt;&lt;p&gt;${escapeXml(q.text)}&lt;/p&gt;&lt;/div&gt;</mattext>
          </material>
          <response_str ident="response1" rcardinality="Single">
            <render_fib>
              <response_label ident="answer1" rshuffle="No"/>
            </render_fib>
          </response_str>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          <respcondition continue="No">
            <conditionvar>
              <other/>
            </conditionvar>
          </respcondition>
        </resprocessing>
      </item>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="${resourceId}" title="${escapeXml(item.title)}">
    <qtimetadata>
      <qtimetadatafield>
        <fieldlabel>cc_maxattempts</fieldlabel>
        <fieldentry>1</fieldentry>
      </qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">${questionItems}
    </section>
  </assessment>
</questestinterop>`;
}

// ============================================
// MANIFEST GENERATOR
// ============================================

function generateManifest(
  course: GeneratedCourse,
  resources: Array<{ id: string; type: string; href?: string; files: string[]; dependency?: string }>,
  itemRefs: Map<string, string>
): string {
  // Build organization items (modules and their items)
  let orgItems = "";

  for (const mod of course.modules) {
    const moduleId = `mod_${mod.id}`;
    let modItems = "";

    for (const item of mod.items) {
      const itemId = `item_${mod.id}_${item.id}`;
      const resourceId = itemRefs.get(item.id) || "";

      modItems += `
          <item identifier="${itemId}" identifierref="${resourceId}">
            <title>${escapeXml(item.title)}</title>
          </item>`;
    }

    orgItems += `
        <item identifier="${moduleId}">
          <title>${escapeXml(mod.name)}</title>${modItems}
        </item>`;
  }

  // Build resources section
  const resourcesXml = resources
    .map((r) => {
      const files = r.files.map((f) => `\n      <file href="${f}"/>`).join("");
      const hrefAttr = r.href ? ` href="${r.href}"` : "";
      const deps = r.dependency ? `\n      <dependency identifierref="${r.dependency}"/>` : "";
      return `
    <resource identifier="${r.id}" type="${r.type}"${hrefAttr}>${files}${deps}
    </resource>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course_${generateId()}"
  xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"
  xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource"
  xmlns:lomimscc="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
    <lomimscc:lom>
      <lomimscc:general>
        <lomimscc:title>
          <lomimscc:string>${escapeXml(course.title)}</lomimscc:string>
        </lomimscc:title>
        <lomimscc:description>
          <lomimscc:string>${escapeXml(course.description)}</lomimscc:string>
        </lomimscc:description>
      </lomimscc:general>
      <lomimscc:lifeCycle>
        <lomimscc:contribute>
          <lomimscc:date>
            <lomimscc:dateTime>${new Date().toISOString().split("T")[0]}</lomimscc:dateTime>
          </lomimscc:date>
        </lomimscc:contribute>
      </lomimscc:lifeCycle>
    </lomimscc:lom>
  </metadata>
  <organizations>
    <organization identifier="org_1" structure="rooted-hierarchy">
      <item identifier="LearningModules">${orgItems}
      </item>
    </organization>
  </organizations>
  <resources>${resourcesXml}
  </resources>
</manifest>`;
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export async function exportToIMSCC(course: GeneratedCourse): Promise<Blob> {
  const zip = new JSZip();
  const resources: Array<{ id: string; type: string; href?: string; files: string[]; dependency?: string }> = [];
  const itemRefs = new Map<string, string>();

  // Initialize context
  const ctx: ExportContext = {
    rubrics: new Map(),
    assignmentGroupId: generateId(),
  };

  // Create course_settings folder
  const courseSettings = zip.folder("course_settings");

  // Create wiki_content folder for pages
  const wikiContent = zip.folder("wiki_content");

  // First pass: collect rubrics from assignments
  for (const mod of course.modules) {
    for (const item of mod.items) {
      if (item.type === "assignment" && item.rubric) {
        const rubricId = generateId();
        ctx.rubrics.set(item.id, { id: rubricId, rubric: item.rubric, itemId: item.id });
      }
    }
  }

  // Process each module and item
  for (const mod of course.modules) {
    for (const item of mod.items) {
      const resourceId = generateId();
      itemRefs.set(item.id, resourceId);

      switch (item.type) {
        case "page": {
          // Pages go in wiki_content folder
          const pageSlug = slugify(item.title);
          const pageFile = `${pageSlug}.html`;
          wikiContent?.file(pageFile, generateWikiPageHtml(item, resourceId));

          resources.push({
            id: resourceId,
            type: "webcontent",
            href: `wiki_content/${pageFile}`,
            files: [`wiki_content/${pageFile}`],
          });
          break;
        }

        case "discussion": {
          // Discussions are XML files at root level - NO href attribute per Canvas format
          const discussionFile = `${resourceId}.xml`;
          zip.file(discussionFile, generateDiscussionTopicXml(item));

          resources.push({
            id: resourceId,
            type: "imsdt_xmlv1p1",
            // No href for discussions - Canvas format
            files: [discussionFile],
          });
          break;
        }

        case "assignment": {
          // Assignments get their own folder
          const assignmentFolder = zip.folder(resourceId);
          const assignmentSlug = slugify(item.title);
          const htmlFile = `${assignmentSlug}.html`;

          assignmentFolder?.file("assignment_settings.xml", generateAssignmentSettingsXml(item, resourceId, ctx));
          assignmentFolder?.file(htmlFile, generateAssignmentHtml(item));

          // Canvas format: href points to HTML content, HTML listed first
          resources.push({
            id: resourceId,
            type: "associatedcontent/imscc_xmlv1p1/learning-application-resource",
            href: `${resourceId}/${htmlFile}`,
            files: [
              `${resourceId}/${htmlFile}`,
              `${resourceId}/assignment_settings.xml`,
            ],
          });
          break;
        }

        case "quiz": {
          // Classic Quizzes format: Canvas needs BOTH QTI files
          const quizFolder = zip.folder(resourceId);
          const metaResourceId = generateId();

          // Ensure non_cc_assessments folder exists
          const nonCcFolder = zip.folder("non_cc_assessments");

          // Create quiz folder with CC-profile QTI
          quizFolder?.file("assessment_meta.xml", generateQuizMetaXml(item, resourceId, ctx));
          quizFolder?.file("assessment_qti.xml", generateCCProfileQtiXml(item, resourceId));

          // Create Canvas-specific QTI in non_cc_assessments folder
          nonCcFolder?.file(`${resourceId}.xml.qti`, generateCanvasQtiXml(item, resourceId));

          // Main quiz resource
          resources.push({
            id: resourceId,
            type: "imsqti_xmlv1p2/imscc_xmlv1p1/assessment",
            files: [`${resourceId}/assessment_qti.xml`],
            dependency: metaResourceId,
          });

          // Assessment meta resource - includes BOTH assessment_meta.xml AND the non_cc_assessments file
          resources.push({
            id: metaResourceId,
            type: "associatedcontent/imscc_xmlv1p1/learning-application-resource",
            href: `${resourceId}/assessment_meta.xml`,
            files: [
              `${resourceId}/assessment_meta.xml`,
              `non_cc_assessments/${resourceId}.xml.qti`,
            ],
          });
          break;
        }

        default: {
          // Default to page
          const pageSlug = slugify(item.title);
          const pageFile = `${pageSlug}.html`;
          wikiContent?.file(pageFile, generateWikiPageHtml(item, resourceId));

          resources.push({
            id: resourceId,
            type: "webcontent",
            href: `wiki_content/${pageFile}`,
            files: [`wiki_content/${pageFile}`],
          });
        }
      }
    }
  }

  // Add welcome page
  const welcomeSlug = "course-welcome";
  wikiContent?.file(`${welcomeSlug}.html`, `<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Welcome</title>
</head>
<body>
${course.welcomeMessage || "<h1>Welcome to the Course!</h1><p>Get started by exploring the modules below.</p>"}
</body>
</html>`);

  // Generate course_settings files
  courseSettings?.file("module_meta.xml", generateModuleMeta(course, itemRefs));
  courseSettings?.file("rubrics.xml", generateRubricsXml(ctx));
  courseSettings?.file("assignment_groups.xml", generateAssignmentGroupsXml(ctx));
  courseSettings?.file("course_settings.xml", generateCourseSettingsXml(course));
  courseSettings?.file("canvas_export.txt", `Canvas course export\nGenerated: ${new Date().toISOString()}`);

  // Add course_settings resource - CRITICAL for Canvas to read module_meta.xml
  const courseSettingsResourceId = generateId();
  resources.unshift({
    id: courseSettingsResourceId,
    type: "associatedcontent/imscc_xmlv1p1/learning-application-resource",
    href: "course_settings/canvas_export.txt",
    files: [
      "course_settings/course_settings.xml",
      "course_settings/module_meta.xml",
      "course_settings/assignment_groups.xml",
      "course_settings/rubrics.xml",
      "course_settings/canvas_export.txt",
    ],
  });

  // Generate manifest
  zip.file("imsmanifest.xml", generateManifest(course, resources, itemRefs));

  // Generate the zip file
  return await zip.generateAsync({ type: "blob" });
}
