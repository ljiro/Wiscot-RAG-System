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

interface ChatInterfaceProps {
  chatId?: string
  onNewMessage?: (chatId: string, message: Message) => void
}

export function ChatInterface({ chatId = "default", onNewMessage }: ChatInterfaceProps) {
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

  // Load messages for current chat
  useEffect(() => {
    if (chatId) {
      const savedMessages = localStorage.getItem(`chat-${chatId}`)
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          setMessages(parsedMessages)
        } catch (error) {
          console.error("Error loading chat messages:", error)
          setMessages([])
        }
      } else {
        setMessages([])
      }
    }
  }, [chatId])

  // Save messages when they change
  useEffect(() => {
    if (chatId && messages.length > 0) {
      localStorage.setItem(`chat-${chatId}`, JSON.stringify(messages))
    }
  }, [messages, chatId])

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
      
      // Notify parent component about new message
      if (onNewMessage) {
        onNewMessage(chatId, userMessage)
      }

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

      // DEBUG: Log what Rasa is sending
      console.log("=== RASA RESPONSE DEBUG ===");
      console.log("Number of messages from Rasa:", rasaResponse.length);
      rasaResponse.forEach((msg: any, index: number) => {
        console.log(`Message ${index}:`, {
          textLength: msg.text?.length || 0,
          first100Chars: msg.text?.substring(0, 100) + '...',
          hasText: !!msg.text
        });
      });

      if (rasaResponse && rasaResponse.length > 0) {
        // COMBINE ALL MESSAGES INTO ONE
        const combinedText = rasaResponse
          .map((msg: any) => msg.text || '')
          .filter(text => text.trim().length > 0)
          .join('\n\n');

        console.log("Combined text length:", combinedText.length);
        console.log("=== END DEBUG ===");

        if (combinedText) {
          const assistantMessage: Message = {
            id: `rasa-${Date.now()}`,
            role: "assistant",
            content: combinedText,
            type: "text",
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // Notify parent component about assistant response
          if (onNewMessage) {
            onNewMessage(chatId, assistantMessage);
          }
        }
      } else {
        const fallbackMessage: Message = {
          id: `rasa-${Date.now()}`,
          role: "assistant",
          content: "I received your message but didn't get a proper response.",
          timestamp: new Date(),
          type: "text"
        }
        setMessages(prev => [...prev, fallbackMessage])
        
        if (onNewMessage) {
          onNewMessage(chatId, fallbackMessage)
        }
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
      
      if (onNewMessage) {
        onNewMessage(chatId, errorMessage)
      }
      
      toast({
        title: "Connection error",
        description: "Failed to connect to the assistant",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  const clearChat = () => {
    setMessages([])
    if (chatId) {
      localStorage.removeItem(`chat-${chatId}`)
    }
    toast({
      title: "Chat cleared",
      description: "All messages have been cleared from this chat",
    })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-base font-semibold text-foreground">Wiscot AI</h1>
              <p className="text-xs text-muted-foreground">
                Chat ID: {chatId} • {messages.length} messages
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-xs"
              >
                Clear Chat
              </Button>
            )}
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
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <Logo className="h-16 w-16 text-primary mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-2 text-balance">How can I help you today?</h2>
              <p className="text-muted-foreground text-sm max-w-md text-pretty mb-6">
                Ask me anything about Baguio City, upload a PDF for context, or request detailed information.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("What are the traffic rules in Baguio?")}
                  className="text-xs"
                >
                  Traffic Rules
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("Tell me about Baguio tourism attractions")}
                  className="text-xs"
                >
                  Tourism Info
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("What are the waste disposal rules in Baguio?")}
                  className="text-xs"
                >
                  Waste Management
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("Explain Baguio culture and traditions")}
                  className="text-xs"
                >
                  Culture & Traditions
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  role={message.role} 
                  content={message.content}
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
              placeholder="Ask about Baguio City..."
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