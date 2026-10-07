// src/pages/student/StudentDashboard.jsx

// Initializing student dashboard layout structure

import { useState, useEffect } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import SubjectCard from '../../components/student/SubjectCard';
import { getDb } from '../../utils/db';
import './StudentDashboard.css';

export default function StudentDashboard() {
  // TODO: Initialize database state and filter enrolled classes

  return (
    /*Sidebar Container*/
    <div className="dashboard-page flex-row">
      <Sidebar />
    {/*Main Content Container*/}
      <main className="dashboard-main container">

        <div className='top-user-bar'>
        <h2 className='welcome-title'>Student Dashboard</h2>
        <p className='welcome-subtitle'>List of enrolled subjects goes here.</p>

        <div className='top-right-user-bar'>
          <img>bell icon</img>
          <img>user profile</img>
          <div className='user-name'>Juan Dela Cruz</div>
          <div className='user-role'>Student BS Information Technology</div>
        </div>

        </div>

        <div className='overview-banner'>
          <div>YOUR LEARNING JOURNEY</div>
          <div>Student Oveview</div>
          <div>Your subjects, your progress, your next step.</div>

          <div className='right-overview-banner'>
            <div className='user-semester'>First Semester</div>
            <div className='user-year'>2026 - 2027</div>

          </div>
        </div>

        <div className='focus-bar'>
          <div>Focus Subjects</div>
          <div>A little extra attention can make a big difference.</div>
          <div className='right-focus-bar'>Passing Grade: 75%</div>

          <div className='subject-focus'>

            <div className='subject-1'>
            <img>subject icon</img>
            <div>subject status</div>
            <div>subject code</div>
            <div>subject name</div>
            <div>grade percentage</div>
            <div>current prelim grade</div>
            <div>loading bar based on performance</div>
            <div>points needed</div>
            <div>Target: 75%</div>
            <div>navigation to the subject detail</div>
            </div>

            <div className='subject-2'>
            <img>subject icon</img>
            <div>subject status</div>
            <div>subject code</div>
            <div>subject name</div>
            <div>grade percentage</div>
            <div>current prelim grade</div>
            <div>loading bar based on performance</div>
            <div>points needed</div>
            <div>Target: 75%</div>
            <div>navigation to the subject detail</div>
            </div>

            <div className='subject-3'>
            <img>subject icon</img>
            <div>subject status</div>
            <div>subject code</div>
            <div>subject name</div>
            <div>grade percentage</div>
            <div>current prelim grade</div>
            <div>loading bar based on performance</div>
            <div>points needed</div>
            <div>Target: 75%</div>
            <div>navigation to the subject detail</div>
            </div>

          </div>

          <div className='user-data-grade'>
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
          
          <div className='student-dashboard-footer'>
            <div>Official grades are posted by your professors</div>
            <div>Passing Grade: 75%</div>
          </div>
        </div>

        <SubjectCard  />
        {/* Developer implementation for displaying SubjectCards goes here */}
        
      </main>
    </div>
  );
}