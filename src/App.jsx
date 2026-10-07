import { useState } from 'react';
import GlobalSettings from './pages/GlobalSettings';
import LoginRegister from './pages/auth/LoginRegister';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <LoginRegister onAuthenticated={() => setShowLogin(false)} />;
  }

  return <GlobalSettings onLogout={() => setShowLogin(true)} />;
}

export default App;
