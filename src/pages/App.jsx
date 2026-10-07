import { useState } from 'react';
import './GlobalSettings.css';

const courses = [
  { code: 'IT101', title: 'Computer Systems' },
  { code: 'MATH 101', title: 'General Mathematics' },
  { code: 'PROG 101', title: 'Introduction to Programming' },
  { code: 'ANTH 101', title: 'Cultural Anthropology' },
];

function App() {
  const [activeSection, setActiveSection] = useState('profile');

  const sectionMeta = {
    profile: {
      label: '01',
      title: 'Profile & Settings',
      subtitle: 'A few details that make this space yours.',
      cardClass: 'profile-shell',
      content: (
        <>
          <div className="avatar-panel">
            <div className="profile-avatar">JD</div>
            <button className="camera-btn" aria-label="Upload photo">
              📷
            </button>
            <div className="upload-text">Upload Photo</div>
          </div>

          <div className="display-name">Juan Dela Cruz</div>
          <div className="student-line">Student ID · 2026-0004</div>
          <div className="badge">Student</div>

          <div className="profile-info">
            <div>BS Information Technology</div>
            <div>First Semester · 2026-2027</div>
          </div>

          <div className="upload-hint">JPG, PNG, or WebP · Up to 2 MB</div>
        </>
      ),
    },
    details: {
      label: '01',
      title: 'Personal Details',
      subtitle: 'Your name and the email connected to this workspace.',
      cardClass: 'details-shell',
      content: (
        <>
          <div className="field-grid">
            <div className="field-block">
              <label>First Name</label>
              <input type="text" value="Juan" readOnly />
            </div>
            <div className="field-block">
              <label>Last Name</label>
              <input type="text" value="Dela Cruz" readOnly />
            </div>
          </div>

          <div className="field-block full-width">
            <label>Email Address</label>
            <input type="email" value="juan.delacruz@university.edu" readOnly />
          </div>

          <p className="helper-text">
            Demo profile only. Changing this email does not change your sign-in credentials.
          </p>
        </>
      ),
    },
    security: {
      label: '02',
      title: 'Security',
      subtitle: 'A little extra care for your account.',
      cardClass: 'security-shell',
      content: (
        <>
          <div className="field-grid">
            <div className="field-block">
              <label>Current Password</label>
              <input type="password" placeholder="Enter current password" />
            </div>
            <div className="field-block">
              <label>New Password</label>
              <input type="password" placeholder="At least 8 characters" />
            </div>
          </div>

          <div className="security-banner">
            <span className="banner-icon">ⓘ</span>
            Security preview only. Do not enter a real password. Passwords are never saved; live password changes require authentication.
          </div>

          <div className="save-row">
            <div>Your profile is up to date.</div>
            <button className="primary-btn">✓ Save Changes</button>
          </div>

          <div className="logout-panel">
            <div>
              <h3>Ready to step away?</h3>
              <p>You can always pick up where you left off.</p>
            </div>
            <button className="ghost-btn">↩ Log Out</button>
          </div>
        </>
      ),
    },
  };

  const activeMeta = sectionMeta[activeSection];

  return (
    <div className="app-shell">
      <aside className="left-sidebar">
        <div className="workspace-box">
          <span>Dev: Switch Workspace</span>
          <strong>Student</strong>
        </div>

        <div className="brand-row">
          <div className="brand-mark">▣</div>
          <div className="brand-name">CompUGrade.</div>
        </div>

        <div className="sidebar-label">YOUR ACADEMIC SPACE</div>

        <div className="course-list">
          {courses.map((course) => (
            <button
              key={course.code}
              className={`course-item ${activeSection === 'profile' ? 'active' : ''}`}
              type="button"
            >
              <span className="course-code">{course.code}</span>
              <span className="course-title">{course.title}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className={`settings-link ${activeSection === 'details' ? 'active' : ''}`}
            onClick={() => setActiveSection('details')}
          >
            ⚙ Settings
          </button>
          <button type="button" className="help-link">? Help &amp; Resources</button>
        </div>
      </aside>

      <main className="main-panel">
        <section className="content-card">
          <div className="section-tabs">
            <button
              type="button"
              className={activeSection === 'profile' ? 'tab active' : 'tab'}
              onClick={() => setActiveSection('profile')}
            >
              Profile
            </button>
            <button
              type="button"
              className={activeSection === 'details' ? 'tab active' : 'tab'}
              onClick={() => setActiveSection('details')}
            >
              Personal Details
            </button>
            <button
              type="button"
              className={activeSection === 'security' ? 'tab active' : 'tab'}
              onClick={() => setActiveSection('security')}
            >
              Security
            </button>
          </div>

          <div className={`header-block ${activeMeta.cardClass}`}>
            <div className="section-number">{activeMeta.label}</div>
            <div className="section-title">{activeMeta.title}</div>
            <div className="section-subtitle">{activeMeta.subtitle}</div>
          </div>

          <div className="panel-body">{activeMeta.content}</div>
        </section>
      </main>
    </div>
  );
}

export default App;