import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDb } from '../../utils/db';

export default function Sidebar() {
  const location = useLocation(); // To highlight the active menu item

  // 1. State for toggling the dropdown
  // If the current URL includes "/student/subject", start with the dropdown OPEN.
  // Otherwise, start with it CLOSED.
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(() => {
    return location.pathname.includes('/student/subject');
  });
  
  // 2. Load DB (Lazy Init)
  const [dbData] = useState(() => getDb());
  const activeStudentId = "U1"; // Hardcoded for Phase 1

  // 3. Derive the student's enrolled subjects
  const myClasses = dbData?.classes?.filter(c =>
    c.studentRecords.some(record => record.studentId === activeStudentId)
  ) || [];

  const enrolledSubjects = myClasses.map(c => {
    const subjectDetails = dbData.subjects.find(s => s.id === c.subjectId);
    return {
      classId: c.id,
      subjectCode: subjectDetails?.subjectCode || "Unknown",
      subjectName: subjectDetails?.subjectName || "Unknown"
    };
  });

  

  return (
    <aside className="flex-col sidebar" >
      <h2>CompUGrade</h2>
      
      <nav className="flex-col" style={{ marginTop: '2rem', flex: 1 }}>
        <Link 
          to="/student/dashboard" 
          className={`sidebar-link ${location.pathname.includes('/student/dashboard') ? 'btn-primary' : ''}`} 
        >
          Dashboard
        </Link>

        {/* The Dropdown Toggle Button */}
        <Link
          to="/student/subject"
          className={`sidebar-link ${location.pathname === '/student/subject' ? 'btn-primary' : ''}`}
          onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          My Subjects
          <span>{isSubjectsOpen ? '▲' : '▼'}</span>
        </Link>

        {/* The Dropdown Menu List */}
        {isSubjectsOpen && (
          <div className="flex-col" style={{ paddingLeft: '1rem', gap: '0.25rem' }}>
            {enrolledSubjects.length > 0 ? (
              enrolledSubjects.map(sub => {
                const linkPath = `/student/subject/${sub.classId}`;
                const isActive = location.pathname === linkPath;
                
                return (
                  <Link 
                    key={sub.classId} 
                    to={linkPath}
                    className={`sidebar-link ${isActive ? 'btn-primary' : ''}`}
                  >
                    {sub.subjectCode} - {sub.subjectName}
                  </Link>
                );
              })
            ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', paddingLeft: '1rem' }}>
                No subjects found
              </p>
            )}
          </div>
        )}

        <Link 
          to="/settings" 
          className={`sidebar-link ${location.pathname.includes('/settings') ? 'btn-primary' : ''}`} 
        >
          Settings
        </Link>
        
        {/* Pushes the logout button to the bottom */}
        <Link to="/" className="btn-warning sidebar-link" style={{marginTop: 'auto', textAlign: 'center'}}>
          Logout
        </Link>
      </nav>
    </aside>
  );
}