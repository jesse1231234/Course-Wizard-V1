import JSZip from "jszip";
import type { GeneratedCourse, CanvasModule, CanvasModuleItem } from "@/types";

// Generate a unique identifier
function generateId(): string {
  return `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Generate imsmanifest.xml
function generateManifest(course: GeneratedCourse): string {
  const resources: string[] = [];
  const items: string[] = [];

  // Add course overview resource
  const overviewId = generateId();
  resources.push(`
    <resource identifier="${overviewId}" type="webcontent" href="course_overview.html">
      <file href="course_overview.html"/>
    </resource>`);

  items.push(`
      <item identifier="overview_item" identifierref="${overviewId}">
        <title>Course Overview</title>
      </item>`);

  // Process modules
  for (const courseModule of course.modules) {
    const moduleId = `mod_${courseModule.id}`;

    const moduleItems: string[] = [];

    for (const item of courseModule.items) {
      const itemId = `item_${item.id}`;
      const resourceId = `res_${item.id}`;

      let resourceType = "webcontent";
      let href = `${item.id}.html`;

      if (item.type === "assignment") {
        resourceType = "assignment";
        href = `assignments/${item.id}.html`;
      } else if (item.type === "discussion") {
        resourceType = "discussion";
        href = `discussions/${item.id}.html`;
      } else if (item.type === "quiz") {
        resourceType = "assessment";
        href = `quizzes/${item.id}.xml`;
      }

      resources.push(`
    <resource identifier="${resourceId}" type="${resourceType}" href="${href}">
      <file href="${href}"/>
    </resource>`);

      moduleItems.push(`
          <item identifier="${itemId}" identifierref="${resourceId}">
            <title>${escapeXml(item.title)}</title>
          </item>`);
    }

    items.push(`
      <item identifier="${moduleId}">
        <title>${escapeXml(courseModule.name)}</title>
        ${moduleItems.join("")}
      </item>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course_${generateId()}"
  xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"
  xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource"
  xmlns:lomimscc="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd">
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
    </lomimscc:lom>
  </metadata>
  <organizations>
    <organization identifier="org_1" structure="rooted-hierarchy">
      <item identifier="root">
        ${items.join("")}
      </item>
    </organization>
  </organizations>
  <resources>
    ${resources.join("")}
  </resources>
</manifest>`;
}

// Generate HTML content for a page
function generatePageHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(title)}</title>
</head>
<body>
${content}
</body>
</html>`;
}

// Generate assignment HTML
function generateAssignmentHtml(item: CanvasModuleItem): string {
  let rubricHtml = "";

  if (item.rubric) {
    rubricHtml = `
<h3>Rubric: ${escapeXml(item.rubric.title)}</h3>
<table border="1" cellpadding="8" cellspacing="0">
  <thead>
    <tr>
      <th>Criterion</th>
      <th>Points</th>
      <th>Ratings</th>
    </tr>
  </thead>
  <tbody>
    ${item.rubric.criteria
      .map(
        (c) => `
    <tr>
      <td>${escapeXml(c.description)}</td>
      <td>${c.points}</td>
      <td>${c.ratings.map((r) => `${escapeXml(r.description)} (${r.points} pts)`).join("<br>")}</td>
    </tr>`
      )
      .join("")}
  </tbody>
</table>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(item.title)}</title>
</head>
<body>
<h1>${escapeXml(item.title)}</h1>
<p><strong>Points:</strong> ${item.points || 0}</p>

<h2>Instructions</h2>
${item.content || "<p>No instructions provided.</p>"}

${rubricHtml}
</body>
</html>`;
}

// Generate discussion HTML
function generateDiscussionHtml(item: CanvasModuleItem): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(item.title)}</title>
</head>
<body>
<h1>${escapeXml(item.title)}</h1>
${item.prompt || item.content || "<p>Discussion topic.</p>"}
</body>
</html>`;
}

// Generate QTI quiz XML
function generateQuizQti(item: CanvasModuleItem): string {
  const questions = item.questions || [];

  const questionItems = questions
    .map((q, index) => {
      const qId = `q_${index + 1}`;

      if (q.type === "multiple_choice" && q.answers) {
        const correctAnswer = q.answers.find((a) => a.correct);
        return `
    <item ident="${qId}" title="Question ${index + 1}">
      <presentation>
        <material>
          <mattext texttype="text/html">${escapeXml(q.text)}</mattext>
        </material>
        <response_lid ident="response1" rcardinality="Single">
          <render_choice>
            ${q.answers
              .map(
                (a, aIndex) => `
            <response_label ident="ans_${aIndex}">
              <material>
                <mattext texttype="text/plain">${escapeXml(a.text)}</mattext>
              </material>
            </response_label>`
              )
              .join("")}
          </render_choice>
        </response_lid>
      </presentation>
      <resprocessing>
        <outcomes>
          <decvar maxvalue="${q.points}" minvalue="0" varname="SCORE" vartype="Decimal"/>
        </outcomes>
        ${
          correctAnswer
            ? `
        <respcondition continue="No">
          <conditionvar>
            <varequal respident="response1">ans_${q.answers.indexOf(correctAnswer)}</varequal>
          </conditionvar>
          <setvar action="Set" varname="SCORE">${q.points}</setvar>
        </respcondition>`
            : ""
        }
      </resprocessing>
    </item>`;
      }

      // Essay or short answer
      return `
    <item ident="${qId}" title="Question ${index + 1}">
      <presentation>
        <material>
          <mattext texttype="text/html">${escapeXml(q.text)}</mattext>
        </material>
        <response_str ident="response1" rcardinality="Single">
          <render_fib>
            <response_label ident="answer1" rshuffle="No"/>
          </render_fib>
        </response_str>
      </presentation>
      <resprocessing>
        <outcomes>
          <decvar maxvalue="${q.points}" minvalue="0" varname="SCORE" vartype="Decimal"/>
        </outcomes>
      </resprocessing>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2">
  <assessment ident="quiz_${item.id}" title="${escapeXml(item.title)}">
    <section ident="root_section">
      ${questionItems}
    </section>
  </assessment>
</questestinterop>`;
}

// Main export function
export async function exportToIMSCC(course: GeneratedCourse): Promise<Blob> {
  const zip = new JSZip();

  // Add manifest
  zip.file("imsmanifest.xml", generateManifest(course));

  // Add course overview / welcome page
  zip.file(
    "course_overview.html",
    generatePageHtml("Welcome", course.welcomeMessage || "<p>Welcome to the course!</p>")
  );

  // Create folders
  const assignmentsFolder = zip.folder("assignments");
  const discussionsFolder = zip.folder("discussions");
  const quizzesFolder = zip.folder("quizzes");

  // Process modules and items
  for (const courseModule of course.modules) {
    for (const item of courseModule.items) {
      switch (item.type) {
        case "page":
          zip.file(
            `${item.id}.html`,
            generatePageHtml(item.title, item.content || "")
          );
          break;

        case "assignment":
          assignmentsFolder?.file(`${item.id}.html`, generateAssignmentHtml(item));
          break;

        case "discussion":
          discussionsFolder?.file(`${item.id}.html`, generateDiscussionHtml(item));
          break;

        case "quiz":
          quizzesFolder?.file(`${item.id}.xml`, generateQuizQti(item));
          break;

        default:
          // Default to page
          zip.file(
            `${item.id}.html`,
            generatePageHtml(item.title, item.content || "")
          );
      }
    }
  }

  // Generate the zip file
  return await zip.generateAsync({ type: "blob" });
}
