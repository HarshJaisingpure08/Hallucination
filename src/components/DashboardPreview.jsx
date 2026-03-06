import './DashboardPreview.css';

const DashboardPreview = () => {
  return (
    <div className="dp">

      {/* Circuit lines – left */}
      <div className="dp-circuits dp-circuits-l">
        <div className="dp-line dp-line-l" style={{ width: '4rem' }} />
        <div className="dp-line dp-line-l" style={{ width: '6rem' }} />
        <div className="dp-line dp-line-l" style={{ width: '3rem' }} />
        <div className="dp-line dp-line-l" style={{ width: '5rem' }} />
      </div>

      {/* Core card */}
      <div className="dp-card-wrap">
        <div className="dp-card">
          <div className="dp-glow" />
          <span className="dp-text">AI</span>

          {/* Tick badge */}
          <div className="dp-badge">
            <svg className="dp-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Circuit lines – right */}
      <div className="dp-circuits dp-circuits-r">
        <div className="dp-line dp-line-r" style={{ width: '5rem' }} />
        <div className="dp-line dp-line-r" style={{ width: '3rem' }} />
        <div className="dp-line dp-line-r" style={{ width: '6rem' }} />
        <div className="dp-line dp-line-r" style={{ width: '4rem' }} />
      </div>

    </div>
  );
};

export default DashboardPreview;