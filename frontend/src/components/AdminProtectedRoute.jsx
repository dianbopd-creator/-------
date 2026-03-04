import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtectedRoute = ({ requireAdmin = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading...</div>;
    }

    if (!user) {
        // Not logged in, redirect to login page
        return <Navigate to="/admin/login" replace />;
    }

    if (requireAdmin && user.role !== 'admin' && user.role !== 'superadmin') {
        // Logged in but doesn't have required admin role, redirect to their dashboard
        return <Navigate to="/admin/dashboard" replace />;
    }

    // Authorized
    return <Outlet />;
};

export default AdminProtectedRoute;
