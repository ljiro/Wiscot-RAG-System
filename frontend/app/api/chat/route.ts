// frontend/src/app/api/chat/route.ts
import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages }: { messages: any[] } = await req.json()
    
    // Get the last user message
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || ""

    if (!lastUserMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

    console.log('Calling backend with message:', lastUserMessage)

    // Call your FastAPI backend
    const response = await fetch('http://localhost:8000/api/v1/campaigns/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: lastUserMessage,
        platforms: ['facebook']
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      throw new Error(`Backend responded with ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('Backend response:', data)

    // Return in AI SDK format (single message, no streaming)
    return NextResponse.json([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
      }
    ])

  } catch (error) {
    console.error('Error in chat route:', error)
    
    // Return error message that user will see
    return NextResponse.json([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if your backend is running on http://localhost:8000`,
      }
    ])
  }
}