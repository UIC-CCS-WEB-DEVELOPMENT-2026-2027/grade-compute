// Tests for the sign-in and registration helpers (checklist A3-A13).
import { describe, expect, it } from "vitest";
import { makeSeedDb } from "@/test/fixtures.js";
import {
    authenticateAccount,
    getPasswordError,
    PASSWORD_REQUIREMENTS,
    registerAccount,
    validateAuthFields,
} from "./accounts.js";

const VALID = {
    fullName: "  New   Student ",
    role: "student",
    identifier: " New@School.EDU ",
    password: "Secret#123",
    confirmPassword: "Secret#123",
};

describe("PASSWORD_REQUIREMENTS", () => {
    it("lists the four rules shown under the password field", () => {
        expect(PASSWORD_REQUIREMENTS.map((rule) => rule.label)).toEqual([
            "At least 8 characters",
            "Special character",
            "Uppercase letter",
            "Number",
        ]);
        const met = (value) => PASSWORD_REQUIREMENTS.map((rule) => rule.test(value));
        expect(met("Secret#123")).toEqual([true, true, true, true]);
        expect(met("abc def")).toEqual([false, false, false, false]);
    });
});

describe("getPasswordError", () => {
    it("explains what is missing (A7, A8)", () => {
        expect(getPasswordError("")).toBe("Password is required.");
        expect(getPasswordError("   ")).toBe("Password is required.");
        expect(getPasswordError("Ab#1")).toBe("Use at least 8 characters.");
        expect(getPasswordError("password123")).toBe(
            "Include an uppercase letter, a number, and a special character.",
        );
        expect(getPasswordError("Password123")).toBe(
            "Include an uppercase letter, a number, and a special character.",
        );
        expect(getPasswordError("Secret#123")).toBe("");
    });
});

describe("validateAuthFields: log in (A3)", () => {
    it("requires both fields", () => {
        expect(validateAuthFields({ mode: "login", identifier: "", password: "" })).toEqual({
            identifier: "Email or Student ID is required.",
            password: "Password is required.",
        });
    });

    it("does not check the email format or password strength", () => {
        expect(validateAuthFields({ mode: "login", identifier: "U1", password: "x" })).toEqual({});
    });
});

describe("validateAuthFields: create account (A7, A8)", () => {
    it("lists every empty field", () => {
        expect(
            validateAuthFields({
                mode: "register",
                identifier: "",
                password: "",
                confirmPassword: "",
            }),
        ).toEqual({
            fullName: "Full name is required.",
            identifier: "Email is required.",
            password: "Password is required.",
            confirmPassword: "Please confirm your password.",
        });
    });

    it("checks the email, the password and the confirmation", () => {
        expect(
            validateAuthFields({
                mode: "register",
                fullName: "Ana",
                identifier: "not-an-email",
                password: "short",
                confirmPassword: "other",
            }),
        ).toEqual({
            identifier: "Enter a valid email address.",
            password: "Use at least 8 characters.",
            confirmPassword: "Passwords do not match.",
        });
    });

    it("limits the full name to 120 characters and the role to student or professor", () => {
        expect(
            validateAuthFields({
                ...VALID,
                mode: "register",
                fullName: "a".repeat(121),
                role: "admin",
            }),
        ).toEqual({
            fullName: "Use 120 characters or fewer.",
            role: "Choose Student or Professor.",
        });
        expect(validateAuthFields({ ...VALID, mode: "register" })).toEqual({});
    });
});

describe("registerAccount", () => {
    it("returns the field errors first", () => {
        expect(registerAccount(makeSeedDb(), { ...VALID, confirmPassword: "" })).toEqual({
            errors: { confirmPassword: "Please confirm your password." },
        });
    });

    it("rejects an email that is already registered, ignoring case (A9)", () => {
        expect(registerAccount(makeSeedDb(), { ...VALID, identifier: "YSA@student.edu" })).toEqual({
            errors: { identifier: "This email is already registered. Please log in." },
        });
    });

    it("adds a student with the next id and a tidied name and email (A10)", () => {
        const db = makeSeedDb();
        const result = registerAccount(db, VALID);
        expect(result.user).toEqual({
            id: "U4",
            role: "student",
            name: "New Student",
            email: "new@school.edu",
            password: "Secret#123",
            programSection: "New Student",
        });
        expect(result.database.users).toEqual([...db.users, result.user]);
        expect(db.users).toHaveLength(3);
    });

    it("adds a professor without a program section (A11)", () => {
        const { user } = registerAccount(makeSeedDb(), { ...VALID, role: "professor" });
        expect(user.role).toBe("professor");
        expect(user).not.toHaveProperty("programSection");
    });
});

describe("authenticateAccount", () => {
    it("returns the field errors first (A3)", () => {
        expect(authenticateAccount(makeSeedDb(), " ", "")).toEqual({
            errors: {
                identifier: "Email or Student ID is required.",
                password: "Password is required.",
            },
        });
    });

    it("finds the account by email or id, ignoring case and spaces (A1, A2)", () => {
        const db = makeSeedDb();
        expect(authenticateAccount(db, " YSA@student.edu ", "password123").user.id).toBe("U1");
        expect(authenticateAccount(db, "u1", "password123").user.id).toBe("U1");
    });

    it("reports an unknown account (A4)", () => {
        expect(authenticateAccount(makeSeedDb(), "nobody@x.edu", "password123")).toEqual({
            errors: { identifier: "Account not found. Check your email or Student ID." },
        });
    });

    it("reports a wrong password (A5)", () => {
        expect(authenticateAccount(makeSeedDb(), "ysa@student.edu", "wrong")).toEqual({
            errors: { password: "Incorrect password. Please try again." },
        });
    });

    it("returns professor and admin accounts too; the page decides what to do (A12, A13)", () => {
        const db = makeSeedDb();
        expect(authenticateAccount(db, "maria@faculty.edu", "password123").user.role).toBe(
            "professor",
        );
        expect(authenticateAccount(db, "admin@compugrade.edu", "admin").user.role).toBe("admin");
    });
});
