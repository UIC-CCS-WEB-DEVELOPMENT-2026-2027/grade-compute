// The Account Actions section of Settings. Download and Clear have no
// action yet (docs/AUDIT.md B3), and the confirmed Log Out does nothing
// either (B1). The confirmation state stays in GlobalSettings.
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DANGER_BUTTON, SECONDARY_BUTTON } from "@/features/settings/buttonStyles";
import { cn } from "@/lib/utils";
import { SettingText } from "./SettingText";

const ROWS = [
    {
        title: "Download account data",
        description: "Export your profile and academic information for review.",
        action: "Download",
    },
    {
        title: "Clear local preferences",
        description: "Reset stored browser settings for this prototype.",
        action: "Clear",
    },
];

// showLogoutConfirm: the "Are you sure?" panel is open.
// onLogout(), onCancelLogout(), onConfirmLogout(): the GlobalSettings handlers.
export function AccountActionsSection({
    showLogoutConfirm,
    onLogout,
    onCancelLogout,
    onConfirmLogout,
}) {
    return (
        <Card className="gap-0">
            <CardContent className="flex flex-col">
                {ROWS.map(({ title, description, action }) => (
                    <div
                        key={title}
                        className="flex min-h-19 items-center justify-between gap-4.5 rounded-lg border-0 border-b border-solid border-border px-1 py-4 last:border-b-0 hover:bg-muted max-sm:gap-3"
                    >
                        <SettingText title={title} description={description} />
                        <Button variant="outline" className="shrink-0 bg-card max-sm:w-29">
                            {action}
                        </Button>
                    </div>
                ))}

                <div className="mt-4 flex items-center justify-between gap-4.5 rounded-xl bg-warning-soft p-4 max-sm:gap-3">
                    <SettingText
                        title="Log out"
                        description="Sign out of your CompuGrade account."
                    />
                    <Button className={cn("shrink-0", DANGER_BUTTON)} onClick={onLogout}>
                        Log Out
                    </Button>
                </div>

                {showLogoutConfirm && (
                    <div className="mt-5 rounded-xl border border-solid border-border bg-muted p-4">
                        <p className="m-0 mb-3.5 type-small text-muted-foreground">
                            Are you sure you want to log out?
                        </p>
                        <div className="flex justify-end gap-3 max-lg:justify-start max-sm:flex-col-reverse">
                            <Button
                                variant="outline"
                                className={SECONDARY_BUTTON}
                                onClick={onCancelLogout}
                            >
                                Cancel
                            </Button>
                            <Button
                                className={cn("max-sm:w-full", DANGER_BUTTON)}
                                onClick={onConfirmLogout}
                            >
                                Log Out
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
