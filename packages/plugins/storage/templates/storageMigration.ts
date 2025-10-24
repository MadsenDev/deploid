/**
 * Migration utilities for updating existing localStorage usage
 * to use the new cross-platform storage system
 */

import { crossPlatformStorage } from './storage'

// Legacy storage keys that need migration
const LEGACY_KEYS = {
  THEME: 'theme',
  LOCALE: 'i18nextLng', // i18next default key
  PUSH_TOKEN: 'pushToken',
  PUSH_PROMPT_DISMISSED: 'pushNotificationPromptDismissed',
} as const

// New storage keys
const NEW_KEYS = {
  THEME: 'theme',
  LOCALE: 'locale',
  PUSH_TOKEN: 'pushToken',
  PUSH_PROMPT_DISMISSED: 'pushPromptDismissed',
} as const

/**
 * Migrates data from legacy localStorage to new cross-platform storage
 */
export async function migrateStorageData(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    // Migrate theme preference
    const legacyTheme = localStorage.getItem(LEGACY_KEYS.THEME)
    if (legacyTheme) {
      await crossPlatformStorage.set(NEW_KEYS.THEME, legacyTheme)
      localStorage.removeItem(LEGACY_KEYS.THEME)
    }

    // Migrate locale preference
    const legacyLocale = localStorage.getItem(LEGACY_KEYS.LOCALE)
    if (legacyLocale) {
      await crossPlatformStorage.set(NEW_KEYS.LOCALE, legacyLocale)
      localStorage.removeItem(LEGACY_KEYS.LOCALE)
    }

    // Migrate push token
    const legacyPushToken = localStorage.getItem(LEGACY_KEYS.PUSH_TOKEN)
    if (legacyPushToken) {
      await crossPlatformStorage.set(NEW_KEYS.PUSH_TOKEN, legacyPushToken)
      localStorage.removeItem(LEGACY_KEYS.PUSH_TOKEN)
    }

    // Migrate push prompt dismissed
    const legacyPushPrompt = localStorage.getItem(LEGACY_KEYS.PUSH_PROMPT_DISMISSED)
    if (legacyPushPrompt) {
      await crossPlatformStorage.set(NEW_KEYS.PUSH_PROMPT_DISMISSED, legacyPushPrompt)
      localStorage.removeItem(LEGACY_KEYS.PUSH_PROMPT_DISMISSED)
    }

    console.log('Storage migration completed successfully')
  } catch (error) {
    console.error('Storage migration failed:', error)
  }
}

/**
 * Hook to use migrated storage with fallback to legacy
 */
export function useMigratedStorage() {
  const getWithFallback = async <T>(newKey: string, legacyKey: string): Promise<T | null> => {
    // Try new storage first
    const newValue = await crossPlatformStorage.get<T>(newKey as any)
    if (newValue !== null) return newValue

    // Fallback to legacy localStorage
    if (typeof window !== 'undefined') {
      const legacyValue = localStorage.getItem(legacyKey)
      if (legacyValue !== null) {
        try {
          return JSON.parse(legacyValue) as T
        } catch {
          return legacyValue as T
        }
      }
    }

    return null
  }

  const setWithMigration = async <T>(newKey: string, value: T): Promise<void> => {
    await crossPlatformStorage.set(newKey as any, value)
    
    // Also update legacy storage for backward compatibility
    if (typeof window !== 'undefined') {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(newKey, serialized)
    }
  }

  return {
    get: getWithFallback,
    set: setWithMigration,
    remove: async (key: string) => {
      await crossPlatformStorage.remove(key as any)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    }
  }
}

export default { migrateStorageData, useMigratedStorage }
