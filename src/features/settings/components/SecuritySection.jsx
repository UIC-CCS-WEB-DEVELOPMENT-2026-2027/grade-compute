// The Security section of Settings: password change with a simulated code,
// two-factor authentication and login sessions, plus the Settings help.
// All state and handlers stay in GlobalSettings (they live on when another
// section is open) and arrive as one `security` object. Known behaviour kept
// on purpose (docs/AUDIT.md):
// - B2: the help dialog is rendered here, so it only shows on Security.
// - B5: the 2FA "Turn off" confirmation and the current session's "Log Out"
//   confirmation share confirmCurrentLogout. That is why the 2FA one stays
//   inline: as a modal it would hide the shared state.
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsIcon } from "@/features/settings/components/SettingsIcon";
import { createPrototypeChallenge, getVerifiedMethods } from "@/services/prototypeVerification";
import { DANGER_BUTTON, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/features/settings/buttonStyles";
import { cn } from "@/lib/utils";

const PASSWORD_LABELS = {
    current: "Current Password",
    next: "New Password",
    confirm: "Confirm New Password",
};
const STRENGTH_FILL = ["", "bg-destructive", "bg-highlight-strong", "bg-success"];

const NOTE = "m-0 type-small text-muted-foreground";
const ERROR = "m-0 type-small text-destructive";
const SUBTITLE = "m-0 mb-1.5 type-card-title text-primary";
const ROW =
    "w-full flex-nowrap rounded-none border-0 border-b border-solid border-border px-1 py-4 text-left hover:bg-muted/60";

// One row on the overview or the sessions list: a button with an icon, a
// title and a line under it, and an arrow.
function SecurityRow({ icon, title, description, badge, onClick }) {
    return (
        <Item render={<button type="button" />} className={ROW} onClick={onClick}>
            <ItemMedia>
                <SettingsIcon name={icon} />
            </ItemMedia>
            <ItemContent>
                <ItemTitle className="line-clamp-none text-foreground">{title}</ItemTitle>
                <ItemDescription>{description}</ItemDescription>
            </ItemContent>
            <ItemActions>
                {badge}
                <ChevronRightIcon aria-hidden="true" className="text-muted-foreground" />
            </ItemActions>
        </Item>
    );
}

// The prototype's verification contacts, as a radio group.
function MethodChoice({ methods, value, onChange }) {
    return (
        <RadioGroup value={value} onValueChange={onChange} className="gap-2">
            {methods.map((method) => (
                <Label key={method.id} className="flex items-center gap-2 font-normal tap:min-h-11">
                    <RadioGroupItem value={method.id} />
                    <span>
                        {method.label} · {method.masked}
                    </span>
                </Label>
            ))}
        </RadioGroup>
    );
}

// The simulated code and the box to type it in.
function CodeEntry({ id, code, value, onChange, autoComplete }) {
    return (
        <>
            <p className="m-0 rounded-lg border border-dashed border-highlight bg-highlight-soft px-3 py-2.5 type-small text-primary">
                Prototype code (not sent): <strong>{code}</strong>
            </p>
            <Field className="gap-2">
                <FieldLabel htmlFor={id} className="text-foreground">
                    Verification code
                </FieldLabel>
                <Input
                    id={id}
                    inputMode="numeric"
                    autoComplete={autoComplete}
                    maxLength={6}
                    value={value}
                    onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
                    required
                    className="bg-card"
                />
            </Field>
        </>
    );
}

export function SecuritySection({ security }) {
    const {
        profile,
        securityView,
        setSecurityView,
        passwordStep,
        passwordIsSet,
        passwordForm,
        setPasswordForm,
        passwordFieldErrors,
        setPasswordFieldErrors,
        visiblePasswords,
        togglePasswordVisibility,
        passwordRequirements,
        passwordStrength,
        securityError,
        setSecurityError,
        verificationMethod,
        setVerificationMethod,
        verificationChallenge,
        setVerificationChallenge,
        verificationCode,
        setVerificationCode,
        verificationFeedback,
        setVerificationFeedback,
        sessionDetails,
        setSessionDetails,
        confirmCurrentLogout,
        setConfirmCurrentLogout,
        confirmLogoutAll,
        setConfirmLogoutAll,
        helpDialog,
        setHelpDialog,
        beginPasswordFlow,
        continuePasswordChange,
        sendSecurityVerification,
        completePasswordChange,
        startTwoFactorEnable,
        finishTwoFactorEnable,
        disableTwoFactor,
        logoutSession,
        logoutAllOtherSessions,
    } = security;
    const methods = getVerifiedMethods(profile);

    return (
        <Card className="gap-0 px-(--card-spacing)">
            {securityView === "overview" && (
                <>
                    <SecurityRow
                        icon="security"
                        title="Password"
                        description="Change your password securely"
                        onClick={beginPasswordFlow}
                    />
                    <SecurityRow
                        icon="privacy"
                        title="Two-Factor Authentication"
                        description="Protect your account with an additional verification method"
                        onClick={() => {
                            setSecurityError("");
                            setVerificationFeedback("");
                            setSecurityView("twoFactor");
                        }}
                    />
                    <SecurityRow
                        icon="account"
                        title="Login Activity"
                        description="Review where your account is currently signed in"
                        onClick={() => setSecurityView("sessions")}
                    />
                    <p className={cn(NOTE, "mt-4")}>
                        Password, verification, and session data are simulated in this browser
                        prototype. Production authentication requires a backend.
                    </p>
                </>
            )}

            {securityView !== "overview" && (
                <div className="flex flex-col gap-4">
                    <div>
                        <Button
                            variant="link"
                            className="h-auto px-0 text-primary tap:min-h-11"
                            onClick={() => {
                                setSecurityView("overview");
                                setSecurityError("");
                                setVerificationFeedback("");
                            }}
                        >
                            <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
                            Security
                        </Button>
                    </div>

                    {securityView === "password" && (
                        <>
                            {passwordStep === "new" && (
                                <form
                                    className="flex max-w-xl flex-col gap-4"
                                    onSubmit={continuePasswordChange}
                                    noValidate
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-solid border-border bg-muted text-primary"
                                            aria-hidden="true"
                                        >
                                            <SettingsIcon name="security" className="size-6" />
                                        </span>
                                        <div>
                                            <h3 className={SUBTITLE}>Change Password</h3>
                                            <p className={NOTE}>
                                                Update password for enhanced account security.
                                            </p>
                                        </div>
                                    </div>
                                    <Separator />
                                    {(passwordIsSet
                                        ? ["current", "next", "confirm"]
                                        : ["next", "confirm"]
                                    ).map((field) => (
                                        <Field
                                            key={field}
                                            data-invalid={Boolean(passwordFieldErrors[field])}
                                            className="gap-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <FieldLabel
                                                    htmlFor={`${field}-password`}
                                                    className="gap-0 text-foreground"
                                                >
                                                    {PASSWORD_LABELS[field]}
                                                    <span aria-hidden="true"> *</span>
                                                </FieldLabel>
                                                {field === "confirm" && passwordForm.confirm && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="font-normal text-muted-foreground"
                                                        onClick={() => {
                                                            setPasswordForm((prev) => ({
                                                                ...prev,
                                                                confirm: "",
                                                            }));
                                                            setPasswordFieldErrors((prev) => {
                                                                const nextErrors = { ...prev };
                                                                delete nextErrors.confirm;
                                                                return nextErrors;
                                                            });
                                                            setSecurityError("");
                                                        }}
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>
                                            <InputGroup className="bg-card">
                                                <InputGroupInput
                                                    id={`${field}-password`}
                                                    type={
                                                        visiblePasswords[field]
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    autoComplete={
                                                        field === "current"
                                                            ? "current-password"
                                                            : "new-password"
                                                    }
                                                    value={passwordForm[field]}
                                                    minLength={field === "next" ? 8 : undefined}
                                                    aria-invalid={Boolean(
                                                        passwordFieldErrors[field],
                                                    )}
                                                    aria-describedby={
                                                        passwordFieldErrors[field]
                                                            ? `${field}-password-error`
                                                            : undefined
                                                    }
                                                    onChange={(event) => {
                                                        setPasswordForm((prev) => ({
                                                            ...prev,
                                                            [field]: event.target.value,
                                                        }));
                                                        setPasswordFieldErrors((prev) => {
                                                            if (!prev[field]) return prev;
                                                            const nextErrors = { ...prev };
                                                            delete nextErrors[field];
                                                            return nextErrors;
                                                        });
                                                        setSecurityError("");
                                                    }}
                                                    required
                                                />
                                                <InputGroupAddon align="inline-end">
                                                    <InputGroupButton
                                                        className="relative type-small tap:after:absolute tap:after:inset-x-0 tap:after:-inset-y-2.75"
                                                        onClick={() =>
                                                            togglePasswordVisibility(field)
                                                        }
                                                    >
                                                        {visiblePasswords[field] ? "Hide" : "Show"}
                                                    </InputGroupButton>
                                                </InputGroupAddon>
                                            </InputGroup>
                                            {passwordFieldErrors[field] && (
                                                <span
                                                    className="type-small text-destructive"
                                                    id={`${field}-password-error`}
                                                    role="alert"
                                                >
                                                    {passwordFieldErrors[field]}
                                                </span>
                                            )}
                                        </Field>
                                    ))}
                                    <div className="flex flex-col gap-2" aria-live="polite">
                                        <div
                                            className="grid grid-cols-3 gap-1.5"
                                            role="img"
                                            aria-label={`Password requirements met: ${passwordStrength} of 3`}
                                        >
                                            {passwordRequirements.map(({ label }, index) => (
                                                <span
                                                    key={label}
                                                    className={cn(
                                                        "h-1.25 rounded-full bg-border",
                                                        index < passwordStrength &&
                                                            STRENGTH_FILL[passwordStrength],
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className={NOTE}>
                                            {passwordStrength === 3
                                                ? "Strong password."
                                                : "Weak password. Must contain:"}
                                        </p>
                                        <ul className="m-0 grid list-none gap-1.5 p-0 type-small text-muted-foreground">
                                            {passwordRequirements.map(({ label, met }) => (
                                                <li
                                                    key={label}
                                                    className={cn(
                                                        "flex items-center gap-2",
                                                        met && "text-success",
                                                    )}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={cn(
                                                            "inline-grid size-4 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground",
                                                            met &&
                                                                "bg-success text-success-foreground",
                                                        )}
                                                    >
                                                        {met ? (
                                                            <CheckIcon className="size-3" />
                                                        ) : (
                                                            <XIcon className="size-3" />
                                                        )}
                                                    </span>
                                                    {label}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {securityError && (
                                        <p className={ERROR} role="alert">
                                            {securityError}
                                        </p>
                                    )}
                                    <div>
                                        <Button type="submit" className={PRIMARY_BUTTON}>
                                            Continue to verification
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {passwordStep === "verification" && (
                                <form
                                    className="flex max-w-xl flex-col gap-4"
                                    onSubmit={completePasswordChange}
                                >
                                    <div>
                                        <h3 className={SUBTITLE}>Verify it's you</h3>
                                        <p className={NOTE}>
                                            We prepared a simulated verification code for your
                                            verified contact. No email or SMS was sent.
                                        </p>
                                    </div>
                                    <MethodChoice
                                        methods={methods}
                                        value={verificationMethod}
                                        onChange={(value) => {
                                            setVerificationMethod(value);
                                            setVerificationChallenge(null);
                                            setVerificationFeedback("");
                                        }}
                                    />
                                    {methods.length === 0 && (
                                        <p className={ERROR}>
                                            Add a verified email or phone number to your account
                                            before changing your password.
                                        </p>
                                    )}
                                    <div>
                                        <Button
                                            variant="outline"
                                            className={SECONDARY_BUTTON}
                                            onClick={sendSecurityVerification}
                                            disabled={!methods.length}
                                        >
                                            Generate prototype code
                                        </Button>
                                    </div>
                                    {verificationChallenge && (
                                        <>
                                            <CodeEntry
                                                id="password-verification-code"
                                                code={verificationChallenge.code}
                                                value={verificationCode}
                                                onChange={setVerificationCode}
                                                autoComplete="one-time-code"
                                            />
                                            <div>
                                                <Button type="submit" className={PRIMARY_BUTTON}>
                                                    Verify and change password
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                    {securityError && (
                                        <p className={ERROR} role="alert">
                                            {securityError}
                                        </p>
                                    )}
                                </form>
                            )}

                            {passwordStep === "success" && (
                                <div className="flex max-w-xl flex-col items-start gap-3">
                                    <h3 className={SUBTITLE}>Password changed</h3>
                                    <p className={NOTE}>
                                        {verificationFeedback} Login verification can use the same
                                        local account store.
                                    </p>
                                    <Button
                                        className={PRIMARY_BUTTON}
                                        onClick={() => setSecurityView("overview")}
                                    >
                                        Done
                                    </Button>
                                </div>
                            )}
                            <p className={NOTE}>
                                This frontend prototype stores a salted password hash locally. It is
                                not production authentication.
                            </p>
                        </>
                    )}

                    {securityView === "twoFactor" && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className={SUBTITLE}>Two-Factor Authentication</h3>
                                    <p className={NOTE}>
                                        {profile.twoFactorEnabled
                                            ? "An additional verification step is enabled."
                                            : "Add a verification step when signing in."}
                                    </p>
                                </div>
                                {profile.twoFactorEnabled ? (
                                    <Button
                                        className={DANGER_BUTTON}
                                        onClick={() => setConfirmCurrentLogout(true)}
                                    >
                                        Turn off
                                    </Button>
                                ) : (
                                    <Button
                                        className={PRIMARY_BUTTON}
                                        onClick={startTwoFactorEnable}
                                    >
                                        Turn on
                                    </Button>
                                )}
                            </div>
                            <Separator />
                            <h4 className="m-0 type-small font-semibold text-primary">
                                Verification Methods
                            </h4>
                            {methods.map((method) => (
                                <Item key={method.id} className="px-1">
                                    <ItemContent>
                                        <ItemTitle className="text-foreground">
                                            {method.label}
                                        </ItemTitle>
                                        <ItemDescription>{method.masked}</ItemDescription>
                                    </ItemContent>
                                    <ItemActions className="type-small font-semibold text-success">
                                        Enabled
                                    </ItemActions>
                                </Item>
                            ))}
                            {!methods.length && (
                                <p className={NOTE}>No verified email or phone is available yet.</p>
                            )}
                            {verificationFeedback && (
                                <p className="m-0 type-small text-success">
                                    {verificationFeedback}
                                </p>
                            )}
                            {!profile.twoFactorEnabled && methods.length > 0 && (
                                <div className="flex max-w-xl flex-col gap-4 rounded-xl border border-solid border-border p-4">
                                    <p className={NOTE}>
                                        To enable 2FA, verify one of your contacts. No real message
                                        will be sent.
                                    </p>
                                    <MethodChoice
                                        methods={methods}
                                        value={verificationMethod}
                                        onChange={setVerificationMethod}
                                    />
                                    <div>
                                        <Button
                                            variant="outline"
                                            className={SECONDARY_BUTTON}
                                            onClick={() => {
                                                const challenge =
                                                    createPrototypeChallenge(verificationMethod);
                                                setVerificationChallenge(challenge);
                                                setVerificationCode("");
                                                setSecurityError("");
                                            }}
                                        >
                                            Generate prototype code
                                        </Button>
                                    </div>
                                    {verificationChallenge && (
                                        <form
                                            className="flex flex-col gap-4"
                                            onSubmit={finishTwoFactorEnable}
                                        >
                                            <CodeEntry
                                                id="two-factor-verification-code"
                                                code={verificationChallenge.code}
                                                value={verificationCode}
                                                onChange={setVerificationCode}
                                            />
                                            <div>
                                                <Button type="submit" className={PRIMARY_BUTTON}>
                                                    Verify and enable
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                    {securityError && (
                                        <p className={ERROR} role="alert">
                                            {securityError}
                                        </p>
                                    )}
                                </div>
                            )}
                            {/* Inline on purpose (B5, see the top of this file). */}
                            {confirmCurrentLogout && (
                                <div className="flex max-w-md flex-col gap-3 rounded-xl border border-solid border-border p-4">
                                    <p className="m-0 type-small text-muted-foreground">
                                        Turning off two-factor authentication reduces account
                                        security. Continue?
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"

                                            onClick={() => setConfirmCurrentLogout(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className={DANGER_BUTTON}
                                            onClick={disableTwoFactor}
                                        >
                                            Turn off 2FA
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {securityView === "sessions" && (
                        <div className="flex flex-col">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className={SUBTITLE}>Login Activity</h3>
                                    <p className={NOTE}>
                                        Review sessions simulated for this browser prototype.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className={SECONDARY_BUTTON}
                                    onClick={() => setConfirmLogoutAll(true)}
                                >
                                    Log Out All Other Sessions
                                </Button>
                            </div>
                            {profile.loginSessions.map((session) => (
                                <SecurityRow
                                    key={session.id}
                                    icon="account"
                                    title={
                                        <>
                                            {session.isCurrent
                                                ? "Current Session"
                                                : "Previous Session"}{" "}
                                            · {session.device} • {session.browser}
                                        </>
                                    }
                                    description={
                                        <>
                                            {session.location} · {session.lastActive}
                                        </>
                                    }
                                    badge={
                                        session.isActive && (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "border-0",
                                                    session.isCurrent
                                                        ? "text-success"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {session.isCurrent ? "Active now" : "Active"}
                                            </Badge>
                                        )
                                    }
                                    onClick={() => setSessionDetails(session)}
                                />
                            ))}
                            {!profile.loginSessions.length && (
                                <p className={NOTE}>No session records are available.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Session details. A click outside or Escape only closes it; the
                Close button also resets the shared confirmation (B5). */}
            {sessionDetails && (
                <Dialog
                    open
                    onOpenChange={(open) => {
                        if (!open) setSessionDetails(null);
                    }}
                >
                    <DialogContent showCloseButton={false} className="gap-4 p-6 sm:max-w-md">
                        <DialogTitle className="m-0 type-card-title text-primary">
                            {sessionDetails.isCurrent ? "Current Session" : "Session Details"}
                        </DialogTitle>
                        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 type-small">
                            {[
                                ["Device", sessionDetails.device],
                                ["Browser", sessionDetails.browser],
                                ["Location", sessionDetails.location],
                                ["Last active", sessionDetails.lastActive],
                                ["Login date", sessionDetails.loginDate],
                            ].map(([term, value]) => (
                                <div key={term} className="contents">
                                    <dt className="text-muted-foreground">{term}</dt>
                                    <dd className="m-0 font-semibold text-foreground">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        {sessionDetails.isCurrent && confirmCurrentLogout && (
                            <p className={ERROR}>
                                Logging out the current simulated session will end this prototype
                                session. Continue?
                            </p>
                        )}
                        <DialogFooter className="-mx-6 -mb-6 px-6">
                            <Button
                                variant="outline"

                                onClick={() => {
                                    setSessionDetails(null);
                                    setConfirmCurrentLogout(false);
                                }}
                            >
                                Close
                            </Button>
                            {sessionDetails.isCurrent ? (
                                confirmCurrentLogout ? (
                                    <Button
                                        className={DANGER_BUTTON}
                                        onClick={() => logoutSession(sessionDetails)}
                                    >
                                        Confirm Log Out
                                    </Button>
                                ) : (
                                    <Button
                                        className={DANGER_BUTTON}
                                        onClick={() => setConfirmCurrentLogout(true)}
                                    >
                                        Log Out
                                    </Button>
                                )
                            ) : (
                                sessionDetails.isActive && (
                                    <Button
                                        className={DANGER_BUTTON}
                                        onClick={() => logoutSession(sessionDetails)}
                                    >
                                        Log Out
                                    </Button>
                                )
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <AlertDialog open={confirmLogoutAll} onOpenChange={setConfirmLogoutAll}>
                <AlertDialogContent onOverlayClick={() => setConfirmLogoutAll(false)}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log Out All Other Sessions?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Other simulated active sessions will be marked as signed out. Your
                            current session will remain active.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={DANGER_BUTTON}
                            onClick={logoutAllOtherSessions}
                        >
                            Log Out All Other Sessions
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* The Settings help (B2: only here, so only on Security). */}
            {helpDialog && (
                <Dialog
                    open
                    onOpenChange={(open) => {
                        if (!open) setHelpDialog(null);
                    }}
                >
                    <DialogContent showCloseButton={false} className="gap-4 p-6 sm:max-w-md">
                        <DialogClose
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute top-3 right-3 text-muted-foreground"
                                    aria-label="Close help"
                                />
                            }
                        >
                            <XIcon aria-hidden="true" />
                        </DialogClose>
                        <Tabs value={helpDialog} onValueChange={setHelpDialog} className="gap-4">
                            <TabsList
                                variant="line"
                                aria-label="Help topics"
                                className="h-auto justify-start gap-1 rounded-none border-0 border-b border-solid border-border p-0 pb-2 group-data-horizontal/tabs:h-auto"
                            >
                                {[
                                    ["support", "Student support"],
                                    ["guide", "Quick reference"],
                                ].map(([value, label]) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="h-auto flex-none rounded-lg px-3 py-2 text-muted-foreground after:hidden tap:min-h-11 hover:bg-muted data-active:text-primary group-data-[variant=line]/tabs-list:data-active:bg-highlight-soft"
                                    >
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <TabsContent value="support" className="flex flex-col gap-3 type-small">
                                <p className="m-0 type-caption tracking-widest text-muted-foreground">
                                    COMPUGRADE HELP
                                </p>
                                <DialogTitle className="m-0 type-card-title text-primary">
                                    Student support
                                </DialogTitle>
                                <p className="m-0 text-muted-foreground">
                                    Try these steps if something is not working as expected:
                                </p>
                                <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
                                    <li>
                                        Refresh the page and sign in again if your session has
                                        expired.
                                    </li>
                                    <li>
                                        Check your course and assignment details before submitting
                                        work.
                                    </li>
                                    <li>
                                        If grades or course information look incorrect, contact your
                                        instructor or your school’s designated support team.
                                    </li>
                                </ol>
                                <p className={NOTE}>
                                    This prototype does not have a connected help desk or support
                                    contact.
                                </p>
                            </TabsContent>
                            <TabsContent value="guide" className="flex flex-col gap-3 type-small">
                                <p className="m-0 type-caption tracking-widest text-muted-foreground">
                                    STUDENT GUIDE
                                </p>
                                <DialogTitle className="m-0 type-card-title text-primary">
                                    Quick reference
                                </DialogTitle>
                                {[
                                    [
                                        "Find your courses",
                                        "Open your student dashboard and choose a course to view its subjects and details.",
                                    ],
                                    [
                                        "Track grades",
                                        "Open the relevant course or subject page to review available grade information.",
                                    ],
                                    [
                                        "Submit assignments",
                                        "Review the assignment instructions and deadline in your course before submitting your work.",
                                    ],
                                ].map(([title, body]) => (
                                    <div key={title} className="flex flex-col gap-1">
                                        <strong className="text-foreground">{title}</strong>
                                        <p className="m-0 text-muted-foreground">{body}</p>
                                    </div>
                                ))}
                            </TabsContent>
                        </Tabs>
                        <DialogFooter className="-mx-6 -mb-6 px-6">
                            <Button className={PRIMARY_BUTTON} onClick={() => setHelpDialog(null)}>
                                Done
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}
