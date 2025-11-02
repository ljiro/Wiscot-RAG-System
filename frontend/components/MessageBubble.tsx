// components/message-bubble.tsx
import React from 'react'
import { Logo } from './logo'

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  messageType?: "text" | "search" | "sources"
}

export function MessageBubble({ role, content, messageType }: MessageBubbleProps) {
  // Function to parse content with proper formatting
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for bold text (main points) - **1. Public Utility Jeepneys (PUJs) Routes**
      const boldMatch = trimmedLine.match(/^\*\*(.*)\*\*$/);
      if (boldMatch) {
        return (
          <div key={index} className="mb-3 mt-4 first:mt-0">
            <strong className="font-semibold text-gray-900 text-[15px] leading-relaxed">
              {boldMatch[1]}
            </strong>
          </div>
        );
      }
      
      // Check for main bullet points (•)
      else if (trimmedLine.startsWith('•') && !trimmedLine.startsWith('• •')) {
        return (
          <div key={index} className="flex items-start mb-2 ml-4">
            <span className="text-gray-600 mr-3 mt-0.5 flex-shrink-0">•</span>
            <span className="text-gray-700 flex-1 leading-relaxed">
              {trimmedLine.slice(1).trim()}
            </span>
          </div>
        );
      }
      
      // Check for nested bullet points (-)
      else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('• •')) {
        const nestedContent = trimmedLine.startsWith('• •') 
          ? trimmedLine.slice(2).trim() 
          : trimmedLine.slice(1).trim();
        
        return (
          <div key={index} className="flex items-start mb-1 ml-12">
            <span className="text-gray-500 mr-3 mt-0.5 flex-shrink-0">-</span>
            <span className="text-gray-600 flex-1 leading-relaxed text-sm">
              {nestedContent}
            </span>
          </div>
        );
      }
      
      // Check for numbered lists (1., 2., 3., etc.)
      else if (trimmedLine.match(/^\d+\./)) {
        const numberMatch = trimmedLine.match(/^(\d+)\.\s*(.*)/);
        if (numberMatch) {
          return (
            <div key={index} className="flex items-start mb-2">
              <span className="text-gray-600 font-medium min-w-6 mt-0.5">
                {numberMatch[1]}.
              </span>
              <span className="text-gray-700 flex-1 ml-2 leading-relaxed">
                {numberMatch[2]}
              </span>
            </div>
          );
        }
      }
      
      // Regular text with proper spacing (non-empty lines)
      else if (trimmedLine) {
        // Check if this looks like a paragraph (not a list item)
        const isParagraph = !trimmedLine.startsWith('•') && 
                           !trimmedLine.startsWith('-') && 
                           !trimmedLine.match(/^\d+\./) &&
                           !boldMatch;
        
        if (isParagraph) {
          return (
            <div key={index} className="mb-3 text-gray-700 leading-relaxed">
              {trimmedLine}
            </div>
          );
        }
      }
      
      // Empty line (spacing) - but only add spacing if it's meaningful
      else if (index > 0 && index < lines.length - 1 && lines[index - 1].trim() && lines[index + 1].trim()) {
        return <div key={index} className="h-3" />;
      }
      
      return null;
    }).filter(Boolean); // Remove null values
  }

  // User - Bubble style
  if (role === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 max-w-[80%]">
          <p className="text-sm">{content}</p>
        </div>
      </div>
    )
  }

  // Assistant - Clean, no bubble
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Logo className="h-3 w-3 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-700">Wiscot AI</span>
      </div>
      
      <div className="pl-8">
        <div className="text-sm">
          {formatContent(content)}
        </div>
      </div>
    </div>
  )
}