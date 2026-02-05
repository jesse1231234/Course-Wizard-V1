import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";

type LLMProvider = "openai" | "anthropic" | "azure";

function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() as LLMProvider;
  if (provider === "openai" || provider === "anthropic" || provider === "azure") {
    return provider;
  }
  // Auto-detect based on available environment variables
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    return "azure";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  return "openai";
}

function getModel() {
  const provider = getProvider();

  if (provider === "azure") {
    const azure = createAzure({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      resourceName: extractResourceName(process.env.AZURE_OPENAI_ENDPOINT || ""),
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview",
    });
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    return azure(deploymentName);
  }

  if (provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic("claude-sonnet-4-20250514");
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai("gpt-4o");
}

// Extract resource name from Azure endpoint URL
// e.g., "https://myresource.openai.azure.com" -> "myresource"
function extractResourceName(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname;
    // hostname is like "myresource.openai.azure.com"
    return hostname.split(".")[0];
  } catch {
    // If URL parsing fails, return the endpoint as-is
    return endpoint;
  }
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function generateLLMResponse(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const model = getModel();

  const { temperature = 0.7, maxTokens = 4096 } = options;

  const systemMessage = messages.find((m) => m.role === "system");
  const otherMessages = messages.filter((m) => m.role !== "system");

  const result = await generateText({
    model,
    system: systemMessage?.content,
    messages: otherMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    temperature,
    maxTokens,
  });

  return result.text;
}

export async function generateJSONResponse<T>(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<T> {
  // Add instruction for JSON output
  const jsonMessages = [...messages];
  const lastMessage = jsonMessages[jsonMessages.length - 1];

  if (lastMessage && lastMessage.role === "user") {
    lastMessage.content += "\n\nRespond with valid JSON only. No markdown, no explanation, just the JSON object.";
  }

  const response = await generateLLMResponse(jsonMessages, options);

  // Try to parse the response as JSON
  try {
    // Remove potential markdown code blocks
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    return JSON.parse(cleanedResponse) as T;
  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", response);
    throw new Error("LLM response was not valid JSON");
  }
}
