// The Account Actions section of Settings. Download and Clear have no
// action yet (docs/AUDIT.md B3), and the confirmed Log Out does nothing
// either (B1). The confirmation state stays in GlobalSettings.
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DANGER = "bg-destructive text-primary-foreground hover:bg-destructive/90";

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

// One action: its name and line on the left, the button on the right.
function ActionText({ title, description }) {
    return (
        <div className="min-w-0">
            <h4 className="m-0 mb-1 type-small font-semibold text-foreground">{title}</h4>
            <p className="m-0 type-small text-muted-foreground">{description}</p>
        </div>
    );
}

// showLogoutConfirm: the "Are you sure?" panel is open.
// onLogout(), onCancelLogout(), onConfirmLogout(): the GlobalSettings handlers.
export function AccountActionsSection({
    showLogoutConfirm,
    onLogout,
    onCancelLogout,
    onConfirmLogout,
}) {
    return (
        <Card className="gap-0 px-(--card-spacing)">
            {ROWS.map(({ title, description, action }) => (
                <div
                    key={title}
                    className="flex min-h-19 items-center justify-between gap-4.5 rounded-lg border-0 border-b border-solid border-border px-1 py-4 last:border-b-0 hover:bg-muted max-sm:gap-3"
                >
                    <ActionText title={title} description={description} />
                    <Button variant="outline" className="shrink-0 bg-card max-sm:w-29">
                        {action}
                    </Button>
                </div>
            ))}

            <div className="mt-4 flex items-center justify-between gap-4.5 rounded-xl bg-warning-soft p-4 max-sm:gap-3">
                <ActionText title="Log out" description="Sign out of your CompuGrade account." />
                <Button className={cn("shrink-0", DANGER)} onClick={onLogout}>
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
                            className="bg-card max-sm:w-full"
                            onClick={onCancelLogout}
                        >
                            Cancel
                        </Button>
                        <Button className={cn("max-sm:w-full", DANGER)} onClick={onConfirmLogout}>
                            Log Out
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
