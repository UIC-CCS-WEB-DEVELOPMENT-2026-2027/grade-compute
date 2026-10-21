// src/pages/student/StudentDashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import SubjectCard from '../../components/student/SubjectCard';
import { getDb } from '../../utils/db';
import './StudentDashboard.css';

export default function StudentDashboard() {
  // TODO: Initialize database state and filter enrolled classes

  const navigate = useNavigate();

  // 1. State & Database Initialization
  const [dbData, setDbData] = useState(() => getDb() || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  const activeStudentId = localStorage.getItem('activeUserId') || "U1";

  useEffect(() => {
    const freshDb = getDb();
    if (freshDb) setDbData(freshDb);
  }, []);

  const currentUser = dbData?.users?.find(u => u.id === activeStudentId) || {
    name: "Juan Dela Cruz",
    role: "Student · BS Information Technology"
  };

  // 2. Derive Enrolled Classes from DB
  const enrolledClasses = (dbData?.classes || [])
    .filter(c => c.studentRecords?.some(r => r.studentId === activeStudentId))
    .map(c => {
      const record = c.studentRecords.find(r => r.studentId === activeStudentId);
      const subject = (dbData?.subjects || []).find(s => s.id === c.subjectId) || {};
      const grade = record?.prelimGrade ?? 75;
      const isBelowPassing = grade < 75;
      const diff = Math.abs(grade - 75);

      return {
        classId: c.id,
        subjectCode: subject.subjectCode || "IT101",
        subjectName: subject.subjectName || "Computer Systems",
        professorName: c.professorName || subject.professorName || "Prof. Maria Santos",
        units: subject.units || 3,
        icon: subject.icon || "</>",
        grade: grade,
        isBelowPassing,
        status: isBelowPassing ? "Needs attention" : (grade >= 85 ? "On track" : "Almost there"),
        statusType: isBelowPassing ? "alert" : (grade >= 85 ? "success" : "warning"),
        pointsText: isBelowPassing ? `${diff} points below passing` : `${diff} points above passing`,
        progressClass: `fill-${Math.min(100, Math.max(0, Math.round(grade)))}`
      };
    });

  // 3. Table Search & Tab Filtering
  const filteredSubjects = enrolledClasses.filter(sub => {
    const matchesSearch = 
      sub.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.professorName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterTab === 'attention') return matchesSearch && sub.isBelowPassing;
    return matchesSearch;
  });

  const attentionCount = enrolledClasses.filter(s => s.isBelowPassing).length;

  // 4. Export CSV Handler
  const handleExportGrades = () => {
    if (enrolledClasses.length === 0) return;
    const csvHeader = "Subject Code,Subject Name,Professor,Units,Prelim Grade,Status\n";
    const csvBody = enrolledClasses.map(s => 
      `"${s.subjectCode}","${s.subjectName}","${s.professorName}",${s.units},"${s.grade}%","${s.isBelowPassing ? 'Below passing' : 'Passing'}"`
    ).join("\n");

    const blob = new Blob([csvHeader + csvBody], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUser.name.replace(/\s+/g, '_')}_Grades.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-page flex-row">
      <Sidebar />

      <div className="dashboard-content-wrapper">

        {/* --- SHARED HEADER --- */}
          <Header 
            welcomeTitle={`Welcome back, ${currentUser.name.split(' ')[0]}!`}
            welcomeSubtitle="A little progress, every day."
            userName={currentUser.name}
            userRole={currentUser.role}
          />
        
        {/* Main Content Container */}
        <main className="dashboard-main container">

          {/* --- STUDENT OVERVIEW BANNER --- */}
          <div className="overview-banner">
            <div className="overview-text">
              <span className="overview-label">YOUR LEARNING JOURNEY</span>
              <h1 className="overview-title">Student Overview</h1>
              <p className="overview-subtitle">Your subjects, your progress, your next step.</p>
            </div>

            <div className="semester-badge">
              <span className="badge-dot">•</span>
              <span className="badge-term">First Semester</span>
              <span className="badge-divider">|</span>
              <span className="badge-year">2026–2027</span>
            </div>
          </div>

          {/* --- FOCUS SUBJECTS SECTION --- */}
          <div className="focus-section">
            <div className="focus-header">
              <div>
                <h2 className="focus-title">Focus Subjects</h2>
                <p className="focus-subtitle">A little extra attention can make a big difference.</p>
              </div>
              <div className="passing-grade-label">
                Passing grade <span className="grade-val">75%</span>
              </div>
            </div>

            {/* 3 Focus Subject Cards using the reusable component (Functionality Added) */}
            <div className="subject-focus-grid">
              {enrolledClasses.slice(0, 3).map(sub => (
                <div 
                  key={sub.classId} 
                  className="subject-card-clickable"
                  onClick={() => navigate(`/student/subject/${sub.classId}`)}
                >
                  <SubjectCard 
                    icon={sub.icon}
                    code={sub.subjectCode}
                    name={sub.subjectName}
                    grade={sub.grade}
                    status={sub.status}
                    statusType={sub.statusType}
                    pointsText={sub.pointsText}
                    target={75}
                    progressClass={sub.progressClass}
                    isAttentionNeeded={sub.isBelowPassing}
                  />
                </div>
              ))}
            </div>
          </div>


          {/* --- ENROLLED SUBJECTS TABLE SECTION --- */}
          <div className="enrolled-subjects-container">
            {/* Header & Export Action */}
            <div className="table-header-top">
              <div>
                <div className="table-title-row">
                  <h2 className="table-title">Enrolled Subjects</h2>
                  <span className="count-badge">{enrolledClasses.length}</span>
                </div>
                <p className="table-subtitle">All your subjects for the current semester.</p>
              </div>
              <button 
                type="button" 
                className="export-link-btn" 
                onClick={handleExportGrades}
              >
                ↓ Export grades
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="table-controls">
              <div className="filter-tabs">
                <button 
                  type="button" 
                  className={`tab-btn ${filterTab === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterTab('all')}
                >
                  All subjects
                </button>
                <button 
                  type="button" 
                  className={`tab-btn ${filterTab === 'attention' ? 'active' : ''}`}
                  onClick={() => setFilterTab('attention')}
                >
                  Needs attention <span className="tab-count-badge">{attentionCount}</span>
                </button>
              </div>

              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search subjects..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="table-wrapper">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>SUBJECT / PROFESSOR</th>
                    <th>UNITS</th>
                    <th>PRELIM GRADE</th>
                    <th>STATUS</th>
                    <th className="th-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map(sub => (
                      <tr 
                        key={sub.classId} 
                        onClick={() => navigate(`/student/subject/${sub.classId}`)}
                      >
                        <td className="subject-cell">
                          <div className="subject-icon-box">{sub.icon}</div>
                          <div className="subject-details-stack">
                            <span className="subject-code-sm">{sub.subjectCode}</span>
                            <span className="subject-name-bold">{sub.subjectName}</span>
                            <span className="prof-name">{sub.professorName}</span>
                          </div>
                        </td>
                        <td className="units-cell">{sub.units}</td>
                        <td className="grade-cell">
                          <span className="table-grade-num">{sub.grade}%</span>
                          <span className="official-grade-lbl">Official grade</span>
                        </td>
                        <td className="status-cell">
                          <span className={`status-pill ${sub.isBelowPassing ? 'status-alert' : 'status-passing'}`}>
                            {sub.isBelowPassing ? 'Below passing' : 'Passing'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <span className="table-arrow">→</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-table-cell">
                        No subjects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="table-footer-bottom">
              <span>• Official grades are posted by your professors.</span>
              <span>Passing grade: 75%</span>
            </div>
          </div>
          
          {/* --- RECENT UPDATES SECTION --- */}
          <div className="recent-updates-section">
            <div className="updates-header">
              <div>
                <h2 className="updates-title">Recent Updates</h2>
                <p className="updates-subtitle">The latest from your professors.</p>
              </div>
              <div className="grade-activity-indicator">
                <span className="blue-dot">•</span> Grade activity
              </div>
            </div>

            <div className="updates-card">
              {enrolledClasses.slice(0, 3).map(sub => (
                <div 
                  key={sub.classId} 
                  className="update-row"
                  onClick={() => navigate(`/student/subject/${sub.classId}`)}
                >
                  <div className="update-left">
                    <div className="check-icon-circle">✓</div>
                    <div className="update-info">
                      <p className="update-text">
                        {sub.professorName} posted an official grade
                      </p>
                      <p className="update-subtext">
                        {sub.subjectName} <span className="dot-sep">•</span> Prelim grade: {sub.grade}%
                      </p>
                    </div>
                  </div>
                  <div className="update-right">
                    <span className="update-time">Recent</span>
                    <span className="update-arrow">↗</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Page Disclaimer & Footer Branding */}
            <div className="dashboard-page-footer">
              <p className="disclaimer-text">Sample student workspace · Grades shown are demonstration data.</p>
              <div className="branding-row">
                <span>A clearer picture. A stronger semester.</span>
                <span>CompuGrade · Built for your potential.</span>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}