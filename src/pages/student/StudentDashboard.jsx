// src/pages/student/StudentDashboard.jsx

import { useState, useEffect } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import SubjectCard from '../../components/student/SubjectCard';
import { getDb } from '../../utils/db';
import './StudentDashboard.css';
import bellIcon from '../../assets/bell-icon.png';
import userProfile from '../../assets/user-profile.png';

export default function StudentDashboard() {
  // TODO: Initialize database state and filter enrolled classes

  return (
    <div className="dashboard-page flex-row">
      <Sidebar />
      
      {/* Main Content Container */}
      <main className="dashboard-main container">

        {/* --- TOP USER BAR --- */}
        <div className="top-user-bar">
          {/* Left: Welcome Header Stack */}
          <div className="welcome-text">
            <h2 className="welcome-title">Welcome back, Juan!</h2>
            <p className="welcome-subtitle">A little progress, every day.</p>
          </div>

          {/* Right: Placeholders & Profile Stack */}
          <div className="top-right-user-bar">
            <img src={bellIcon} alt="Notifications" className="header-icon-img" />
            <img src={userProfile} alt="User Profile" className="profile-avatar-img" />
            
            <div className="user-details">
              <span className="user-name">Juan Dela Cruz</span>
              <span className="user-role">Student · BS Information Technology</span>
            </div>

            {/* Settings Dropdown Button (Placeholder) */}
            <button 
              type="button" 
              className="dropdown-arrow-btn"
              onClick={(e) => e.preventDefault()} 
              title="Settings (Under Development)"
            >
              ▼
            </button>
          </div>
        </div>

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

          {/* 3 Focus Subject Cards using the reusable component */}
          <div className="subject-focus-grid">
            <SubjectCard 
              icon="</>"
              code="IT101"
              name="Computer Systems"
              grade={72}
              status="Needs attention"
              statusType="alert"
              pointsText="3 points below passing"
              target={75}
              progressClass="fill-72"
              isAttentionNeeded={true}
            />

            <SubjectCard 
              icon="Σ"
              code="MATH 101"
              name="General Mathematics"
              grade={78}
              status="Almost there"
              statusType="warning"
              pointsText="3 points above passing"
              target={75}
              progressClass="fill-78"
            />

            <SubjectCard 
              icon="≡"
              code="PROG 101"
              name="Introduction to Programming"
              grade={86}
              status="On track"
              statusType="success"
              pointsText="11 points above passing"
              target={75}
              progressClass="fill-86"
            />
          </div>
        </div>

        {/* --- ENROLLED SUBJECTS TABLE SECTION --- */}
        <div className="enrolled-subjects-container">
          {/* Header & Export Action */}
          <div className="table-header-top">
            <div>
              <div className="table-title-row">
                <h2 className="table-title">Enrolled Subjects</h2>
                <span className="count-badge">5</span>
              </div>
              <p className="table-subtitle">All your subjects for the current semester.</p>
            </div>
            <button type="button" className="export-link-btn" onClick={(e) => e.preventDefault()}>
              ↓ Export grades
            </button>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="table-controls">
            <div className="filter-tabs">
              <button type="button" className="tab-btn active">All subjects</button>
              <button type="button" className="tab-btn">
                Needs attention <span className="tab-count-badge">1</span>
              </button>
            </div>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search subjects..." 
                className="search-input"
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
                {/* Row 1: IT101 */}
                <tr>
                  <td className="subject-cell">
                    <div className="subject-icon-box">&lt;/&gt;</div>
                    <div className="subject-details-stack">
                      <span className="subject-code-sm">IT101</span>
                      <span className="subject-name-bold">Computer Systems</span>
                      <span className="prof-name">Prof. Maria Santos</span>
                    </div>
                  </td>
                  <td className="units-cell">3</td>
                  <td className="grade-cell">
                    <span className="table-grade-num">72%</span>
                    <span className="official-grade-lbl">Official grade</span>
                  </td>
                  <td className="status-cell">
                    <span className="status-pill status-alert">Below passing</span>
                  </td>
                  <td className="action-cell">
                    <span className="table-arrow">→</span>
                  </td>
                </tr>

                {/* Row 2: MATH 101 */}
                <tr>
                  <td className="subject-cell">
                    <div className="subject-icon-box">Σ</div>
                    <div className="subject-details-stack">
                      <span className="subject-code-sm">MATH 101</span>
                      <span className="subject-name-bold">General Mathematics</span>
                      <span className="prof-name">Prof. Carlo Reyes</span>
                    </div>
                  </td>
                  <td className="units-cell">3</td>
                  <td className="grade-cell">
                    <span className="table-grade-num">78%</span>
                    <span className="official-grade-lbl">Official grade</span>
                  </td>
                  <td className="status-cell">
                    <span className="status-pill status-passing">Passing</span>
                  </td>
                  <td className="action-cell">
                    <span className="table-arrow">→</span>
                  </td>
                </tr>

                {/* Row 3: PROG 101 */}
                <tr>
                  <td className="subject-cell">
                    <div className="subject-icon-box">≡</div>
                    <div className="subject-details-stack">
                      <span className="subject-code-sm">PROG 101</span>
                      <span className="subject-name-bold">Introduction to Programming</span>
                      <span className="prof-name">Prof. Ana Cruz</span>
                    </div>
                  </td>
                  <td className="units-cell">3</td>
                  <td className="grade-cell">
                    <span className="table-grade-num">86%</span>
                    <span className="official-grade-lbl">Official grade</span>
                  </td>
                  <td className="status-cell">
                    <span className="status-pill status-passing">Passing</span>
                  </td>
                  <td className="action-cell">
                    <span className="table-arrow">→</span>
                  </td>
                </tr>

                {/* Row 4: STAT 201 */}
                <tr>
                  <td className="subject-cell">
                    <div className="subject-icon-box">σ</div>
                    <div className="subject-details-stack">
                      <span className="subject-code-sm">STAT 201</span>
                      <span className="subject-name-bold">Probability &amp; Statistics</span>
                      <span className="prof-name">Prof. David Park</span>
                    </div>
                  </td>
                  <td className="units-cell">3</td>
                  <td className="grade-cell">
                    <span className="table-grade-num">85.8%</span>
                    <span className="official-grade-lbl">Official grade</span>
                  </td>
                  <td className="status-cell">
                    <span className="status-pill status-passing">Passing</span>
                  </td>
                  <td className="action-cell">
                    <span className="table-arrow">→</span>
                  </td>
                </tr>

                {/* Row 5: ENG 102 */}
                <tr>
                  <td className="subject-cell">
                    <div className="subject-icon-box">Aa</div>
                    <div className="subject-details-stack">
                      <span className="subject-code-sm">ENG 102</span>
                      <span className="subject-name-bold">Academic Writing</span>
                      <span className="prof-name">Dr. Olivia Reyes</span>
                    </div>
                  </td>
                  <td className="units-cell">3</td>
                  <td className="grade-cell">
                    <span className="table-grade-num">91%</span>
                    <span className="official-grade-lbl">Official grade</span>
                  </td>
                  <td className="status-cell">
                    <span className="status-pill status-passing">Passing</span>
                  </td>
                  <td className="action-cell">
                    <span className="table-arrow">→</span>
                  </td>
                </tr>
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
            {/* Update Item 1 */}
            <div className="update-row">
              <div className="update-left">
                <div className="check-icon-circle">✓</div>
                <div className="update-info">
                  <p className="update-text">
                    Prof. Ana Cruz posted an official grade
                  </p>
                  <p className="update-subtext">
                    Introduction to Programming <span className="dot-sep">•</span> Prelim grade: 86%
                  </p>
                </div>
              </div>
              <div className="update-right">
                <span className="update-time">Today, 10:30 AM</span>
                <span className="update-arrow">↗</span>
              </div>
            </div>

            {/* Update Item 2 */}
            <div className="update-row">
              <div className="update-left">
                <div className="check-icon-circle">✓</div>
                <div className="update-info">
                  <p className="update-text">
                    Prof. Maria Santos posted an official grade
                  </p>
                  <p className="update-subtext">
                    Computer Systems <span className="dot-sep">•</span> Prelim grade: 72%
                  </p>
                </div>
              </div>
              <div className="update-right">
                <span className="update-time">Yesterday, 2:15 PM</span>
                <span className="update-arrow">↗</span>
              </div>
            </div>

            {/* Update Item 3 */}
            <div className="update-row">
              <div className="update-left">
                <div className="check-icon-circle">✓</div>
                <div className="update-info">
                  <p className="update-text">
                    Prof. Carlo Reyes posted an official grade
                  </p>
                  <p className="update-subtext">
                    General Mathematics <span className="dot-sep">•</span> Prelim grade: 78%
                  </p>
                </div>
              </div>
              <div className="update-right">
                <span className="update-time">Oct 3, 9:00 AM</span>
                <span className="update-arrow">↗</span>
              </div>
            </div>
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
  );
}