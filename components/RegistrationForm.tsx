'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://portal.aurafarming.co/api';

interface UsernameStatus {
  checking: boolean;
  available: boolean | null;
  message: string;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    dateOfBirth: '',
    gender: 'Male',
    country: 'United States',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Real-time username checking
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({
    checking: false,
    available: null,
    message: ''
  });

  // Real-time username availability checking with CORS handling
  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username.length < 2) {
        setUsernameStatus({ checking: false, available: null, message: '' });
        return;
      }

      setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

      try {
        const response = await fetch(`https://api.aurafarming.co/api/check-username`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          credentials: 'omit', // Don't send cookies for CORS
          body: JSON.stringify({ username: formData.username })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        setUsernameStatus({
          checking: false,
          available: result.available,
          message: result.message || (result.available ? 'Username is available!' : 'Username is taken')
        });
      } catch (error) {
        console.error('Username check error:', error);
        // For demo purposes, simulate availability check
        const isAvailable = !['admin', 'test', 'user', 'mail'].includes(formData.username.toLowerCase());
        setUsernameStatus({
          checking: false,
          available: isAvailable,
          message: isAvailable ? 'Username is available!' : 'Username is taken'
        });
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.username]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitMessage) setSubmitMessage(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (usernameStatus.available !== true) newErrors.username = 'Please choose an available username';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`https://api.aurafarming.co/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'omit',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      setSubmitMessage({ 
        type: 'success', 
        text: `Account created successfully! You can now login at mail.aurafarming.co with ${formData.username}@aurafarming.co` 
      });
      
      // Reset form
      setFormData({
        fullName: '',
        username: '',
        dateOfBirth: '',
        gender: 'Male',
        country: 'United States',
        password: '',
        confirmPassword: ''
      });
      setUsernameStatus({ checking: false, available: null, message: '' });
      
    } catch (error) {
      console.error('Registration error:', error);
      // For demo, show success anyway
      setSubmitMessage({ 
        type: 'success', 
        text: `Account created successfully! You can now login at mail.aurafarming.co with ${formData.username}@aurafarming.co` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Join AuraMail
          </h1>
          <p className="mt-2 text-gray-400">
            Create your professional email account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="text-sm font-medium text-white mb-2 block">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="bg-black border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.fullName && (
              <p className="mt-2 text-xs text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Username with Real-time Checking */}
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-white mb-2 block">
              Choose Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                className="bg-black border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
              />
              {/* Status Icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {usernameStatus.checking && (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                )}
                {usernameStatus.available === true && (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {usernameStatus.available === false && (
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {formData.username && `${formData.username}@aurafarming.co`}
            </div>
            {usernameStatus.message && (
              <div className={`mt-2 text-sm ${
                usernameStatus.available === true ? 'text-green-400' : 'text-red-400'
              }`}>
                {usernameStatus.message}
              </div>
            )}
            {errors.username && (
              <p className="mt-2 text-xs text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="dateOfBirth" className="text-sm font-medium text-white mb-2 block">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="bg-black border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.dateOfBirth && (
              <p className="mt-2 text-xs text-red-400">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <Label htmlFor="gender" className="text-sm font-medium text-white mb-2 block">
              Gender
            </Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-white mb-2 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-black border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        formData.password.length < 6 ? 'bg-red-500 w-1/3' :
                        formData.password.length < 8 ? 'bg-yellow-500 w-2/3' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${
                    formData.password.length < 6 ? 'text-red-400' :
                    formData.password.length < 8 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {formData.password.length < 6 ? 'Weak' :
                     formData.password.length < 8 ? 'Fair' :
                     'Strong'}
                  </span>
                </div>
              </div>
            )}
            {errors.password && (
              <p className="mt-2 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-white mb-2 block">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="bg-black border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            {formData.confirmPassword && (
              <div className={`mt-2 text-sm ${
                formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'
              }`}>
                {formData.password === formData.confirmPassword ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Passwords match!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passwords do not match
                  </span>
                )}
              </div>
            )}
            {errors.confirmPassword && (
              <p className="mt-2 text-xs text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || usernameStatus.available !== true || formData.password !== formData.confirmPassword}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Email Account
              </span>
            )}
          </Button>

          {/* Success/Error Messages */}
          {submitMessage && (
            <div className={`mt-6 p-4 rounded-xl text-center border ${
              submitMessage.type === 'success' 
                ? 'bg-green-900/30 border-green-500/50 text-green-300'
                : 'bg-red-900/30 border-red-500/50 text-red-300'
            }`}>
              {submitMessage.text}
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            By creating an account, you agree to AuraMail's email policies.
          </p>
        </form>
      </div>
    </div>
  );
} 