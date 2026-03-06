import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DashboardPreview from '../components/DashboardPreview';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="lp">
      <Navbar />

      <div className="lp-glow" />

      <main className="lp-main">

        <div className="lp-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div className="lp-headings">
          <h1 className="lp-title">VERIFY AI OUTPUTS.</h1>
          <h2 className="lp-subtitle">
            DETECT <span className="lp-hl">HALLUCINATIONS.</span>
          </h2>
        </div>

        <p className="lp-desc">
          Ensure your LLM generation is Factual, Ethical, and Explainable.
          The enterprise standard for AI auditing.
        </p>

        <DashboardPreview />

        <div className="lp-cta">
          <button className="lp-btn lp-btn-primary" onClick={() => navigate('/analyze')}>
            GET STARTED
          </button>
        </div>

        <div className="lp-footer">
          <svg className="lp-footer-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Welcome to Factless AI
        </div>

      </main>
    </div>
  );
};

export default LandingPage;