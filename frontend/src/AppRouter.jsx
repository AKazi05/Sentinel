import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import App from './App';

function AppRouter() {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuth(!!token);
  }, []);

  if (isAuth === null) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuth ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/app" replace /> : <LoginForm setIsAuth={setIsAuth} />}
        />
        <Route
          path="/register"
          element={isAuth ? <Navigate to="/app" replace /> : <RegisterForm />}
        />
        <Route
          path="/app"
          element={isAuth ? <App /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default AppRouter;
