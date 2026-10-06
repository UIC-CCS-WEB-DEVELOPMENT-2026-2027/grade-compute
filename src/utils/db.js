// src/utils/db.js
import mockData from './db.json';

const DB_KEY = 'compugrade_db';

/**
 * Injects the db.json data into the browser's local storage 
 * ONLY if it doesn't already exist.
 */
export const initializeDatabase = () => {
  const existingData = localStorage.getItem(DB_KEY);
  if (!existingData) {
    localStorage.setItem(DB_KEY, JSON.stringify(mockData));
    console.log('Database initialized from db.json');
  }
};

/**
 * Retrieves the entire database state.
 * Use this in your React components to read data.
 */
export const getDb = () => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * Overwrites the local storage with new data.
 * Use this whenever a user adds a class, types a score, etc.
 */
export const saveDb = (updatedData) => {
  localStorage.setItem(DB_KEY, JSON.stringify(updatedData));
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