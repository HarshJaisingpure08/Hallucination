import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import { UserProvider } from './context/UserContext';
import WelcomeModal from './components/WelcomeModal';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <UserProvider>
      <AnalysisProvider>
        <WelcomeModal />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </BrowserRouter>
      </AnalysisProvider>
    </UserProvider>
  );
}

export default App;