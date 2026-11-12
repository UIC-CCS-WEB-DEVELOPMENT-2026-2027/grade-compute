// The Notifications section of Settings. The switches change for this visit
// only; they aren't saved (docs/AUDIT.md B3). The state stays in
// GlobalSettings, so it lives on while another section is open.
import { ChevronRightIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const ROWS = [
    {
        key: "email",
        title: "Email notifications",
        description: "Receive important updates through email.",
    },
    {
        key: "system",
        title: "Important system notifications",
        description: "Platform alerts for deadlines, outages, and account changes.",
    },
    {
        key: "assignments",
        title: "Assignment and grade notifications",
        description: "Get reminded when tasks are graded or submitted.",
    },
];

// notifications: { email, system, assignments } booleans.
// onToggle(key): flips one of them.
export function NotificationsSection({ notifications, onToggle }) {
    return (
        <Card className="gap-0 px-(--card-spacing)">
            {ROWS.map(({ key, title, description }) => (
                // A click anywhere on the row flips its switch, as before. The
                // switch is the keyboard control; the row only widens the
                // mouse target.
                <div
                    key={key}
                    className="relative flex min-h-19 cursor-pointer items-center justify-between gap-4.5 rounded-lg border-0 border-b border-solid border-border py-4 pr-8 pl-1 transition last:border-b-0 hover:-translate-y-px hover:bg-muted motion-reduce:transition-none max-lg:flex-col max-lg:items-start max-sm:flex-row max-sm:items-center max-sm:gap-3 max-sm:pr-1"
                    onClick={(event) => {
                        if (event.target.closest("button, [role='switch'], input, label, a")) {
                            return;
                        }
                        onToggle(key);
                    }}
                >
                    <div className="min-w-0">
                        <h4 className="m-0 mb-1 type-small font-semibold text-foreground">
                            {title}
                        </h4>
                        <p className="m-0 type-small text-muted-foreground">{description}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 max-md:min-h-11">
                        {/* The word the old toggle showed; the switch states it too. */}
                        <span aria-hidden="true" className="type-small text-muted-foreground">
                            {notifications[key] ? "On" : "Off"}
                        </span>
                        <Switch
                            checked={notifications[key]}
                            onCheckedChange={() => onToggle(key)}
                            aria-label={title}
                            className="max-lg:after:-inset-y-3.5"
                        />
                    </span>
                    <ChevronRightIcon
                        aria-hidden="true"
                        className="absolute top-1/2 right-2 size-5 -translate-y-1/2 text-muted-foreground max-sm:hidden"
                    />
                </div>
            ))}
        </Card>
    );
}
