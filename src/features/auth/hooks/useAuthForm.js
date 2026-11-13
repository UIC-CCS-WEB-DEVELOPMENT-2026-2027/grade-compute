// The sign-in and registration form: its fields, errors and messages, the
// switch between Log In and Create Account, and the submit, which checks
// the fields, then signs a student in (or registers them) and opens their
// page. Professor and admin logins are verified and stopped (docs/AUDIT.md
// §6). Only the pathname of a redirected page is kept (B14).
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDb, saveDb } from "@/services/db";
import { ACTIVE_USER_KEY } from "@/services/session";
import {
    authenticateAccount,
    registerAccount,
    validateAuthFields,
} from "@/features/auth/lib/accounts";

export function useAuthForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("login");
    const [fullName, setFullName] = useState("");
    const [registrationRole, setRegistrationRole] = useState("student");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPasswordHints, setShowPasswordHints] = useState(false);
    const isRegister = activeTab === "register";

    const changeAuthMode = (mode) => {
        if (mode === activeTab) return;
        setActiveTab(mode);
        setFullName("");
        setRegistrationRole("student");
        setIdentifier("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setFieldErrors({});
        setShowPasswordHints(false);
        setErrorMessage("");
        setInfoMessage("");
    };

    const clearFieldError = (field) => {
        setFieldErrors((previous) => {
            const next = { ...previous };
            delete next[field];
            return next;
        });
        setErrorMessage("");
        setInfoMessage("");
    };

    const focusFirstError = (form, errors) => {
        form.elements.namedItem(Object.keys(errors)[0])?.focus?.();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setErrorMessage("");
        setInfoMessage("");
        const fields = { fullName, role: registrationRole, identifier, password, confirmPassword };
        const invalidFields = validateAuthFields({ ...fields, mode: activeTab });
        setFieldErrors(invalidFields);
        setShowPasswordHints(Boolean(isRegister && invalidFields.password));
        if (Object.keys(invalidFields).length) {
            focusFirstError(form, invalidFields);
            return;
        }
        let database;
        try {
            database = getDb();
        } catch {
            setErrorMessage("Saved account data could not be read. Refresh and try again.");
            return;
        }
        if (!database || !Array.isArray(database.users)) {
            setErrorMessage("Account data is unavailable. Refresh and try again.");
            return;
        }
        if (
            database.users.some(
                (account) =>
                    !account || typeof account !== "object" || typeof account.id !== "string",
            )
        ) {
            setErrorMessage(
                "Saved account data is incomplete. Please contact your project administrator.",
            );
            return;
        }
        const clearPreviousSession = () => {
            try {
                localStorage.removeItem(ACTIVE_USER_KEY);
                return true;
            } catch {
                setErrorMessage(
                    "The previous sign-in could not be cleared. Check browser storage and try again.",
                );
                return false;
            }
        };
        let user;
        if (isRegister) {
            const registration = registerAccount(database, fields);
            if (registration.errors) {
                setFieldErrors(registration.errors);
                focusFirstError(form, registration.errors);
                return;
            }
            user = registration.user;
            try {
                saveDb(registration.database);
            } catch {
                setErrorMessage(
                    "Your account could not be saved. Check browser storage and try again.",
                );
                return;
            }
            if (user.role === "professor") {
                if (!clearPreviousSession()) return;
                changeAuthMode("login");
                setIdentifier(user.email);
                setInfoMessage("Professor account created. Your workspace is coming soon.");
                return;
            }
        } else {
            const authentication = authenticateAccount(database, identifier, password);
            if (authentication.errors) {
                setFieldErrors(authentication.errors);
                focusFirstError(form, authentication.errors);
                return;
            }
            user = authentication.user;
            if (user.role !== "student") {
                if (!clearPreviousSession()) return;
                setInfoMessage(
                    user.role === "professor"
                        ? "Login verified. The Professor Workspace is coming soon."
                        : "Login verified. This workspace is not available yet.",
                );
                return;
            }
        }
        try {
            localStorage.setItem(ACTIVE_USER_KEY, user.id);
        } catch {
            if (isRegister) {
                changeAuthMode("login");
                setIdentifier(user.email);
                setErrorMessage("Account saved. Automatic sign-in failed; please log in.");
            } else
                setErrorMessage("Sign-in could not be saved. Check browser storage and try again.");
            return;
        }
        const requestedPath = location.state?.from;
        const destination =
            !isRegister &&
            typeof requestedPath === "string" &&
            (requestedPath === "/settings" || requestedPath.startsWith("/student/"))
                ? requestedPath
                : "/student/dashboard";
        navigate(destination, { replace: true });
    };

    return {
        activeTab,
        fullName,
        setFullName,
        registrationRole,
        setRegistrationRole,
        identifier,
        setIdentifier,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        errorMessage,
        setErrorMessage,
        infoMessage,
        setInfoMessage,
        fieldErrors,
        showPasswordHints,
        isRegister,
        changeAuthMode,
        clearFieldError,
        handleSubmit,
    };
}
