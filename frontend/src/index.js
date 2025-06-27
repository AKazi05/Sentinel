import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppRouter />);
