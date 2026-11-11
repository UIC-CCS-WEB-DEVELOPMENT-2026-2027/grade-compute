import "./Header.css";
import { getDb } from "@/services/db";
import { getInitials } from "@/lib/format";
import { getActiveUser } from "@/services/session";
import { useSidebar } from "@/components/ui/sidebar";

function BellIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
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
        <header className="app-header">
            {/* Phones: opens the sidebar as a slide-in menu. */}
            <button
                id="sidebar-menu-button"
                className="app-header__menu"
                type="button"
                aria-label="Open menu"
                aria-controls="app-sidebar"
                aria-expanded={openMobile}
                onClick={() => setOpenMobile(true)}
            >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M4 7h16M4 12h16M4 17h16"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
            </button>
            <div className="app-header__welcome">
                <h1>{welcomeTitle}</h1>
                {subtitle !== null && <p>{subtitle}</p>}
            </div>

            <div className="app-header__account">
                <button
                    className="app-header__notifications"
                    type="button"
                    aria-label="View notifications"
                >
                    <BellIcon />
                    <span className="app-header__notification-dot" />
                </button>

                <div className="app-header__avatar" aria-hidden="true">
                    {getInitials(name)}
                </div>

                <div className="app-header__profile">
                    <strong>{name}</strong>
                    <span>{profileDescription}</span>
                </div>

                <button
                    className="app-header__profile-toggle"
                    type="button"
                    aria-label="Open profile menu"
                >
                    <ChevronDownIcon />
                </button>
            </div>
        </header>
    );
}
