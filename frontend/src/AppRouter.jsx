import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import App from './App';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

function AppRouter() {
  const [isAuth, setIsAuth] = useState(null); // null = loading, false = not logged in

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/user`, { withCredentials: true })
      .then(() => setIsAuth(true))
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/app"
          element={isAuth ? <App /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default AppRouter;
