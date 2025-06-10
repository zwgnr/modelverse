// Helper function to extract assistant name from OpenRouter model ID
export function getAssistantName(modelId: string): string {
  if (modelId.includes("openai") || modelId.includes("gpt")) {
    return "ChatGPT";
  }
  if (modelId.includes("anthropic") || modelId.includes("claude")) {
    return "Claude";
  }
  if (modelId.includes("google") || modelId.includes("gemini")) {
    return "Gemini";
  }
  // Default fallback
  return "Assistant";
}