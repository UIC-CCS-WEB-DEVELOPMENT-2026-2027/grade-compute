import { cn } from "cn";

// The CompUGrade mark: the document icon on its blue gradient tile. The
// Sidebar and Settings drew identical copies (AUDIT G14). Branding is out
// of scope for the clean-up, so it stays exactly as it was: the SVG here
// and the .brand-mark rules in index.css.
export function BrandMark({ className }) {
    return (
        <span className={cn("brand-mark", className)} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M7 5.5C7 4.67 7.67 4 8.5 4H15.5C16.33 4 17 4.67 17 5.5V15.5C17 16.33 16.33 17 15.5 17H8.5C7.67 17 7 16.33 7 15.5V5.5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                />
                <path
                    d="M10 8H14M10 11H14M10 14H12.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                />
            </svg>
        </span>
    );
}
