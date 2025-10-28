"use client"

import { CodeBlock } from "./code-block"
import { Logo } from "./logo"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: Array<{ type: string; text?: string; [key: string]: any }>
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user"

  // Parse code blocks from text content
  const parseContent = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        })
      }

      // Add code block
      parts.push({
        type: "code",
        content: match[2].trim(),
        language: match[1] || "text",
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      })
    }

    return parts.length > 0 ? parts : [{ type: "text" as const, content: text }]
  }

  const textContent = content
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("")

  const contentParts = parseContent(textContent)

  return (
    <div className={cn("flex gap-3 mb-8", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Logo className="h-5 w-5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted/50",
        )}
      >
        {contentParts.map((part, index) => {
          if (part.type === "code") {
            return <CodeBlock key={index} code={part.content} language={part.language} />
          }
          return (
            <p
              key={index}
              className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                isUser ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {part.content}
            </p>
          )
        })}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  )
}
