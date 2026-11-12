import { useEffect, useState } from "react";
import {
    hasLocalPassword,
    loadLocalAccount,
    saveLocalAccount,
    saveLocalPassword,
    saveLocalLoginSessions,
    verifyLocalPassword,
} from "@/services/localAccountStore";
import {
    createPrototypeChallenge,
    getVerifiedMethods,
    verifyPrototypeChallenge,
} from "@/services/prototypeVerification";
import { BackLink } from "@/components/BackLink";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSpaceSplitInitials } from "@/lib/format";
import { AccountActionsSection } from "@/features/settings/components/AccountActionsSection";
import { AccountSection } from "@/features/settings/components/AccountSection";
import { SecuritySection } from "@/features/settings/components/SecuritySection";
import { SettingsIcon } from "@/features/settings/components/SettingsIcon";
import { NotificationsSection } from "@/features/settings/components/NotificationsSection";
import { ProfileSection } from "@/features/settings/components/ProfileSection";

const sidebarItems = [
    { label: "Profile", icon: "profile" },
    { label: "Account", icon: "account" },
    { label: "Security", icon: "security" },
    { label: "Notifications", icon: "notifications" },
    { label: "Account Actions", icon: "actions" },
];
const legacySettingsThemeStorageKey = "compugrade-settings-theme";

export function GlobalSettings({ onLogout }) {
    const [activeSection, setActiveSection] = useState("Profile");
    const [profile, setProfile] = useState(loadLocalAccount);
    const [isAccountEditing, setIsAccountEditing] = useState(true);
    const [selectedImage, setSelectedImage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
    const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [passwordIsSet, setPasswordIsSet] = useState(hasLocalPassword);
    const [securityView, setSecurityView] = useState("overview");
    const [passwordStep, setPasswordStep] = useState("current");
    const [verificationMethod, setVerificationMethod] = useState("email");
    const [verificationChallenge, setVerificationChallenge] = useState(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [securityError, setSecurityError] = useState("");
    const [verificationFeedback, setVerificationFeedback] = useState("");
    const [sessionDetails, setSessionDetails] = useState(null);
    const [confirmCurrentLogout, setConfirmCurrentLogout] = useState(false);
    const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
    const [helpDialog, setHelpDialog] = useState(null);
    const [notifications, setNotifications] = useState({
        email: true,
        system: true,
        assignments: true,
    });
    useEffect(() => {
        localStorage.removeItem(legacySettingsThemeStorageKey);
    }, []);

    useEffect(() => {
        saveLocalAccount(profile);
    }, [profile]);

    const updateStatus = (message) => {
        setStatusMessage(message);
        window.clearTimeout(updateStatus.timeoutId);
        updateStatus.timeoutId = window.setTimeout(() => setStatusMessage(""), 2400);
    };

    const handleAccountInput = (event) => {
        const { name, value } = event.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
            updateStatus("Please choose a JPG, JPEG, or PNG image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const saveProfilePicture = () => {
        if (!selectedImage) {
            updateStatus("Choose an image first.");
            return;
        }

        setProfile((prev) => ({ ...prev, profilePicture: selectedImage }));
        updateStatus("Profile picture saved.");
    };

    const saveAccountChanges = () => {
        saveLocalAccount(profile);
        setIsAccountEditing(false);
        updateStatus("Account details updated.");
    };

    const toggleNotification = (key) => {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const togglePasswordVisibility = (field) => {
        setVisiblePasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const continuePasswordChange = async (event) => {
        event.preventDefault();
        setSecurityError("");
        const requiredFields = passwordIsSet ? ["current", "next", "confirm"] : ["next", "confirm"];
        const emptyFields = requiredFields.filter((field) => !passwordForm[field]);
        if (emptyFields.length) {
            setPasswordFieldErrors(
                Object.fromEntries(
                    emptyFields.map((field) => [field, "Please fill out this field."]),
                ),
            );
            return;
        }
        setPasswordFieldErrors({});

        if (passwordIsSet) {
            try {
                const isCurrentPasswordValid = await verifyLocalPassword(passwordForm.current);
                if (!isCurrentPasswordValid) {
                    setSecurityError("Current password is incorrect.");
                    return;
                }
            } catch {
                setSecurityError("Could not verify your current password. Please try again.");
                return;
            }
        }

        if (passwordForm.next.length < 8) {
            setSecurityError("Your new password must be at least 8 characters.");
            return;
        }
        if (!/[A-Z]/.test(passwordForm.next) || !/\d/.test(passwordForm.next)) {
            setSecurityError(
                "Your new password must include at least one uppercase letter and one number.",
            );
            return;
        }
        if (passwordForm.next !== passwordForm.confirm) {
            setSecurityError("The new passwords do not match.");
            return;
        }

        try {
            if (passwordIsSet && (await verifyLocalPassword(passwordForm.next))) {
                setSecurityError("Your new password must be different from your current password.");
                return;
            }
            setPasswordStep("verification");
        } catch {
            setSecurityError("Could not validate your new password. Please try again.");
        }
    };

    const sendSecurityVerification = () => {
        try {
            const challenge = createPrototypeChallenge(verificationMethod);
            setVerificationChallenge(challenge);
            setVerificationCode("");
            setVerificationFeedback("");
            setSecurityError("");
        } catch {
            setSecurityError("Could not create a verification code. Please try again.");
        }
    };

    const completePasswordChange = async (event) => {
        event.preventDefault();
        setSecurityError("");
        if (!verificationChallenge) {
            setSecurityError("Request a verification code first.");
            return;
        }
        if (!verifyPrototypeChallenge(verificationChallenge.id, verificationCode.trim())) {
            setSecurityError("That verification code is incorrect or expired. Request a new code.");
            setVerificationFeedback("");
            setVerificationChallenge(null);
            return;
        }

        try {
            await saveLocalPassword(passwordForm.next);
            setPasswordIsSet(true);
            setPasswordStep("success");
            setVerificationFeedback("Your password was changed successfully.");
            setPasswordForm({ current: "", next: "", confirm: "" });
            setVisiblePasswords({});
            setVerificationChallenge(null);
        } catch {
            setSecurityError("The password could not be updated. Please try again.");
        }
    };

    const beginPasswordFlow = () => {
        setSecurityView("password");
        setPasswordStep("new");
        setPasswordForm({ current: "", next: "", confirm: "" });
        setPasswordFieldErrors({});
        setVisiblePasswords({});
        setSecurityError("");
        setVerificationFeedback("");
        setVerificationChallenge(null);
    };

    const startTwoFactorEnable = () => {
        const methods = getVerifiedMethods(profile);
        if (!methods.length) {
            setSecurityError(
                "Add and verify an email address or phone number before enabling two-factor authentication.",
            );
            return;
        }
        setVerificationMethod(methods[0].id);
        setVerificationChallenge(null);
        setVerificationCode("");
        setVerificationFeedback("");
        setSecurityError("");
        setSecurityView("twoFactor");
    };

    const finishTwoFactorEnable = (event) => {
        event.preventDefault();
        if (
            !verificationChallenge ||
            !verifyPrototypeChallenge(verificationChallenge.id, verificationCode.trim())
        ) {
            setSecurityError("That verification code is incorrect or expired. Request a new code.");
            setVerificationChallenge(null);
            return;
        }
        const updatedAccount = { ...profile, twoFactorEnabled: true };
        setProfile(updatedAccount);
        setVerificationFeedback("Two-factor authentication is now enabled.");
        setVerificationChallenge(null);
        setVerificationCode("");
        setSecurityError("");
    };

    const disableTwoFactor = () => {
        const updatedAccount = { ...profile, twoFactorEnabled: false };
        setProfile(updatedAccount);
        setSecurityView("twoFactor");
        setSecurityError("");
    };

    const updateSessions = (sessions) => {
        saveLocalLoginSessions(sessions);
        setProfile((prev) => ({ ...prev, loginSessions: sessions }));
    };

    const logoutSession = (session) => {
        const updatedSessions = profile.loginSessions.map((item) =>
            item.id === session.id ? { ...item, isActive: false, lastActive: "Signed out" } : item,
        );
        updateSessions(updatedSessions);
        setSessionDetails(null);
        setConfirmCurrentLogout(false);
    };

    const logoutAllOtherSessions = () => {
        const updatedSessions = profile.loginSessions.map((session) =>
            session.isCurrent ? session : { ...session, isActive: false, lastActive: "Signed out" },
        );
        updateSessions(updatedSessions);
        setConfirmLogoutAll(false);
        setSessionDetails(null);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout?.();
    };

    const profileInitials = getSpaceSplitInitials(profile.fullName);
    const passwordRequirements = [
        { label: "At least 1 uppercase", met: /[A-Z]/.test(passwordForm.next) },
        { label: "At least 1 number", met: /\d/.test(passwordForm.next) },
        { label: "At least 8 characters", met: passwordForm.next.length >= 8 },
    ];
    const passwordStrength = passwordRequirements.filter(({ met }) => met).length;

    // Everything the Security section shows and changes. It stays here, so
    // it lives on while another section is open, and the page's Help button
    // can open the help (B2).
    const security = {
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
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case "Profile":
                return <ProfileSection profile={profile} initials={profileInitials} />;
            case "Account":
                return (
                    <AccountSection
                        profile={profile}
                        initials={profileInitials}
                        selectedImage={selectedImage}
                        isEditing={isAccountEditing}
                        onFieldChange={handleAccountInput}
                        onImageSelect={handleImageSelect}
                        onSavePhoto={saveProfilePicture}
                        onSave={saveAccountChanges}
                        onEditAgain={() => setIsAccountEditing(true)}
                    />
                );
            case "Security":
                return <SecuritySection security={security} />;
            case "Notifications":
                return (
                    <NotificationsSection
                        notifications={notifications}
                        onToggle={toggleNotification}
                    />
                );
            case "Account Actions":
                return (
                    <AccountActionsSection
                        showLogoutConfirm={showLogoutConfirm}
                        onLogout={() => setShowLogoutConfirm(true)}
                        onCancelLogout={() => setShowLogoutConfirm(false)}
                        onConfirmLogout={confirmLogout}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <PageShell>
            <div className="flex flex-col gap-6">
                <div>
                    <BackLink to="/student/dashboard">Back</BackLink>
                </div>

                <header>
                    <p className="m-0 mb-2 type-caption tracking-widest text-muted-foreground">
                        YOUR ACCOUNT
                    </p>
                    <h1 className="m-0 type-page-title text-foreground">Settings</h1>
                </header>

                <Tabs value={activeSection} onValueChange={setActiveSection} className="gap-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <TabsList
                            variant="line"
                            aria-label="Global settings navigation"
                            className="h-auto min-w-0 flex-1 flex-wrap justify-start group-data-horizontal/tabs:h-auto gap-x-6 gap-y-1 rounded-none border-0 border-b border-solid border-border p-0"
                        >
                            {sidebarItems.map(({ label, icon }) => (
                                <TabsTrigger
                                    key={label}
                                    value={label}
                                    className="h-auto flex-none rounded-none border-0 px-0 pt-1 pb-2.5 type-small font-normal text-muted-foreground group-data-horizontal/tabs:after:-bottom-px after:bg-primary hover:text-primary data-active:text-primary max-lg:min-h-11"
                                >
                                    <SettingsIcon name={icon} />
                                    {label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {/* Opens the Settings help, which only shows while the
                            Security section is open (docs/AUDIT.md B2). Hidden
                            below lg, as before (900px and narrower). */}
                        <Button
                            variant="outline"
                            className="hidden bg-card lg:inline-flex"
                            onClick={() => setHelpDialog("support")}
                        >
                            <span
                                className="inline-grid size-4.5 place-items-center rounded-full border border-solid border-current type-caption"
                                aria-hidden="true"
                            >
                                ?
                            </span>
                            Help &amp; Resources
                        </Button>
                    </div>

                    <TabsContent value={activeSection} className="type-body">
                        <Card className="gap-0 px-(--card-spacing) type-body">
                            <h2 className="m-0 mb-2 type-section-title text-foreground">
                                {activeSection}
                            </h2>

                            <p className="m-0 mb-6 type-small text-muted-foreground">
                                {activeSection === "Profile" &&
                                    "Read-only details for your academic identity."}
                                {activeSection === "Account" &&
                                    "Manage your personal account information and profile picture settings."}
                                {activeSection === "Security" &&
                                    "Protect your account with password, verification, and session controls."}
                                {activeSection === "Notifications" &&
                                    "Choose which alerts and updates you want to receive."}
                                {activeSection === "Account Actions" &&
                                    "Review account data and take higher-risk actions carefully."}
                            </p>

                            {renderSectionContent()}

                            {statusMessage && (
                                <div className="mt-4.5 rounded-lg border border-solid border-highlight bg-highlight-soft px-3.5 py-3 type-small font-semibold text-primary">
                                    {statusMessage}
                                </div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    );
}
