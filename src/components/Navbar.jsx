import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './Navbar.css';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
};

const Navbar = () => {
  const navigate = useNavigate();
  const { userName, clearUser } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="nav-logo">
          <span className="nav-logo-txt">F</span>
        </div>
        <span className="nav-title">FACTLESS</span>
      </div>

      <div className="nav-right">
        <div className="nav-links">
          <button className="nav-link" onClick={() => navigate('/analyze')}>Analyze</button>
          <button className="nav-link" onClick={() => navigate('/history')}>History</button>
        </div>

        <div 
          className="nav-user"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="nav-avatar">
            {getInitials(userName)}
          </div>

          {showDropdown && (
            <div className="nav-dropdown">
              <div className="nav-dropdown-header">
                <span className="nav-dropdown-name">{userName}</span>
              </div>
              <div className="nav-dropdown-divider" />
              <button className="nav-dropdown-item" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;