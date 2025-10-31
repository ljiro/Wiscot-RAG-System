"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MessageBubble } from "./message-bubble"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "text" | "search" | "sources"
}

export function ChatInterface() {
  const [pdfContext, setPdfContext] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const RASA_API_URL = process.env.NEXT_PUBLIC_RASA_API_URL || "http://localhost:5005"
  const RASA_WEBHOOK_ENDPOINT = "/webhooks/rest/webhook"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const parseRasaResponse = (text: string): Message[] => {
    const messages: Message[] = []
    const now = Date.now()

    // Split the response into logical parts
    const lines = text.split('\n').filter(line => line.trim())
    
    let currentContent = ""
    let currentType: "text" | "search" | "sources" = "text"

    for (const line of lines) {
      if (line.includes('🔍 Searching my knowledge base') || line.includes('Searching my knowledge base')) {
        // If we have accumulated content, push it as a message
        if (currentContent.trim()) {
          messages.push({
            id: `msg-${now}-${messages.length}`,
            role: "assistant",
            content: currentContent.trim(),
            type: currentType
          })
          currentContent = ""
        }
        // Add search status as a separate message
        messages.push({
          id: `search-${now}`,
          role: "assistant",
          content: line.trim(),
          type: "search"
        })
      }
      else if (line.includes('📚 Sources:') || line.includes('Sources:')) {
        // If we have accumulated content, push it as a message
        if (currentContent.trim()) {
          messages.push({
            id: `msg-${now}-${messages.length}`,
            role: "assistant",
            content: currentContent.trim(),
            type: currentType
          })
          currentContent = ""
        }
        // Add sources as a separate message
        messages.push({
          id: `sources-${now}`,
          role: "assistant",
          content: line.trim(),
          type: "sources"
        })
      }
      else if (line.includes('Answer:') || line.includes('Answer (')) {
        // If we have accumulated content (like the greeting), push it
        if (currentContent.trim()) {
          messages.push({
            id: `msg-${now}-${messages.length}`,
            role: "assistant",
            content: currentContent.trim(),
            type: currentType
          })
          currentContent = ""
        }
        // Start accumulating answer content
        currentContent = line.replace(/Answer\s*\([^)]+\):\s*/, '').trim()
        currentType = "text"
      }
      else {
        // Accumulate regular content
        currentContent += (currentContent ? '\n' : '') + line
      }
    }

    // Don't forget the last accumulated content
    if (currentContent.trim()) {
      messages.push({
        id: `msg-${now}-${messages.length}`,
        role: "assistant",
        content: currentContent.trim(),
        type: currentType
      })
    }

    // If no structured messages were found, return the original text as one message
    if (messages.length === 0) {
      return [{
        id: `msg-${now}`,
        role: "assistant",
        content: text,
        type: "text"
      }]
    }

    return messages
  }

  const sendMessageToRasa = async (message: string) => {
    setIsLoading(true)
    
    try {
      // Add user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, userMessage])

      const requestBody = {
        sender: "user",
        message: message,
        metadata: pdfContext ? { context: pdfContext } : undefined
      }

      const response = await fetch(`${RASA_API_URL}${RASA_WEBHOOK_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Rasa API responded with status: ${response.status}`)
      }

      const rasaResponse = await response.json()

      if (rasaResponse && rasaResponse.length > 0) {
        rasaResponse.forEach((rasaMessage: any, index: number) => {
          if (rasaMessage.text) {
            const parsedMessages = parseRasaResponse(rasaMessage.text)
            parsedMessages.forEach((parsedMessage, msgIndex) => {
              setMessages(prev => [...prev, {
                ...parsedMessage,
                id: `rasa-${Date.now()}-${index}-${msgIndex}`,
                timestamp: new Date()
              }])
            })
          }
        })
      } else {
        const fallbackMessage: Message = {
          id: `rasa-${Date.now()}`,
          role: "assistant",
          content: "I received your message but didn't get a proper response.",
          timestamp: new Date(),
          type: "text"
        }
        setMessages(prev => [...prev, fallbackMessage])
      }
    } catch (error) {
      console.error("Error sending message to Rasa:", error)
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting to the assistant. Please try again.",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Connection error",
        description: "Failed to connect to the assistant",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Rest of your existing functions remain the same...
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessageToRasa(input)
    setInput("")

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
                <MessageBubble 
                  key={message.id} 
                  role={message.role} 
                  content={[{ type: 'text', text: message.content }]} 
                  messageType={message.type}
                />
              ))}
              {isLoading && (
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
              disabled={isUploading || isLoading}
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
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
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