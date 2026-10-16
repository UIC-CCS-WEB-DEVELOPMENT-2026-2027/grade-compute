// src/pages/student/StudentDashboard.jsx

import { useState, useEffect } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import SubjectCard from '../../components/student/SubjectCard';
import { getDb } from '../../utils/db';
import './StudentDashboard.css';

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
            <div className="icon-placeholder">bell icon</div>
            <div className="icon-placeholder">user profile</div>
            
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
        <div className="user-data-grade">
          <div>Enrolled Subjects</div>
          <div>All your subjects for the current semester.</div>
          <div>navigation for all subjects</div>
          <div>navigation for needs attention</div>
          <div>search bar for subjects</div>

          <table>
            <thead>
              <tr>
                <th>SUBJECT / PROFESSOR</th>
                <th>UNIT</th>
                <th>PRELIM GRADE</th>
                <th>STATUS</th>
                <th>navigation for certain subject</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  subject code
                  subject name
                  professor name
                </td>
                <td>3</td>
                <td>
                  72%
                  Official Grade
                </td>
                <td>passing grade status</td>
                <td>navigation link</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* --- FOOTER --- */}
        <div className="student-dashboard-footer">
          <div>Official grades are posted by your professors</div>
          <div>Passing Grade: 75%</div>
        </div>

      </main>
    </div>
  );
}