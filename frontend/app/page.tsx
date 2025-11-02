"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { ChatSidebar } from "@/components/chat-sidebar"

export interface Chat {
  id: string
  title: string
  timestamp: Date
  messageCount: number
  lastMessage?: string
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "Baguio Traffic Discussion",
      timestamp: new Date(),
      messageCount: 0,
      lastMessage: "What are the traffic rules in Baguio?"
    }
  ])
  const [selectedChat, setSelectedChat] = useState("1")

  const handleNewMessage = (chatId: string, message: any) => {
    // Update last message but NOT the message count
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: message.content.substring(0, 50) + (message.content.length > 50 ? "..." : ""),
          timestamp: new Date()
        }
      }
      return chat
    }))
  }

  const handleNewChat = () => {
    const newChatId = Date.now().toString()
    const newChat: Chat = {
      id: newChatId,
      title: `New Chat`,
      timestamp: new Date(),
      messageCount: 0
    }
    setChats(prev => [newChat, ...prev])
    setSelectedChat(newChatId)
  }

  const handleDeleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (selectedChat === chatId) {
      setSelectedChat(chats.find(chat => chat.id !== chatId)?.id || "")
    }
    // Clear localStorage for deleted chat
    localStorage.removeItem(`chat-${chatId}`)
  }

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ))
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar 
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />
      <div className="flex-1 flex flex-col">
        <ChatInterface 
          chatId={selectedChat}
          onNewMessage={handleNewMessage}
        />
      </div>
    </div>
  )
}