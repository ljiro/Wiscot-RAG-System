"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, FileText, Send, Sparkles, Columns2, Paperclip, X, File, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PostPreview } from "@/components/post-preview"

type FileAttachment = {
  name: string
  type: string
  data: string
  size: number
}

export function ChatInterface() {
  const [viewMode, setViewMode] = useState<"chat" | "preview" | "split">("chat")
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const [inputValue, setInputValue] = useState("")

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    for (const file of files) {
      // Only accept PDFs and images
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        continue
      }

      // Convert file to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const data = event.target?.result as string
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            data,
            size: file.size,
          },
        ])
      }
      reader.readAsDataURL(file)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((inputValue.trim() || attachments.length > 0) && status !== "in_progress") {
      sendMessage({
        text: inputValue,
        experimental_attachments: attachments.map((att) => ({
          name: att.name,
          contentType: att.type,
          url: att.data,
        })),
      })
      setInputValue("")
      setAttachments([])
    }
  }

  const ChatView = () => (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4">
        <div className="max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-balance">Social Content Studio</h2>
                <p className="text-muted-foreground text-pretty max-w-md">
                  Describe your campaign idea and I'll help you craft engaging social media posts
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue("Create a product launch post for a new eco-friendly water bottle")
                    setTimeout(() => document.getElementById("chat-input")?.focus(), 0)
                  }}
                >
                  Product Launch
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue("Write a promotional campaign for a summer sale event")
                    setTimeout(() => document.getElementById("chat-input")?.focus(), 0)
                  }}
                >
                  Promotional Campaign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue("Generate an engaging post about company culture and team values")
                    setTimeout(() => document.getElementById("chat-input")?.focus(), 0)
                  }}
                >
                  Brand Story
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "group border-b border-border/40 px-4 py-6 md:px-6",
                    message.role === "assistant" ? "bg-muted/30" : "bg-background",
                  )}
                >
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm">
                      {message.role === "assistant" ? (
                        <div className="flex h-full w-full items-center justify-center rounded-sm bg-primary">
                          <Sparkles className="h-5 w-5 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-sm bg-muted-foreground/20">
                          <MessageSquare className="h-5 w-5 text-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 overflow-hidden">
                      {message.experimental_attachments && message.experimental_attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-2">
                          {message.experimental_attachments.map((att, attIndex) => (
                            <div
                              key={attIndex}
                              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs"
                            >
                              {att.contentType?.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <File className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="max-w-[150px] truncate">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed md:text-base">
                        {message.parts.map((part, partIndex) => {
                          if (part.type === "text") {
                            return <span key={partIndex}>{part.text}</span>
                          }
                          return null
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {status === "in_progress" && (
                <div className="group border-b border-border/40 bg-muted/30 px-4 py-6 md:px-6">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary">
                      <Sparkles className="h-5 w-5 animate-pulse text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="flex justify-center border-t border-border/40 bg-background px-4">
        <div className="w-full max-w-3xl py-4">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                >
                  {att.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="max-w-[150px] truncate">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="ml-1 rounded-sm hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === "in_progress"}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              id="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message Social Content Studio..."
              disabled={status === "in_progress"}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={status === "in_progress" || (!inputValue.trim() && attachments.length === 0)}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-base font-semibold">Social Content Studio</h1>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Button
              variant={viewMode === "chat" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("chat")}
              className="h-8 gap-2 px-3"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              variant={viewMode === "split" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="h-8 gap-2 px-3"
            >
              <Columns2 className="h-4 w-4" />
              <span className="hidden sm:inline">Split</span>
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="h-8 gap-2 px-3"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {viewMode === "chat" && (
          <div className="flex-1">
            <ChatView />
          </div>
        )}
        {viewMode === "preview" && (
          <div className="flex-1 overflow-y-auto">
            <PostPreview
              content={
                messages
                  .filter((m) => m.role === "assistant")
                  .pop()
                  ?.parts.find((p) => p.type === "text")?.text || ""
              }
            />
          </div>
        )}
        {viewMode === "split" && (
          <>
            <div className="flex-1 border-r border-border/40">
              <ChatView />
            </div>
            <div className="flex-1 overflow-y-auto">
              <PostPreview
                content={
                  messages
                    .filter((m) => m.role === "assistant")
                    .pop()
                    ?.parts.find((p) => p.type === "text")?.text || ""
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
