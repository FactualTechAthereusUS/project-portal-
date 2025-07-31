'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Send, 
  Paperclip, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Smile,
  Minimize2,
  Maximize2
} from 'lucide-react'

interface ComposeEmailProps {
  isOpen: boolean
  onClose: () => void
  onSend: (emailData: {
    to: string
    subject: string
    body: string
    priority: 'low' | 'normal' | 'high'
    attachments?: File[]
  }) => void
  token: string
}

export default function ComposeEmail({ isOpen, onClose, onSend, token }: ComposeEmailProps) {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: '',
    priority: 'normal' as 'low' | 'normal' | 'high'
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!emailData.to || !emailData.subject) {
      alert('Please fill in recipient and subject')
      return
    }

    setIsSending(true)
    try {
      await onSend({
        ...emailData,
        attachments
      })
      // Reset form
      setEmailData({ to: '', subject: '', body: '', priority: 'normal' })
      setAttachments([])
      onClose()
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ 
          scale: isMinimized ? 0.3 : 1, 
          opacity: 1, 
          y: isMinimized ? 300 : 0,
          x: isMinimized ? 400 : 0
        }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg w-full max-w-4xl ${
          isMinimized ? 'max-h-16' : 'max-h-[90vh]'
        } overflow-hidden shadow-notion-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A] bg-[#0F0F0F]">
          <h3 className="font-semibold text-white">Compose Email</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col h-full max-h-[calc(90vh-60px)]">
            {/* Email Form */}
            <div className="p-4 space-y-4 border-b border-[#1A1A1A]">
              {/* To Field */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-400 w-16">To</label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="recipient@example.com"
                  className="flex-1 px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                  multiple
                />
                <select
                  value={emailData.priority}
                  onChange={(e) => setEmailData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              {/* Subject Field */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-400 w-16">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                  className="flex-1 px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-400">Attachments:</span>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-xs text-gray-300"
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-3 border-b border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <Bold className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <Italic className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <Underline className="w-4 h-4" />
                </button>
              </div>
              
              <div className="w-px h-6 bg-[#2A2A2A] mx-2" />
              
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-[#2A2A2A] mx-2" />

              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <Link className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400">
                  <Smile className="w-4 h-4" />
                </button>
                <label className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400 cursor-pointer">
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileAttach}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 p-4">
              <textarea
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your message..."
                className="w-full h-full min-h-[300px] bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm leading-relaxed"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[#1A1A1A] bg-[#0F0F0F]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {emailData.body.length} characters
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || !emailData.to || !emailData.subject}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
} 