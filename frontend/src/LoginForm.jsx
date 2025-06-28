import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

function LoginForm({ setIsAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', { username, password });
      const token = response.data.token;
      localStorage.setItem('token', token);

      setIsAuth(true); // <-- Update auth state here to trigger redirect in AppRouter
      navigate('/app');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={login} style={styles.form}>
        <h2 style={styles.title}>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.buttonPrimary}>Login</button>
        <button type="button" onClick={() => navigate('/register')} style={styles.buttonSecondary}>Register</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#f4f6f9',
  },
  form: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 360,
  },
  title: {
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  buttonPrimary: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  },
  buttonSecondary: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#f1f1f1',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};

export default LoginForm;
