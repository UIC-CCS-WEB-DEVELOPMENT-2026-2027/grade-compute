// The line icons of the Settings page (its tabs and the Security section).
// name: profile | account | security | privacy | notifications | actions.
// className: size changes where it sits.
import { cn } from "@/lib/utils";

export function SettingsIcon({ name, className }) {
    const iconPaths = {
        profile: (
            <>
                <circle cx="12" cy="8" r="3.25" />
                <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
            </>
        ),
        account: (
            <>
                <rect x="4" y="5" width="16" height="14" rx="3" />
                <circle cx="9" cy="11" r="2" />
                <path d="M6.5 16a3 3 0 0 1 5 0M14 10h3M14 14h3" />
            </>
        ),
        security: (
            <>
                <path d="M12 3.5 19 6v5.2c0 4.4-3 7.6-7 9.3-4-1.7-7-4.9-7-9.3V6l7-2.5Z" />
                <path d="m9.5 12 1.7 1.7 3.5-3.7" />
            </>
        ),
        privacy: (
            <>
                <path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" />
                <circle cx="12" cy="12" r="2" />
                <path d="m4 4 16 16" />
            </>
        ),
        notifications: (
            <>
                <path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 9h17C20.5 16 18 16 18 9ZM10 21h4" />
            </>
        ),
        actions: (
            <>
                <path d="M5 7h14M5 12h14M5 17h14" />
                <circle cx="9" cy="7" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="11" cy="17" r="1.5" />
            </>
        ),
    };

    return (
        <svg
            className={cn("size-4.5 shrink-0", className)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {iconPaths[name]}
        </svg>
    );
}
