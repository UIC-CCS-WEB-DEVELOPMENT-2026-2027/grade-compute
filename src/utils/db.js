// src/utils/db.js
import mockData from './db.json';
import { migrateDb, needsMigration } from './migrations.js';

const DB_KEY = 'compugrade_db';
export const DB_UPDATED_EVENT = 'compugrade-db-updated';

/**
 * Injects the db.json data into the browser's local storage 
 * ONLY if it doesn't already exist.
 */
export const initializeDatabase = () => {
  try {
    const existingData = localStorage.getItem(DB_KEY);
    if (!existingData) {
      localStorage.setItem(DB_KEY, JSON.stringify(mockData));
      console.log('Database initialized from db.json');
      return;
    }
    getDb(); // upgrades data saved in an older format
  } catch {
    // Keep authentication available when browser storage is blocked.
    // Do not replace or erase existing data.
  }
};
/**
 * Retrieves the entire database state.
 * Use this in your React components to read data.
 */
export const getDb = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    if (!needsMigration(parsed)) return parsed;

    // Upgrade only valid older data, preserving the stored copy on failure.
    const upgraded = migrateDb(parsed);
    localStorage.setItem(DB_KEY, JSON.stringify(upgraded));
    return upgraded;
  } catch {
    // The login page can report unavailable data instead of a blank screen.
    return null;
  }
};
/**
 * Overwrites the local storage with new data.
 * Use this whenever a user adds a class, types a score, etc.
 */
export const saveDb = (updatedData) => {
  localStorage.setItem(DB_KEY, JSON.stringify(updatedData));
  window.dispatchEvent(new Event(DB_UPDATED_EVENT));
};

/**
 * DEV TOOL: Instantly wipes any changes and restores the original db.json.
 * Useful when prototyping or if the state gets messy.
 */
export const resetDatabase = () => {
  localStorage.setItem(DB_KEY, JSON.stringify(mockData));
  console.log('Database forcibly reset to default db.json');
  window.location.reload(); // Refresh to show default data
};