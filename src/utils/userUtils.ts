// Centralized username management utility
export function getUsername(): string | null {
  return localStorage.getItem('username');
}

export function setUsername(username: string): void {
  localStorage.setItem('username', username);
}

export function clearUsername(): void {
  localStorage.removeItem('username');
}

// Legacy function for backward compatibility with existing code
export function getUserId(): string {
  const username = getUsername();
  if (username) {
    return username;
  }
  
  // Fallback to old system if no username is set
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
}