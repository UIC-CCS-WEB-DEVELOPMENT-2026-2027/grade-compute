import { useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, XIcon } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Sidebar as SidebarRoot,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { getDb, saveDb } from "@/services/db";
import { getEnrolledSubjects } from "@/lib/subjects";
import { toTermKey } from "@/lib/terms";
import { getActiveStudentId, signOut } from "@/services/session";
import { SandboxSubjectPicker } from "@/features/sandbox/components/SandboxSubjectPicker";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useDb } from "@/hooks/useDb";

// Every menu entry: a 44px row with a 20px icon. Minimized, it becomes an
// icon-only row of the same height; the label stays for screen readers and
// shows as a tooltip.
const MENU_LINK =
    "h-auto gap-3 rounded-xl p-3 type-small font-semibold text-sidebar-foreground no-underline hover:bg-sidebar-accent hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-primary [&_svg]:size-5 group-data-[collapsible=icon]:h-11! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-3!";

function MenuIcon({ children }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {children}
        </svg>
    );
}

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [dbData, setDbData] = useDb();
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [subjectToRemove, setSubjectToRemove] = useState(null);
    const [isSandboxPickerOpen, setIsSandboxPickerOpen] = useState(false);
    const [isSubjectsOpen, setIsSubjectsOpen] = useState(() =>
        location.pathname.includes("/student/subject"),
    );
    const { minimized } = useSidebarState();
    const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();
    // Minimized sidebar (not phones): My Subjects opens a pop-out subject list
    // (a Popover: Escape or a click outside closes it) instead of the page.
    const [isPopoutOpen, setIsPopoutOpen] = useState(false);
    const usePopout = minimized && !isMobile;

    // The subject stays set while the confirmation closes, so its text
    // doesn't disappear during the closing animation.
    const [isRemoveOpen, setIsRemoveOpen] = useState(false);

    const activeStudentId = getActiveStudentId(dbData);

    const myClasses =
        dbData?.classes?.filter((c) =>
            c.studentRecords.some((record) => record.studentId === activeStudentId),
        ) || [];

    const enrolledSubjects = myClasses.map((c) => {
        const subjectDetails = dbData.subjects.find((s) => s.id === c.subjectId);
        return {
            classId: c.id,
            subjectCode: subjectDetails?.subjectCode || "Unknown",
            subjectName: subjectDetails?.subjectName || "Unknown",
        };
    });

    const dashboardActive = location.pathname.includes("/student/dashboard");
    const subjectsActive = location.pathname === "/student/subject";
    const onSettings = location.pathname.includes("/settings");

    const removeSubjectEnrollment = ({ classId, subjectCode, subjectName }) => {
        const currentDb = getDb() || dbData;
        const classToRemove = currentDb.classes.find((classItem) => classItem.id === classId);
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
                : currentDb.subjects.filter((subject) => subject.id !== subjectId),
            verificationQueue: (currentDb.verificationQueue ?? []).filter((request) => {
                const isThisStudentRequest = request.requestedByStudentId === activeStudentId;
                const isThisSubjectRequest =
                    request.subjectId === subjectId ||
                    (request.subjectId == null && matchesSubject(request));
                return !(
                    isThisStudentRequest &&
                    isThisSubjectRequest &&
                    request.status === "pending"
                );
            }),
        };

        saveDb(updatedDb);
        setDbData(updatedDb);

        if (location.pathname === `/student/subject/${classId}`) {
            navigate("/student/dashboard");
        }
    };

    // On phones, picking any page closes the menu.
    const closeMenuOnLink = (event) => {
        if (event.target.closest?.("a")) setOpenMobile(false);
    };

    const subjectsButton = (
        <SidebarMenuButton
            render={<Link to="/student/subject" />}
            isActive={subjectsActive}
            tooltip="My Subjects"
            className={cn(MENU_LINK, "relative flex-1")}
            // With the pop-out, the button opens the list instead of the page
            // (the list links there).
            onClick={(event) => {
                if (usePopout) event.preventDefault();
            }}
        >
            <MenuIcon>
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
            </MenuIcon>
            <span className="flex-1 truncate">My Subjects</span>
            <Badge className="min-w-6 rounded-md px-1.5 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:min-w-4 group-data-[collapsible=icon]:px-1">
                {enrolledSubjects.length}
            </Badge>
        </SidebarMenuButton>
    );

    const popoutLink =
        "flex rounded-lg px-2.5 text-foreground no-underline outline-none hover:bg-secondary focus-visible:bg-secondary";
    const subjectsPopoutList = (
        <>
            <Link
                to="/student/subject"
                className={cn(popoutLink, "items-center justify-between py-2 font-semibold")}
            >
                My Subjects <Badge>{enrolledSubjects.length}</Badge>
            </Link>
            {enrolledSubjects.length > 0 ? (
                <ul className="mt-1 border-t border-border pt-1">
                    {enrolledSubjects.map((sub) => {
                        const linkPath = `/student/subject/${sub.classId}`;
                        return (
                            <li key={sub.classId}>
                                <Link
                                    to={linkPath}
                                    className={cn(
                                        popoutLink,
                                        "min-h-11 flex-col justify-center py-1.5",
                                        location.pathname === linkPath && "bg-secondary",
                                    )}
                                >
                                    <strong className="type-caption tracking-wide text-muted-foreground">
                                        {sub.subjectCode}
                                    </strong>
                                    <span className="truncate">{sub.subjectName}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="px-1 pt-2 text-muted-foreground">No subjects yet</p>
            )}
        </>
    );

    return (
        <>
            <SidebarRoot
                id="app-sidebar"
                aria-label="Main menu"
                collapsible="icon"
                className="z-(--z-sidebar) border-sidebar-border"
            >
                <SidebarHeader className="flex-row items-center justify-between gap-2 px-5 pt-5 pb-5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-3 group-data-[collapsible=icon]:px-3">
                    <div className="mt-0.5 flex min-w-0 items-center gap-3" aria-label="CompUGrade">
                        <BrandMark />
                        <span className="brand-name group-data-[collapsible=icon]:hidden">
                            CompUGrade<span className="brand-name-dot">.</span>
                        </span>
                    </div>
                    {/* Wider screens: minimize to icons, or expand again. */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden size-9 text-sidebar-foreground tap:size-11 hover:bg-sidebar-accent aria-expanded:bg-transparent aria-expanded:text-sidebar-foreground aria-expanded:hover:bg-sidebar-accent md:inline-flex [&_svg]:size-5"
                        onClick={() => {
                            setIsPopoutOpen(false);
                            toggleSidebar();
                        }}
                        aria-label={minimized ? "Expand sidebar" : "Minimize sidebar"}
                        aria-expanded={!minimized}
                        aria-controls="app-sidebar"
                        title={minimized ? "Expand sidebar" : "Minimize sidebar"}
                    >
                        <MenuIcon>
                            <rect
                                x="3.5"
                                y="4.5"
                                width="17"
                                height="15"
                                rx="2.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.5" />
                            <path
                                d={minimized ? "M13 10l2 2-2 2" : "M16 10l-2 2 2 2"}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </MenuIcon>
                    </Button>
                    {/* Phones: close the slide-in menu. */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 text-sidebar-foreground hover:bg-sidebar-accent md:hidden [&_svg]:size-5"
                        onClick={() => setOpenMobile(false)}
                        aria-label="Close menu"
                    >
                        <MenuIcon>
                            <path
                                d="M6 6l12 12M18 6L6 18"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </MenuIcon>
                    </Button>
                </SidebarHeader>

                <SidebarContent
                    className="px-5 group-data-[collapsible=icon]:px-3"
                    onClick={closeMenuOnLink}
                >
                    <nav aria-label="Sidebar navigation">
                        <SidebarGroup className="gap-4 p-0">
                            <SidebarGroupLabel className="mt-1 h-auto px-1 font-bold tracking-widest text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                                YOUR ACADEMIC SPACE
                            </SidebarGroupLabel>
                            <SidebarMenu className="gap-4">
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        render={<Link to="/student/dashboard" />}
                                        isActive={dashboardActive}
                                        tooltip="Dashboard"
                                        className={MENU_LINK}
                                    >
                                        <MenuIcon>
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
                                        </MenuIcon>
                                        <span>Dashboard</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                                        {usePopout ? (
                                            <Popover
                                                open={isPopoutOpen}
                                                onOpenChange={setIsPopoutOpen}
                                            >
                                                <PopoverTrigger
                                                    render={subjectsButton}
                                                    nativeButton={false}
                                                />
                                                <PopoverContent
                                                    side="right"
                                                    align="start"
                                                    sideOffset={10}
                                                    aria-label="Your subjects"
                                                    className="max-h-105 w-65 gap-0 overflow-y-auto p-2"
                                                    onClick={(event) => {
                                                        if (event.target.closest?.("a")) {
                                                            setIsPopoutOpen(false);
                                                        }
                                                    }}
                                                >
                                                    {subjectsPopoutList}
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            subjectsButton
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="w-6 text-sidebar-foreground hover:bg-sidebar-accent aria-expanded:bg-transparent aria-expanded:text-sidebar-foreground aria-expanded:hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden tap:size-11"
                                            onClick={() => setIsSubjectsOpen((isOpen) => !isOpen)}
                                            aria-label={
                                                isSubjectsOpen
                                                    ? "Collapse subject list"
                                                    : "Expand subject list"
                                            }
                                            aria-expanded={isSubjectsOpen}
                                            aria-controls="sidebar-subject-list"
                                        >
                                            <ChevronRightIcon
                                                aria-hidden="true"
                                                className={cn(
                                                    "transition-transform",
                                                    isSubjectsOpen && "rotate-90",
                                                )}
                                            />
                                        </Button>
                                    </div>

                                    {isSubjectsOpen && (
                                        <SidebarMenuSub
                                            id="sidebar-subject-list"
                                            className="mx-0 ml-5 gap-0.5 border-sidebar-border px-0 py-1 pl-2"
                                        >
                                            {enrolledSubjects.length > 0 ? (
                                                enrolledSubjects.map((sub) => {
                                                    const linkPath = `/student/subject/${sub.classId}`;
                                                    return (
                                                        <SidebarMenuSubItem
                                                            key={sub.classId}
                                                            className="flex min-w-0"
                                                        >
                                                            <SidebarMenuSubButton
                                                                render={<Link to={linkPath} />}
                                                                isActive={
                                                                    location.pathname === linkPath
                                                                }
                                                                className="h-auto min-h-8 flex-1 items-start py-1.5 pr-8 no-underline tap:min-h-11 tap:items-center tap:pr-12 hover:bg-sidebar-accent data-active:bg-sidebar-accent data-active:text-sidebar-primary"
                                                            >
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="text-sidebar-primary"
                                                                >
                                                                    ↳
                                                                </span>
                                                                <span className="min-w-0 whitespace-normal! wrap-anywhere">
                                                                    {sub.subjectCode} -{" "}
                                                                    {sub.subjectName}
                                                                </span>
                                                            </SidebarMenuSubButton>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                className="pointer-events-none absolute top-1/2 right-0.5 -translate-y-1/2 bg-sidebar text-destructive opacity-0 group-focus-within/menu-sub-item:pointer-events-auto group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:pointer-events-auto group-hover/menu-sub-item:opacity-100 hover:bg-destructive/10 hover:text-destructive tap:pointer-events-auto tap:size-11 tap:opacity-100 tap:[&_svg]:size-4"
                                                                aria-label={`Remove ${sub.subjectCode} - ${sub.subjectName} from your subjects`}
                                                                title="Remove subject"
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    setOpenMobile(false);
                                                                    setSubjectToRemove(sub);
                                                                    setIsRemoveOpen(true);
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
                                                            </Button>
                                                        </SidebarMenuSubItem>
                                                    );
                                                })
                                            ) : (
                                                <li className="px-1 pt-2 type-small text-muted-foreground">
                                                    No subjects found
                                                </li>
                                            )}
                                        </SidebarMenuSub>
                                    )}
                                </SidebarMenuItem>

                                {/* Asks which subject to plan, then opens that subject's sandbox. */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        isActive={location.pathname.endsWith("/sandbox")}
                                        tooltip="Target Grade Sandbox"
                                        className={MENU_LINK}
                                        onClick={() => {
                                            setOpenMobile(false);
                                            setIsSandboxPickerOpen(true);
                                        }}
                                        aria-haspopup="dialog"
                                    >
                                        <MenuIcon>
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
                                        </MenuIcon>
                                        <span>Target Grade Sandbox</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        render={<Link to="/student/rules" />}
                                        isActive={location.pathname.startsWith("/student/rules")}
                                        tooltip="Grade Rules"
                                        className={MENU_LINK}
                                    >
                                        <MenuIcon>
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
                                        </MenuIcon>
                                        <span>Grade Rules</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    </nav>
                </SidebarContent>

                <SidebarFooter
                    className="mx-5 gap-2 border-t border-sidebar-border px-0 py-4 group-data-[collapsible=icon]:mx-3"
                    onClick={closeMenuOnLink}
                >
                    <SidebarMenu className="gap-2">
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link to="/settings" />}
                                tooltip="Settings"
                                className={cn(
                                    MENU_LINK,
                                    onSettings &&
                                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                )}
                            >
                                <MenuIcon>
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
                                </MenuIcon>
                                <span>Settings</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip="Help & Resources"
                                className={MENU_LINK}
                                onClick={() => {
                                    setOpenMobile(false);
                                    setIsHelpOpen(true);
                                }}
                            >
                                <MenuIcon>
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
                                    <circle cx="12" cy="16.3" r="0.7" fill="currentColor" />
                                </MenuIcon>
                                <span>Help &amp; Resources</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link to="/" onClick={signOut} />}
                                tooltip="Logout"
                                className={cn(
                                    MENU_LINK,
                                    "justify-center bg-warning text-warning-foreground hover:bg-warning/90 hover:text-warning-foreground",
                                )}
                            >
                                <MenuIcon>
                                    <path
                                        d="M14 4.5H17.5C18.6 4.5 19.5 5.4 19.5 6.5V17.5C19.5 18.6 18.6 19.5 17.5 19.5H14"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M10.5 8L6.5 12L10.5 16M6.5 12H15"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </MenuIcon>
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </SidebarRoot>

            {/* The dialogs sit outside the sidebar: on phones its content is
                unmounted when the menu closes. */}
            {/* Help: the close button, Escape or a backdrop click close it. */}
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                <DialogContent showCloseButton={false} className="p-6 sm:max-w-xs">
                    <DialogClose
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-2 right-2 text-muted-foreground"
                            />
                        }
                        aria-label="Close help and resources"
                    >
                        <XIcon aria-hidden="true" />
                    </DialogClose>
                    <DialogHeader>
                        <DialogTitle>Help &amp; resources</DialogTitle>
                        <DialogDescription className="text-foreground">
                            CompuGrade helps you track courses and understand your progress.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-1">
                        <h3 className="type-small font-semibold">Getting started</h3>
                        <p>
                            Add your courses, review your grades, and use the grade simulator to
                            explore future outcomes. Export your gradebook anytime as a CSV.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

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
                            ? toTermKey(new URLSearchParams(location.search).get("term"))
                            : null
                    }
                    onClose={() => setIsSandboxPickerOpen(false)}
                />
            )}

            {/* Remove-subject confirmation. Cancel, Escape or a backdrop click
                keep the subject; focus starts on "No, keep it". */}
            <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
                <AlertDialogContent onOverlayClick={() => setIsRemoveOpen(false)}>
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive">
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M12 8v5m0 3.5h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </AlertDialogMedia>
                        <AlertDialogTitle>Remove this subject?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove “{subjectToRemove?.subjectCode} - {subjectToRemove?.subjectName}”
                            and its personal grade records from your list? Other students will not
                            be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                                removeSubjectEnrollment(subjectToRemove);
                                setIsRemoveOpen(false);
                            }}
                        >
                            Yes, remove it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
