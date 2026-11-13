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
import { PASSWORD_REQUIREMENTS } from "@/features/auth/lib/accounts";
import documentIcon from "@/assets/document-icon.svg";
import sparkle from "@/assets/decorative-sparkle.svg";
import sparkleSmall from "@/assets/decorative-sparkle-small.svg";
import sparkleTiny from "@/assets/decorative-sparkle-tiny.svg";
import { cn } from "@/lib/utils";
import { AcademicPreview } from "@/features/auth/components/AcademicPreview";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";

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
                        className="relative tap:after:absolute tap:after:-inset-2.75"
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
    const {
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
    } = useAuthForm();
    return (
        <main className="flex min-h-svh flex-col bg-card font-sans text-foreground lg:grid lg:grid-cols-12">
            <section
                className="relative isolate flex min-w-0 flex-col bg-highlight px-6 py-3 max-md:min-h-20 md:overflow-hidden lg:col-span-7 md:px-7 md:py-6 xl:px-11"
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
                    [sparkleTiny, "top-2/3 right-1/6 animate-delay-700"],
                    [sparkleSmall, "top-3/4 left-3/16 animate-delay-1050"],
                ].map(([src, place]) => (
                    <img
                        key={place}
                        className={cn(
                            "pointer-events-none absolute animate-auth-sparkle motion-reduce:animate-none max-lg:hidden",
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
                className="relative flex min-w-0 flex-1 flex-col bg-card px-6 pt-3 pb-2.5 lg:col-span-5 lg:px-2 lg:pt-3.5"
                aria-labelledby="auth-title"
            >
                <p className="m-0 type-caption text-muted-foreground max-md:hidden">
                    YOUR ACADEMIC GUIDE
                </p>
                <Tabs
                    value={activeTab}
                    onValueChange={changeAuthMode}
                    className={cn(
                        "relative mx-auto mb-3 w-full max-w-91 shrink-0 animate-auth-enter animate-delay-120 gap-0 motion-reduce:animate-none lg:px-4 xl:px-0",
                        isRegister ? "mt-1 mb-1 max-lg:mt-0" : "mt-0 lg:mt-16",
                    )}
                >
                    <TabsList
                        variant="line"
                        aria-label="Account access"
                        className="h-auto w-full justify-start gap-8 rounded-none border-b border-border p-0 max-lg:gap-0 lg:mt-12"
                    >
                        {[
                            ["login", "Log In"],
                            ["register", "Create Account"],
                        ].map(([value, label]) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="h-auto flex-none rounded-none border-0 px-0 pt-0 pb-2 type-small font-normal text-muted-foreground data-active:text-primary group-data-horizontal/tabs:after:-bottom-px after:bg-primary tap:min-h-11 tap:min-w-11 max-lg:flex-1 max-lg:py-0"
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
                                            className="min-h-9 cursor-pointer justify-center gap-2 rounded-md border border-input px-2 py-1 font-normal text-muted-foreground transition-colors hover:border-primary has-data-checked:border-primary has-data-checked:bg-secondary has-data-checked:font-semibold has-data-checked:text-primary tap:min-h-11"
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
                                className="relative h-auto p-0 type-small font-normal tap:after:absolute tap:after:-inset-x-1 tap:after:-inset-y-3"
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
                <small className="mt-auto self-end type-small text-muted-foreground lg:pr-4">
                    © 2026 CompUGrade
                </small>
            </section>
        </main>
    );
}
