"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { MessageBubble } from "./message-bubble"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ChatInterface() {
  const [pdfContext, setPdfContext] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [input, setInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { context: pdfContext },
    }),
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === "in_progress") return

    sendMessage({ text: input })
    setInput("")

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setPdfContext(data.extractedText)
        setUploadedFile(data.fileName)
        toast({
          title: "PDF uploaded successfully",
          description: `${data.fileName} is now available for context`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to process PDF file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeFile = () => {
    setPdfContext("")
    setUploadedFile(null)
    toast({
      title: "File removed",
      description: "PDF context has been cleared",
    })
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Auto-resize textarea
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7 text-primary" />
            <h1 className="text-base font-semibold text-foreground">Wiscot AI</h1>
          </div>
          {uploadedFile && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-muted rounded-md text-xs">
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="text-foreground max-w-[180px] truncate">{uploadedFile}</span>
              <Button variant="ghost" size="sm" onClick={removeFile} className="h-4 w-4 p-0 hover:bg-background">
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <Logo className="h-16 w-16 text-primary mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-2 text-balance">How can I help you today?</h2>
              <p className="text-muted-foreground text-sm max-w-md text-pretty">
                Ask me anything about coding, upload a PDF for context, or request explanations and solutions.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} role={message.role} content={message.parts} />
              ))}
              {status === "in_progress" && (
                <div className="flex gap-3 mb-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Logo className="h-5 w-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || status === "in_progress"}
              className="flex-shrink-0 h-9 w-9"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Message Wiscot AI..."
              className="flex-1 min-h-[36px] max-h-[120px] resize-none text-sm py-2"
              disabled={status === "in_progress"}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || status === "in_progress"}
              className="flex-shrink-0 h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
