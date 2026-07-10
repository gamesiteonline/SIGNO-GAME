// SIGNO Save System
// Handles persistent storage of game progress using localStorage

import type { GameState } from '../game/engine/Types';

const STORAGE_KEY = 'SIGNO_GAME_DATA';
const SETTINGS_KEY = 'SIGNO_SETTINGS';

/**
 * Save game progress to localStorage
 */
export const saveGameData = (
  completedLevels: number[],
  secretsFound: Record<string, number>,
  gameState: GameState,
  settings: Record<string, any>
): void => {
  try {
    const data = {
      version: '1.0',
      timestamp: Date.now(),
      completedLevels,
      secretsFound,
      gameState,
      settings
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Also save settings separately for easier access
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    console.log('Game saved successfully');
  } catch (error) {
    console.error('Failed to save game data:', error);
  }
};

/**
 * Load game progress from localStorage
 * Returns null if no save data exists or if data is invalid
 */
export const loadGameData = (): {
  completedLevels: number[];
  secretsFound: Record<string, number>;
  gameState: GameState;
  settings: Record<string, any>;
} | null => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;

    const data = JSON.parse(savedData);

    // Validate data structure
    if (!data || typeof data !== 'object') return null;
    if (!data.completedLevels || !Array.isArray(data.completedLevels)) return null;
    if (!data.secretsFound || typeof data.secretsFound !== 'object') return null;
    if (!data.gameState || typeof data.gameState !== 'object') return null;

    // Validate game state has required properties
    const requiredStateProps = ['screen', 'currentLevel', 'deaths', 'collectiblesFound', 'timeElapsed', 'secretsFound'];
    for (const prop of requiredStateProps) {
      if (!(prop in data.gameState)) {
        console.warn(`Missing property ${prop} in saved game state`);
        // Continue anyway, missing properties will use defaults
      }
    }

    console.log('Game loaded successfully');
    return {
      completedLevels: data.completedLevels,
      secretsFound: data.secretsFound,
      gameState: data.gameState,
      settings: data.settings || {}
    };
  } catch (error) {
    console.error('Failed to load game data:', error);
    return null;
  }
};

/**
 * Load settings specifically
 */
export const loadSettings = (): Record<string, any> => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!savedSettings) return {};

    return JSON.parse(savedSettings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {};
  }
};

/**
 * Clear all saved game data
 */
export const clearSaveData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    console.log('Save data cleared');
  } catch (error) {
    console.error('Failed to clear save data:', error);
  }
};

/**
 * Check if save data exists
 */
export const hasSaveData = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Auto-save function to be called periodically
 */
export const createAutoSaver = (
  getState: () => {
    completedLevels: number[];
    secretsFound: Record<string, number>;
    gameState: GameState;
    settings: Record<string, any>;
  },
  intervalMs: number = 30000 // 30 seconds default
) => {
  let timer: NodeJS.Timeout | null = null;

  const save = () => {
    const state = getState();
    saveGameData(
      state.completedLevels,
      state.secretsFound,
      state.gameState,
      state.settings
    );
  };

  const start = () => {
    // Save immediately on start
    save();

    // Then set up interval
    timer = setInterval(save, intervalMs);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    // Save one final time
    save();
  };

  return { start, stop };
};