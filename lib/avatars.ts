// Avatar utility functions for consistent avatar generation

export interface UserInfo {
  id?: number
  name?: string
  email?: string
  role?: string
}

export const getAvatarUrl = (user: UserInfo | null): string => {
  if (!user) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=9ca3af&textColor=ffffff`
  }
  
  const seed = user.name || user.email || `user-${user.id}` || 'default'
  
  // Different avatar styles based on role
  switch (user.role) {
    case 'admin':
      return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=dc2626&textColor=ffffff`
    case 'manager':
      return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=f59e0b&textColor=ffffff`
    default:
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=3b82f6&textColor=ffffff`
  }
}

export const getAvatarFallbackColor = (role?: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-red-600 text-white'
    case 'manager':
      return 'bg-amber-500 text-white'
    default:
      return 'bg-blue-500 text-white'
  }
}

export const getInitials = (name?: string, role?: string): string => {
  if (name) {
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }
  
  return role?.charAt(0)?.toUpperCase() || 'U'
}
