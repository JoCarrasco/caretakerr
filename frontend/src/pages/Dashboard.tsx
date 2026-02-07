import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h1>🏥 CareTaker</h1>
                </div>
                <div className="nav-user">
                    <span className="user-info">
                        <strong>{user?.name}</strong>
                        <small>{user?.role}</small>
                    </span>
                    <button className="btn btn-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <main className="dashboard-main">
                <div className="container">
                    <div className="welcome-section">
                        <h2>Welcome back, {user?.name}! 👋</h2>
                        <p>Your CareTaker MVP is ready to go. Core features coming soon:</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📦</div>
                            <h3>Inventory</h3>
                            <p>Track medicines and supplies with low stock alerts</p>
                            <span className="status-badge coming-soon">Coming Soon</span>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📅</div>
                            <h3>Schedules</h3>
                            <p>Manage caretaker shifts with calendar view</p>
                            <span className="status-badge coming-soon">Coming Soon</span>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💊</div>
                            <h3>Medications</h3>
                            <p>Medication schedules and reminders</p>
                            <span className="status-badge coming-soon">Coming Soon</span>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">✅</div>
                            <h3>Tasks</h3>
                            <p>Task assignment and activity scheduling</p>
                            <span className="status-badge coming-soon">Coming Soon</span>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💰</div>
                            <h3>Payroll</h3>
                            <p>Flexible work hours tracking and payroll</p>
                            <span className="status-badge coming-soon">Coming Soon</span>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📴</div>
                            <h3>Offline Mode</h3>
                            <p>Works offline with automatic sync</p>
                            <span className="status-badge coming-soon">Coming Soon</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
