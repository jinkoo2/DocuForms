import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
};

export default App;

