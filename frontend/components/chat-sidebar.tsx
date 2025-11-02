"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, 
  Plus, 
  Search, 
  MoreHorizontal,
  Trash2,
  Edit3
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Chat {
  id: string
  title: string
  timestamp: Date
  messageCount: number
  lastMessage?: string
}

interface ChatSidebarProps {
  chats: Chat[]
  selectedChat: string
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
}

export function ChatSidebar({ 
  chats, 
  selectedChat, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat,
  onRenameChat 
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRenameStart = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleRenameSave = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim())
    }
    setEditingChatId(null)
    setEditTitle("")
  }

  const handleRenameCancel = () => {
    setEditingChatId(null)
    setEditTitle("")
  }

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      handleRenameSave(chatId)
    } else if (e.key === 'Escape') {
      handleRenameCancel()
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-80 bg-background border-r border-border/40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Chats</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "No chats found" : "No chats yet"}
            </p>
            {!searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onNewChat}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start a chat
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  selectedChat === chat.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingChatId === chat.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRenameSave(chat.id)}
                        onKeyDown={(e) => handleKeyDown(e, chat.id)}
                        className="h-6 text-sm bg-background text-foreground"
                        autoFocus
                      />
                    ) : (
                      <h3 className={`font-medium truncate ${
                        selectedChat === chat.id ? "text-primary-foreground" : "text-foreground"
                      }`}>
                        {chat.title}
                      </h3>
                    )}
                    <div className={`flex items-center gap-2 mt-1 text-xs ${
                      selectedChat === chat.id ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}>
                      <span>{formatDate(chat.timestamp)}</span>
                      {chat.lastMessage && (
                        <>
                          <span>•</span>
                          <span className="truncate">{chat.lastMessage}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 opacity-0 group-hover:opacity-100 ${
                          selectedChat === chat.id 
                            ? "text-primary-foreground hover:bg-primary-foreground/20" 
                            : "text-muted-foreground"
                        }`}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleRenameStart(chat, e)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteChat(chat.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{chats.length} chats</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNewChat}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
        </div>
      </div>
    </div>
  )
}