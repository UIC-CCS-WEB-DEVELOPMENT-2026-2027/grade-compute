import { useEffect, useState } from 'react';
import {
  hasLocalPassword,
  loadLocalAccount,
  saveLocalAccount,
  saveLocalPassword,
  saveLocalLoginSessions,
  verifyLocalPassword,
} from '../utils/localAccountStore';
import {
  createPrototypeChallenge,
  getVerifiedMethods,
  verifyPrototypeChallenge,
} from '../utils/prototypeVerification';
import './GlobalSettings.css';

const sidebarItems = [
  { label: 'Profile', icon: 'profile' },
  { label: 'Account', icon: 'account' },
  { label: 'Security', icon: 'security' },
  { label: 'Notifications', icon: 'notifications' },
  { label: 'Appearance', icon: 'appearance' },
  { label: 'Account Actions', icon: 'actions' },
];

function SettingsIcon({ name }) {
  const iconPaths = {
    profile: <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" /></>,
    account: <><rect x="4" y="5" width="16" height="14" rx="3" /><circle cx="9" cy="11" r="2" /><path d="M6.5 16a3 3 0 0 1 5 0M14 10h3M14 14h3" /></>,
    security: <><path d="M12 3.5 19 6v5.2c0 4.4-3 7.6-7 9.3-4-1.7-7-4.9-7-9.3V6l7-2.5Z" /><path d="m9.5 12 1.7 1.7 3.5-3.7" /></>,
    privacy: <><path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" /><circle cx="12" cy="12" r="2" /><path d="m4 4 16 16" /></>,
    notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 9h17C20.5 16 18 16 18 9ZM10 21h4" /></>,
    appearance: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M4.7 4.7l1.4 1.4m11.8 11.8 1.4 1.4M2.5 12h2m15 0h2M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4" /></>,
    actions: <><path d="M5 7h14M5 12h14M5 17h14" /><circle cx="9" cy="7" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="11" cy="17" r="1.5" /></>,
  };

  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function GlobalSettings({ onLogout }) {
  const [activeSection, setActiveSection] = useState('Profile');
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfile] = useState(loadLocalAccount);
  const [selectedImage, setSelectedImage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [currentPasswordStatus, setCurrentPasswordStatus] = useState('idle');
  const [passwordIsSet, setPasswordIsSet] = useState(false);
  const [securityView, setSecurityView] = useState('overview');
  const [passwordStep, setPasswordStep] = useState('current');
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [verificationChallenge, setVerificationChallenge] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [confirmCurrentLogout, setConfirmCurrentLogout] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [helpDialog, setHelpDialog] = useState(null);
  const [notifications, setNotifications] = useState({
    email: true,
    system: true,
    assignments: true,
  });
  useEffect(() => {
    setPasswordIsSet(hasLocalPassword());
  }, []);

  useEffect(() => {
    saveLocalAccount(profile);
  }, [profile]);

  const updateStatus = (message) => {
    setStatusMessage(message);
    window.clearTimeout(updateStatus.timeoutId);
    updateStatus.timeoutId = window.setTimeout(() => setStatusMessage(''), 2400);
  };

  const handleAccountInput = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      updateStatus('Please choose a JPG, JPEG, or PNG image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfilePicture = () => {
    if (!selectedImage) {
      updateStatus('Choose an image first.');
      return;
    }

    setProfile((prev) => ({ ...prev, profilePicture: selectedImage }));
    updateStatus('Profile picture saved.');
  };

  const saveAccountChanges = () => {
    saveLocalAccount(profile);
    updateStatus('Account details updated.');
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordInput = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'current') setCurrentPasswordStatus('idle');
  };

  const validateCurrentPassword = async () => {
    if (!passwordForm.current) {
      setCurrentPasswordStatus('idle');
      return;
    }

    setCurrentPasswordStatus('checking');
    try {
      const isValid = await verifyLocalPassword(passwordForm.current);
      setCurrentPasswordStatus(isValid ? 'valid' : 'invalid');
    } catch {
      setCurrentPasswordStatus('error');
    }
  };

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const continuePasswordChange = async (event) => {
    event.preventDefault();
    setSecurityError('');
    if (passwordForm.next.length < 8) {
      setSecurityError('Your new password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setSecurityError('The new passwords do not match.');
      return;
    }

    try {
      if (passwordIsSet && await verifyLocalPassword(passwordForm.next)) {
        setSecurityError('Your new password must be different from your current password.');
        return;
      }
      setPasswordStep('verification');
    } catch {
      setSecurityError('Could not validate your new password. Please try again.');
    }
  };

  const continueFromCurrentPassword = async (event) => {
    event.preventDefault();
    setSecurityError('');
    setCurrentPasswordStatus('checking');
    try {
      const isValid = await verifyLocalPassword(passwordForm.current);
      setCurrentPasswordStatus(isValid ? 'valid' : 'invalid');
      if (!isValid) {
        setSecurityError('Current password is incorrect.');
        return;
      }
      setPasswordStep('new');
    } catch {
      setCurrentPasswordStatus('error');
      setSecurityError('Could not verify your current password. Please try again.');
    }
  };

  const sendSecurityVerification = () => {
    try {
      const challenge = createPrototypeChallenge(verificationMethod);
      setVerificationChallenge(challenge);
      setVerificationCode('');
      setVerificationFeedback('');
      setSecurityError('');
    } catch {
      setSecurityError('Could not create a verification code. Please try again.');
    }
  };

  const completePasswordChange = async (event) => {
    event.preventDefault();
    setSecurityError('');
    if (!verificationChallenge) {
      setSecurityError('Request a verification code first.');
      return;
    }
    if (!verifyPrototypeChallenge(verificationChallenge.id, verificationCode.trim())) {
      setSecurityError('That verification code is incorrect or expired. Request a new code.');
      setVerificationFeedback('');
      setVerificationChallenge(null);
      return;
    }

    try {
      await saveLocalPassword(passwordForm.next);
      setPasswordIsSet(true);
      setPasswordStep('success');
      setVerificationFeedback('Your password was changed successfully.');
      setPasswordForm({ current: '', next: '', confirm: '' });
      setVisiblePasswords({});
      setCurrentPasswordStatus('idle');
      setVerificationChallenge(null);
    } catch {
      setSecurityError('The password could not be updated. Please try again.');
    }
  };

  const beginPasswordFlow = () => {
    setSecurityView('password');
    setPasswordStep(passwordIsSet ? 'current' : 'new');
    setPasswordForm({ current: '', next: '', confirm: '' });
    setVisiblePasswords({});
    setSecurityError('');
    setVerificationFeedback('');
    setVerificationChallenge(null);
    setCurrentPasswordStatus('idle');
  };

  const startTwoFactorEnable = () => {
    const methods = getVerifiedMethods(profile);
    if (!methods.length) {
      setSecurityError('Add and verify an email address or phone number before enabling two-factor authentication.');
      return;
    }
    setVerificationMethod(methods[0].id);
    setVerificationChallenge(null);
    setVerificationCode('');
    setVerificationFeedback('');
    setSecurityError('');
    setSecurityView('twoFactor');
  };

  const finishTwoFactorEnable = (event) => {
    event.preventDefault();
    if (!verificationChallenge || !verifyPrototypeChallenge(verificationChallenge.id, verificationCode.trim())) {
      setSecurityError('That verification code is incorrect or expired. Request a new code.');
      setVerificationChallenge(null);
      return;
    }
    const updatedAccount = { ...profile, twoFactorEnabled: true };
    setProfile(updatedAccount);
    setVerificationFeedback('Two-factor authentication is now enabled.');
    setVerificationChallenge(null);
    setVerificationCode('');
    setSecurityError('');
  };

  const disableTwoFactor = () => {
    const updatedAccount = { ...profile, twoFactorEnabled: false };
    setProfile(updatedAccount);
    setSecurityView('twoFactor');
    setSecurityError('');
  };

  const updateSessions = (sessions) => {
    saveLocalLoginSessions(sessions);
    setProfile((prev) => ({ ...prev, loginSessions: sessions }));
  };

  const logoutSession = (session) => {
    const updatedSessions = profile.loginSessions.map((item) =>
      item.id === session.id ? { ...item, isActive: false, lastActive: 'Signed out' } : item
    );
    updateSessions(updatedSessions);
    setSessionDetails(null);
    setConfirmCurrentLogout(false);
  };

  const logoutAllOtherSessions = () => {
    const updatedSessions = profile.loginSessions.map((session) =>
      session.isCurrent ? session : { ...session, isActive: false, lastActive: 'Signed out' }
    );
    updateSessions(updatedSessions);
    setConfirmLogoutAll(false);
    setSessionDetails(null);
  };

  const handleSettingRowClick = (event) => {
    if (event.target.closest('button, select, input, textarea, a, label')) return;

    const row = event.target.closest('.simple-row, .danger-box:not(.destructive)');
    const control = row?.querySelector('button, select');
    control?.click();
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout?.();
  };

  const profileInitials = profile.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderProfileSection = () => (
    <div className="settings-panel" onClick={handleSettingRowClick}>
      <div className="profile-overview">
        <div className="profile-avatar-wrap">
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt="Profile" className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-placeholder">{profileInitials}</div>
          )}
        </div>

        <div className="profile-info-block">
          <h3>{profile.fullName}</h3>
          <p>@{profile.username}</p>
          <span className="student-badge">Student</span>
        </div>
      </div>

      <div className="profile-summary-grid">
        <div className="summary-card">
          <span className="summary-label">Student ID</span>
          <strong>{profile.studentId}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Program</span>
          <strong>{profile.program}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Year level</span>
          <strong>{profile.yearLevel}</strong>
        </div>
      </div>

      <div className="bio-box">
        <h4>Short bio</h4>
        <p>{profile.bio}</p>
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className="settings-panel" onClick={handleSettingRowClick}>
      <div className="account-header-row">
        <div>
          <h3>Account details</h3>
          <p>Update the information connected to your CompuGrade account.</p>
        </div>
      </div>

      <div className="profile-photo-box">
        <div className="photo-preview-wrap">
          {selectedImage || profile.profilePicture ? (
            <img src={selectedImage || profile.profilePicture} alt="Current profile preview" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">{profileInitials}</div>
          )}
        </div>

        <div className="photo-controls">
          <label className="upload-button">
            <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageSelect} />
            Choose photo
          </label>
          <button type="button" className="secondary-button" onClick={saveProfilePicture}>
            Save photo
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Full name</span>
          <input
            type="text"
            name="fullName"
            value={profile.fullName}
            onChange={handleAccountInput}
          />
        </label>

        <label className="field">
          <span>Student ID</span>
          <input
            type="text"
            name="studentId"
            value={profile.studentId}
            onChange={handleAccountInput}
          />
        </label>

        <label className="field">
          <span>Program / Course</span>
          <input
            type="text"
            name="program"
            value={profile.program}
            onChange={handleAccountInput}
          />
        </label>

        <label className="field">
          <span>Year level</span>
          <input
            type="text"
            name="yearLevel"
            value={profile.yearLevel}
            onChange={handleAccountInput}
          />
        </label>

        <label className="field full-width">
          <span>Short bio</span>
          <textarea
            name="bio"
            rows="4"
            value={profile.bio}
            onChange={handleAccountInput}
          />
        </label>

        <label className="field">
          <span>Email address</span>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleAccountInput}
          />
        </label>

        <label className="field">
          <span>Username</span>
          <input
            type="text"
            name="username"
            value={profile.username}
            onChange={handleAccountInput}
          />
        </label>

      </div>

      <div className="action-row">
        <button type="button" className="primary-button" onClick={saveAccountChanges}>
          Save changes
        </button>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="settings-panel security-panel">
      {securityView === 'overview' && (
        <>
          <button type="button" className="security-row" onClick={beginPasswordFlow}>
            <SettingsIcon name="security" />
            <span className="security-row-copy">
              <strong>Password</strong>
              <span>Change your password securely</span>
            </span>
            <span className="security-arrow" aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            className="security-row"
            onClick={() => {
              setSecurityError('');
              setVerificationFeedback('');
              setSecurityView('twoFactor');
            }}
          >
            <SettingsIcon name="privacy" />
            <span className="security-row-copy">
              <strong>Two-Factor Authentication</strong>
              <span>Protect your account with an additional verification method</span>
            </span>
            <span className="security-arrow" aria-hidden="true">›</span>
          </button>
          <button type="button" className="security-row" onClick={() => setSecurityView('sessions')}>
            <SettingsIcon name="account" />
            <span className="security-row-copy">
              <strong>Login Activity</strong>
              <span>Review where your account is currently signed in</span>
            </span>
            <span className="security-arrow" aria-hidden="true">›</span>
          </button>
          <p className="security-prototype-note">
            Password, verification, and session data are simulated in this browser prototype. Production authentication requires a backend.
          </p>
        </>
      )}

      {securityView !== 'overview' && (
        <div className="security-subview">
          <button type="button" className="back-link" onClick={() => {
            setSecurityView('overview');
            setSecurityError('');
            setVerificationFeedback('');
          }}>
            ‹ Security
          </button>

          {securityView === 'password' && (
            <>
              <h3 className="security-subtitle">Password</h3>
              {passwordStep === 'current' && (
                <form className="password-form" onSubmit={continueFromCurrentPassword}>
                  <p className="password-form-heading">Confirm your current password to continue.</p>
                  <div className="field password-field">
                    <label htmlFor="current-password">Current password</label>
                    <input
                      id="current-password"
                      type={visiblePasswords.current ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={passwordForm.current}
                      onChange={(event) => {
                        setPasswordForm((prev) => ({ ...prev, current: event.target.value }));
                        setCurrentPasswordStatus('idle');
                      }}
                      onBlur={validateCurrentPassword}
                      required
                    />
                    <button type="button" className="password-visibility" onClick={() => togglePasswordVisibility('current')}>
                      {visiblePasswords.current ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {currentPasswordStatus === 'valid' && <p className="password-validation valid">Current password is correct.</p>}
                  {securityError && <p className="security-error" role="alert">{securityError}</p>}
                  <button type="submit" className="primary-button password-submit">Continue</button>
                </form>
              )}

              {passwordStep === 'new' && (
                <form className="password-form" onSubmit={continuePasswordChange}>
                  <p className="password-form-heading">Choose a new password</p>
                  {['next', 'confirm'].map((field) => (
                    <div className="field password-field" key={field}>
                      <label htmlFor={`${field}-password`}>{field === 'next' ? 'New password' : 'Confirm new password'}</label>
                      <input
                        id={`${field}-password`}
                        type={visiblePasswords[field] ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordForm[field]}
                        minLength={8}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }))}
                        required
                      />
                      <button type="button" className="password-visibility" onClick={() => togglePasswordVisibility(field)}>
                        {visiblePasswords[field] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  ))}
                  {securityError && <p className="security-error" role="alert">{securityError}</p>}
                  <button type="submit" className="primary-button password-submit">Continue to verification</button>
                </form>
              )}

              {passwordStep === 'verification' && (
                <form className="password-form" onSubmit={completePasswordChange}>
                  <div className="password-form-heading">
                    <h3>Verify it's you</h3>
                    <p>We prepared a simulated verification code for your verified contact. No email or SMS was sent.</p>
                  </div>
                  <div className="verification-methods">
                    {getVerifiedMethods(profile).map((method) => (
                      <label key={method.id}>
                        <input
                          type="radio"
                          name="password-verification-method"
                          value={method.id}
                          checked={verificationMethod === method.id}
                          onChange={() => {
                            setVerificationMethod(method.id);
                            setVerificationChallenge(null);
                            setVerificationFeedback('');
                          }}
                        />
                        <span>{method.label} · {method.masked}</span>
                      </label>
                    ))}
                  </div>
                  {getVerifiedMethods(profile).length === 0 && (
                    <p className="security-error">Add a verified email or phone number to your account before changing your password.</p>
                  )}
                  <button type="button" className="secondary-button" onClick={sendSecurityVerification} disabled={!getVerifiedMethods(profile).length}>
                    Generate prototype code
                  </button>
                  {verificationChallenge && (
                    <>
                      <p className="prototype-code">Prototype code (not sent): <strong>{verificationChallenge.code}</strong></p>
                      <label className="field">
                        <span>Verification code</span>
                        <input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </label>
                      <button type="submit" className="primary-button password-submit">Verify and change password</button>
                    </>
                  )}
                  {securityError && <p className="security-error" role="alert">{securityError}</p>}
                </form>
              )}

              {passwordStep === 'success' && (
                <div className="security-success">
                  <h3>Password changed</h3>
                  <p>{verificationFeedback} Login verification can use the same local account store.</p>
                  <button type="button" className="primary-button" onClick={() => setSecurityView('overview')}>Done</button>
                </div>
              )}
              <p className="password-note">This frontend prototype stores a salted password hash locally. It is not production authentication.</p>
            </>
          )}

          {securityView === 'twoFactor' && (
            <div className="two-factor-view">
              <div className="two-factor-heading">
                <div>
                  <h3 className="security-subtitle">Two-Factor Authentication</h3>
                  <p>{profile.twoFactorEnabled ? 'An additional verification step is enabled.' : 'Add a verification step when signing in.'}</p>
                </div>
                {profile.twoFactorEnabled ? (
                  <button type="button" className="danger-button" onClick={() => setConfirmCurrentLogout(true)}>Turn off</button>
                ) : (
                  <button type="button" className="primary-button" onClick={startTwoFactorEnable}>Turn on</button>
                )}
              </div>
              <h4>Verification Methods</h4>
              {getVerifiedMethods(profile).map((method) => (
                <div className="verified-method" key={method.id}>
                  <div><strong>{method.label}</strong><span>{method.masked}</span></div>
                  <span className="method-enabled">Enabled</span>
                </div>
              ))}
              {!getVerifiedMethods(profile).length && <p className="password-note">No verified email or phone is available yet.</p>}
              {verificationFeedback && <p className="security-success-message">{verificationFeedback}</p>}
              {!profile.twoFactorEnabled && getVerifiedMethods(profile).length > 0 && (
                <div className="verification-setup">
                  <p>To enable 2FA, verify one of your contacts. No real message will be sent.</p>
                  <div className="verification-methods">
                    {getVerifiedMethods(profile).map((method) => (
                      <label key={method.id}>
                        <input type="radio" name="2fa-method" value={method.id} checked={verificationMethod === method.id} onChange={() => setVerificationMethod(method.id)} />
                        <span>{method.label} · {method.masked}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" className="secondary-button" onClick={() => {
                    const challenge = createPrototypeChallenge(verificationMethod);
                    setVerificationChallenge(challenge);
                    setVerificationCode('');
                    setSecurityError('');
                  }}>Generate prototype code</button>
                  {verificationChallenge && (
                    <form className="verification-code-form" onSubmit={finishTwoFactorEnable}>
                      <p className="prototype-code">Prototype code (not sent): <strong>{verificationChallenge.code}</strong></p>
                      <label className="field"><span>Verification code</span><input inputMode="numeric" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))} required /></label>
                      <button className="primary-button" type="submit">Verify and enable</button>
                    </form>
                  )}
                  {securityError && <p className="security-error" role="alert">{securityError}</p>}
                </div>
              )}
              {confirmCurrentLogout && (
                <div className="confirmation-panel">
                  <p>Turning off two-factor authentication reduces account security. Continue?</p>
                  <button type="button" className="secondary-button" onClick={() => setConfirmCurrentLogout(false)}>Cancel</button>
                  <button type="button" className="danger-button" onClick={disableTwoFactor}>Turn off 2FA</button>
                </div>
              )}
            </div>
          )}

          {securityView === 'sessions' && (
            <div className="sessions-view">
              <div className="sessions-heading">
                <div>
                  <h3 className="security-subtitle">Login Activity</h3>
                  <p>Review sessions simulated for this browser prototype.</p>
                </div>
                <button type="button" className="secondary-button" onClick={() => setConfirmLogoutAll(true)}>Log Out All Other Sessions</button>
              </div>
              {profile.loginSessions.map((session) => (
                <button type="button" className="session-row" key={session.id} onClick={() => setSessionDetails(session)}>
                  <SettingsIcon name="account" />
                  <span className="security-row-copy">
                    <strong>{session.isCurrent ? 'Current Session' : 'Previous Session'} · {session.device} • {session.browser}</strong>
                    <span>{session.location} · {session.lastActive}</span>
                  </span>
                  {session.isActive && <span className={session.isCurrent ? 'session-active' : 'session-other'}>{session.isCurrent ? 'Active now' : 'Active'}</span>}
                  <span className="security-arrow" aria-hidden="true">›</span>
                </button>
              ))}
              {!profile.loginSessions.length && <p className="password-note">No session records are available.</p>}
            </div>
          )}
        </div>
      )}

      {sessionDetails && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSessionDetails(null)}>
          <section className="session-modal" role="dialog" aria-modal="true" aria-labelledby="session-modal-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="session-modal-title">{sessionDetails.isCurrent ? 'Current Session' : 'Session Details'}</h3>
            <dl>
              <dt>Device</dt><dd>{sessionDetails.device}</dd>
              <dt>Browser</dt><dd>{sessionDetails.browser}</dd>
              <dt>Location</dt><dd>{sessionDetails.location}</dd>
              <dt>Last active</dt><dd>{sessionDetails.lastActive}</dd>
              <dt>Login date</dt><dd>{sessionDetails.loginDate}</dd>
            </dl>
            {sessionDetails.isCurrent && confirmCurrentLogout && (
              <p className="security-error">Logging out the current simulated session will end this prototype session. Continue?</p>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => {
                setSessionDetails(null);
                setConfirmCurrentLogout(false);
              }}>Close</button>
              {sessionDetails.isCurrent ? (
                confirmCurrentLogout
                  ? <button type="button" className="danger-button" onClick={() => logoutSession(sessionDetails)}>Confirm Log Out</button>
                  : <button type="button" className="danger-button" onClick={() => setConfirmCurrentLogout(true)}>Log Out</button>
              ) : sessionDetails.isActive && (
                <button type="button" className="danger-button" onClick={() => logoutSession(sessionDetails)}>Log Out</button>
              )}
            </div>
          </section>
        </div>
      )}

      {confirmLogoutAll && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmLogoutAll(false)}>
          <section className="session-modal" role="dialog" aria-modal="true" aria-labelledby="logout-all-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="logout-all-title">Log Out All Other Sessions?</h3>
            <p>Other simulated active sessions will be marked as signed out. Your current session will remain active.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmLogoutAll(false)}>Cancel</button>
              <button type="button" className="danger-button" onClick={logoutAllOtherSessions}>Log Out All Other Sessions</button>
            </div>
          </section>
        </div>
      )}

      {helpDialog && (
        <div className="modal-backdrop" role="presentation" onClick={() => setHelpDialog(null)}>
          <section
            className="session-modal help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Close help"
              onClick={() => setHelpDialog(null)}
            >
              ×
            </button>
            <div className="help-tabs" role="tablist" aria-label="Help topics">
              <button
                type="button"
                role="tab"
                aria-selected={helpDialog === 'support'}
                className={helpDialog === 'support' ? 'help-tab active' : 'help-tab'}
                onClick={() => setHelpDialog('support')}
              >
                Student support
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={helpDialog === 'guide'}
                className={helpDialog === 'guide' ? 'help-tab active' : 'help-tab'}
                onClick={() => setHelpDialog('guide')}
              >
                Quick reference
              </button>
            </div>
            {helpDialog === 'support' ? (
              <>
                <p className="eyebrow">COMPUGRADE HELP</p>
                <h3 id="help-dialog-title">Student support</h3>
                <p>Try these steps if something is not working as expected:</p>
                <ol className="help-steps">
                  <li>Refresh the page and sign in again if your session has expired.</li>
                  <li>Check your course and assignment details before submitting work.</li>
                  <li>If grades or course information look incorrect, contact your instructor or your school’s designated support team.</li>
                </ol>
                <p className="password-note">This prototype does not have a connected help desk or support contact.</p>
              </>
            ) : (
              <>
                <p className="eyebrow">STUDENT GUIDE</p>
                <h3 id="help-dialog-title">Quick reference</h3>
                <div className="guide-topic">
                  <strong>Find your courses</strong>
                  <p>Open your student dashboard and choose a course to view its subjects and details.</p>
                </div>
                <div className="guide-topic">
                  <strong>Track grades</strong>
                  <p>Open the relevant course or subject page to review available grade information.</p>
                </div>
                <div className="guide-topic">
                  <strong>Submit assignments</strong>
                  <p>Review the assignment instructions and deadline in your course before submitting your work.</p>
                </div>
              </>
            )}
            <div className="modal-actions">
              <button type="button" className="primary-button" onClick={() => setHelpDialog(null)}>Done</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-panel" onClick={handleSettingRowClick}>
      <div className="simple-row">
        <div>
          <h4>Email notifications</h4>
          <p>Receive important updates through email.</p>
        </div>
        <button
          type="button"
          className={notifications.email ? 'toggle-button on' : 'toggle-button'}
          onClick={() => toggleNotification('email')}
        >
          {notifications.email ? 'On' : 'Off'}
        </button>
      </div>

      <div className="simple-row">
        <div>
          <h4>Important system notifications</h4>
          <p>Platform alerts for deadlines, outages, and account changes.</p>
        </div>
        <button
          type="button"
          className={notifications.system ? 'toggle-button on' : 'toggle-button'}
          onClick={() => toggleNotification('system')}
        >
          {notifications.system ? 'On' : 'Off'}
        </button>
      </div>

      <div className="simple-row">
        <div>
          <h4>Assignment and grade notifications</h4>
          <p>Get reminded when tasks are graded or submitted.</p>
        </div>
        <button
          type="button"
          className={notifications.assignments ? 'toggle-button on' : 'toggle-button'}
          onClick={() => toggleNotification('assignments')}
        >
          {notifications.assignments ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="settings-panel" onClick={handleSettingRowClick}>
      <div className="simple-row">
        <div>
          <h4>Interface theme</h4>
          <p>Switch between light and dark interface mode for your viewing preference.</p>
        </div>
        <button
          type="button"
          className="toggle-button on"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? 'Dark' : 'Light'}
        </button>
      </div>

    </div>
  );

  const renderActionsSection = () => (
    <div className="settings-panel">
      <div className="danger-box">
        <div>
          <h4>Download account data</h4>
          <p>Export your profile and academic information for review.</p>
        </div>
        <button type="button" className="secondary-button">
          Download
        </button>
      </div>

      <div className="danger-box">
        <div>
          <h4>Clear local preferences</h4>
          <p>Reset stored browser settings for this prototype.</p>
        </div>
        <button type="button" className="secondary-button">
          Clear
        </button>
      </div>

      <div className="danger-box destructive">
        <div>
          <h4>Log out</h4>
          <p>Sign out of your CompuGrade account.</p>
        </div>
        <button type="button" className="danger-button" onClick={() => setShowLogoutConfirm(true)}>
          Log Out
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="delete-confirmation">
          <p>Are you sure you want to log out?</p>
          <div className="confirm-actions">
            <button type="button" className="secondary-button" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </button>
            <button type="button" className="danger-button" onClick={confirmLogout}>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'Profile':
        return renderProfileSection();
      case 'Account':
        return renderAccountSection();
      case 'Security':
        return renderSecuritySection();
      case 'Notifications':
        return renderNotificationsSection();
      case 'Appearance':
        return renderAppearanceSection();
      case 'Account Actions':
        return renderActionsSection();
      default:
        return null;
    }
  };

  return (
    <div className={darkMode ? 'global-settings dark' : 'global-settings'}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-icon" aria-hidden="true">C</div>
          <div className="brand-name">CompuGrade</div>
        </div>

        <div className="workspace-box">
          <span>Workspace</span>
          <strong>Student</strong>
        </div>

        <nav className="menu" aria-label="Global settings navigation">
          <p className="menu-label">SETTINGS</p>
          {sidebarItems.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              className={activeSection === label ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveSection(label)}
              aria-current={activeSection === label ? 'page' : undefined}
            >
              <SettingsIcon name={icon} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="help-button" onClick={() => setHelpDialog('support')}>
          <span className="help-mark" aria-hidden="true">?</span>
          <span>Help &amp; Resources</span>
        </button>
      </aside>

      <main className="content-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h1>Settings</h1>
          </div>
        </header>

        <section className="main-card">
          <div className="section-header-row">
            <div>
              <h2>{activeSection}</h2>
            </div>
          </div>

          <p className="section-description">
            {activeSection === 'Profile' && 'Read-only details for your academic identity.'}
            {activeSection === 'Account' && 'Manage your personal account information and profile picture settings.'}
            {activeSection === 'Security' && 'Protect your account with password, verification, and session controls.'}
            {activeSection === 'Notifications' && 'Choose which alerts and updates you want to receive.'}
            {activeSection === 'Appearance' && 'Choose the look and feel that works best for you.'}
            {activeSection === 'Account Actions' && 'Review account data and take higher-risk actions carefully.'}
          </p>

          {renderSectionContent()}

          {statusMessage && <div className="status-message">{statusMessage}</div>}
        </section>
      </main>
    </div>
  );
}

export default GlobalSettings;