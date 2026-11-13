import { BackLink } from "@/components/BackLink";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountActionsSection } from "@/features/settings/components/AccountActionsSection";
import { AccountSection } from "@/features/settings/components/AccountSection";
import { SecuritySection } from "@/features/settings/components/SecuritySection";
import { SettingsIcon } from "@/features/settings/components/SettingsIcon";
import { NotificationsSection } from "@/features/settings/components/NotificationsSection";
import { ProfileSection } from "@/features/settings/components/ProfileSection";
import { useGlobalSettings } from "@/features/settings/hooks/useGlobalSettings";

const sidebarItems = [
    { label: "Profile", icon: "profile" },
    { label: "Account", icon: "account" },
    { label: "Security", icon: "security" },
    { label: "Notifications", icon: "notifications" },
    { label: "Account Actions", icon: "actions" },
];

export function GlobalSettings({ onLogout }) {
    const {
        activeSection,
        setActiveSection,
        profile,
        profileInitials,
        selectedImage,
        isAccountEditing,
        setIsAccountEditing,
        handleAccountInput,
        handleImageSelect,
        saveProfilePicture,
        saveAccountChanges,
        notifications,
        toggleNotification,
        showLogoutConfirm,
        setShowLogoutConfirm,
        confirmLogout,
        security,
        setHelpDialog,
        statusMessage,
    } = useGlobalSettings(onLogout);

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
                                    className="h-auto flex-none rounded-none border-0 px-0 pt-1 pb-2.5 type-small font-normal text-muted-foreground group-data-horizontal/tabs:after:-bottom-px after:bg-primary hover:text-primary data-active:text-primary tap:min-h-11"
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
                        <Card className="gap-0 type-body">
                            <CardContent className="flex flex-col">
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
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    );
}
