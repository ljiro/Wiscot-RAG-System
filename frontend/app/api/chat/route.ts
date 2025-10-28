import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[]; context?: string } = await req.json()

  const prompt = convertToModelMessages(messages)

  // Add RAG context to the system message if provided
  const systemMessage = context
    ? {
        role: "system" as const,
        content: `You are a helpful AI assistant that provides explanations and coding solutions. Use the following context from uploaded documents to answer questions:\n\n${context}\n\nWhen providing code solutions, format them clearly with proper syntax. Be concise and accurate.`,
      }
    : {
        role: "system" as const,
        content:
          "You are a helpful AI assistant that provides explanations and coding solutions. Format code clearly with proper syntax.",
      }

  const result = streamText({
    model: "openai/gpt-5-mini",
    messages: [systemMessage, ...prompt],
    abortSignal: req.signal,
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("[v0] Chat request aborted")
      }
    },
    consumeSseStream: consumeStream,
  })
}
