

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaInstagram, FaChevronLeft, FaDownload, FaRedo, FaMagic } from 'react-icons/fa'; // Add new icons
import { generateSportImage } from '../services/geminiService';
import { GeneratedImageResult } from '../types';
import { INSTAGRAM_URL } from '../constants';
import '../App.css';
import './SportMundoPage.css'; // Specific styles for this page

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Get only the base64 part
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface SportMundoPageProps {
  onGoBack: () => void;
}

interface SportDetails {
  scenarios: string[];
  actionStyles: string[];
  lightingThemes: string[];
}

const sportOptionsMap: { [key: string]: SportDetails } = {
  "Futebol": {
    scenarios: ["Estádio", "Gramado", "Treino", "Vestiário"],
    actionStyles: ["Correndo", "Driblando", "Comemorando", "Retrato Oficial"],
    lightingThemes: ["Diurna", "Noturna", "Cinemática"],
  },
  "Basquete": {
    scenarios: ["Quadra interna", "Treino", "Vestiário"],
    actionStyles: ["Arremessando", "Driblando", "Comemorando", "Retrato Oficial"],
    lightingThemes: ["Estúdio", "Cinemática", "Noturna"],
  },
  "Tênis": {
    scenarios: ["Quadra de tênis", "Treino", "Pista aberta"],
    actionStyles: ["Sacando", "Correndo para bola", "Retrato Oficial"],
    lightingThemes: ["Diurna", "Cinemática suave", "Estúdio"],
  },
  "Corrida": {
    scenarios: ["Pista de atletismo", "Parque urbano", "Treino"],
    actionStyles: ["Correndo", "Alongando", "Retrato Oficial"],
    lightingThemes: ["Diurna", "Amanhecer", "Cinemática leve"],
  },
  "Surf": {
    scenarios: ["Praia", "Mar aberto", "Costão rochoso"],
    actionStyles: ["Surfando", "Caminhando com prancha", "Retrato Oficial", "Saindo do Tubo"],
    lightingThemes: ["Amanhecer dourado", "Pôr do sol", "Diurna"],
  },
};

const footballTeamsByCountry: { [country: string]: string[] } = {
  "Brasil": [
    "Seleção Brasileira", // Added National Team
    "Flamengo", "Palmeiras", "Corinthians", "São Paulo", "Grêmio", "Internacional",
    "Atlético Mineiro", "Cruzeiro", "Fluminense", "Vasco da Gama", "Botafogo",
    "Bahia", "Santos", "Athletico Paranaense", "Cuiabá", "Fortaleza",
    "Red Bull Bragantino", "Vitória", "Criciúma", "Juventude", "Clube do Remo", "Paysandu Sport Club"
  ],
  "Espanha": [
    "Seleção Espanhola", // Added National Team
    "Real Madrid", "FC Barcelona", "Atlético de Madrid"
  ],
  "Inglaterra": [
    "Seleção Inglesa", // Added National Team
    "Manchester City", "Liverpool FC", "Arsenal FC", "Manchester United", "Chelsea FC", "Newcastle United"
  ],
  "Alemanha": [
    "Seleção Alemã", // Added National Team
    "Bayern de Munique", "Borussia Dortmund"
  ],
  "Itália": [
    "Seleção Italiana", // Added National Team
    "Inter de Milão", "AC Milan", "Juventus", "Napoli"
  ],
  "França": [
    "Seleção Francesa", // Added National Team
    "Paris Saint-Germain (PSG)", "Olympique de Marseille"
  ],
  "Portugal": [
    "Seleção Portuguesa", // Added National Team
    "FC Porto", "SL Benfica"
  ],
};


const SportMundoPage: React.FC<SportMundoPageProps> = ({ onGoBack }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedActionStyle, setSelectedActionStyle] = useState<string | null>(null);
  const [uniformName, setUniformName] = useState<string>('');
  const [jerseyNumber, setJerseyNumber] = useState<string>(''); // Keep as string for input
  const [lightingTheme, setLightingTheme] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // New state for selected country
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null); // New state for selected team
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [credits, setCredits] = useState(10); // Initial credits
  const [error, setError] = useState<string | null>(null);

  const loadingMessages = useRef([
    "🏟️ Preparando o campo...",
    "⚙️ Ajustando iluminação cinematográfica...",
    "📸 Capturando o momento perfeito...",
    "🏃 Analisando a biomecânica do movimento...",
    "✨ Adicionando detalhes realistas ao uniforme...",
    "🏆 Renderizando a cena para a vitória...",
  ]);

  const sports = Object.keys(sportOptionsMap); // Use keys from the map for the main sport selection
  
  const getRandomLoadingMessage = () => {
    const messages = loadingMessages.current;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  useEffect(() => {
    // Reset selectedTeam and selectedCountry if sport is not "Futebol" or when sport changes
    if (selectedSport !== "Futebol") {
      setSelectedCountry(null);
      setSelectedTeam(null);
    }
    // Reset dependent fields when sport changes
    setSelectedScenario(null);
    setSelectedActionStyle(null);
    setLightingTheme(null);
  }, [selectedSport]);

  useEffect(() => {
    // Reset selectedTeam when selectedCountry changes
    setSelectedTeam(null);
  }, [selectedCountry]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setUploadedFile(null);
      setUploadedImageBase64(null);
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError("Formato de arquivo inválido. Apenas JPG/PNG são permitidos.");
      setUploadedFile(null);
      setUploadedImageBase64(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError("Arquivo muito grande. Tamanho máximo é 5MB.");
      setUploadedFile(null);
      setUploadedImageBase64(null);
      return;
    }

    setUploadedFile(file);
    try {
      const base64 = await blobToBase64(file);
      setUploadedImageBase64(base64);
    } catch (e) {
      setError("Erro ao ler o arquivo.");
      setUploadedFile(null);
      setUploadedImageBase64(null);
    }
  };

  const generateImage = useCallback(async (isVariation: boolean = false) => {
    setError(null);
    if (!uploadedImageBase64 || !uploadedFile || !selectedSport || !selectedScenario || !selectedActionStyle || !lightingTheme) {
      setError("Por favor, preencha todos os campos obrigatórios (foto, esporte, cenário, ação e iluminação).");
      return;
    }
    if (credits <= 0) {
      setError("Você não tem créditos suficientes para gerar uma nova imagem. Por favor, recarregue ou tente mais tarde.");
      return;
    }
    // Specific validation for "Futebol" and team selection
    if (selectedSport === "Futebol") {
      if (!selectedCountry) {
        setError("Por favor, selecione um país para o time de Futebol.");
        return;
      }
      if (!selectedTeam) {
        setError("Por favor, selecione um time para Futebol.");
        return;
      }
    }


    setIsLoading(true);
    setLoadingMessage(getRandomLoadingMessage());

    try {
      const newImageBase64 = await generateSportImage({
        imageBase64: uploadedImageBase64,
        mimeType: uploadedFile.type,
        sport: selectedSport,
        scenario: selectedScenario,
        actionStyle: selectedActionStyle,
        uniformName: uniformName || undefined,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
        lightingTheme: lightingTheme,
        teamName: selectedTeam || undefined, // Pass selectedTeam
      });

      const promptSummary = `Esporte: ${selectedSport}, Cenário: ${selectedScenario}, Ação: ${selectedActionStyle}, Iluminação: ${lightingTheme}` +
                            (uniformName ? `, Nome: ${uniformName}` : '') +
                            (jerseyNumber ? `, Número: ${jerseyNumber}` : '') +
                            (selectedSport === "Futebol" && selectedCountry ? `, País do Time: ${selectedCountry}` : '') + // Add country to summary
                            (selectedTeam ? `, Time: ${selectedTeam}` : ''); // Add team to summary

      setGeneratedImage({
        id: crypto.randomUUID(),
        base64: newImageBase64,
        prompt: promptSummary,
        timestamp: new Date(),
      });
      // A variation also costs a credit
      setCredits(prev => prev - 1);

    } catch (err) {
      console.error("API Error during image generation:", err);
      setError(`Falha ao gerar a imagem: ${err instanceof Error ? err.message : String(err)}. Verifique sua conexão ou tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImageBase64, uploadedFile, selectedSport, selectedScenario, selectedActionStyle, uniformName, jerseyNumber, lightingTheme, selectedCountry, selectedTeam, credits]); // Add selectedCountry to dependencies

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${generatedImage.base64}`;
      link.download = `sportmundo_ia_${generatedImage.id}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setUploadedImageBase64(null);
    setSelectedSport(null);
    setSelectedScenario(null);
    setSelectedActionStyle(null);
    setUniformName('');
    setJerseyNumber('');
    setLightingTheme(null);
    setSelectedCountry(null); // Reset selected country
    setSelectedTeam(null); // Reset selected team
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
  };

  const currentSportOptions = selectedSport ? sportOptionsMap[selectedSport] : null;
  const availableScenarios = currentSportOptions?.scenarios || [];
  const availableActionStyles = currentSportOptions?.actionStyles || [];
  const availableLightingThemes = currentSportOptions?.lightingThemes || [];

  const canGenerate = uploadedImageBase64 && selectedSport && selectedScenario && selectedActionStyle && lightingTheme && !isLoading && credits > 0 &&
                      (selectedSport !== "Futebol" || (selectedCountry && selectedTeam)); // Add country & team validation for Futebol
  const canGenerateVariation = generatedImage && !isLoading && credits > 0;

  const availableTeamsForSelectedCountry = selectedCountry ? footballTeamsByCountry[selectedCountry] : [];

  return (
    <div className="sportmundo-page-container portal-container">
      <button className="back-btn" onClick={onGoBack}>
        <FaChevronLeft className="mr-2" /> Voltar ao Portal
      </button>

      <header className="sportmundo-header">
        <h1 className="title">SportMundo IA — Crie sua Foto Esportiva com Inteligência Artificial</h1>
        <p className="subtitle">Gere retratos realistas de jogadores, treinos e momentos épicos do esporte.</p>
      </header>

      <main className="sportmundo-content">
        <div className="input-section">
          {/* Upload Area */}
          <div className="upload-area">
            <label htmlFor="file-upload" className="upload-label">
              {uploadedImageBase64 ? (
                <img src={`data:${uploadedFile?.type};base64,${uploadedImageBase64}`} alt="Pré-visualização" className="uploaded-image-preview" />
              ) : (
                <span>Envie sua foto para manter o mesmo rosto do atleta.</span>
              )}
              <input
                id="file-upload"
                type="file"
                accept="image/jpeg, image/png"
                onChange={handleFileChange}
                className="hidden-file-input"
              />
            </label>
            {error && <p className="error-message">{error}</p>}
          </div>

          {/* Dropdowns */}
          <div className="dropdowns-grid">
            <div className="dropdown-container">
              <label htmlFor="sport-select">Esporte</label>
              <select
                id="sport-select"
                value={selectedSport || ''}
                onChange={(e) => setSelectedSport(e.target.value)}
              >
                <option value="" disabled>Selecione um esporte</option>
                {sports.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="scenario-select">Cenário</label>
              <select
                id="scenario-select"
                value={selectedScenario || ''}
                onChange={(e) => setSelectedScenario(e.target.value)}
                disabled={!selectedSport}
              >
                <option value="" disabled>{selectedSport ? "Selecione um cenário" : "Selecione um Esporte primeiro"}</option>
                {availableScenarios.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="action-select">Ação / Estilo</label>
              <select
                id="action-select"
                value={selectedActionStyle || ''}
                onChange={(e) => setSelectedActionStyle(e.target.value)}
                disabled={!selectedSport}
              >
                <option value="" disabled>{selectedSport ? "Selecione uma ação/estilo" : "Selecione um Esporte primeiro"}</option>
                {availableActionStyles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="optional-fields-grid">
            {selectedSport === "Futebol" && (
              <>
                <div className="dropdown-container">
                  <label htmlFor="country-select">País do Time</label>
                  <select
                    id="country-select"
                    value={selectedCountry || ''}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    <option value="" disabled>Selecione um país</option>
                    {Object.keys(footballTeamsByCountry).map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div className="dropdown-container">
                  <label htmlFor="team-select">Time do Uniforme</label>
                  <select
                    id="team-select"
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    disabled={!selectedCountry}
                  >
                    <option value="" disabled>{selectedCountry ? "Selecione um time" : "Selecione um País primeiro"}</option>
                    {availableTeamsForSelectedCountry.map(team => <option key={team} value={team}>{team}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="input-field-container">
              <label htmlFor="uniform-name">Nome no uniforme (opcional)</label>
              <input
                id="uniform-name"
                type="text"
                value={uniformName}
                onChange={(e) => setUniformName(e.target.value)}
                placeholder="Ex: SILVA"
              />
            </div>
            <div className="input-field-container">
              <label htmlFor="jersey-number">Número da camisa (opcional)</label>
              <input
                id="jersey-number"
                type="number"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="Ex: 10"
                min="0"
                max="99"
              />
            </div>
            <div className="dropdown-container">
              <label htmlFor="lighting-theme">Tema de iluminação</label>
              <select
                id="lighting-theme"
                value={lightingTheme || ''}
                onChange={(e) => setLightingTheme(e.target.value)}
                disabled={!selectedSport}
              >
                <option value="" disabled>{selectedSport ? "Selecione a iluminação" : "Selecione um Esporte primeiro"}</option>
                {availableLightingThemes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div> {/* End input-section */}

        {/* Action Buttons */}
        <div className="action-buttons-group">
          <button
            className="main-action-btn"
            onClick={() => generateImage(false)}
            disabled={!canGenerate}
          >
            ⚡ Criar Foto Esportiva ({credits} créditos)
          </button>
          <button
            className="secondary-action-btn"
            onClick={resetForm}
            disabled={isLoading}
          >
            <FaRedo className="mr-2" /> Nova Geração
          </button>
          <button
            className="secondary-action-btn"
            onClick={() => generateImage(true)}
            disabled={!canGenerateVariation}
          >
            <FaMagic className="mr-2" /> Gerar Variação ({credits} créditos)
          </button>
          {generatedImage && (
            <button
              className="secondary-action-btn"
              onClick={handleDownload}
            >
              <FaDownload className="mr-2" /> Baixar
            </button>
          )}
        </div>

        {/* Loader or Generated Image */}
        <div className="output-section">
          {isLoading ? (
            <div className="generation-loader">
              <div className="spinner"></div>
              <p>{loadingMessage}</p>
              <p className="mt-4 text-sm text-gray-400">A IA está suando para criar sua imagem...</p>
            </div>
          ) : generatedImage ? (
            <div className="generated-image-preview-container">
              <img src={`data:image/jpeg;base64,${generatedImage.base64}`} alt="Foto Esportiva Gerada" className="generated-image-output" />
              {error && <p className="error-message text-center mt-4">{error}</p>}
            </div>
          ) : (
            <div className="placeholder-image-preview">
              <p>Sua foto esportiva gerada aparecerá aqui.</p>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}
        </div>
        {credits <= 0 && !isLoading && <p className="text-red-400 mt-4 text-center">Créditos esgotados! Recarregue para gerar mais.</p>}
      </main>

      <footer className="sportmundo-footer">
        © 2025 <strong>SportMundo IA</strong> | Desenvolvido por Fabricio Menezes IA
      </footer>
    </div>
  );
};

export default SportMundoPage;