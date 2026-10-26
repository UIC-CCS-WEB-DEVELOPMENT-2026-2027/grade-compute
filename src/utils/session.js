// src/utils/session.js
// Who is signed in. LoginRegister saves the user's id under "activeUserId"
// when a student logs in or registers; every student page reads it from
// here instead of assuming a fixed account.
// Pass the database from getDb() (pages already have it as dbData).
export const ACTIVE_USER_KEY = "activeUserId";

function readStoredUserId() {
    try {
        return localStorage.getItem(ACTIVE_USER_KEY);
    } catch {
        return null;
    }
}

// The signed-in student's id, or null if no student is signed in
// (nobody logged in, the account was removed, or it isn't a student).
export function getActiveStudentId(db) {
    const id = readStoredUserId();
    if (!id) return null;
    const user = db?.users?.find((item) => item.id === id);
    return user?.role === "student" ? id : null;
}

// The signed-in user's record from the database, or null.
export function getActiveUser(db) {
    const id = readStoredUserId();
    return id ? db?.users?.find((item) => item.id === id) ?? null : null;
}

export function signOut() {
    try {
        localStorage.removeItem(ACTIVE_USER_KEY);
    } catch {
        // Storage blocked: nothing was saved, so there is nothing to clear.
    }
}
