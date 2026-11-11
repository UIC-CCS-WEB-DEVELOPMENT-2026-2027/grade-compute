// Helpers for component tests (files that start with "@vitest-environment jsdom").
// They seed localStorage the way the app does, sign in a user, and stub the
// few browser features jsdom does not have.
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { makeSeedDb } from "./fixtures.js";

export const DB_KEY = "compugrade_db";
export const ACTIVE_USER_KEY = "activeUserId";

// Saves a database and signs in a user (the seed student U1 by default).
export function seedBrowser(db = makeSeedDb(), userId = "U1") {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    if (userId) localStorage.setItem(ACTIVE_USER_KEY, userId);
}

export function readDb() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

// The stored record of one student in one class.
export function readRecord(classId = "C101", studentId = "U1") {
    return readDb()
        .classes.find((item) => item.id === classId)
        .studentRecords.find((record) => record.studentId === studentId);
}

// Call once at the top of a component test file.
export function setupBrowserTests() {
    beforeEach(() => {
        localStorage.clear();
        window.matchMedia = (query) => ({
            matches: false,
            media: query,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
        });
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
        Element.prototype.scrollIntoView = vi.fn();
        HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
        HTMLMediaElement.prototype.pause = vi.fn();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });
}
