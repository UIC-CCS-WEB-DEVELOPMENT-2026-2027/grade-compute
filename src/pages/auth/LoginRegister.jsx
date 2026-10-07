// src/pages/auth/LoginRegister.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb, saveDb } from '../../utils/db';
import './LoginRegister.css';

const buildDisplayName = (value) => {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return 'New Student';

  const nameCandidate = cleanValue
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!nameCandidate) return 'New Student';

  return nameCandidate
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const buildStudentEmail = (value) => {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return 'student@compugrade.edu';

  if (cleanValue.includes('@')) {
    return cleanValue.toLowerCase();
  }

  return `${cleanValue.toLowerCase().replace(/\s+/g, '')}@student.edu`;
};

const getNextStudentId = (users = []) => {
  const latestId = users
    .filter((user) => user?.role === 'student' && /^U\d+$/i.test(user.id || ''))
    .reduce((max, user) => {
      const numericId = Number.parseInt(user.id.replace(/\D/g, ''), 10);
      return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
    }, 0);

  return `U${latestId + 1}`;
};

export default function LoginRegister() {
  const navigate = useNavigate();

  // Lazy database initialization to prevent cascading renders
  const [dbData] = useState(() => getDb());

  // Form states
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'professor'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

  // Handle Submission (login/register)
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

    if (activeTab === 'register') {
      const normalizedIdentifier = identifier.trim();
      const existingUser = users.find(
        (user) =>
          user.role === 'student' &&
          (user.id.toLowerCase() === normalizedIdentifier.toLowerCase() ||
            user.email.toLowerCase() === normalizedIdentifier.toLowerCase() ||
            user.email.toLowerCase() === buildStudentEmail(normalizedIdentifier).toLowerCase())
      );

      if (existingUser) {
        setErrorMessage('An account with that email or ID already exists. Please log in instead.');
        return;
      }

      const newUser = {
        id: getNextStudentId(users),
        role: 'student',
        name: buildDisplayName(normalizedIdentifier),
        programSection: 'New Student',
        email: buildStudentEmail(normalizedIdentifier),
        password,
      };

      const updatedDb = {
        ...dbData,
        users: [...users, newUser],
      };

      try {
        saveDb(updatedDb);
        localStorage.setItem('activeUserId', newUser.id);
      } catch {
        // Local storage access fallback
      }

      setInfoMessage('Account created successfully. Redirecting to your dashboard...');
      navigate('/student/dashboard');
      return;
    }

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
      <style>{`
        .login-page-wrapper {
          --auth-blue: #426497;
          --auth-ink: #282b31;
          --auth-muted: #7b8491;
          --auth-line: #dce2ea;
          position: relative;
          z-index: auto;
          min-height: 100vh;
          height: 100vh;
          overflow: hidden;
          background: #fff;
          color: var(--auth-ink);
        }

        @keyframes authPanelEnter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @-webkit-keyframes authPanelEnter {
          from { opacity: 0; -webkit-transform: translateY(6px); transform: translateY(6px); }
          to { opacity: 1; -webkit-transform: translateY(0); transform: translateY(0); }
        }

        @keyframes authContentEnter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @-webkit-keyframes authContentEnter {
          from { opacity: 0; -webkit-transform: translateY(4px); transform: translateY(4px); }
          to { opacity: 1; -webkit-transform: translateY(0); transform: translateY(0); }
        }

        .login-page-wrapper .login-hero-panel {
          -webkit-animation: authPanelEnter 650ms ease-out both;
          animation: authPanelEnter 480ms ease-out both;
        }

        .login-page-wrapper .login-form-panel {
          -webkit-animation: authPanelEnter 650ms ease-out 80ms both;
          animation: authPanelEnter 480ms ease-out 60ms both;
        }

        .login-page-wrapper .login-brand-header {
          -webkit-animation: authContentEnter 400ms ease-out 100ms both;
          animation: authContentEnter 400ms ease-out 100ms both;
        }

        .login-page-wrapper .login-pill-badge {
          -webkit-animation: authContentEnter 400ms ease-out 120ms both;
          animation: authContentEnter 400ms ease-out 120ms both;
        }

        .login-page-wrapper .login-hero-title {
          -webkit-animation: authContentEnter 440ms ease-out 160ms both;
          animation: authContentEnter 440ms ease-out 160ms both;
        }

        .login-page-wrapper .login-hero-subtitle {
          -webkit-animation: authContentEnter 440ms ease-out 200ms both;
          animation: authContentEnter 440ms ease-out 200ms both;
        }

        .login-page-wrapper .login-hero-footer,
        .login-page-wrapper .login-form-meta,
        .login-page-wrapper .login-form-footer {
          -webkit-animation: authContentEnter 400ms ease-out 260ms both;
          animation: authContentEnter 400ms ease-out 260ms both;
        }

        .login-page-wrapper .login-hero-panel,
        .login-page-wrapper .login-form-panel {
          box-sizing: border-box;
          height: 100%;
          min-height: 0;
        }

        .login-page-wrapper .login-hero-panel {
          flex: 0 0 47%;
          padding: 24px 42px 22px;
          background: #fff59a;
          overflow: hidden;
          position: relative;
          z-index: 0;
        }

        .login-page-wrapper .login-hero-panel::before,
        .login-page-wrapper .login-hero-panel::after,
        .login-page-wrapper .login-form-panel::before {
          display: none;
        }

        .login-page-wrapper .login-brand-header {
          gap: 8px;
          margin: 0;
        }

        .login-page-wrapper .login-brand-icon {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          box-shadow: none;
          -webkit-transition: -webkit-transform 280ms ease, box-shadow 280ms ease;
          transition: transform 280ms ease, box-shadow 280ms ease;
        }

        .login-page-wrapper .login-brand-header:hover .login-brand-icon {
          transform: translateY(-1px) rotate(-2deg);
          box-shadow: 0 4px 10px rgba(66, 100, 151, 0.16);
        }

        .login-page-wrapper .login-brand-icon svg {
          width: 18px;
          height: 18px;
        }

        .login-page-wrapper .login-brand-name {
          color: var(--auth-ink);
          font-size: 1.25rem;
          letter-spacing: -0.3px;
        }

        .login-page-wrapper .login-brand-dot {
          color: var(--auth-blue);
        }

        .login-page-wrapper .login-hero-content {
          width: min(460px, 72%);
          max-width: 460px;
          margin: auto;
          position: relative;
          top: 8px;
        }

        .login-page-wrapper .login-pill-badge {
          margin-bottom: 9px;
          font-size: 0.58rem;
          letter-spacing: 1.25px;
          color: #6c7480;
        }

        .login-page-wrapper .login-hero-title {
          max-width: 410px;
          margin: 0 0 12px;
          color: var(--auth-ink);
          font-size: clamp(1.75rem, 2.2vw, 2.35rem);
          line-height: 1.02;
          font-weight: 600;
        }

        .login-page-wrapper .login-hero-subtitle {
          margin: 0;
          color: #65665e;
          font-size: 0.82rem;
          line-height: 1.55;
        }

        .login-page-wrapper .login-preview-card-container {
          width: min(410px, 92%);
          margin: 36px auto 10px;
          -webkit-animation: heroCardFloat 7s ease-in-out 800ms infinite;
          animation: heroCardFloat 7s ease-in-out 800ms infinite;
        }

        .login-page-wrapper .login-preview-card {
          padding: 16px;
          border-radius: 8px;
          border-color: #e8e5d3;
          box-shadow: 0 8px 22px rgba(50, 66, 92, 0.1);
          -webkit-transition: -webkit-transform 240ms ease, box-shadow 240ms ease;
          transition:
            transform 240ms ease,
            box-shadow 240ms ease;
        }

        .login-page-wrapper .preview-card-action {
          -webkit-transition: color 220ms ease, background-color 220ms ease, -webkit-transform 220ms ease;
          transition: color 220ms ease, background-color 220ms ease, transform 220ms ease;
        }

        .login-page-wrapper .login-preview-card:hover .preview-card-action {
          transform: translate(1px, -1px);
          color: var(--auth-blue);
          background-color: #edf3fb;
        }

        .login-page-wrapper .preview-card-header {
          margin-bottom: 12px;
        }

        .login-page-wrapper .preview-header-left {
          gap: 8px;
        }

        .login-page-wrapper .preview-header-icon {
          width: 30px;
          height: 30px;
          border-radius: 6px;
        }

        .login-page-wrapper .preview-card-tag {
          font-size: 0.52rem;
          letter-spacing: 0.6px;
        }

        .login-page-wrapper .preview-card-subtitle {
          font-size: 0.68rem;
        }

        .login-page-wrapper .preview-card-action {
          width: 25px;
          height: 25px;
          pointer-events: none;
        }

        .login-page-wrapper .preview-target-row {
          padding-top: 9px;
          margin-bottom: 8px;
        }

        .login-page-wrapper .preview-target-label {
          font-size: 0.68rem;
        }

        .login-page-wrapper .preview-status-chip {
          padding: 2px 6px;
          font-size: 0.55rem;
        }

        .login-page-wrapper .preview-target-value {
          font-size: 1.7rem;
        }

        .login-page-wrapper .preview-chart-area {
          margin-top: 0;
          padding-top: 8px;
        }

        .login-page-wrapper .preview-bars-wrapper {
          height: 90px;
          gap: 8px;
          position: relative;
          isolation: isolate;
        }

        .login-page-wrapper .preview-bar-col {
          border-radius: 6px 6px 0 0;
          -webkit-transition: -webkit-transform 220ms ease;
          transition: transform 220ms ease;
        }

        .login-page-wrapper .preview-bar {
          -webkit-transition: -webkit-filter 220ms ease, filter 220ms ease;
          transition: filter 220ms ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .login-page-wrapper .preview-bar-col:hover {
            -webkit-transform: translateY(-3px);
            transform: translateY(-3px);
          }

          .login-page-wrapper .preview-bar-col:hover .preview-bar {
            -webkit-filter: brightness(1.1) saturate(1.08);
            filter: brightness(1.1) saturate(1.08);
          }
        }

        .login-page-wrapper .preview-bar-col:active {
          -webkit-transform: translateY(-1px);
          transform: translateY(-1px);
        }

        .login-page-wrapper .preview-bars-wrapper::before {
          position: absolute;
          z-index: -1;
          inset: 8px 0 14px;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 19px,
            rgba(66, 100, 151, 0.08) 20px
          );
          content: '';
          pointer-events: none;
          -webkit-animation: chartGridFade 1.2s ease-out both;
          animation: chartGridFade 1.2s ease-out both;
        }

        .login-page-wrapper .bar-val-label {
          font-size: 0.55rem;
          opacity: 0;
          transform: translateY(4px);
          -webkit-animation: chartLabelReveal 650ms ease-out both;
          animation: chartLabelReveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .login-page-wrapper .bar-name-label {
          font-size: 0.52rem;
          opacity: 0;
          transform: translateY(4px);
          -webkit-animation: chartLabelReveal 650ms ease-out both;
          animation: chartLabelReveal 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .login-page-wrapper .preview-bar {
          transform: scaleY(0);
          -webkit-transform: scaleY(0);
          transform-origin: bottom;
          -webkit-transform-origin: bottom;
          -webkit-animation: loginBarRise 900ms ease-out both;
          animation: loginBarRise 900ms ease-out both;
        }

        .login-page-wrapper .preview-bar-col:nth-child(1) .preview-bar {
          -webkit-animation-delay: 80ms;
          animation-delay: 80ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(2) .preview-bar {
          -webkit-animation-delay: 150ms;
          animation-delay: 150ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(3) .preview-bar {
          -webkit-animation-delay: 220ms;
          animation-delay: 220ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(4) .preview-bar {
          -webkit-animation-delay: 290ms;
          animation-delay: 290ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(5) .preview-bar.bar-target {
          -webkit-animation: loginBarRise 900ms ease-out 360ms both, targetBarGlow 3s ease-in-out 1.3s infinite;
          animation:
            loginBarRise 900ms ease-out 360ms both,
            targetBarGlow 3s ease-in-out 1.3s infinite;
        }

        .login-page-wrapper .preview-bar-col:nth-child(1) .bar-val-label,
        .login-page-wrapper .preview-bar-col:nth-child(1) .bar-name-label {
          -webkit-animation-delay: 180ms;
          animation-delay: 180ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(2) .bar-val-label,
        .login-page-wrapper .preview-bar-col:nth-child(2) .bar-name-label {
          -webkit-animation-delay: 250ms;
          animation-delay: 250ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(3) .bar-val-label,
        .login-page-wrapper .preview-bar-col:nth-child(3) .bar-name-label {
          -webkit-animation-delay: 320ms;
          animation-delay: 320ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(4) .bar-val-label,
        .login-page-wrapper .preview-bar-col:nth-child(4) .bar-name-label {
          -webkit-animation-delay: 390ms;
          animation-delay: 390ms;
        }

        .login-page-wrapper .preview-bar-col:nth-child(5) .bar-val-label,
        .login-page-wrapper .preview-bar-col:nth-child(5) .bar-name-label {
          -webkit-animation-delay: 460ms;
          animation-delay: 460ms;
        }

        @keyframes loginBarRise {
          from {
            transform: scaleY(0);
            opacity: 0.5;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @-webkit-keyframes loginBarRise {
          from { -webkit-transform: scaleY(0); transform: scaleY(0); opacity: 0.5; }
          to { -webkit-transform: scaleY(1); transform: scaleY(1); opacity: 1; }
        }

        @keyframes chartLabelReveal {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @-webkit-keyframes chartLabelReveal {
          from { opacity: 0; -webkit-transform: translateY(4px); transform: translateY(4px); }
          to { opacity: 1; -webkit-transform: translateY(0); transform: translateY(0); }
        }

        @keyframes chartGridFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @-webkit-keyframes chartGridFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes targetBarGlow {
          0%, 100% {
            box-shadow: 0 3px 9px rgba(76, 140, 228, 0.2);
          }
          50% {
            box-shadow: 0 4px 12px rgba(76, 140, 228, 0.3);
          }
        }

        @-webkit-keyframes targetBarGlow {
          0%, 100% { box-shadow: 0 3px 9px rgba(76, 140, 228, 0.2); }
          50% { box-shadow: 0 4px 12px rgba(76, 140, 228, 0.3); }
        }

        @keyframes heroCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @-webkit-keyframes heroCardFloat {
          0%, 100% { -webkit-transform: translateY(0); transform: translateY(0); }
          50% { -webkit-transform: translateY(-3px); transform: translateY(-3px); }
        }

        @keyframes heroPillFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @-webkit-keyframes heroPillFloat {
          0%, 100% { -webkit-transform: translateY(0); transform: translateY(0); }
          50% { -webkit-transform: translateY(-3px); transform: translateY(-3px); }
        }

        .login-page-wrapper .preview-floating-pill {
          right: -14px;
          bottom: -15px;
          padding: 7px 10px;
          border-radius: 8px;
          gap: 7px;
          -webkit-animation: heroPillFloat 4.5s ease-in-out 900ms infinite;
          animation: heroPillFloat 4.5s ease-in-out 900ms infinite;
        }

        .login-page-wrapper .preview-pill-icon {
          width: 22px;
          height: 22px;
          animation: none;
        }

        .login-page-wrapper .preview-pill-text {
          font-size: 0.58rem;
        }

        .login-page-wrapper .preview-pill-sub {
          font-size: 0.52rem;
        }

        .login-page-wrapper .sparkle-icon {
          opacity: 0.2;
          -webkit-animation: sparkleTwinkle 2.4s ease-in-out infinite;
          animation: sparkleTwinkle 2.4s ease-in-out infinite;
        }

        .login-page-wrapper .sparkle-2 {
          -webkit-animation-delay: 800ms;
          animation: sparkleTwinkle 2.4s ease-in-out 800ms infinite;
        }

        .login-page-wrapper .sparkle-3 {
          -webkit-animation-delay: 1.2s;
          animation: sparkleTwinkle 2.4s ease-in-out 1.2s infinite;
        }

        @keyframes sparkleTwinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.85) rotate(-8deg);
          }
          50% {
            opacity: 0.65;
            transform: scale(1) rotate(12deg);
          }
        }

        @-webkit-keyframes sparkleTwinkle {
          0%, 100% {
            opacity: 0.2;
            -webkit-transform: scale(0.85) rotate(-8deg);
            transform: scale(0.85) rotate(-8deg);
          }
          50% {
            opacity: 0.65;
            -webkit-transform: scale(1) rotate(12deg);
            transform: scale(1) rotate(12deg);
          }
        }

        .login-page-wrapper .login-checklist {
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
        }

        .login-page-wrapper .login-check-item {
          gap: 4px;
          padding: 0;
          border: 0;
          background: transparent;
          font-size: 0.56rem;
          font-weight: 500;
          opacity: 0;
          animation: authContentEnter 380ms ease-out both;
          backdrop-filter: none;
          transition: color 160ms ease, transform 160ms ease;
        }

        .login-page-wrapper .login-check-item:nth-child(1) {
          -webkit-animation-delay: 360ms;
          animation-delay: 360ms;
        }

        .login-page-wrapper .login-check-item:nth-child(2) {
          -webkit-animation-delay: 410ms;
          animation-delay: 410ms;
        }

        .login-page-wrapper .login-check-item:nth-child(3) {
          -webkit-animation-delay: 460ms;
          animation-delay: 460ms;
        }

        .login-page-wrapper .login-check-item:hover {
          background: transparent;
          border: 0;
          box-shadow: none;
          transform: translateY(-1px);
        }

        .login-page-wrapper .check-mark {
          opacity: 1;
          animation: none;
        }

        .login-page-wrapper .login-hero-footer {
          padding: 0;
          margin: 0;
          font-size: 0.52rem;
          letter-spacing: 1px;
          font-weight: 500;
          color: #777660;
        }

        .login-page-wrapper .login-form-panel {
          flex: 1 1 53%;
          padding: 70px 36px 60px;
          overflow: hidden;
          z-index: 1;
          background: #fff;
        }

        .login-page-wrapper .login-form-container {
          max-width: 240px;
          align-items: stretch;
          margin: auto 0;
        }

        .login-page-wrapper .login-form-container > .login-tab-switcher {
          animation: authContentEnter 380ms ease-out 100ms both;
        }

        .login-page-wrapper .login-form-meta,
        .login-page-wrapper .login-form-footer {
          position: absolute;
          right: 28px;
          left: 28px;
          display: flex;
          justify-content: space-between;
          color: #9aa1aa;
          font-size: 0.48rem;
          letter-spacing: 0.25px;
        }

        .login-page-wrapper .login-form-meta {
          top: 20px;
        }

        .login-page-wrapper .login-form-footer {
          bottom: 16px;
        }

        .login-page-wrapper .login-tab-switcher {
          gap: 16px;
          margin: 0 0 17px;
          padding: 0;
          border-bottom: 1px solid var(--auth-line);
          border-radius: 0;
          background: transparent;
        }

        .login-page-wrapper .login-tab-switcher::before {
          top: auto;
          bottom: -1px;
          left: 0;
          width: 34px;
          height: 2px;
          border-radius: 0;
          background: var(--auth-blue);
          box-shadow: none;
        }

        .login-page-wrapper .login-tab-switcher[data-active="register"]::before {
          transform: translateX(52px);
        }

        .login-page-wrapper .login-tab-btn {
          flex: none;
          width: auto;
          padding: 0 0 9px;
          color: #858c95;
          font-size: 0.68rem;
          font-weight: 500;
          text-align: left;
          -webkit-transition: color 180ms ease, opacity 180ms ease;
          transition: color 180ms ease, opacity 180ms ease;
        }

        .login-page-wrapper .login-tab-btn.active {
          color: var(--auth-blue);
        }

        .login-page-wrapper .login-form-overline,
        .login-page-wrapper .login-form-title,
        .login-page-wrapper .login-form-sub {
          -webkit-animation: authContentEnter 340ms ease-out both;
          animation: authContentEnter 340ms ease-out both;
        }

        .login-page-wrapper .login-form-overline {
          -webkit-animation-delay: 30ms;
          animation-delay: 30ms;
        }

        .login-page-wrapper .login-form-title {
          -webkit-animation-delay: 70ms;
          animation-delay: 70ms;
        }

        .login-page-wrapper .login-form-sub {
          -webkit-animation-delay: 110ms;
          animation-delay: 110ms;
        }

        .login-page-wrapper .login-form-overline {
          margin-bottom: 3px;
          color: var(--auth-blue);
          font-size: 0.55rem;
          letter-spacing: 1px;
          text-align: left;
        }

        .login-page-wrapper .login-form-title {
          margin-bottom: 4px;
          color: var(--auth-ink);
          font-size: 1.75rem;
          line-height: 1.1;
          text-align: left;
        }

        .login-page-wrapper .login-form-sub {
          margin: 0 0 16px;
          color: var(--auth-muted);
          font-size: 0.68rem;
          text-align: left;
        }

        .login-page-wrapper .role-select-section {
          margin-bottom: 10px;
        }

        .login-page-wrapper .role-select-label {
          margin-bottom: 5px;
          color: #606873;
          font-size: 0.65rem;
          font-weight: 500;
        }

        .login-page-wrapper .role-cards-grid {
          gap: 7px;
        }

        .login-page-wrapper .role-card-btn {
          min-width: 0;
          gap: 7px;
          padding: 7px;
          border: 1px solid var(--auth-line);
          border-radius: 5px;
          box-shadow: none;
          -webkit-transition: -webkit-transform 180ms ease, border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease;
        }

        .login-page-wrapper .role-card-btn:nth-child(1) {
          -webkit-animation: authContentEnter 360ms ease-out 160ms both;
          animation: authContentEnter 360ms ease-out 160ms both;
        }

        .login-page-wrapper .role-card-btn:nth-child(2) {
          -webkit-animation: authContentEnter 360ms ease-out 210ms both;
          animation: authContentEnter 360ms ease-out 210ms both;
        }

        .login-page-wrapper .role-card-btn.selected {
          transform: translateY(-1px);
        }

        .login-page-wrapper .role-card-btn:active {
          transform: translateY(0) scale(0.99);
        }

        @media (hover: hover) and (pointer: fine) {
          .login-page-wrapper .role-card-btn:hover {
            transform: translateY(-2px);
            border-color: var(--auth-blue);
            box-shadow: 0 4px 10px rgba(66, 100, 151, 0.12);
          }

          .login-page-wrapper .login-preview-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 11px 26px rgba(50, 66, 92, 0.13);
          }
        }

        .login-page-wrapper .role-card-btn.selected {
          border-color: var(--auth-blue);
          background: #f7f9fc;
        }

        .login-page-wrapper .role-icon-box {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          background: transparent;
          -webkit-transition: color 220ms ease, background-color 220ms ease, -webkit-transform 220ms ease;
          transition: color 220ms ease, background-color 220ms ease, transform 220ms ease;
        }

        .login-page-wrapper .role-icon-box svg {
          width: 14px;
          height: 14px;
        }

        .login-page-wrapper .role-card-btn.selected .role-icon-box {
          background: transparent;
          color: var(--auth-blue);
        }

        .login-page-wrapper .role-card-title {
          font-size: 0.63rem;
          font-weight: 500;
        }

        .login-page-wrapper .role-card-desc {
          font-size: 0.48rem;
        }

        .login-page-wrapper .role-radio-indicator {
          width: 12px;
          height: 12px;
          -webkit-transition: border-color 220ms ease, background-color 220ms ease, -webkit-transform 220ms ease;
          transition: border-color 220ms ease, background-color 220ms ease, transform 220ms ease;
        }

        .login-page-wrapper .role-radio-dot {
          width: 5px;
          height: 5px;
          -webkit-transition: -webkit-transform 220ms ease;
          transition: transform 220ms ease;
        }

        .login-page-wrapper .login-alerts-container {
          min-height: 0;
          max-height: none;
          margin: 0;
          overflow: visible;
        }

        .login-page-wrapper .login-alert-banner {
          margin: 0;
          font-size: 0.65rem;
          transition:
            opacity 240ms ease,
            visibility 240ms ease,
            padding 240ms ease,
            margin 240ms ease,
            max-height 300ms cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .login-page-wrapper .login-alert-banner.visible {
          margin: 0 0 8px;
          padding: 7px 9px;
        }

        .login-page-wrapper .login-form-group {
          margin-bottom: 10px;
          opacity: 1;
          -webkit-animation: authContentEnter 360ms ease-out both;
          animation: authContentEnter 360ms ease-out both;
        }

        .login-page-wrapper form > .login-form-group:nth-of-type(3) {
          -webkit-animation-delay: 360ms;
          animation-delay: 360ms;
        }

        .login-page-wrapper form > .login-form-group:nth-of-type(4) {
          -webkit-animation-delay: 430ms;
          animation-delay: 430ms;
        }

        .login-page-wrapper .login-form-label {
          margin-bottom: 4px;
          color: #606873;
          font-size: 0.62rem;
          font-weight: 500;
        }

        .login-page-wrapper .login-form-input {
          box-sizing: border-box;
          height: 34px;
          padding: 7px 10px;
          border: 1px solid var(--auth-line);
          border-radius: 5px;
          font-size: 0.65rem;
          box-shadow: none;
          -webkit-transition: border-color 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
          transition:
            border-color 220ms ease,
            box-shadow 220ms ease,
            background-color 220ms ease;
        }

        .login-page-wrapper .login-form-input:focus {
          border-color: var(--auth-blue);
          box-shadow: 0 0 0 2px rgba(66, 100, 151, 0.1);
        }

        .login-page-wrapper .password-toggle-btn {
          right: 9px;
          -webkit-transition: color 180ms ease, background-color 180ms ease, -webkit-transform 180ms ease;
          transition: color 180ms ease, background-color 180ms ease, transform 180ms ease;
        }

        .login-page-wrapper .password-toggle-btn:hover {
          transform: scale(1.06);
        }

        .login-page-wrapper .password-toggle-btn svg {
          width: 14px;
          height: 14px;
        }

        .login-page-wrapper .login-submit-btn {
          position: relative;
          justify-content: center;
          min-height: 34px;
          margin-top: 7px;
          padding: 8px 13px;
          border-radius: 20px;
          background: var(--auth-blue);
          box-shadow: none;
          font-size: 0.65rem;
          -webkit-transition: -webkit-transform 220ms ease, background-color 220ms ease, box-shadow 220ms ease;
          transition:
            transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
            background-color 220ms ease,
            box-shadow 220ms ease;
          -webkit-animation: authContentEnter 520ms ease-out 480ms both;
          animation: authContentEnter 520ms cubic-bezier(0.2, 0.7, 0.2, 1) 480ms both;
        }

        .login-page-wrapper .login-submit-btn span:last-child {
          position: absolute;
          right: 13px;
        }

        .login-page-wrapper .login-submit-btn:hover {
          transform: translateY(-2px);
          background: #355581;
          box-shadow: 0 4px 10px rgba(53, 85, 129, 0.18);
        }

        .login-page-wrapper .login-submit-btn:active {
          transform: translateY(0) scale(0.99);
          box-shadow: none;
        }

        .login-page-wrapper button:focus-visible,
        .login-page-wrapper input:focus-visible {
          outline: 2px solid rgba(66, 100, 151, 0.55);
          outline-offset: 3px;
        }

        .login-page-wrapper .login-link-btn {
          -webkit-transition: color 180ms ease;
          transition: color 180ms ease, text-decoration-color 180ms ease;
        }

        .login-page-wrapper .login-footer-links {
          gap: 12px;
          margin-top: 12px;
          font-size: 0.62rem;
          -webkit-animation: authContentEnter 360ms ease-out 300ms both;
          animation: authContentEnter 360ms ease-out 300ms both;
        }

        .login-page-wrapper .login-link-btn {
          color: var(--auth-blue);
          font-size: inherit;
          font-weight: 500;
        }

        .login-page-wrapper .login-switch-prompt {
          flex-wrap: wrap;
          gap: 4px;
          color: #858c95;
          font-size: 0.62rem;
        }

        .login-page-wrapper .login-demo-helper {
          margin-top: 14px;
          padding: 9px 0 0;
          border: 0;
          border-top: 1px solid var(--auth-line);
          border-radius: 0;
          background: transparent;
          font-size: 0.55rem;
          -webkit-animation: authContentEnter 360ms ease-out 340ms both;
          animation: authContentEnter 360ms ease-out 340ms both;
        }

        .login-page-wrapper .login-demo-helper code {
          padding: 0;
          background: transparent;
          font-size: inherit;
        }

        @media (max-width: 960px) {
          .login-page-wrapper {
            flex-direction: row;
          }

          .login-page-wrapper .login-hero-panel {
            flex: 0 0 44%;
            padding: 22px 24px;
          }

          .login-page-wrapper .login-hero-content {
            width: 100%;
            top: 0;
          }

          .login-page-wrapper .login-preview-card-container {
            width: min(410px, 92%);
            margin-top: 24px;
          }

          .login-page-wrapper .login-hero-title {
            font-size: clamp(1.75rem, 3.8vw, 2.5rem);
          }

          .login-page-wrapper .login-form-panel {
            flex: 1 1 56%;
            padding-right: 28px;
            padding-left: 28px;
          }
        }

        @media (max-width: 680px) {
          .login-page-wrapper {
            min-height: 100vh;
            height: auto;
            overflow: auto;
          }

          .login-page-wrapper .login-hero-panel {
            display: none;
          }

          .login-page-wrapper .login-form-panel {
            flex: 1 1 auto;
            min-height: 100vh;
            padding: 70px 24px 58px;
            overflow: visible;
          }

          .login-page-wrapper .login-form-container {
            width: 100%;
            max-width: 420px;
          }

          .login-page-wrapper .login-tab-btn {
            font-size: 0.82rem;
          }

          .login-page-wrapper .login-form-overline {
            font-size: 0.65rem;
          }

          .login-page-wrapper .login-form-title {
            font-size: 2rem;
          }

          .login-page-wrapper .login-form-sub {
            font-size: 0.85rem;
          }

          .login-page-wrapper .role-select-label,
          .login-page-wrapper .login-form-label {
            font-size: 0.78rem;
          }

          .login-page-wrapper .role-card-title {
            font-size: 0.78rem;
          }

          .login-page-wrapper .login-form-meta,
          .login-page-wrapper .login-form-footer {
            right: 18px;
            left: 18px;
            font-size: 0.5rem;
          }

          .login-page-wrapper .role-card-desc {
            font-size: 0.65rem;
          }

          .login-page-wrapper .login-form-input {
            font-size: 0.85rem;
          }

          .login-page-wrapper .login-submit-btn,
          .login-page-wrapper .login-footer-links,
          .login-page-wrapper .login-switch-prompt {
            font-size: 0.8rem;
          }

          .login-page-wrapper .login-demo-helper {
            font-size: 0.7rem;
          }
        }

      `}</style>
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
              <div className="preview-floating-pill" style={{ pointerEvents: 'none' }}>
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
        <div className="login-form-meta">
          <span aria-hidden="true">YOUR ACADEMIC GUIDE</span>
          <span>CompUGrade · 2026</span>
        </div>
        <div className="login-form-container">
          {/* Top Switcher Tabs */}
          <div className="login-tab-switcher" data-active={activeTab}>
            <button
              type="button"
              className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
                setInfoMessage('');
              }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`login-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('register');
                setInfoMessage('Create a student account with your email and a password.');
              }}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="login-form-overline" key={`overline-${activeTab}`}>Good to see you again</div>
          <h2 className="login-form-title" key={`title-${activeTab}`}>
            {activeTab === 'login' ? 'Welcome back.' : 'Create your account.'}
          </h2>
          <p className="login-form-sub" key={`subtitle-${activeTab}`}>
            {activeTab === 'login'
              ? 'Your grades, goals, and next steps are waiting.'
              : 'Join CompUGrade to calculate and achieve your target grades.'}
          </p>

          <form key={activeTab} onSubmit={handleSubmit} style={{ width: '100%' }}>
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

            {/* Error & Info Alerts - Always render to reserve space, prevent layout shift */}
            <div className="login-alerts-container">
              <div className={`login-alert-banner login-alert-warning ${errorMessage ? 'visible' : ''}`} role="alert" aria-live="polite">
                {errorMessage}
              </div>
              <div className={`login-alert-banner login-alert-info ${infoMessage ? 'visible' : ''}`} role="status" aria-live="polite">
                {infoMessage}
              </div>
            </div>

            {/* Email / ID Field */}
            <div className="login-form-group">
              <label htmlFor="identifier-input" className="login-form-label">
                {activeTab === 'login' ? 'Email or Student ID' : 'Email'}
              </label>
              <input
                id="identifier-input"
                type="text"
                className="login-form-input"
                placeholder={activeTab === 'login' ? 'you@university.edu or U1' : 'you@university.edu'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete={activeTab === 'register' ? 'email' : 'username'}
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
                  autoComplete={activeTab === 'register' ? 'new-password' : 'current-password'}
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
          <div className="login-footer-links" key={`footer-links-${activeTab}`}>
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
            <strong>Demo student:</strong> <code>ysa@student.edu</code> (or <code>U1</code>) · Password: <code>password123</code>
          </div>
        </div>
        <div className="login-form-footer" aria-hidden="true">
          <span>A clearer path. A stronger semester.</span>
          <span>© 2026 CompUGrade</span>
        </div>
      </section>
    </div>
  );
}