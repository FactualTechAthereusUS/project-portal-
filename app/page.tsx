'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Inbox, 
  Send, 
  Star, 
  Archive,
  Trash,
  Plus,
  Search,
  Settings,
  User,
  PaperclipIcon,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  LogOut,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import ComposeEmail from '@/components/ComposeEmail'

// Types
interface Email {
  id: number
  from_email: string
  to_email: string
  subject: string
  body: string
  is_read: boolean
  has_attachments: boolean
  created_at: string
  priority: 'low' | 'normal' | 'high'
  starred: boolean
  folder: string
}

interface User {
  id: number
  email: string
  profile: {
    full_name?: string
  }
}

const API_URL = 'https://api.aurafarming.co'

export default function WebmailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeFolder, setActiveFolder] = useState('inbox')
  const [isComposing, setIsComposing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loginMode, setLoginMode] = useState(true)
  const [credentials, setCredentials] = useState({ email: '', password: '' })

  // Login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('auramail_token', data.token)
        localStorage.setItem('auramail_user', JSON.stringify(data.user))
        setLoginMode(false)
        fetchEmails(data.user.id, data.token)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Check for existing login on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auramail_token')
    const savedUser = localStorage.getItem('auramail_user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setLoginMode(false)
      fetchEmails(JSON.parse(savedUser).id, savedToken)
    }
  }, [])

  // FIXED: Auto-refresh emails every 10 seconds
  useEffect(() => {
    if (!user || !token) return
    
    console.log('🔄 Setting up auto-refresh for emails...')
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing emails...')
      fetchEmails(user.id, token)
    }, 10000) // 10 seconds
    
    return () => {
      console.log('🛑 Clearing auto-refresh interval')
      clearInterval(interval)
    }
  }, [user, token, activeFolder])

  // FIXED: Fetch emails function with folder-specific endpoints
  const fetchEmails = async (userId?: number, authToken?: string) => {
    const actualUserId = userId || user?.id
    const actualToken = authToken || token
    
    if (!actualUserId || !actualToken) {
      console.log('❌ Missing user ID or token for email fetch')
      return
    }
    
    setIsLoading(true)
    try {
      console.log(`📬 Fetching emails for folder: ${activeFolder}, user: ${actualUserId}`)
      
      // FIXED: Use different endpoints based on folder
      let endpoint = `${API_URL}/api/emails/inbox/1`; // Default to inbox
      
      if (activeFolder === 'sent') {
        endpoint = `${API_URL}/api/emails/sent/1`;
      } else if (activeFolder === 'starred') {
        endpoint = `${API_URL}/api/emails/inbox/1`; // We'll filter starred on frontend
      } else if (activeFolder === 'archive') {
        endpoint = `${API_URL}/api/emails/inbox/1`; // We'll filter archived on frontend  
      } else if (activeFolder === 'trash') {
        endpoint = `${API_URL}/api/emails/inbox/1`; // We'll filter trash on frontend
      }
      
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${actualToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Fetched ${data.emails?.length || 0} emails for ${activeFolder}`)
        
        let filteredEmails = data.emails || [];
        
                 // FIXED: Apply folder-specific filtering
         if (activeFolder === 'starred') {
           filteredEmails = filteredEmails.filter((email: Email) => email.starred);
         } else if (activeFolder === 'archive') {
           filteredEmails = filteredEmails.filter((email: Email) => email.folder === 'archive');
         } else if (activeFolder === 'trash') {
           filteredEmails = filteredEmails.filter((email: Email) => email.folder === 'trash');
         }
        
        setEmails(filteredEmails)
        
        // Show notification for new emails (only for inbox)
        if (activeFolder === 'inbox' && filteredEmails && filteredEmails.length > emails.length) {
          console.log('🔔 New emails detected!')
        }
      } else {
        console.error('Failed to fetch emails:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Send email function
  const handleSendEmail = async (emailData: {
    to: string
    subject: string
    body: string
    priority: 'low' | 'normal' | 'high'
    attachments?: File[]
  }) => {
    if (!token) return

    // FIXED: Send JSON instead of FormData to match backend
    const emailPayload = {
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      priority: emailData.priority,
      from_user: user?.email || 'noreply@aurafarming.co' // Use logged-in user's email
      // Note: Attachments will be added in a future update
    }

    try {
      const response = await fetch(`${API_URL}/api/emails/send`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Refresh emails
          if (user) fetchEmails(user.id, token)
          alert('Email sent successfully!')
        } else {
          throw new Error(data.error)
        }
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      console.error('Send email error:', error)
      throw error
    }
  }

  // Star/unstar email
  const handleStarEmail = async (emailId: number, starred: boolean) => {
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/api/emails/${emailId}/star`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ starred })
      })

      if (response.ok) {
        // Update local state
        setEmails(prev => prev.map(email => 
          email.id === emailId ? { ...email, starred } : email
        ))
        if (selectedEmail && selectedEmail.id === emailId) {
          setSelectedEmail(prev => prev ? { ...prev, starred } : null)
        }
      }
    } catch (error) {
      console.error('Star email error:', error)
    }
  }

  // Archive email
  const handleArchiveEmail = async (emailId: number) => {
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/api/emails/${emailId}/move`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder: 'archive' })
      })

      if (response.ok) {
        // Remove from current view
        setEmails(prev => prev.filter(email => email.id !== emailId))
        if (selectedEmail && selectedEmail.id === emailId) {
          setSelectedEmail(null)
        }
      }
    } catch (error) {
      console.error('Archive email error:', error)
    }
  }

  // Delete email
  const handleDeleteEmail = async (emailId: number) => {
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/api/emails/${emailId}/move`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder: 'trash' })
      })

      if (response.ok) {
        // Remove from current view
        setEmails(prev => prev.filter(email => email.id !== emailId))
        if (selectedEmail && selectedEmail.id === emailId) {
          setSelectedEmail(null)
        }
      }
    } catch (error) {
      console.error('Delete email error:', error)
    }
  }

  // Mark email as read
  const handleMarkAsRead = async (emailId: number) => {
    if (!token) return

    try {
      await fetch(`${API_URL}/api/emails/${emailId}/read`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: true })
      })

      // Update local state
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, is_read: true } : email
      ))
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, is_read: true } : null)
      }
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('auramail_token')
    localStorage.removeItem('auramail_user')
    setToken(null)
    setUser(null)
    setLoginMode(true)
    setEmails([])
    setSelectedEmail(null)
  }

  // Login Screen with Notion-inspired design
  if (loginMode) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">AuraMail</h1>
            <p className="text-gray-400">Professional email for professionals</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <a href="https://portal.aurafarming.co" className="text-blue-400 hover:text-blue-300">
              Create one here
            </a>
          </p>
        </motion.div>
      </div>
    )
  }

  // Main Webmail Interface
  const folders = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: emails.filter(e => !e.is_read && e.folder === 'inbox').length },
    { id: 'starred', name: 'Starred', icon: Star, count: emails.filter(e => e.starred).length },
    { id: 'sent', name: 'Sent', icon: Send, count: 0 },
    { id: 'archive', name: 'Archive', icon: Archive, count: 0 },
    { id: 'trash', name: 'Trash', icon: Trash, count: 0 },
  ]

  const Sidebar = () => (
    <div className="w-72 bg-[#0F0F0F] border-r border-[#1A1A1A] h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AuraMail</h1>
            <p className="text-xs text-gray-500">Professional</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsComposing(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>
      </div>

      {/* Folders */}
      <div className="flex-1 p-4 space-y-1">
        {folders.map((folder) => (
          <motion.div
            key={folder.id}
            whileHover={{ x: 2 }}
            onClick={() => {
              setActiveFolder(folder.id)
              if (user && token) fetchEmails(user.id, token)
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeFolder === folder.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-[#1A1A1A] hover:text-white'
            }`}
          >
            <folder.icon className="w-4 h-4" />
            <span className="flex-1 text-sm font-medium">{folder.name}</span>
            {folder.count > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                activeFolder === folder.id ? 'bg-white/20' : 'bg-[#2A2A2A] text-gray-400'
              }`}>
                {folder.count}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-[#1A1A1A]">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A1A1A] cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user?.profile.full_name?.[0] || user?.email[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.profile.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-[#2A2A2A] rounded text-gray-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const EmailList = () => (
    <div className="w-96 bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-[#1A1A1A]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white capitalize">{activeFolder}</h2>
            {emails.length > 0 && (
              <span className="text-xs text-gray-500">({emails.length})</span>
            )}
            {/* FIXED: Auto-refresh indicator */}
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Auto-refreshing every 10s"></div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmails()}
              disabled={isLoading}
              className="p-1.5 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white"
              title="Refresh now"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-1.5 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No emails in {activeFolder}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {emails.map((email) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setSelectedEmail(email)
                  if (!email.is_read) {
                    handleMarkAsRead(email.id)
                  }
                }}
                className={`p-4 border-b border-[#1A1A1A] cursor-pointer transition-colors hover:bg-[#0F0F0F] ${
                  selectedEmail?.id === email.id ? 'bg-[#1A1A1A]' : ''
                } ${!email.is_read ? 'border-l-2 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">
                      {email.from_email[0].toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm truncate ${!email.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                        {email.from_email}
                      </p>
                      <div className="flex items-center gap-1">
                        {email.has_attachments && <PaperclipIcon className="w-3 h-3 text-gray-500" />}
                        {email.starred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                        <span className="text-xs text-gray-500">
                          {new Date(email.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate mb-1 ${!email.is_read ? 'font-medium text-white' : 'text-gray-400'}`}>
                      {email.subject}
                    </p>
                    
                    <p className="text-xs text-gray-500 truncate">
                      {email.body.replace(/<[^>]*>/g, '').substring(0, 80)}...
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const EmailView = () => (
    <div className="flex-1 bg-[#0A0A0A] flex flex-col">
      {selectedEmail ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col"
        >
          {/* Email Header */}
          <div className="p-6 border-b border-[#1A1A1A]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-white mb-3">{selectedEmail.subject}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>From: {selectedEmail.from_email}</span>
                  <span>To: {selectedEmail.to_email}</span>
                  <span>{new Date(selectedEmail.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleStarEmail(selectedEmail.id, !selectedEmail.starred)}
                  className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white"
                >
                  <Star className={`w-4 h-4 ${selectedEmail.starred ? 'text-yellow-500 fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => handleArchiveEmail(selectedEmail.id)}
                  className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteEmail(selectedEmail.id)}
                  className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white"
                >
                  <Trash className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-[#1A1A1A] rounded text-gray-400 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div 
              className="prose prose-invert max-w-none text-gray-200"
              dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
            />
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">No email selected</p>
            <p className="text-sm">Choose an email from the list to read</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="h-screen flex bg-[#0A0A0A] text-white overflow-hidden">
      <Sidebar />
      <EmailList />
      <EmailView />
      
      {/* Compose Modal */}
      <ComposeEmail
        isOpen={isComposing}
        onClose={() => setIsComposing(false)}
        onSend={handleSendEmail}
        token={token || ''}
      />
    </div>
  )
} 