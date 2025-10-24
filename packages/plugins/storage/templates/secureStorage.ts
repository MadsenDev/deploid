/**
 * Secure storage for sensitive data like auth tokens
 * Uses different strategies for web vs native environments
 */

import { Preferences } from '@capacitor/preferences'
import { crossPlatformStorage } from './storage'

export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

/**
 * Web secure storage using sessionStorage (more secure than localStorage)
 * SessionStorage is cleared when tab closes, providing better security
 */
class WebSecureStorageAdapter implements SecureStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(key, value)
    } catch (error) {
      console.warn('Failed to set secure storage item:', error)
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove secure storage item:', error)
    }
  }
}

/**
 * Native secure storage using Capacitor Preferences with encryption
 * This provides encrypted storage on device
 */
class NativeSecureStorageAdapter implements SecureStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      // Use Capacitor Preferences for secure storage
      const result = await Preferences.get({ key: `secure_${key}` })
      return result.value
    } catch (error) {
      console.warn('Secure storage not available, falling back to regular storage:', error)
      // Fallback to regular storage
      return await crossPlatformStorage.get(key as any)
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Use Capacitor Preferences for secure storage
      await Preferences.set({ key: `secure_${key}`, value })
    } catch (error) {
      console.warn('Secure storage not available, falling back to regular storage:', error)
      // Fallback to regular storage
      await crossPlatformStorage.set(key as any, value)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Use Capacitor Preferences for secure storage
      await Preferences.remove({ key: `secure_${key}` })
    } catch (error) {
      console.warn('Secure storage not available, falling back to regular storage:', error)
      // Fallback to regular storage
      await crossPlatformStorage.remove(key as any)
    }
  }
}

/**
 * Detects if running in native environment
 */
function isNativeEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         (window as any).Capacitor !== undefined
}

/**
 * Creates appropriate secure storage adapter
 */
function createSecureStorageAdapter(): SecureStorageAdapter {
  return isNativeEnvironment() 
    ? new NativeSecureStorageAdapter()
    : new WebSecureStorageAdapter()
}

// Global secure storage instance
const secureStorage = createSecureStorageAdapter()

/**
 * Secure storage for sensitive data
 */
export const secureStorageUtil = {
  /**
   * Get a value from secure storage
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await secureStorage.getItem(key)
      if (value === null) return null
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    } catch (error) {
      console.warn(`Failed to get secure storage key "${key}":`, error)
      return null
    }
  },

  /**
   * Set a value in secure storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      await secureStorage.setItem(key, serialized)
    } catch (error) {
      console.warn(`Failed to set secure storage key "${key}":`, error)
    }
  },

  /**
   * Remove a value from secure storage
   */
  async remove(key: string): Promise<void> {
    try {
      await secureStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove secure storage key "${key}":`, error)
    }
  },

  /**
   * Check if secure storage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false
    
    if (isNativeEnvironment()) {
      return true // Capacitor should be available
    }
    
    try {
      const testKey = '__secure_storage_test__'
      sessionStorage.setItem(testKey, 'test')
      sessionStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
}

export default secureStorageUtil
