import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DB_UPDATED_EVENT, getDb, saveDb } from '../../utils/db';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dbData, setDbData] = useState(() => getDb());
  const [selectedRole, setSelectedRole] = useState('Student');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [subjectToRemove, setSubjectToRemove] = useState(null);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(() => {
    return location.pathname.includes('/student/subject');
  });

  useEffect(() => {
    const refreshDbData = () => setDbData(getDb());
    window.addEventListener(DB_UPDATED_EVENT, refreshDbData);
    return () => window.removeEventListener(DB_UPDATED_EVENT, refreshDbData);
  }, []);

  useEffect(() => {
    if (!subjectToRemove) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSubjectToRemove(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subjectToRemove]);

  const activeStudentId = 'U1';

  const myClasses = dbData?.classes?.filter((c) =>
    c.studentRecords.some((record) => record.studentId === activeStudentId)
  ) || [];

  const enrolledSubjects = myClasses.map((c) => {
    const subjectDetails = dbData.subjects.find((s) => s.id === c.subjectId);
    return {
      classId: c.id,
      subjectCode: subjectDetails?.subjectCode || 'Unknown',
      subjectName: subjectDetails?.subjectName || 'Unknown'
    };
  });

  const dashboardActive = location.pathname.includes('/student/dashboard');
  const subjectsActive = location.pathname === '/student/subject';
  const settingsActive = location.pathname.includes('/settings');

  const removeSubjectEnrollment = ({ classId, subjectCode, subjectName }) => {
    const currentDb = getDb() || dbData;
    const classToRemove = currentDb.classes.find((classItem) => classItem.id === classId);
    if (!classToRemove) return;

    const subjectId = classToRemove.subjectId;
    const remainingClasses = currentDb.classes.flatMap((classItem) => {
      if (classItem.id !== classId) return [classItem];

      const remainingRecords = classItem.studentRecords.filter(
        (record) => record.studentId !== activeStudentId
      );
      return remainingRecords.length > 0
        ? [{ ...classItem, studentRecords: remainingRecords }]
        : [];
    });
    const subjectStillUsed = remainingClasses.some(
      (classItem) => classItem.subjectId === subjectId
    );
    const normalizedCode = subjectCode.trim().toLowerCase();
    const normalizedName = subjectName.trim().toLowerCase();
    const matchesSubject = (item) => (
      item.subjectCode?.trim().toLowerCase() === normalizedCode &&
      item.subjectName?.trim().toLowerCase() === normalizedName
    );
    const updatedDb = {
      ...currentDb,
      classes: remainingClasses,
      subjects: subjectStillUsed
        ? currentDb.subjects
        : currentDb.subjects.filter((subject) => subject.id !== subjectId),
      verificationQueue: (currentDb.verificationQueue ?? []).filter((request) => {
        const isThisStudentRequest = request.requestedByStudentId === activeStudentId;
        const isThisSubjectRequest = request.subjectId === subjectId ||
          (request.subjectId == null && matchesSubject(request));
        return !(isThisStudentRequest && isThisSubjectRequest && request.status === 'pending');
      })
    };

    saveDb(updatedDb);
    setDbData(updatedDb);

    if (location.pathname === `/student/subject/${classId}`) {
      navigate('/student/dashboard');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="student-switcher" aria-label="Switch workspace">
          <span className="student-switcher-label">Dov: Switch Workspace</span>
          <div className="student-switcher-role">
            <button
              className="student-switcher-user"
              type="button"
              aria-label={`Current role: ${selectedRole}`}
              aria-expanded={isRoleMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsRoleMenuOpen((isOpen) => !isOpen)}
            >
              <span>{selectedRole}</span>
              <span className="student-switcher-caret" aria-hidden="true">▾</span>
            </button>
            {isRoleMenuOpen && (
              <div className="student-role-menu" role="menu" aria-label="Choose a role">
                {['Student', 'Professor', 'Admin', 'Sign-in'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`student-role-option ${selectedRole === role ? 'is-selected' : ''}`}
                    role="menuitem"
                    onClick={() => {
                      setIsRoleMenuOpen(false);
                      if (role === 'Sign-in') {
                        navigate('/');
                        return;
                      }
                      setSelectedRole(role);
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="brand" aria-label="CompUGrade">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 5.5C7 4.67 7.67 4 8.5 4H15.5C16.33 4 17 4.67 17 5.5V15.5C17 16.33 16.33 17 15.5 17H8.5C7.67 17 7 16.33 7 15.5V5.5Z" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 8H14M10 11H14M10 14H12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="brand-name">CompUGrade<span className="brand-name-dot">.</span></span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        <div className="sidebar-section-label">YOUR ACADEMIC SPACE</div>

        <Link
          to="/student/dashboard"
          className={`sidebar-link ${dashboardActive ? 'is-active' : ''}`}
        >
          <span className="sidebar-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="13.5" y="11.5" width="7" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
          <span>Dashboard</span>
        </Link>

        <div className={`sidebar-subject-row ${isSubjectsOpen ? 'is-open' : ''}`}>
          <Link
            to="/student/subject"
            className={`sidebar-link sidebar-subject-link ${subjectsActive ? 'is-active' : ''}`}
          >
            <span className="sidebar-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 8H16M8 12H16M8 16H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="sidebar-subject-label">My Subjects</span>
            <span className="sidebar-subject-count">{enrolledSubjects.length}</span>
          </Link>

          <button
            type="button"
            className="sidebar-subject-toggle"
            onClick={() => setIsSubjectsOpen((isOpen) => !isOpen)}
            aria-label={isSubjectsOpen ? 'Collapse subject list' : 'Expand subject list'}
            aria-expanded={isSubjectsOpen}
            aria-controls="sidebar-subject-list"
          >
            <span className="sidebar-subject-chevron" aria-hidden="true" />
          </button>
        </div>

        {isSubjectsOpen && (
          <div id="sidebar-subject-list" className="sidebar-subject-list">
            {enrolledSubjects.length > 0 ? (
              enrolledSubjects.map((sub) => {
                const linkPath = `/student/subject/${sub.classId}`;
                const isActive = location.pathname === linkPath;

                return (
                  <div key={sub.classId} className="sidebar-enrolled-subject-row">
                    <Link
                      to={linkPath}
                      className={`sidebar-link sidebar-enrolled-subject ${isActive ? 'is-active' : ''}`}
                    >
                      <span className="sidebar-enrolled-subject-name">
                        <span className="sidebar-enrolled-subject-code">{sub.subjectCode}</span>
                        <span className="sidebar-enrolled-subject-divider">-</span>
                        <span className="sidebar-enrolled-subject-title">{sub.subjectName}</span>
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
                        setSubjectToRemove(sub);
                      }}
                    >
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 4.5h10M6 4.5V3h4v1.5m1.5 0-.5 8H5l-.5-8M6.5 7v3.5M9.5 7v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="sidebar-empty-state">No subjects found</p>
            )}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <Link
          to="/settings"
          className={`sidebar-link sidebar-footer-link ${settingsActive ? 'is-active' : ''}`}
        >
          <span className="sidebar-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3.75V5.25M12 18.75V20.25M4.85 4.85L5.8 5.8M18.2 18.2L19.15 19.15M3.75 12H5.25M18.75 12H20.25M4.85 19.15L5.8 18.2M18.2 5.8L19.15 4.85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
          <span>Settings</span>
        </Link>

        <Link to="/help" className="sidebar-link sidebar-footer-link">
          <span className="sidebar-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9.7 9.4C9.7 8.1 10.7 7.3 12 7.3C13.5 7.3 14.4 8.1 14.4 9.2C14.4 10.1 13.9 10.7 12.7 11.3C11.9 11.7 11.4 12.2 11.4 13V13.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="16.3" r="0.7" fill="currentColor"/>
            </svg>
          </span>
          <span>Help &amp; Resources</span>
        </Link>
      </div>

      {subjectToRemove && (
        <div
          className="subject-remove-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSubjectToRemove(null);
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
              <span className="subject-remove-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v5m0 3.5h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <h2 id="subject-remove-title">Remove this subject?</h2>
            </div>
            <p id="subject-remove-description" className="subject-remove-description">
              Remove “{subjectToRemove.subjectCode} - {subjectToRemove.subjectName}” and its personal grade records from your list? Other students will not be affected.
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
        </div>
      )}
    </aside>
  );
}