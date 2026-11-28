import { getDb } from "@/services/db";
import { getInitials } from "@/lib/format";
import { getActiveUser } from "@/services/session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

function BellIcon({ className }) {
    return (
        <svg
            className={className}
            aria-hidden="true"
            viewBox="0 0 24 24"
            focusable="false"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </svg>
    );
}

function ChevronDownIcon({ className }) {
    return (
        <svg
            className={className}
            aria-hidden="true"
            viewBox="0 0 24 24"
            focusable="false"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7 10 5 5 5-5" />
        </svg>
    );
}

export function Header({ title, subtitle = "A little progress, every day." }) {
    const dbData = getDb();
    const activeUser = getActiveUser(dbData);
    const profile = activeUser ?? {
        name: "Student",
        role: "student",
        programSection: "",
    };
    const name = profile.name || "Student";
    const role = profile.role
        ? `${profile.role[0].toUpperCase()}${profile.role.slice(1)}`
        : "Student";
    const profileDescription = profile.programSection
        ? `${role} · ${profile.programSection}`
        : `${role} · CompUGrade`;
    const welcomeTitle = title ?? `Welcome back, ${name.split(/\s+/)[0]}!`;
    const { openMobile, setOpenMobile } = useSidebar();

    return (
        <header className="flex min-h-23 items-center justify-between gap-8 border-b border-border bg-card px-10 py-4 max-lg:gap-4 max-lg:px-6 max-md:sticky max-md:top-0 max-md:z-(--z-header) max-md:min-h-16 max-md:gap-3 max-md:px-4 max-md:py-2.5">
            {/* Phones: opens the sidebar as a slide-in menu. */}
            <Button
                id="sidebar-menu-button"
                variant="outline"
                size="icon"
                className="size-11 rounded-xl bg-card md:hidden"
                aria-label="Open menu"
                aria-controls="app-sidebar"
                aria-expanded={openMobile}
                onClick={() => setOpenMobile(true)}
            >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-6">
                    <path
                        d="M4 7h16M4 12h16M4 17h16"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
            </Button>
            <div className="min-w-0 max-md:flex-1">
                <h1 className="m-0 type-section-title text-foreground max-md:truncate">
                    {welcomeTitle}
                </h1>
                {subtitle !== null && (
                    <p className="mt-1.5 type-small text-muted-foreground max-md:hidden">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3 max-md:gap-1.5">
                {/* No action yet (AUDIT B13). */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="View notifications"
                >
                    <BellIcon className="size-5" />
                    <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-card bg-warning" />
                </Button>

                <Avatar className="size-9" aria-hidden="true">
                    <AvatarFallback className="bg-secondary type-caption text-primary">
                        {getInitials(name)}
                    </AvatarFallback>
                </Avatar>

                <div className="flex min-w-48 flex-col gap-0.5 max-lg:min-w-0 max-md:hidden">
                    <strong className="type-small font-semibold text-foreground">{name}</strong>
                    <span className="type-small whitespace-nowrap text-muted-foreground">
                        {profileDescription}
                    </span>
                </div>

                {/* No action yet (AUDIT B13). */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="max-md:hidden"
                    aria-label="Open profile menu"
                >
                    <ChevronDownIcon className="size-4" />
                </Button>
            </div>
        </header>
    );
}
