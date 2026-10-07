// src/pages/auth/LoginRegister.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb } from '../../utils/db';
import './LoginRegister.css';

export default function LoginRegister() {
  const navigate = useNavigate();

  // Lazy database initialization to prevent cascading renders
  const [dbData] = useState(() => getDb());

  // Form states
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'professor'
  const [identifier, setIdentifier] = useState('ysa@student.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Handle Role Selection
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'professor') {
      setInfoMessage('Notice: Professor Workspace is scheduled for Phase 2. To test the Phase 1 MVP, select Student.');
    } else {
      setInfoMessage('');
    }
  };

  // Handle Login Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedRole === 'professor') {
      setErrorMessage('The Professor Workspace is locked for the Phase 1 MVP. Please log in as a Student.');
      return;
    }

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or Student ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const users = dbData?.users || [];

    // Match by ID or Email (case-insensitive)
    const matchedUser = users.find(
      (u) =>
        (u.id.toLowerCase() === identifier.trim().toLowerCase() ||
          u.email.toLowerCase() === identifier.trim().toLowerCase()) &&
        u.role === 'student'
    );

    if (!matchedUser) {
      setErrorMessage('No student account found with this email or ID. (Try demo: ysa@student.edu or U1)');
      return;
    }

    if (matchedUser.password !== password) {
      setErrorMessage('Incorrect password. (Demo password: password123)');
      return;
    }

    // Authentication successful
    try {
      localStorage.setItem('activeUserId', matchedUser.id);
    } catch {
      // LocalStorage access fallback
    }

    navigate('/student/dashboard');
  };

  return (
    <div className="login-page-wrapper">
      {/* =========================================
          LEFT HERO PANEL (Yellow Background)
          ========================================= */}
      <section className="login-hero-panel" aria-label="Brand Overview">
        {/* Logo */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
              <path d="M6 6h10"></path>
              <path d="M6 10h10"></path>
            </svg>
          </div>
          <span className="login-brand-name">CompUGrade<span className="login-brand-dot">.</span></span>
        </div>

        {/* Main Pitch */}
        <div className="login-hero-content">
          <span className="login-pill-badge">A CLEARER PATH TO HIGH POTENTIAL</span>
          <h1 className="login-hero-title">Calculate grades and achieve grade targets</h1>
          <p className="login-hero-subtitle">
            A little clarity today. A stronger semester tomorrow.
          </p>

          {/* Floating Target Preview Graphic */}
          <div className="login-preview-card-container">
            {/* Cheerful Sparkle Accents */}
            <svg className="sparkle-icon sparkle-1" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"></path>
            </svg>
            <svg className="sparkle-icon sparkle-2" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"></path>
            </svg>
            <svg className="sparkle-icon sparkle-3" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"></path>
            </svg>

            <div className="login-preview-card">
              <div className="preview-card-header">
                <div className="preview-header-left">
                  <div className="preview-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="preview-card-tag">You're Very On Track</div>
                    <p className="preview-card-subtitle">A plan for your Q1 target</p>
                  </div>
                </div>
                <div className="preview-card-action" title="View details">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
              </div>

              <div className="preview-target-row">
                <div className="preview-target-meta">
                  <span className="preview-target-label">My grade target</span>
                  <span className="preview-status-chip">
                    <span className="status-dot"></span> On Track
                  </span>
                </div>
                <span className="preview-target-value">90%</span>
              </div>

              {/* Ascending Chart Visualization with Target Threshold */}
              <div className="preview-chart-area">
                <div className="chart-threshold-line">
                  <span className="threshold-tag">Goal: 90%</span>
                </div>

                <div className="preview-bars-wrapper" aria-hidden="true">
                  <div className="preview-bar-col">
                    <span className="bar-val-label">84%</span>
                    <div className="preview-bar bar-1" style={{ height: '42%' }}></div>
                    <span className="bar-name-label">Quiz 1</span>
                  </div>
                  <div className="preview-bar-col">
                    <span className="bar-val-label">88%</span>
                    <div className="preview-bar bar-2" style={{ height: '56%' }}></div>
                    <span className="bar-name-label">Lab 1</span>
                  </div>
                  <div className="preview-bar-col">
                    <span className="bar-val-label">91%</span>
                    <div className="preview-bar bar-3" style={{ height: '72%' }}></div>
                    <span className="bar-name-label">Quiz 2</span>
                  </div>
                  <div className="preview-bar-col">
                    <span className="bar-val-label">93%</span>
                    <div className="preview-bar bar-4" style={{ height: '86%' }}></div>
                    <span className="bar-name-label">Midterm</span>
                  </div>
                  <div className="preview-bar-col">
                    <span className="bar-val-label star-highlight">95% ⭐</span>
                    <div className="preview-bar bar-target" style={{ height: '96%' }}></div>
                    <span className="bar-name-label target-name">Target</span>
                  </div>
                </div>
              </div>

              {/* Floating Pill Badge */}
              <div className="preview-floating-pill">
                <div className="preview-pill-icon">✓</div>
                <div className="preview-pill-text">
                  <div className="preview-pill-bold">Make Your Target Grade a Reality</div>
                  <div className="preview-pill-sub">Tap to see what score you need next</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="login-checklist">
            <div className="login-check-item">
              <span className="check-mark">✓</span>
              <span>Track your progress</span>
            </div>
            <div className="login-check-item">
              <span className="check-mark">✓</span>
              <span>Simulate your targets</span>
            </div>
            <div className="login-check-item">
              <span className="check-mark">✓</span>
              <span>Learn with confidence</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="login-hero-footer">
          MADE FOR STUDENTS. BUILT WITH PROFESSORS.
        </div>
      </section>

      {/* =========================================
          RIGHT FORM PANEL (White Background)
          ========================================= */}
      <section className="login-form-panel" aria-label="Sign In Form">
        <div className="login-form-container">
          {/* Top Switcher Tabs */}
          <div className="login-tab-switcher">
            <button
              type="button"
              className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={`login-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('register');
                setInfoMessage('Student registration is auto-seeded with Ysa Ang (BSIT-2A) for the Phase 1 MVP.');
              }}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="login-form-overline">Good to see you again</div>
          <h2 className="login-form-title">
            {activeTab === 'login' ? 'Welcome back.' : 'Create your account.'}
          </h2>
          <p className="login-form-sub">
            {activeTab === 'login'
              ? 'Your grades, goals, and next steps are waiting.'
              : 'Join CompUGrade to calculate and achieve your target grades.'}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Role Selector Cards */}
            <div className="role-select-section">
              <span className="role-select-label">I am a:</span>
              <div className="role-cards-grid">
                {/* Student Option */}
                <button
                  type="button"
                  className={`role-card-btn ${selectedRole === 'student' ? 'selected' : ''}`}
                  onClick={() => handleRoleChange('student')}
                >
                  <div className="role-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </div>
                  <div className="role-card-info">
                    <span className="role-card-title">Student</span>
                    <span className="role-card-desc">Track &amp; simulate your scores</span>
                  </div>
                  <div className="role-radio-indicator">
                    {selectedRole === 'student' && <div className="role-radio-dot"></div>}
                  </div>
                </button>

                {/* Professor Option */}
                <button
                  type="button"
                  className={`role-card-btn ${selectedRole === 'professor' ? 'selected' : ''}`}
                  onClick={() => handleRoleChange('professor')}
                >
                  <div className="role-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <div className="role-card-info">
                    <span className="role-card-title">Professor</span>
                    <span className="role-card-desc">Quick &amp; easy grade input</span>
                  </div>
                  <div className="role-radio-indicator">
                    {selectedRole === 'professor' && <div className="role-radio-dot"></div>}
                  </div>
                </button>
              </div>
            </div>

            {/* Error & Info Alerts */}
            {errorMessage && (
              <div className="login-alert-banner login-alert-warning" role="alert">
                {errorMessage}
              </div>
            )}
            {infoMessage && (
              <div className="login-alert-banner login-alert-info" role="status">
                {infoMessage}
              </div>
            )}

            {/* Email / ID Field */}
            <div className="login-form-group">
              <label htmlFor="identifier-input" className="login-form-label">
                Email or Student ID
              </label>
              <input
                id="identifier-input"
                type="text"
                className="login-form-input"
                placeholder="ysa@student.edu or U1"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            {/* Password Field */}
            <div className="login-form-group">
              <label htmlFor="password-input" className="login-form-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="login-form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-submit-btn">
              <span>{activeTab === 'login' ? 'Log In' : 'Create Account'}</span>
              <span>→</span>
            </button>
          </form>

          {/* Links & Helpers */}
          <div className="login-footer-links">
            <button
              type="button"
              className="login-link-btn"
              onClick={() => alert('Demo Reset: Your student password is "password123".')}
            >
              Forgot Password?
            </button>
            <div className="login-switch-prompt">
              {activeTab === 'login' ? (
                <>
                  New to CompUGrade?{' '}
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={() => setActiveTab('register')}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={() => setActiveTab('login')}
                  >
                    Sign in here
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Seed Account Helper for Smooth Testing */}
          <div className="login-demo-helper">
            <strong>Demo Student Account:</strong> <code>ysa@student.edu</code> (or <code>U1</code>) &bull; Password: <code>password123</code>
          </div>
        </div>
      </section>
    </div>
  );
}