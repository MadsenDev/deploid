/**
 * Cross-platform storage utility for web and native environments
 * Handles localStorage (web) and Capacitor Preferences (native) seamlessly
 */

import { Preferences } from '@capacitor/preferences'

export type StorageKey = 
  | 'theme'
  | 'locale' 
  | 'pushToken'
  | 'pushPromptDismissed'
  | 'userPreferences'
  | 'offlineData'
  | 'user'
  | 'accessToken'

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}

/**
 * Web storage adapter using localStorage
 */
class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

/**
 * Native storage adapter using Capacitor Preferences
 */
class NativeStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      const result = await Preferences.get({ key })
      return result.value
    } catch {
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value })
    } catch (error) {
      console.warn('Failed to set storage item:', error)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await Preferences.remove({ key })
    } catch (error) {
      console.warn('Failed to remove storage item:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      await Preferences.clear()
    } catch (error) {
      console.warn('Failed to clear storage:', error)
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
 * Creates appropriate storage adapter based on environment
 */
function createStorageAdapter(): StorageAdapter {
  return isNativeEnvironment() 
    ? new NativeStorageAdapter()
    : new WebStorageAdapter()
}

// Global storage instance
const storage = createStorageAdapter()

/**
 * Cross-platform storage utility
 */
export const crossPlatformStorage = {
  /**
   * Get a value from storage
   */
  async get<T = string>(key: StorageKey): Promise<T | null> {
    try {
      const value = await storage.getItem(key)
      if (value === null) return null
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    } catch (error) {
      console.warn(`Failed to get storage key "${key}":`, error)
      return null
    }
  },

  /**
   * Set a value in storage
   */
  async set<T>(key: StorageKey, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      await storage.setItem(key, serialized)
    } catch (error) {
      console.warn(`Failed to set storage key "${key}":`, error)
    }
  },

  /**
   * Remove a value from storage
   */
  async remove(key: StorageKey): Promise<void> {
    try {
      await storage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove storage key "${key}":`, error)
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      await storage.clear()
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
  },

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false
    
    if (isNativeEnvironment()) {
      return true // Capacitor Preferences should be available
    }
    
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Hook for using storage in React components
 */
export function useStorage() {
  return {
    get: crossPlatformStorage.get,
    set: crossPlatformStorage.set,
    remove: crossPlatformStorage.remove,
    clear: crossPlatformStorage.clear,
    isAvailable: crossPlatformStorage.isAvailable,
  }
}

export default crossPlatformStorage
