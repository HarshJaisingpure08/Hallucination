import { useState } from 'react';
import { useUser } from '../context/UserContext';
import './WelcomeModal.css';

const WelcomeModal = () => {
  const { showPrompt, setUserName } = useUser();
  const [inputName, setInputName] = useState('');

  if (!showPrompt) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputName.trim()) {
      setUserName(inputName.trim());
    }
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="welcome-title">Welcome to Factless</h2>
        <p className="welcome-desc">Enter your name to get started</p>
        <form onSubmit={handleSubmit} className="welcome-form">
          <input
            type="text"
            className="welcome-input"
            placeholder="Your name (e.g. John Doe)"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            autoFocus
          />
          <button 
            type="submit" 
            className="welcome-btn"
            disabled={!inputName.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeModal;
