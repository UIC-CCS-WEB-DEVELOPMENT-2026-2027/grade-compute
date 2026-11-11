import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDb, saveDb } from "@/services/db";
import { ACTIVE_USER_KEY } from "@/services/session";
import {
    authenticateAccount,
    PASSWORD_REQUIREMENTS,
    registerAccount,
    validateAuthFields,
} from "@/features/auth/lib/accounts";
import documentIcon from "../../assets/document-icon.svg";
import graduationCap from "../../assets/graduation-cap.svg";
import sparkle from "../../assets/decorative-sparkle.svg";
import sparkleSmall from "../../assets/decorative-sparkle-small.svg";
import sparkleTiny from "../../assets/decorative-sparkle-tiny.svg";
import targetStar from "../../assets/target-star.svg";
import openTargetButton from "../../assets/open-target-button.svg";
import openArrow from "../../assets/open-arrow.svg";
import greenStatusDot from "../../assets/green-status-dot.svg";
import notificationCheckBadge from "../../assets/notification-check-badge.svg";
import notificationCheck from "../../assets/notification-check.svg";
import dottedHeaderDivider from "../../assets/dotted-header-divider.svg";
import chartLowerRule from "../../assets/chart-lower-rule.svg";
import "./LoginRegister.css";

const previewScores = [
    { value: 84, height: 24, label: "Quiz 1" },
    { value: 88, height: 41, label: "Lab 1" },
    { value: 91, height: 54, label: "Quiz 2" },
    { value: 93, height: 72, label: "Midterm" },
    { value: 95, height: 89, label: "Target" },
];

function AcademicPreview() {
    return (
        <div
            className="preview-scene"
            aria-label="Example grade progress, from 84 percent to a 95 percent target"
        >
            <div className="preview-card">
                <div className="preview-header">
                    <span className="preview-cap">
                        <img src={graduationCap} alt="" />
                    </span>
                    <div>
                        <small>YOU'RE VERY ON TRACK</small>
                        <span>A plan for your Q1 target</span>
                    </div>
                    <span className="preview-arrow" aria-hidden="true">
                        <img src={openTargetButton} alt="" />
                        <img src={openArrow} alt="" />
                    </span>
                </div>
                <img className="preview-divider" src={dottedHeaderDivider} alt="" />
                <div className="target-row">
                    <span>My grade target</span>
                    <em>
                        <img src={greenStatusDot} alt="" /> On Track
                    </em>
                    <strong>
                        96% <img src={targetStar} alt="" />
                    </strong>
                </div>
                <div className="bars" aria-hidden="true">
                    {previewScores.map(({ value, height, label }) => (
                        <div className="bar-item" key={label}>
                            <div className="bar-column" style={{ "--bar-height": `${height}px` }}>
                                <small>{value}%</small>
                                <span className="bar-hover">
                                    <i className="bar" />
                                </span>
                            </div>
                            <span>{label}</span>
                        </div>
                    ))}
                    <img className="chart-rule" src={chartLowerRule} alt="" />
                </div>
            </div>
            <div className="preview-note">
                <span className="notification-badge" aria-hidden="true">
                    <img src={notificationCheckBadge} alt="" />
                    <img src={notificationCheck} alt="" />
                </span>
                <div>Make Your Target Grade a Reality</div>
            </div>
        </div>
    );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, error, isRegister }) {
    return (
        <div className="auth-field">
            <label htmlFor={id}>{label}</label>
            <div className="auth-input-wrap">
                <input
                    id={id}
                    name={id}
                    required
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    placeholder={
                        id === "confirmPassword" ? "Confirm your password" : "Enter your password"
                    }
                    className={error ? "has-error" : undefined}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                />
                <button
                    type="button"
                    className="visibility-button"
                    aria-label={
                        (visible ? "Hide " : "Show ") +
                        (id === "confirmPassword" ? "confirmed password" : "password")
                    }
                    title={
                        (visible ? "Hide " : "Show ") +
                        (id === "confirmPassword" ? "confirmed password" : "password")
                    }
                    aria-controls={id}
                    aria-pressed={visible}
                    onClick={onToggle}
                >
                    <svg
                        className="visibility-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                        {visible && (
                            <>
                                <path d="m3 3 18 18" stroke="white" strokeWidth="4" />
                                <path className="visibility-slash" d="m3 3 18 18" />
                            </>
                        )}
                    </svg>
                </button>
            </div>
            <small
                id={`${id}-error`}
                className="field-error"
                role={error ? "alert" : undefined}
                aria-hidden={!error}
            >
                {error || "\u00a0"}
            </small>
        </div>
    );
}

export function LoginRegister() {
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
    return (
        <main className={`auth-page${isRegister ? " is-register" : ""}`}>
            <section className="auth-hero" aria-label="About CompUGrade">
                <header className="auth-brand">
                    <span className="brand-icon">
                        <img src={documentIcon} alt="" />
                    </span>
                    <strong>
                        CompUGrade
                        <span className="brand-dot" aria-hidden="true">
                            .
                        </span>
                    </strong>
                </header>
                <div className="hero-content">
                    <p className="eyebrow">A CLEARER PATH TO HIGH POTENTIAL</p>
                    <h1>
                        Calculate grades and achieve
                        <br className="desktop-heading-break" /> grade targets
                    </h1>
                    <div className="hero-points">
                        <span>• Track your progress</span>
                        <span>• Simulate your targets</span>
                        <span>• Learn with confidence</span>
                    </div>
                    <AcademicPreview />
                </div>
                <img className="sparkle sparkle-one" src={sparkle} alt="" />
                <img className="sparkle sparkle-two" src={sparkleSmall} alt="" />
                <img className="sparkle sparkle-three" src={sparkleTiny} alt="" />
                <img className="sparkle sparkle-four" src={sparkleSmall} alt="" />
                <p className="mobile-guide-label">YOUR ACADEMIC GUIDE</p>
                <p className="hero-footer">MADE FOR STUDENTS. BUILT WITH PROFESSORS.</p>
            </section>
            <section className="auth-panel" aria-labelledby="auth-title">
                <p className="guide-label">YOUR ACADEMIC GUIDE</p>
                <div className={`auth-form-area${isRegister ? " is-register" : ""}`}>
                    <div className="auth-tabs" role="group" aria-label="Account access">
                        <button
                            type="button"
                            className={!isRegister ? "active" : ""}
                            aria-pressed={!isRegister}
                            onClick={() => changeAuthMode("login")}
                        >
                            Log In
                        </button>
                        <button
                            type="button"
                            className={isRegister ? "active" : ""}
                            aria-pressed={isRegister}
                            onClick={() => changeAuthMode("register")}
                        >
                            Create Account
                        </button>
                    </div>
                    <div className="auth-intro" key={`intro-${activeTab}`}>
                        <p className="form-eyebrow">
                            {isRegister ? "YOUR NEXT CHAPTER STARTS HERE" : "GOOD TO SEE YOU AGAIN"}
                        </p>
                        <h2 id="auth-title">
                            {isRegister ? "Create your account." : "Welcome back."}
                        </h2>
                        <p className="form-subtitle">
                            {isRegister
                                ? "Set your goals. Build a stronger semester."
                                : "Your grades, goals, and next steps are waiting."}
                        </p>
                    </div>
                    <form key={activeTab} onSubmit={handleSubmit} noValidate>
                        {isRegister && (
                            <fieldset className="account-types">
                                <legend className="sr-only">Account type</legend>
                                {["student", "professor"].map((role) => (
                                    <label
                                        key={role}
                                        className={`account-type${registrationRole === role ? " selected" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role}
                                            checked={registrationRole === role}
                                            onChange={() => {
                                                setRegistrationRole(role);
                                                setErrorMessage("");
                                                setInfoMessage("");
                                            }}
                                        />
                                        <span>{role === "student" ? "Student" : "Professor"}</span>
                                    </label>
                                ))}
                            </fieldset>
                        )}
                        <div className={isRegister ? "registration-identity" : undefined}>
                            {isRegister && (
                                <div className="auth-field">
                                    <label htmlFor="fullName">Full name</label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        required
                                        value={fullName}
                                        autoComplete="name"
                                        maxLength={120}
                                        onChange={(event) => {
                                            setFullName(event.target.value);
                                            clearFieldError("fullName");
                                        }}
                                        placeholder="Your full name"
                                        className={fieldErrors.fullName ? "has-error" : undefined}
                                        aria-invalid={Boolean(fieldErrors.fullName)}
                                        aria-describedby={
                                            fieldErrors.fullName ? "fullName-error" : undefined
                                        }
                                    />
                                    <small
                                        id="fullName-error"
                                        className="field-error"
                                        role={fieldErrors.fullName ? "alert" : undefined}
                                        aria-hidden={!fieldErrors.fullName}
                                    >
                                        {fieldErrors.fullName || "\u00a0"}
                                    </small>
                                </div>
                            )}
                            <div className="auth-field">
                                <label htmlFor="identifier">
                                    {isRegister ? "Email" : "Email or Student ID"}
                                </label>
                                <input
                                    id="identifier"
                                    name="identifier"
                                    required
                                    type={isRegister ? "email" : "text"}
                                    value={identifier}
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    onChange={(event) => {
                                        setIdentifier(event.target.value);
                                        clearFieldError("identifier");
                                    }}
                                    placeholder="you@university.edu"
                                    className={fieldErrors.identifier ? "has-error" : undefined}
                                    aria-invalid={Boolean(fieldErrors.identifier)}
                                    aria-describedby={
                                        fieldErrors.identifier ? "identifier-error" : undefined
                                    }
                                />
                                <small
                                    id="identifier-error"
                                    className="field-error"
                                    role={fieldErrors.identifier ? "alert" : undefined}
                                    aria-hidden={!fieldErrors.identifier}
                                >
                                    {fieldErrors.identifier || "\u00a0"}
                                </small>
                            </div>
                        </div>
                        <PasswordField
                            id="password"
                            label="Password"
                            value={password}
                            isRegister={isRegister}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                clearFieldError("password");
                                clearFieldError("confirmPassword");
                            }}
                            visible={showPassword}
                            onToggle={() => setShowPassword((value) => !value)}
                            error={fieldErrors.password}
                        />
                        {isRegister && (
                            <PasswordField
                                id="confirmPassword"
                                label="Confirm password"
                                value={confirmPassword}
                                isRegister
                                onChange={(event) => {
                                    setConfirmPassword(event.target.value);
                                    clearFieldError("confirmPassword");
                                }}
                                visible={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword((value) => !value)}
                                error={fieldErrors.confirmPassword}
                            />
                        )}
                        <div
                            className={`auth-feedback${isRegister ? " registration-feedback" : ""}`}
                        >
                            {isRegister && !errorMessage && !infoMessage && (
                                <ul className="password-hints" aria-label="Password requirements">
                                    {PASSWORD_REQUIREMENTS.map((requirement) => (
                                        <li
                                            key={requirement.label}
                                            className={
                                                requirement.test(password)
                                                    ? "met"
                                                    : showPasswordHints
                                                      ? "unmet"
                                                      : "pending"
                                            }
                                        >
                                            <span aria-hidden="true">
                                                {requirement.test(password)
                                                    ? "✓"
                                                    : showPasswordHints
                                                      ? "×"
                                                      : "·"}
                                            </span>{" "}
                                            {requirement.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {errorMessage && (
                                <p className="form-message error" role="alert">
                                    {errorMessage}
                                </p>
                            )}
                            {infoMessage && (
                                <p className="form-message info" role="status">
                                    {infoMessage}
                                </p>
                            )}
                        </div>
                        <button className="submit-button" type="submit">
                            {isRegister ? "Create account" : "Log In"}
                        </button>
                    </form>
                    <p className="switch-copy">
                        {isRegister ? "Already have an account? " : "New to CompUGrade? "}
                        <button
                            type="button"
                            onClick={() => changeAuthMode(isRegister ? "login" : "register")}
                        >
                            {isRegister ? "Log in" : "Create an account"}
                        </button>
                    </p>
                    {!isRegister && (
                        <p className="demo-copy">
                            Demo student: ysa@student.edu (or U1)
                            <span>
                                Password: <strong>password123</strong>
                            </span>
                        </p>
                    )}
                </div>
                <small className="copyright">© 2026 CompUGrade</small>
            </section>
        </main>
    );
}
