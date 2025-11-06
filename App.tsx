import React, { useState } from "react";
import { ModuleInfo } from './types';
import { FaCommentAlt, FaInstagram } from 'react-icons/fa'; // Only Feedback icon now
import StyleMundoPage from './pages/StyleMundoPage';
import SportMundoPage from './pages/SportMundoPage';
import LifeMundoPage from './pages/LifeMundoPage';
import TravelMundoPage from './pages/TravelMundoPage'; // Import the new TravelMundoPage
import PremiumHomePage from './pages/PremiumHomePage'; // Import the new PremiumHomePage
import { INSTAGRAM_URL } from './constants'; // Import INSTAGRAM_URL
import './App.css';

function App() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [activeModulePage, setActiveModulePage] = useState<string | null>(null);

  const handleFeedbackSubmit = () => {
    alert("✨ Obrigado pelo feedback!");
    setFeedbackText("");
    setShowFeedback(false);
  };

  const handleSelectModule = (moduleKey: string) => {
    setActiveModulePage(moduleKey);
  };

  const handleGoBackToPortal = () => {
    setActiveModulePage(null); // This will naturally take us back to rendering PremiumHomePage
  };

  let content;
  if (activeModulePage === 'style-mundo-ia') {
    content = <StyleMundoPage onGoBack={handleGoBackToPortal} />;
  } else if (activeModulePage === 'sport-mundo-ia') {
    content = <SportMundoPage onGoBack={handleGoBackToPortal} />;
  } else if (activeModulePage === 'life-mundo-ia') {
    content = <LifeMundoPage onGoBack={handleGoBackToPortal} />;
  } else if (activeModulePage === 'travel-mundo-ia') {
    content = <TravelMundoPage onGoBack={handleGoBackToPortal} />;
  } else {
    // Default: Show the Premium Home Page
    content = <PremiumHomePage onSelectModule={handleSelectModule} />;
  }

  return (
    <div className="app-wrapper">
      {content}

      {/* Global Feedback button */}
      <button className="feedback-btn" onClick={() => setShowFeedback(true)}>
        <FaCommentAlt className="mr-2" /> Feedback
      </button>

      {/* Modal de feedback */}
      {showFeedback && (
        <div className="feedback-modal animate-fade-in">
          <div className="feedback-box">
            <button
              onClick={() => setShowFeedback(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors duration-200 text-2xl"
              aria-label="Fechar"
            >
              &times;
            </button>
            <h2>💡 Envie seu feedback</h2>
            <textarea
              placeholder="Conte o que achou..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={6}
            ></textarea>
            <div className="feedback-actions">
              <button onClick={handleFeedbackSubmit}>Enviar</button>
              <button onClick={() => setShowFeedback(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Instagram button */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-btn fixed bottom-6 right-6"
      >
        <FaInstagram className="text-xl mr-2" />
        <span>Seguir no Instagram</span>
      </a>
    </div>
  );
}

export default App;