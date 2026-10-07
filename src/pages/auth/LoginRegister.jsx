import Sidebar from '../../components/shared/Sidebar';
import { useState } from 'react';
import { authenticateLocalAccount } from '../../utils/localAccountStore';

export default function LoginRegister({ onAuthenticated }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const isAuthenticated = await authenticateLocalAccount(identifier, password);
      if (isAuthenticated) {
        setMessage('Prototype credentials verified.');
        onAuthenticated?.();
      } else {
        setMessage('The username, email, or password is incorrect.');
      }
    } catch {
      setMessage('Could not verify your credentials. Please try again.');
    }
  };

  return (
    <div className="container flex-col align-center mt-5">
      <Sidebar /> {/* REMOVE THIS LATER, USED FOR NAVIGATION */}
      <h1>CompUGrade Login</h1>
      <form className="password-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email or username</span>
          <input
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </label>
        <div className="field password-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className="password-visibility"
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <button type="submit" className="primary-button">Sign in</button>
        {message && <p role="status">{message}</p>}
        <p className="password-note">
          Frontend prototype only. Credentials are checked against the local CompuGrade account store.
        </p>
      </form>
    </div>
  );
}