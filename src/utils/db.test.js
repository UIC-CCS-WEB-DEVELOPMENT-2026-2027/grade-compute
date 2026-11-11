// @vitest-environment jsdom
// Characterization tests for db.js and session.js (browser storage).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeSeedDb } from '../test/fixtures.js';
import { DB_UPDATED_EVENT, getDb, initializeDatabase, saveDb } from './db.js';
import { ACTIVE_USER_KEY, getActiveStudentId, getActiveUser, signOut } from './session.js';

const DB_KEY = 'compugrade_db';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('initializeDatabase', () => {
  it('seeds storage from db.json when it is empty', () => {
    initializeDatabase();
    expect(JSON.parse(localStorage.getItem(DB_KEY))).toEqual(makeSeedDb());
    expect(console.log).toHaveBeenCalledWith('Database initialized from db.json');
  });

  it('never overwrites data that is already there', () => {
    const saved = { ...makeSeedDb(), users: [] };
    localStorage.setItem(DB_KEY, JSON.stringify(saved));
    initializeDatabase();
    expect(JSON.parse(localStorage.getItem(DB_KEY))).toEqual(saved);
  });

  it('upgrades older data that is already there', () => {
    localStorage.setItem(DB_KEY, JSON.stringify({ users: [] }));
    initializeDatabase();
    expect(JSON.parse(localStorage.getItem(DB_KEY))).toEqual({
      users: [],
      schemaVersion: 2,
      computationRules: [],
      classes: [],
    });
  });
});

describe('getDb', () => {
  it('returns null when nothing is stored or the stored text is not JSON', () => {
    expect(getDb()).toBeNull();
    localStorage.setItem(DB_KEY, '{not json');
    expect(getDb()).toBeNull();
    expect(localStorage.getItem(DB_KEY)).toBe('{not json');
  });

  it('returns the stored database', () => {
    localStorage.setItem(DB_KEY, JSON.stringify(makeSeedDb()));
    expect(getDb()).toEqual(makeSeedDb());
  });

  it('upgrades older data and saves the upgraded copy, without an update event', () => {
    const listener = vi.fn();
    window.addEventListener(DB_UPDATED_EVENT, listener);
    localStorage.setItem(DB_KEY, JSON.stringify({ schemaVersion: 1, users: [{ id: 'U1' }] }));

    expect(getDb()).toMatchObject({ schemaVersion: 2, users: [{ id: 'U1' }] });
    expect(JSON.parse(localStorage.getItem(DB_KEY)).schemaVersion).toBe(2);
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(DB_UPDATED_EVENT, listener);
  });
});

describe('saveDb', () => {
  it('writes the database and tells listeners it changed', () => {
    const listener = vi.fn();
    window.addEventListener(DB_UPDATED_EVENT, listener);
    const db = { ...makeSeedDb(), users: [] };

    saveDb(db);

    expect(DB_UPDATED_EVENT).toBe('compugrade-db-updated');
    expect(JSON.parse(localStorage.getItem(DB_KEY))).toEqual(db);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(DB_UPDATED_EVENT, listener);
  });
});

describe('session', () => {
  it('uses the "activeUserId" key', () => {
    expect(ACTIVE_USER_KEY).toBe('activeUserId');
  });

  it('nobody is signed in by default', () => {
    expect(getActiveStudentId(makeSeedDb())).toBeNull();
    expect(getActiveUser(makeSeedDb())).toBeNull();
  });

  it('returns the signed-in student', () => {
    localStorage.setItem(ACTIVE_USER_KEY, 'U1');
    expect(getActiveStudentId(makeSeedDb())).toBe('U1');
    expect(getActiveUser(makeSeedDb())).toMatchObject({ id: 'U1', role: 'student', name: 'Ysa Ang' });
  });

  it('a professor or admin is a user but not an active student', () => {
    localStorage.setItem(ACTIVE_USER_KEY, 'U2');
    expect(getActiveStudentId(makeSeedDb())).toBeNull();
    expect(getActiveUser(makeSeedDb())).toMatchObject({ id: 'U2', role: 'professor' });
    localStorage.setItem(ACTIVE_USER_KEY, 'U3');
    expect(getActiveStudentId(makeSeedDb())).toBeNull();
  });

  it('an unknown id or a missing database means nobody is signed in', () => {
    localStorage.setItem(ACTIVE_USER_KEY, 'U99');
    expect(getActiveStudentId(makeSeedDb())).toBeNull();
    expect(getActiveUser(makeSeedDb())).toBeNull();
    localStorage.setItem(ACTIVE_USER_KEY, 'U1');
    expect(getActiveStudentId(null)).toBeNull();
    expect(getActiveUser(null)).toBeNull();
  });

  it('signOut clears the signed-in user', () => {
    localStorage.setItem(ACTIVE_USER_KEY, 'U1');
    signOut();
    expect(localStorage.getItem(ACTIVE_USER_KEY)).toBeNull();
  });
});
