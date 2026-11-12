import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDb, saveDb } from "@/services/db";
import { ACTIVE_USER_KEY } from "@/services/session";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    authenticateAccount,
    PASSWORD_REQUIREMENTS,
    registerAccount,
    validateAuthFields,
} from "@/features/auth/lib/accounts";
import documentIcon from "@/assets/document-icon.svg";
import graduationCap from "@/assets/graduation-cap.svg";
import sparkle from "@/assets/decorative-sparkle.svg";
import sparkleSmall from "@/assets/decorative-sparkle-small.svg";
import sparkleTiny from "@/assets/decorative-sparkle-tiny.svg";
import targetStar from "@/assets/target-star.svg";
import openTargetButton from "@/assets/open-target-button.svg";
import openArrow from "@/assets/open-arrow.svg";
import greenStatusDot from "@/assets/green-status-dot.svg";
import notificationCheckBadge from "@/assets/notification-check-badge.svg";
import notificationCheck from "@/assets/notification-check.svg";
import dottedHeaderDivider from "@/assets/dotted-header-divider.svg";
import chartLowerRule from "@/assets/chart-lower-rule.svg";
import { cn } from "@/lib/utils";

const previewScores = [
    { value: 84, height: 24, label: "Quiz 1", bar: "from-self-reported/40 to-self-reported/30" },
    { value: 88, height: 41, label: "Lab 1", bar: "from-self-reported/70 to-self-reported/55" },
    { value: 91, height: 54, label: "Quiz 2", bar: "from-self-reported to-self-reported/80" },
    { value: 93, height: 72, label: "Midterm", bar: "from-primary to-self-reported" },
    {
        value: 95,
        height: 89,
        label: "Target",
        bar: "from-self-reported-foreground to-primary shadow-card",
    },
];

function AcademicPreview() {
    return (
        <div
            className="relative mt-2 ml-6 w-full max-w-114 pb-7 animate-auth-float motion-reduce:animate-none max-xl:ml-3"
            aria-label="Example grade progress, from 84 percent to a 95 percent target"
        >
            <div className="relative min-h-63 w-full -rotate-6 rounded-lg border border-border bg-card px-4 pt-4 pb-7 shadow-hover">
                <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-md bg-secondary">
                        <img className="block" src={graduationCap} alt="" />
                    </span>
                    <div className="grid flex-1 gap-px">
                        <small className="type-caption text-primary">YOU'RE VERY ON TRACK</small>
                        <span className="type-caption font-normal text-muted-foreground">
                            A plan for your Q1 target
                        </span>
                    </div>
                    <span className="relative grid size-6 place-items-center" aria-hidden="true">
                        <img className="absolute inset-0" src={openTargetButton} alt="" />
                        <img className="relative" src={openArrow} alt="" />
                    </span>
                </div>
                <img className="mt-3 mb-2 block max-w-full" src={dottedHeaderDivider} alt="" />
                <div className="flex items-center gap-3">
                    <span className="type-caption font-normal text-muted-foreground">
                        My grade target
                    </span>
                    <em className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 type-caption not-italic text-success">
                        <img src={greenStatusDot} alt="" /> On Track
                    </em>
                    <strong className="ml-auto flex items-center gap-1 font-heading text-xl leading-6 font-semibold text-primary">
                        96% <img src={targetStar} alt="" />
                    </strong>
                </div>
                <div
                    className="relative mt-3 flex h-32 items-end gap-4 px-3 pt-1"
                    aria-hidden="true"
                >
                    {previewScores.map(({ value, height, label, bar }, index) => (
                        <div
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                            key={label}
                        >
                            <div
                                className="group/bar relative mb-2 h-(--bar-height) w-full"
                                style={{
                                    "--bar-height": `${height}px`,
                                    "--bar-delay": `${180 + index * 120}ms`,
                                }}
                            >
                                <small className="absolute -top-6 left-0 w-full text-center type-caption font-normal text-muted-foreground">
                                    {value}%
                                </small>
                                <span className="block size-full origin-bottom transition duration-850 ease-auth group-hover/bar:scale-y-108 group-hover/bar:brightness-112 group-hover/bar:saturate-115">
                                    <i
                                        className={cn(
                                            "block size-full origin-bottom animate-auth-bar-grow rounded-t-md bg-linear-to-b",
                                            bar,
                                        )}
                                    />
                                </span>
                            </div>
                            <span className="type-caption font-normal text-muted-foreground">
                                {label}
                            </span>
                        </div>
                    ))}
                    <img
                        className="absolute bottom-5 left-0 max-w-full"
                        src={chartLowerRule}
                        alt=""
                    />
                </div>
            </div>
            <div className="absolute -right-24 bottom-0 flex animate-auth-note-enter items-center gap-1.5 rounded-md border border-primary bg-card px-2.5 py-2 type-caption font-normal text-muted-foreground shadow-card motion-reduce:animate-none max-xl:-right-6">
                <span
                    className="relative grid size-5.5 shrink-0 place-items-center"
                    aria-hidden="true"
                >
                    <img className="absolute inset-0" src={notificationCheckBadge} alt="" />
                    <img className="relative" src={notificationCheck} alt="" />
                </span>
                <div>Make Your Target Grade a Reality</div>
            </div>
        </div>
    );
}

// One line of space is kept under each field for its error, so the form
// doesn't move when an error appears. The error is announced (role="alert").
function FieldErrorLine({ id, error }) {
    return (
        <div className="min-h-5">
            {error && (
                <FieldError id={`${id}-error`} className="type-small">
                    {error}
                </FieldError>
            )}
        </div>
    );
}

function TextField({ id, label, error, ...inputProps }) {
    return (
        <Field data-invalid={Boolean(error)} className="gap-1.5">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
                id={id}
                name={id}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                {...inputProps}
            />
            <FieldErrorLine id={id} error={error} />
        </Field>
    );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, error, isRegister }) {
    const toggleLabel =
        (visible ? "Hide " : "Show ") +
        (id === "confirmPassword" ? "confirmed password" : "password");
    return (
        <Field data-invalid={Boolean(error)} className="gap-1.5">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <InputGroup>
                <InputGroupInput
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
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        size="icon-xs"
                        aria-label={toggleLabel}
                        title={toggleLabel}
                        aria-controls={id}
                        aria-pressed={visible}
                        onClick={onToggle}
                    >
                        {visible ? (
                            <EyeOffIcon aria-hidden="true" />
                        ) : (
                            <EyeIcon aria-hidden="true" />
                        )}
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
            <FieldErrorLine id={id} error={error} />
        </Field>
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
        <main className="flex min-h-svh flex-col bg-card font-sans text-foreground md:grid md:grid-cols-12">
            <section
                className="relative isolate flex min-w-0 flex-col bg-highlight px-6 py-3 max-md:min-h-20 md:col-span-7 md:overflow-hidden md:px-7 md:py-6 xl:px-11"
                aria-label="About CompUGrade"
            >
                <header className="flex w-fit shrink-0 animate-auth-enter items-center gap-1.5 motion-reduce:animate-auth-fade-in">
                    <span className="auth-brand-icon">
                        <img src={documentIcon} alt="" />
                    </span>
                    <strong className="auth-brand-name">
                        CompUGrade
                        <span className="auth-brand-dot" aria-hidden="true">
                            .
                        </span>
                    </strong>
                </header>
                <div className="relative mt-10 mb-10 ml-5 max-w-140 animate-auth-enter animate-delay-80 motion-reduce:animate-auth-fade-in max-md:hidden xl:ml-22">
                    <p className="m-0 type-caption tracking-wider text-muted-foreground">
                        A CLEARER PATH TO HIGH POTENTIAL
                    </p>
                    <h1 className="m-0 type-display tracking-tight text-foreground">
                        Calculate grades and achieve
                        <br className="max-xl:hidden" /> grade targets
                    </h1>
                    <div className="mt-2.5 flex flex-wrap gap-2 type-small text-muted-foreground xl:gap-3">
                        <span>• Track your progress</span>
                        <span>• Simulate your targets</span>
                        <span>• Learn with confidence</span>
                    </div>
                    <AcademicPreview />
                </div>
                {[
                    [sparkle, "top-3/5 left-1/7"],
                    [sparkleSmall, "top-3/8 right-1/5 animate-delay-350"],
                    [sparkleTiny, "top-3/5 right-1/6 animate-delay-700"],
                    [sparkleSmall, "top-3/4 left-3/16 animate-delay-1050"],
                ].map(([src, place]) => (
                    <img
                        key={place}
                        className={cn(
                            "pointer-events-none absolute animate-auth-sparkle motion-reduce:animate-none max-md:hidden",
                            place,
                        )}
                        src={src}
                        alt=""
                    />
                ))}
                <p className="mt-2 type-caption text-muted-foreground md:hidden">
                    YOUR ACADEMIC GUIDE
                </p>
                <p className="m-0 mt-auto type-caption tracking-wide text-muted-foreground max-md:hidden">
                    MADE FOR STUDENTS. BUILT WITH PROFESSORS.
                </p>
            </section>
            <section
                className="relative flex min-w-0 flex-1 flex-col bg-card px-6 pt-3 pb-2.5 md:col-span-5 md:px-2 md:pt-3.5"
                aria-labelledby="auth-title"
            >
                <p className="m-0 type-caption text-muted-foreground max-md:hidden">
                    YOUR ACADEMIC GUIDE
                </p>
                <Tabs
                    value={activeTab}
                    onValueChange={changeAuthMode}
                    className={cn(
                        "relative mx-auto mb-3 w-full max-w-91 shrink-0 animate-auth-enter animate-delay-120 gap-0 motion-reduce:animate-none md:px-4 xl:px-0",
                        isRegister ? "mt-1 mb-1 max-md:mt-0" : "mt-0 md:mt-16",
                    )}
                >
                    <TabsList
                        variant="line"
                        aria-label="Account access"
                        className="h-auto w-full justify-start gap-8 rounded-none border-b border-border p-0 md:mt-12 max-md:gap-0"
                    >
                        {[
                            ["login", "Log In"],
                            ["register", "Create Account"],
                        ].map(([value, label]) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="h-auto flex-none rounded-none border-0 px-0 pt-0 pb-2 type-small font-normal text-muted-foreground data-active:text-primary group-data-horizontal/tabs:after:-bottom-px after:bg-primary max-md:flex-1 max-md:pt-1 max-md:pb-3"
                            >
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value={activeTab} className="flex-none type-body">
                        <div
                            className={cn(
                                "animate-auth-content-enter motion-reduce:animate-auth-fade-in",
                                isRegister ? "my-2" : "my-4",
                            )}
                            key={`intro-${activeTab}`}
                        >
                            <p className="m-0 mb-0.5 type-caption text-primary">
                                {isRegister
                                    ? "YOUR NEXT CHAPTER STARTS HERE"
                                    : "GOOD TO SEE YOU AGAIN"}
                            </p>
                            <h2 id="auth-title" className="m-0 type-section-title text-foreground">
                                {isRegister ? "Create your account." : "Welcome back."}
                            </h2>
                            <p className="mt-1.5 type-small text-muted-foreground">
                                {isRegister
                                    ? "Set your goals. Build a stronger semester."
                                    : "Your grades, goals, and next steps are waiting."}
                            </p>
                        </div>
                        <form
                            key={activeTab}
                            onSubmit={handleSubmit}
                            noValidate
                            className="animate-auth-content-enter animate-delay-50 motion-reduce:animate-auth-fade-in"
                        >
                            {isRegister && (
                                <RadioGroup
                                    name="role"
                                    aria-label="Account type"
                                    value={registrationRole}
                                    onValueChange={(role) => {
                                        setRegistrationRole(role);
                                        setErrorMessage("");
                                        setInfoMessage("");
                                    }}
                                    className="mb-2 grid-cols-2 gap-2"
                                >
                                    {["student", "professor"].map((role) => (
                                        <Label
                                            key={role}
                                            className="min-h-9 cursor-pointer justify-center gap-2 rounded-md border border-input px-2 py-1 font-normal text-muted-foreground transition-colors hover:border-primary has-data-checked:border-primary has-data-checked:bg-secondary has-data-checked:font-semibold has-data-checked:text-primary max-md:min-h-11"
                                        >
                                            <RadioGroupItem value={role} />
                                            {role === "student" ? "Student" : "Professor"}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            )}
                            <div className={isRegister ? "grid-cols-2 gap-3 md:grid" : undefined}>
                                {isRegister && (
                                    <TextField
                                        id="fullName"
                                        label="Full name"
                                        error={fieldErrors.fullName}
                                        value={fullName}
                                        autoComplete="name"
                                        maxLength={120}
                                        onChange={(event) => {
                                            setFullName(event.target.value);
                                            clearFieldError("fullName");
                                        }}
                                        placeholder="Your full name"
                                    />
                                )}
                                <TextField
                                    id="identifier"
                                    label={isRegister ? "Email" : "Email or Student ID"}
                                    error={fieldErrors.identifier}
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
                                />
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
                                className={cn(
                                    "mb-2.5 empty:hidden",
                                    isRegister && "mb-1.5 min-h-7.5",
                                )}
                            >
                                {isRegister && !errorMessage && !infoMessage && (
                                    <ul
                                        className="m-0 grid grid-cols-2 gap-x-2.5 gap-y-0.5 p-0 type-small"
                                        aria-label="Password requirements"
                                    >
                                        {PASSWORD_REQUIREMENTS.map((requirement) => (
                                            <li
                                                key={requirement.label}
                                                className={cn(
                                                    "transition-colors",
                                                    requirement.test(password)
                                                        ? "text-success"
                                                        : showPasswordHints
                                                          ? "text-destructive"
                                                          : "text-muted-foreground",
                                                )}
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
                                    <Alert variant="destructive">
                                        <AlertDescription className="text-destructive">
                                            {errorMessage}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {infoMessage && (
                                    <Alert role="status">
                                        <AlertDescription className="text-foreground">
                                            {infoMessage}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                            <Button type="submit" size="lg" className="w-full rounded-full">
                                {isRegister ? "Create account" : "Log In"}
                            </Button>
                        </form>
                        <p
                            className={cn(
                                "m-0 text-center type-small text-muted-foreground",
                                isRegister ? "mt-2" : "mt-3",
                            )}
                        >
                            {isRegister ? "Already have an account? " : "New to CompUGrade? "}
                            <Button
                                variant="link"
                                className="h-auto p-0 type-small font-normal"
                                onClick={() => changeAuthMode(isRegister ? "login" : "register")}
                            >
                                {isRegister ? "Log in" : "Create an account"}
                            </Button>
                        </p>
                        {!isRegister && (
                            <p className="m-0 mt-3.5 border-t border-border pt-2.5 text-center type-small text-muted-foreground">
                                Demo student: ysa@student.edu (or U1)
                                <span className="block text-primary">
                                    Password: <strong className="font-normal">password123</strong>
                                </span>
                            </p>
                        )}
                    </TabsContent>
                </Tabs>
                <small className="mt-auto self-end type-small text-muted-foreground md:pr-4">
                    © 2026 CompUGrade
                </small>
            </section>
        </main>
    );
}
