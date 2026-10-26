import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DB_UPDATED_EVENT, getDb, saveDb } from "../../utils/db";
import { getEnrolledSubjects } from "../../utils/subjects";
import { toTermKey } from "../../utils/terms";
import { getActiveStudentId, signOut } from "../../utils/session";
import SandboxSubjectPicker from "../student/SandboxSubjectPicker";
import useSidebarState, {
    PHONE_MAX_WIDTH,
    setSidebarMenuOpen,
    setSidebarMinimized,
} from "./useSidebarState";

// Phones use the slide-in menu; minimizing only applies to wider screens.
function isPhoneWidth() {
    return window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH}px)`).matches;
}

export default function Sidebar() {
    const location = useLocation();
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const navigate = useNavigate();
    const [dbData, setDbData] = useState(() => getDb());
    const [subjectToRemove, setSubjectToRemove] = useState(null);
    const [isSandboxPickerOpen, setIsSandboxPickerOpen] = useState(false);
    const [isSubjectsOpen, setIsSubjectsOpen] = useState(() => {
        return location.pathname.includes("/student/subject");
    });
    // minimized: icon-only sidebar. menuOpen: phone slide-in menu is open.
    const { minimized, menuOpen } = useSidebarState();
    // Pop-out subject list for the minimized sidebar: { top, left } or null.
    const [subjectsPopout, setSubjectsPopout] = useState(null);
    const closeButtonRef = useRef(null);
    const popoutRef = useRef(null);

    // Phone menu: Escape closes it, focus moves into it when it opens (and
    // stays in it) and back to the ☰ button when it closes, and the page
    // behind can't scroll.
    useEffect(() => {
        if (!menuOpen) return undefined;
        closeButtonRef.current?.focus();
        document.body.classList.add("sidebar-menu-open");
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setSidebarMenuOpen(false);
                return;
            }
            // Keep Tab inside the open menu (the page behind is covered).
            if (event.key !== "Tab") return;
            const items = [...document.querySelectorAll(
                "#app-sidebar a[href], #app-sidebar button:not([disabled])"
            )].filter((item) => item.offsetParent !== null);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.classList.remove("sidebar-menu-open");
            // Return focus to ☰ unless a dialog opened from the menu has it.
            const focused = document.activeElement;
            if (!focused || focused === document.body || focused.closest("#app-sidebar")) {
                document.getElementById("sidebar-menu-button")?.focus();
            }
        };
    }, [menuOpen]);

    // Pop-out list: closes on Escape or a click outside it.
    useEffect(() => {
        if (!subjectsPopout) return undefined;
        popoutRef.current?.querySelector("a")?.focus();
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setSubjectsPopout(null);
        };
        const handlePointerDown = (event) => {
            if (!popoutRef.current?.contains(event.target) && !event.target.closest?.(".sidebar-subject-link")) {
                setSubjectsPopout(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("pointerdown", handlePointerDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [subjectsPopout]);

    useEffect(() => {
        const refreshDbData = () => setDbData(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refreshDbData);
        return () =>
            window.removeEventListener(DB_UPDATED_EVENT, refreshDbData);
    }, []);

    useEffect(() => {
        if (!subjectToRemove) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") setSubjectToRemove(null);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [subjectToRemove]);

    const activeStudentId = getActiveStudentId(dbData);

    const myClasses =
        dbData?.classes?.filter((c) =>
            c.studentRecords.some(
                (record) => record.studentId === activeStudentId,
            ),
        ) || [];

    const enrolledSubjects = myClasses.map((c) => {
        const subjectDetails = dbData.subjects.find(
            (s) => s.id === c.subjectId,
        );
        return {
            classId: c.id,
            subjectCode: subjectDetails?.subjectCode || "Unknown",
            subjectName: subjectDetails?.subjectName || "Unknown",
        };
    });

    const dashboardActive = location.pathname.includes("/student/dashboard");
    const subjectsActive = location.pathname === "/student/subject";

    const removeSubjectEnrollment = ({ classId, subjectCode, subjectName }) => {
        const currentDb = getDb() || dbData;
        const classToRemove = currentDb.classes.find(
            (classItem) => classItem.id === classId,
        );
        if (!classToRemove) return;

        const subjectId = classToRemove.subjectId;
        const remainingClasses = currentDb.classes.flatMap((classItem) => {
            if (classItem.id !== classId) return [classItem];

            const remainingRecords = classItem.studentRecords.filter(
                (record) => record.studentId !== activeStudentId,
            );
            return remainingRecords.length > 0
                ? [{ ...classItem, studentRecords: remainingRecords }]
                : [];
        });
        const subjectStillUsed = remainingClasses.some(
            (classItem) => classItem.subjectId === subjectId,
        );
        const normalizedCode = subjectCode.trim().toLowerCase();
        const normalizedName = subjectName.trim().toLowerCase();
        const matchesSubject = (item) =>
            item.subjectCode?.trim().toLowerCase() === normalizedCode &&
            item.subjectName?.trim().toLowerCase() === normalizedName;
        const updatedDb = {
            ...currentDb,
            classes: remainingClasses,
            subjects: subjectStillUsed
                ? currentDb.subjects
                : currentDb.subjects.filter(
                      (subject) => subject.id !== subjectId,
                  ),
            verificationQueue: (currentDb.verificationQueue ?? []).filter(
                (request) => {
                    const isThisStudentRequest =
                        request.requestedByStudentId === activeStudentId;
                    const isThisSubjectRequest =
                        request.subjectId === subjectId ||
                        (request.subjectId == null && matchesSubject(request));
                    return !(
                        isThisStudentRequest &&
                        isThisSubjectRequest &&
                        request.status === "pending"
                    );
                },
            ),
        };

        saveDb(updatedDb);
        setDbData(updatedDb);

        if (location.pathname === `/student/subject/${classId}`) {
            navigate("/student/dashboard");
        }
    };

    return (
        <>
        {/* Phone menu backdrop: tapping it closes the menu. Popups below are
            rendered on <body> (createPortal) so they always sit above the
            page and the sidebar; see the z-index scale in index.css. */}
        {createPortal(
            <div
                className={`sidebar-backdrop ${menuOpen ? "is-visible" : ""}`}
                aria-hidden="true"
                onClick={() => setSidebarMenuOpen(false)}
            />,
            document.body
        )}
        <aside
            id="app-sidebar"
            className={`sidebar ${minimized ? "is-minimized" : ""} ${menuOpen ? "is-open" : ""}`}
            aria-label="Main menu"
            // On phones, picking any page closes the menu.
            onClick={(event) => {
                if (event.target.closest?.("a")) setSidebarMenuOpen(false);
            }}
        >
            <div className="sidebar-top">
                <div className="brand" aria-label="CompUGrade">
                    <span className="brand-mark" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
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
                    <span className="brand-name">
                        CompUGrade<span className="brand-name-dot">.</span>
                    </span>
                </div>
                {/* Wider screens: minimize to icons, or expand again. */}
                <button
                    type="button"
                    className="sidebar-minimize-toggle"
                    onClick={() => {
                        setSubjectsPopout(null);
                        setSidebarMinimized(!minimized);
                    }}
                    aria-label={minimized ? "Expand sidebar" : "Minimize sidebar"}
                    aria-expanded={!minimized}
                    aria-controls="app-sidebar"
                    title={minimized ? "Expand sidebar" : "Minimize sidebar"}
                >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.5" />
                        <path
                            d={minimized ? "M13 10l2 2-2 2" : "M16 10l-2 2 2 2"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                {/* Phones: close the slide-in menu. */}
                <button
                    type="button"
                    ref={closeButtonRef}
                    className="sidebar-close"
                    onClick={() => setSidebarMenuOpen(false)}
                    aria-label="Close menu"
                >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav" aria-label="Sidebar navigation">
                <div className="sidebar-section-label">YOUR ACADEMIC SPACE</div>

                <Link
                    to="/student/dashboard"
                    className={`sidebar-link ${dashboardActive ? "is-active" : ""}`}
                    data-tooltip="Dashboard"
                >
                    <span className="sidebar-icon-wrap" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                x="3.5"
                                y="3.5"
                                width="7"
                                height="7"
                                rx="1.2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <rect
                                x="13.5"
                                y="3.5"
                                width="7"
                                height="4.5"
                                rx="1.2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <rect
                                x="13.5"
                                y="11.5"
                                width="7"
                                height="9"
                                rx="1.2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <rect
                                x="3.5"
                                y="13.5"
                                width="7"
                                height="7"
                                rx="1.2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </span>
                    <span className="sidebar-label">Dashboard</span>
                </Link>

                <div
                    className={`sidebar-subject-row ${isSubjectsOpen ? "is-open" : ""}`}
                >
                    <Link
                        to="/student/subject"
                        className={`sidebar-link sidebar-subject-link ${subjectsActive ? "is-active" : ""}`}
                        data-tooltip="My Subjects"
                        aria-haspopup={minimized ? "true" : undefined}
                        aria-expanded={minimized ? Boolean(subjectsPopout) : undefined}
                        // Minimized sidebar: open the pop-out subject list
                        // instead of the page (the list links to the page).
                        onClick={(event) => {
                            if (!minimized || isPhoneWidth()) return;
                            event.preventDefault();
                            if (subjectsPopout) {
                                setSubjectsPopout(null);
                                return;
                            }
                            const rect = event.currentTarget.getBoundingClientRect();
                            setSubjectsPopout({ top: rect.top, left: rect.right + 10 });
                        }}
                    >
                        <span className="sidebar-icon-wrap" aria-hidden="true">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    x="4"
                                    y="3"
                                    width="16"
                                    height="18"
                                    rx="2"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M8 8H16M8 12H16M8 16H13.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                        <span className="sidebar-subject-label sidebar-label">
                            My Subjects
                        </span>
                        <span className="sidebar-subject-count">
                            {enrolledSubjects.length}
                        </span>
                    </Link>

                    <button
                        type="button"
                        className="sidebar-subject-toggle"
                        onClick={() => setIsSubjectsOpen((isOpen) => !isOpen)}
                        aria-label={
                            isSubjectsOpen
                                ? "Collapse subject list"
                                : "Expand subject list"
                        }
                        aria-expanded={isSubjectsOpen}
                        aria-controls="sidebar-subject-list"
                    >
                        <span
                            className="sidebar-subject-chevron"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                {isSubjectsOpen && (
                    <div
                        id="sidebar-subject-list"
                        className="sidebar-subject-list"
                    >
                        {enrolledSubjects.length > 0 ? (
                            enrolledSubjects.map((sub) => {
                                const linkPath = `/student/subject/${sub.classId}`;
                                const isActive = location.pathname === linkPath;

                                return (
                                    <div
                                        key={sub.classId}
                                        className="sidebar-enrolled-subject-row"
                                    >
                                        <Link
                                            to={linkPath}
                                            className={`sidebar-link sidebar-enrolled-subject ${isActive ? "is-active" : ""}`}
                                        >
                                            <span className="sidebar-enrolled-subject-name">
                                                <span className="sidebar-enrolled-subject-code">
                                                    {sub.subjectCode}
                                                </span>
                                                <span className="sidebar-enrolled-subject-divider">
                                                    -
                                                </span>
                                                <span className="sidebar-enrolled-subject-title">
                                                    {sub.subjectName}
                                                </span>
                                            </span>
                                        </Link>
                                        <button
                                            type="button"
                                            className="sidebar-subject-delete"
                                            aria-label={`Remove ${sub.subjectCode} - ${sub.subjectName} from your subjects`}
                                            title="Remove subject"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                setSidebarMenuOpen(false);
                                                setSubjectToRemove(sub);
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M3 4.5h10M6 4.5V3h4v1.5m1.5 0-.5 8H5l-.5-8M6.5 7v3.5M9.5 7v3.5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="sidebar-empty-state">
                                No subjects found
                            </p>
                        )}
                    </div>
                )}

                {/* Asks which subject to plan, then opens that subject's sandbox. */}
                <button
                    type="button"
                    className={`sidebar-link sidebar-link-button ${location.pathname.endsWith("/sandbox") ? "is-active" : ""}`}
                    onClick={() => setIsSandboxPickerOpen(true)}
                    aria-haspopup="dialog"
                    data-tooltip="Target Grade Sandbox"
                >
                    <span className="sidebar-icon-wrap" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="8.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                        </svg>
                    </span>
                    <span className="sidebar-label">Target Grade Sandbox</span>
                </button>

                <Link
                    to="/student/rules"
                    className={`sidebar-link ${location.pathname.startsWith("/student/rules") ? "is-active" : ""}`}
                    data-tooltip="Grade Rules"
                >
                    <span className="sidebar-icon-wrap" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="8.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="3.7"
                                stroke="currentColor"
                                strokeWidth="1.3"
                            />
                            <path
                                d="M9 12.3L11.1 14.2L15.5 9.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <span className="sidebar-label">Grade Rules</span>
                </Link>
            </nav>

            <div className="sidebar-footer">
                <Link
                    to="/settings"
                    className={`sidebar-link ${location.pathname.includes("/settings") ? "btn-primary" : ""}`}
                    data-tooltip="Settings"
                >
                    <span className="sidebar-icon-wrap" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 3.75V5.25M12 18.75V20.25M4.85 4.85L5.8 5.8M18.2 18.2L19.15 19.15M3.75 12H5.25M18.75 12H20.25M4.85 19.15L5.8 18.2M18.2 5.8L19.15 4.85"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="3.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </span>
                    <span className="sidebar-label">Settings</span>
                </Link>

                {/* Help and Resources */}
                <button
                    type="button"
                    onClick={() => {
                        setSidebarMenuOpen(false);
                        setIsHelpOpen(true);
                    }}
                    className="sidebar-link sidebar-footer-link"
                    data-tooltip="Help & Resources"
                >
                    <span className="sidebar-icon-wrap" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="8.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <path
                                d="M9.7 9.4C9.7 8.1 10.7 7.3 12 7.3C13.5 7.3 14.4 8.1 14.4 9.2C14.4 10.1 13.9 10.7 12.7 11.3C11.9 11.7 11.4 12.2 11.4 13V13.2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <circle
                                cx="12"
                                cy="16.3"
                                r="0.7"
                                fill="currentColor"
                            />
                        </svg>
                    </span>
                    <span className="sidebar-label">Help &amp; Resources</span>
                </button>

                {isHelpOpen && createPortal(
                    <div
                        role="presentation"
                        onClick={() => setIsHelpOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: "var(--z-modal)",
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(33, 45, 59, 0.34)",
                            backdropFilter: "blur(5px)",
                        }}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="help-modal-title"
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                position: "relative",
                                width: "min(20rem, calc(100vw - 2rem))",
                                padding: "1.65rem 1.35rem 1.55rem",
                                borderRadius: "0.35rem",
                                background: "var(--color-surface)",
                                boxShadow:
                                    "0 1rem 2.5rem rgba(38, 50, 65, 0.18)",
                            }}
                        >
                            <button
                                type="button"
                                aria-label="Close help and resources"
                                autoFocus
                                onClick={() => setIsHelpOpen(false)}
                                style={{
                                    position: "absolute",
                                    top: "0.7rem",
                                    right: "0.55rem",
                                    padding: "0.25rem",
                                    background: "transparent",
                                    color: "var(--color-muted)",
                                    fontSize: "1.25rem",
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                            <h2 id="help-modal-title">Help &amp; resources</h2>
                            <p>
                                CompuGrade helps you track courses and
                                understand your progress.
                            </p>
                            <h3>Getting started</h3>
                            <p>
                                Add your courses, review your grades, and use
                                the grade simulator to explore future outcomes.
                                Export your gradebook anytime as a CSV.
                            </p>
                        </section>
                    </div>,
                    document.body
                )}

                {/* Pushes the logout button to the bottom */}
                <Link
                    to="/"
                    onClick={signOut}
                    className="btn-warning sidebar-link sidebar-logout"
                    data-tooltip="Logout"
                >
                    <span className="sidebar-icon-wrap" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 4.5H17.5C18.6 4.5 19.5 5.4 19.5 6.5V17.5C19.5 18.6 18.6 19.5 17.5 19.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M10.5 8L6.5 12L10.5 16M6.5 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <span className="sidebar-label">Logout</span>
                </Link>
            </div>

            {isSandboxPickerOpen && (
                <SandboxSubjectPicker
                    subjects={getEnrolledSubjects(dbData, activeStudentId)}
                    currentClassId={
                        enrolledSubjects.find((item) =>
                            [
                                `/student/subject/${item.classId}`,
                                `/student/subject/${item.classId}/sandbox`,
                            ].includes(location.pathname),
                        )?.classId ?? null
                    }
                    termKey={
                        new URLSearchParams(location.search).has("term")
                            ? toTermKey(
                                  new URLSearchParams(location.search).get(
                                      "term",
                                  ),
                              )
                            : null
                    }
                    onClose={() => setIsSandboxPickerOpen(false)}
                />
            )}

            {subjectToRemove && createPortal(
                <div
                    className="subject-remove-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget)
                            setSubjectToRemove(null);
                    }}
                >
                    <section
                        className="subject-remove-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="subject-remove-title"
                        aria-describedby="subject-remove-description"
                    >
                        <div className="subject-remove-heading">
                            <span
                                className="subject-remove-icon"
                                aria-hidden="true"
                            >
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 8v5m0 3.5h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                            <h2 id="subject-remove-title">
                                Remove this subject?
                            </h2>
                        </div>
                        <p
                            id="subject-remove-description"
                            className="subject-remove-description"
                        >
                            Remove “{subjectToRemove.subjectCode} -{" "}
                            {subjectToRemove.subjectName}” and its personal
                            grade records from your list? Other students will
                            not be affected.
                        </p>
                        <div className="subject-remove-actions">
                            <button
                                type="button"
                                className="subject-remove-cancel"
                                onClick={() => setSubjectToRemove(null)}
                                autoFocus
                            >
                                No, keep it
                            </button>
                            <button
                                type="button"
                                className="subject-remove-confirm"
                                onClick={() => {
                                    removeSubjectEnrollment(subjectToRemove);
                                    setSubjectToRemove(null);
                                }}
                            >
                                Yes, remove it
                            </button>
                        </div>
                    </section>
                </div>,
                document.body
            )}

            {subjectsPopout && createPortal(
                <div
                    ref={popoutRef}
                    className="sidebar-popout"
                    role="dialog"
                    aria-label="Your subjects"
                    style={{ top: subjectsPopout.top, left: subjectsPopout.left }}
                    onClick={(event) => {
                        if (event.target.closest?.("a")) setSubjectsPopout(null);
                    }}
                >
                    <Link to="/student/subject" className="sidebar-popout-all">
                        My Subjects <span>{enrolledSubjects.length}</span>
                    </Link>
                    {enrolledSubjects.length > 0 ? (
                        <ul>
                            {enrolledSubjects.map((sub) => (
                                <li key={sub.classId}>
                                    <Link
                                        to={`/student/subject/${sub.classId}`}
                                        className={location.pathname === `/student/subject/${sub.classId}` ? "is-active" : ""}
                                    >
                                        <strong>{sub.subjectCode}</strong>
                                        <span>{sub.subjectName}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="sidebar-empty-state">No subjects yet</p>
                    )}
                </div>,
                document.body
            )}
        </aside>
        </>
    );
}
