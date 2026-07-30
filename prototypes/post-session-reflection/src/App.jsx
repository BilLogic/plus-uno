import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReflectionsListPage from './pages/ReflectionsListPage';
import ReflectionFormPage from './pages/ReflectionFormPage';
import './App.css';

/**
 * Post-session reflection prototype — clickable flow, in-memory only.
 */
export default function App() {
    return (
        <Routes>
            <Route path="/" element={<ReflectionsListPage />} />
            <Route path="/reflection/:reflectionId" element={<ReflectionFormPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
