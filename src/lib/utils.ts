import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  FileSpreadsheet, 
  Presentation,
  HardDrive
} from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Unknown date'
  const now = new Date()
  // Check calendar day equality for 'Today'
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isSameDay) return 'Today'

  const msPerDay = 1000 * 60 * 60 * 24
  const diffDays = Math.floor(Math.abs(now.getTime() - d.getTime()) / msPerDay)

  if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }
}

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('audio/')) return 'Music'
  if (mimeType === 'application/pdf') return 'FileText'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'FileText'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Sheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation'
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'FileText'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'Archive'
  return 'File'
}

export function getFileIconComponent(mimeType: string): { icon: React.ComponentType<any>; color: string } {
  if (mimeType.startsWith('image/')) return { icon: Image, color: 'text-green-500' }
  if (mimeType.startsWith('video/')) return { icon: Video, color: 'text-purple-500' }
  if (mimeType.startsWith('audio/')) return { icon: Music, color: 'text-pink-500' }
  if (mimeType === 'application/pdf') return { icon: FileText, color: 'text-red-500' }
  if (mimeType.includes('document') || mimeType.includes('word')) return { icon: FileText, color: 'text-blue-500' }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { icon: FileSpreadsheet, color: 'text-green-600' }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { icon: Presentation, color: 'text-orange-500' }
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return { icon: FileText, color: 'text-gray-500' }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return { icon: Archive, color: 'text-yellow-600' }
  return { icon: File, color: 'text-gray-400' }
}

export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'text'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive'
  return 'other'
}

export function truncateText(text: string | null | undefined, maxLength: number) {
  const s = text ?? ''
  if (s.length <= maxLength) return s
  return s.slice(0, maxLength) + '...'
}

export function generateShareUrl(token: string) {
  return `${window.location.origin}/shared/${token}`
}

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}

export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function isImageFile(mimeType: string) {
  return mimeType.startsWith('image/')
}

export function isVideoFile(mimeType: string) {
  return mimeType.startsWith('video/')
}

export function isAudioFile(mimeType: string) {
  return mimeType.startsWith('audio/')
}

export function isPdfFile(mimeType: string) {
  return mimeType === 'application/pdf'
}

export function isTextFile(mimeType: string) {
  return mimeType.startsWith('text/') || mimeType === 'application/json'
}

export function canPreview(mimeType: string) {
  return isImageFile(mimeType) || isVideoFile(mimeType) || isAudioFile(mimeType) || isPdfFile(mimeType) || isTextFile(mimeType)
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string) {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: [
      ...(password.length < minLength ? [`Password must be at least ${minLength} characters long`] : []),
      ...(!hasUpperCase ? ['Password must contain at least one uppercase letter'] : []),
      ...(!hasLowerCase ? ['Password must contain at least one lowercase letter'] : []),
      ...(!hasNumbers ? ['Password must contain at least one number'] : []),
      ...(!hasSpecialChar ? ['Password must contain at least one special character'] : []),
    ]
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

export function isTokenExpired(token: string) {
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return true
  return Date.now() >= payload.exp * 1000
}
