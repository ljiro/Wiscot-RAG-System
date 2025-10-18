"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe } from "lucide-react"

interface PostPreviewProps {
  content: string
}

export function PostPreview({ content }: PostPreviewProps) {
  return (
    <div className="container mx-auto flex h-full max-w-2xl items-center justify-center px-4 py-8">
      <Card className="w-full overflow-hidden bg-card shadow-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent" />
            <div>
              <p className="font-semibold text-sm">Your Brand</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Just now</span>
                <span>·</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 pb-3">
          {content ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{content}</p>
          ) : (
            <div className="space-y-2 py-8 text-center">
              <p className="text-muted-foreground text-sm">No content yet</p>
              <p className="text-xs text-muted-foreground text-pretty">
                Start a conversation in the chat to generate your social media post
              </p>
            </div>
          )}
        </div>

        {/* Post Image Placeholder */}
        <div className="aspect-video w-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20">
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2 p-8">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">Image Placeholder</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <ThumbsUp className="h-2.5 w-2.5 text-white fill-white" />
                </div>
              </div>
              <span>1.2K</span>
            </div>
            <div className="flex gap-3">
              <span>234 comments</span>
              <span>89 shares</span>
            </div>
          </div>

          <div className="border-t border-border flex items-center justify-around py-1">
            <Button variant="ghost" size="sm" className="flex-1 gap-2 hover:bg-accent/50">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm font-medium">Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2 hover:bg-accent/50">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2 hover:bg-accent/50">
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Share</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
