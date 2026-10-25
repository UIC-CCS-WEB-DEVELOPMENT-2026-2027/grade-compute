// src/pages/student/StudentDashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import { getDb } from '../../utils/db';
import dbJson from '../../utils/db.json';
import './StudentDashboard.css';

// Helper to compute Prelim Grade from db.json raw scores
function calculatePrelimGrade(prelimGrades) {
  if (!prelimGrades) return 75;

  let totalScore = 0;
  let totalMax = 0;

  if (Array.isArray(prelimGrades.AT)) {
    prelimGrades.AT.forEach(task => {
      const score = task.officialScore ?? task.studentReportedScore;
      if (score !== null && score !== undefined && task.maxScore) {
        totalScore += score;
        totalMax += task.maxScore;
      }
    });
  }

  if (Array.isArray(prelimGrades.TLA)) {
    prelimGrades.TLA.forEach(task => {
      const score = task.officialScore ?? task.studentReportedScore;
      if (score !== null && score !== undefined && task.maxScore) {
        totalScore += score;
        totalMax += task.maxScore;
      }
    });
  }

  if (prelimGrades.Exam && typeof prelimGrades.Exam === 'object') {
    const exam = prelimGrades.Exam;
    const score = exam.officialScore ?? exam.studentReportedScore;
    if (score !== null && score !== undefined && exam.maxScore) {
      totalScore += score;
      totalMax += exam.maxScore;
    }
  }

  if (totalMax === 0) return 75;
  return Math.round((totalScore / totalMax) * 100 * 10) / 10;
}

// Safely obtain DB data or seed localStorage with db.json if empty
function loadDatabaseData() {
  const local = getDb();
  if (local && Array.isArray(local.users) && local.users.length > 0) {
    return local;
  }
  try {
    localStorage.setItem('compugrade_db', JSON.stringify(dbJson));
    localStorage.setItem('activeUserId', 'U1');
  } catch (e) {
    console.error('Failed to seed localStorage', e);
  }
  return dbJson;
}

export default function StudentDashboard() {
  const navigate = useNavigate();

  // 1. Database & User Context State
  const [dbData, setDbData] = useState(() => loadDatabaseData());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  const activeStudentId = localStorage.getItem('activeUserId') || "U1";

  useEffect(() => {
    const data = loadDatabaseData();
    setDbData(data);
  }, []);

  // Find user inside users array
  const currentUser = dbData?.users?.find(u => String(u.id) === String(activeStudentId)) || 
                      dbData?.users?.find(u => u.role === 'student') || {
                        id: "U1",
                        name: "Juan Dela Cruz",
                        programSection: "BSIT-2A"
                      };

  const effectiveUserId = currentUser.id;

  // 2. Fetch Classes Relationally from DB
  const rawClasses = dbData?.classes || [];
  const rawSubjects = dbData?.subjects || [];
  const rawUsers = dbData?.users || [];

  let userClasses = rawClasses.filter(c => 
    c.studentRecords?.some(r => String(r.studentId) === String(effectiveUserId))
  );

  // Fallback: If logged in user has no specific records, load all default database classes
  if (userClasses.length === 0) {
    userClasses = rawClasses;
  }

  // Icons array to alternate on subject cards
  const icons = ['</>', 'Σ', '≡', '⚡', '📊'];

  const enrolledClasses = userClasses.map((c, idx) => {
    const record = c.studentRecords?.find(r => String(r.studentId) === String(effectiveUserId)) || c.studentRecords?.[0];
    const subject = rawSubjects.find(s => s.id === c.subjectId) || {};
    const professor = rawUsers.find(u => u.id === c.professorId) || {};

    const grade = calculatePrelimGrade(record?.grades?.prelim);
    
    // Extract target grade from targetGradeSandbox in db.json (defaults to 75)
    const targetGrade = record?.targetGradeSandbox?.desiredFinalGrade ?? 75;

    const isBelowPassing = grade < 75;
    const diff = Math.abs(grade - 75);

    let status = "On track";
    let statusType = "success";
    if (isBelowPassing) {
      status = "Needs attention";
      statusType = "alert";
    } else if (grade < 85) {
      status = "Almost there";
      statusType = "warning";
    }

    return {
      classId: c.id,
      subjectCode: subject.subjectCode || c.subjectCode || "IT101",
      subjectName: subject.subjectName || c.subjectName || "Computer Systems",
      professorName: professor.name || c.professorName || "Prof. Maria Santos",
      units: subject.units || c.units || 3,
      icon: icons[idx % icons.length],
      grade: grade,
      targetGrade: targetGrade, // Reads 90 from db.json
      isBelowPassing,
      status,
      statusType,
      pointsText: isBelowPassing ? `${diff} points below passing` : `${diff} points above passing`
    };
  });

  // 3. Search & Tab Filter Logic
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
    a.download = `${(currentUser.name || 'Student').replace(/\s+/g, '_')}_Grades.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-page flex-row">
      <Sidebar />

      <div className="dashboard-content-wrapper">

        {/* --- SHARED HEADER --- */}
        <Header/>
        
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

            <div className="subject-focus-grid">
              {enrolledClasses.slice(0, 3).map(sub => (
                <div 
                  key={sub.classId} 
                  className="subject-card-clickable"
                  onClick={() => navigate(`/student/subject/${sub.classId}`)}
                >
                  <div className={`focus-card ${sub.isBelowPassing ? 'card-needs-attention' : ''}`}>
                    <div className="card-top">
                      <div className="card-icon-box">{sub.icon}</div>
                      <span className={`status-pill status-${sub.statusType}`}>
                        {sub.status}
                      </span>
                    </div>

                    <div className="subject-info">
                      <span className="subject-code">{sub.subjectCode}</span>
                      <h3 className="subject-name">{sub.subjectName}</h3>
                    </div>

                    <div className="grade-section">
                      <div className="grade-display">
                        <span className="grade-number">{sub.grade}%</span>
                        <span className="grade-label">Current Prelim grade</span>
                      </div>
                      
                      {/* Progress Bar Track with Green Target Line */}
                      <div className="progress-bar-track">
                        <div 
                          className="progress-bar-fill"
                          style={{ 
                            width: `${Math.min(100, Math.max(10, sub.grade))}%`,
                            backgroundColor: sub.isBelowPassing ? '#ef4444' : '#1e3a8a'
                          }}
                        />
                        {/* Green Target Indicator Line */}
                        <div 
                          className="target-line-marker" 
                          style={{ left: `${sub.targetGrade}%` }}
                          title={`Target: ${sub.targetGrade}%`}
                        />
                      </div>

                      <div className="progress-details">
                        <span className={sub.isBelowPassing ? 'text-alert' : ''}>{sub.pointsText}</span>
                        <span>Target: {sub.targetGrade}%</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span>Explore your target</span>
                      <span>↗</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- ENROLLED SUBJECTS TABLE SECTION --- */}
          <div className="enrolled-subjects-container">
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

            <div className="table-footer-bottom">
              <span>Official grades are posted by your professors.</span>
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