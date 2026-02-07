import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import './App.css';

function App() {
    const { isAuthenticated, user, clearAuth } = useAuthStore();

    const handleLogout = () => {
        clearAuth();
    };

    return (
        <BrowserRouter>
            <div className="app-shell">
                {isAuthenticated && (
                    <nav className="dashboard-nav">
                        <div className="container nav-container">
                            <div className="nav-brand">
                                <Link to="/dashboard"><h1>🏥 CareTaker</h1></Link>
                            </div>
                            <div className="nav-links">
                                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                                <Link to="/inventory" className="nav-link">Inventory</Link>
                                <div className="nav-user">
                                    <span className="user-info">
                                        <strong>{user?.name}</strong>
                                        <small>{user?.role}</small>
                                    </span>
                                    <button className="btn btn-logout" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>
                )}

                <Routes>
                    <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                    <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/inventory" element={isAuthenticated ? <InventoryPage /> : <Navigate to="/login" />} />
                    <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
