import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Login from './Login.jsx'

function Root() {
  const [userEmail, setUserEmail] = useState(() => sessionStorage.getItem("ss_email") || "");

  const handleLogin = (email) => {
    sessionStorage.setItem("ss_email", email);
    setUserEmail(email);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ss_email");
    setUserEmail("");
  };

  if (!userEmail) return <Login onLogin={handleLogin} />;
  return <App userEmail={userEmail} onLogout={handleLogout} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Root /></StrictMode>
)
