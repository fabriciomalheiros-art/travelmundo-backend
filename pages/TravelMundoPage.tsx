

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaInstagram, FaChevronLeft, FaDownload, FaRedo, FaMagic, FaSave, FaLanguage } from 'react-icons/fa';
import { generatePhotographicEssay } from '../services/geminiService'; // Reusing existing service function
import { GeneratedImageResult } from '../types';
import { INSTAGRAM_URL, DESTINATIONS_LIST } from '../constants';
import '../App.css';
import './TravelMundoPage.css'; // Specific styles for this page

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

interface TravelMundoPageProps {
  onGoBack: () => void;
}

interface SelectOption {
  value: string;
  label: string;
}

// Language Translations
const translations = {
  pt: {
    title: "TravelMundo IA — Crie sua Foto de Viagem Cinematográfica com IA",
    subtitle: "Gere imagens realistas em destinos icônicos do mundo com o seu rosto e o seu estilo.",
    uploadLabel: "Envie sua foto base (rosto visível, bem iluminado).",
    uploadWarning: "Usaremos essa foto para manter o mesmo rosto.",
    destinationLabel: "1. Destino",
    destinationPlaceholder: "Ex.: Paris, Santorini, Dubai, Tóquio, Machu Picchu…",
    travelStyleLabel: "2. Estilo de Viagem (Mood)",
    scenarioLabel: "3. Cenário / Ambiente",
    timeDayClimateLabel: "4. Hora do Dia & Estação/Clima",
    hourLabel: "Hora",
    climateLabel: "Clima",
    clothesStyleLabel: "5. Roupa / Estilo",
    framingPositionLabel: "6. Enquadramento & Posição",
    framingLabel: "Enquadramento",
    positionActionLabel: "Posição/Ação",
    colorPaletteLabel: "Paleta de cores (opcional)",
    lightingThemeLabel: "Tema de iluminação (opcional)",
    createBtn: "⚡ Criar Foto de Viagem (1 crédito)",
    generateVariationBtn: "✨ Gerar Variação (1 crédito)",
    newGenerationBtn: "🔁 Nova Geração",
    downloadBtn: "⬇️ Baixar",
    savePresetBtn: "💾 Salvar Preset",
    loadingDefault: "Viajando para o destino...",
    loading1: "🛫 Carimbando seu passaporte visual...",
    loading2: "🌅 Ajustando pôr do sol sobre o destino...",
    loading3: "🏛️ Compondo arquitetura local e atmosfera...",
    loading4: "🎬 Refinando luz cinematográfica e pele realista...",
    loading5: "✨ Preparando sua obra-prima de viagem...",
    loading6: "🌍 Explorando novas paisagens para sua foto...",
    loadingTakingFewSeconds: "Isso pode levar alguns segundos...",
    placeholderImage: "Sua foto de viagem cinematográfica aparecerá aqui.",
    footer: "© 2025 TravelMundo IA | Desenvolvido por Fabricio Menezes IA",
    creditsExhausted: "Créditos esgotados! Recarregue para gerar mais.",
    requiredFieldsError: "Por favor, preencha todos os campos obrigatórios (foto, destino, estilo de viagem, cenário, hora/clima, roupa, enquadramento e posição).",
    uploadInvalidFormat: "Formato de arquivo inválido. Apenas JPG/PNG são permitidos.",
    uploadTooLarge: "Arquivo muito grande. Tamanho máximo é 5MB.",
    uploadError: "Erro ao ler o arquivo.",
    apiError: "Falha ao gerar a imagem: ",
    presetSaved: "Preset salvo com sucesso! ✅",
    selectOption: "Selecione uma opção", // Added missing translation
    followInstagram: "Seguir no Instagram", // Added missing translation
    backToPortal: "Voltar ao Portal", // Added missing translation
  },
  en: {
    title: "TravelMundo AI — Create Your Cinematic Travel Photo with AI",
    subtitle: "Generate realistic images in iconic global destinations with your face and style.",
    uploadLabel: "Upload your base photo (face visible, well-lit).",
    uploadWarning: "We will use this photo to maintain the same face.",
    destinationLabel: "1. Destination",
    destinationPlaceholder: "E.g.: Paris, Santorini, Dubai, Tokyo, Machu Picchu…",
    travelStyleLabel: "2. Travel Style (Mood)",
    scenarioLabel: "3. Scenario / Environment",
    timeDayClimateLabel: "4. Time of Day & Season/Climate",
    hourLabel: "Hour",
    climateLabel: "Climate",
    clothesStyleLabel: "5. Clothing / Style",
    framingPositionLabel: "6. Framing & Position",
    framingLabel: "Framing",
    positionActionLabel: "Position/Action",
    colorPaletteLabel: "Color Palette (optional)",
    lightingThemeLabel: "Lighting Theme (optional)",
    createBtn: "⚡ Create Travel Photo (1 credit)",
    generateVariationBtn: "✨ Generate Variation (1 credit)",
    newGenerationBtn: "🔁 New Generation",
    downloadBtn: "⬇️ Download",
    savePresetBtn: "💾 Save Preset",
    loadingDefault: "Traveling to your destination...",
    loading1: "🛫 Stamping your visual passport...",
    loading2: "🌅 Adjusting sunset over the destination...",
    loading3: "🏛️ Composing local architecture and atmosphere...",
    loading4: "🎬 Refining cinematic light and realistic skin...",
    loading5: "✨ Preparing your travel masterpiece...",
    loading6: "🌍 Exploring new landscapes for your photo...",
    loadingTakingFewSeconds: "This may take a few seconds...",
    placeholderImage: "Your cinematic travel photo will appear here.",
    footer: "© 2025 TravelMundo AI | Developed by Fabricio Menezes AI",
    creditsExhausted: "Credits exhausted! Recharge to generate more.",
    requiredFieldsError: "Please fill in all required fields (photo, destination, travel style, scenario, time/climate, clothing, framing, and position).",
    uploadInvalidFormat: "Invalid file format. Only JPG/PNG are allowed.",
    uploadTooLarge: "File too large. Maximum size is 5MB.",
    uploadError: "Error reading file.",
    apiError: "Failed to generate image: ",
    presetSaved: "Preset saved successfully! ✅",
    selectOption: "Select an option", // Added missing translation
    followInstagram: "Follow on Instagram", // Added missing translation
    backToPortal: "Back to Portal", // Added missing translation
  }
};

const travelStyleOptions: SelectOption[] = [
  { value: "Romântico", label: "Romântico" },
  { value: "Aventura", label: "Aventura" },
  { value: "Solo", label: "Solo" },
  { value: "Família", label: "Família" },
  { value: "Luxo", label: "Luxo" },
  { value: "Cultural", label: "Cultural" },
  { value: "Urbano Criativo", label: "Urbano Criativo" },
  { value: "Natureza", label: "Natureza" },
];

const scenarioOptions: SelectOption[] = [
  { value: "Landmark/Cartão-postal", label: "Landmark/Cartão-postal" },
  { value: "Praia", label: "Praia" },
  { value: "Montanha/Trilha", label: "Montanha/Trilha" },
  { value: "Centro histórico", label: "Centro histórico" },
  { value: "Mercado local", label: "Mercado local" },
  { value: "Rooftop", label: "Rooftop" },
  { value: "Café europeu", label: "Café europeu" },
  { value: "Deserto", label: "Deserto" },
  { value: "Neve", label: "Neve" },
];

const hourOptions: SelectOption[] = [
  { value: "Amanhecer", label: "Amanhecer" },
  { value: "Dourado", label: "Dourado" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noturno urbano", label: "Noturno urbano" },
];

const climateOptions: SelectOption[] = [
  { value: "Ensolarado", label: "Ensolarado" },
  { value: "Céu dramático", label: "Céu dramático" },
  { value: "Nevoado", label: "Nevoado" },
  { value: "Chuva leve", label: "Chuva leve" },
  { value: "Neve", label: "Neve" },
];

const clothesStyleOptions: SelectOption[] = [
  { value: "Casual elegante", label: "Casual elegante" },
  { value: "Fashion cinematográfico", label: "Fashion cinematográfico" },
  { value: "Esportivo", label: "Esportivo" },
  { value: "Verão/Praia", label: "Verão/Praia" },
  { value: "Inverno", label: "Inverno" },
];

const framingOptions: SelectOption[] = [
  { value: "Retrato", label: "Retrato" },
  { value: "Meio corpo", label: "Meio corpo" },
  { value: "Corpo inteiro", label: "Corpo inteiro" },
  { value: "Plano americano", label: "Plano americano" },
];

const positionActionOptions: SelectOption[] = [
  { value: "Caminhando", label: "Caminhando" },
  { value: "Olhando o horizonte", label: "Olhando o horizonte" },
  { value: "Encostado em muralha/parede", label: "Encostado em muralha/parede" },
  { value: "Sentado em café", label: "Sentado em café" },
  { value: "Ao lado de carro/vespa", label: "Ao lado de carro/vespa" },
];

const colorPaletteOptions: SelectOption[] = [
  { value: "", label: "Nenhum (padrão)" },
  { value: "neutra", label: "Neutra" },
  { value: "quente", label: "Quente" },
  { value: "fria", label: "Fria" },
  { value: "neon urbano", label: "Neon Urbano" },
];

const lightingThemeOptions: SelectOption[] = [
  { value: "", label: "Nenhum (padrão)" },
  { value: "Cinemática", label: "Cinemática" },
  { value: "Estúdio soft", label: "Estúdio soft" },
  { value: "Luz dourada", label: "Luz dourada" },
  { value: "Azul noturna", label: "Luz azul noturna" },
];


const TravelMundoPage: React.FC<TravelMundoPageProps> = ({ onGoBack }) => {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const t = (key: keyof typeof translations.pt) => translations[language][key] || key;

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedTravelStyle, setSelectedTravelStyle] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedClimate, setSelectedClimate] = useState<string | null>(null);
  const [selectedClothesStyle, setSelectedClothesStyle] = useState<string | null>(null);
  const [selectedFraming, setSelectedFraming] = useState<string | null>(null);
  const [selectedPositionAction, setSelectedPositionAction] = useState<string | null>(null);
  const [selectedColorPalette, setSelectedColorPalette] = useState<string | null>(null);
  const [selectedLightingTheme, setSelectedLightingTheme] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [credits, setCredits] = useState(10); // Initial credits
  const [error, setError] = useState<string | null>(null);
  const [presetMessage, setPresetMessage] = useState<string | null>(null);

  const loadingMessages = useRef([
    translations.pt.loading1,
    translations.pt.loading2,
    translations.pt.loading3,
    translations.pt.loading4,
    translations.pt.loading5,
    translations.pt.loading6,
  ]);

  useEffect(() => {
    // Update loading messages when language changes
    loadingMessages.current = [
      translations[language].loading1,
      translations[language].loading2,
      translations[language].loading3,
      translations[language].loading4,
      translations[language].loading5,
      translations[language].loading6,
    ];
  }, [language]);


  const getRandomLoadingMessage = () => {
    const messages = loadingMessages.current;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setGeneratedImage(null); // Clear previous image on new file upload
    const file = event.target.files?.[0];
    if (!file) {
      setUploadedFile(null);
      setUploadedImageBase64(null);
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError(t('uploadInvalidFormat'));
      setUploadedFile(null);
      // Fix: Corrected typo `setUploadedImageBase664` to `setUploadedImageBase64`
      setUploadedImageBase64(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError(t('uploadTooLarge'));
      setUploadedFile(null);
      setUploadedImageBase64(null);
      return;
    }

    setUploadedFile(file);
    try {
      const base64 = await blobToBase64(file);
      setUploadedImageBase64(base64);
    } catch (e) {
      setError(t('uploadError'));
      setUploadedFile(null);
      setUploadedImageBase64(null);
    }
  };

  const generateImage = useCallback(async (isVariation: boolean = false) => {
    setError(null);
    if (!uploadedImageBase64 || !uploadedFile || !selectedDestination || !selectedTravelStyle || !selectedScenario || !selectedHour || !selectedClimate || !selectedClothesStyle || !selectedFraming || !selectedPositionAction) {
      setError(t('requiredFieldsError'));
      return;
    }
    if (credits <= 0) {
      setError(t('creditsExhausted'));
      return;
    }

    setIsLoading(true);
    setLoadingMessage(getRandomLoadingMessage());

    try {
      // Prompt construction with mandatory facial consistency and scene details
      let finalPrompt = `preserve the exact face from the uploaded photo (identity consistency), realistic skin texture, coherent lighting with the selected ‘Hora do Dia & Clima’. `;
      finalPrompt += `Create a realistic and cinematic travel photo. Do not include any texts or logos. Do not include watermarks. Focus on local architecture, landscape, and cultural context. Ensure the colors, lighting, and climate match the selections. High resolution, sharp eyes/skin, and natural depth of field.`;
      
      finalPrompt += `\n- Destination: ${selectedDestination}`;
      finalPrompt += `\n- Travel Style (Mood): ${selectedTravelStyle}`;
      finalPrompt += `\n- Scenario/Environment: ${selectedScenario}`;
      finalPrompt += `\n- Time of Day: ${selectedHour}, Climate: ${selectedClimate}`;
      finalPrompt += `\n- Clothes/Style: ${selectedClothesStyle}`;
      finalPrompt += `\n- Framing: ${selectedFraming}, Position/Action: ${selectedPositionAction}`;
      if (selectedColorPalette) {
        finalPrompt += `\n- Color Palette: ${selectedColorPalette}`;
      }
      if (selectedLightingTheme) {
        finalPrompt += `\n- Lighting Theme: ${selectedLightingTheme}`;
      }
      if (isVariation) {
        finalPrompt += `\n- Variation: Create a slightly different pose, framing, or angle while maintaining the same identity and context.`;
      }

      const newImageBase64 = await generatePhotographicEssay({
        imageBase64: uploadedImageBase64,
        mimeType: uploadedFile.type,
        prompt: finalPrompt,
      });

      const promptSummary = `Destino: ${selectedDestination}, Estilo: ${selectedTravelStyle}, Cenário: ${selectedScenario}, Hora: ${selectedHour}, Clima: ${selectedClimate}, Roupa: ${selectedClothesStyle}, Enquadramento: ${selectedFraming}, Posição: ${selectedPositionAction}` +
                            (selectedColorPalette ? `, Paleta: ${selectedColorPalette}` : '') +
                            (selectedLightingTheme ? `, Iluminação: ${selectedLightingTheme}` : '');

      setGeneratedImage({
        id: crypto.randomUUID(),
        base64: newImageBase64,
        prompt: promptSummary,
        timestamp: new Date(),
      });
      setCredits(prev => prev - 1);

    } catch (err) {
      console.error("API Error during image generation:", err);
      setError(`${t('apiError')}${err instanceof Error ? err.message : String(err)}. Verifique sua conexão ou tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImageBase64, uploadedFile, selectedDestination, selectedTravelStyle, selectedScenario, selectedHour, selectedClimate, selectedClothesStyle, selectedFraming, selectedPositionAction, selectedColorPalette, selectedLightingTheme, credits, language, t]);

  const handleDownload = () => {
    if (generatedImage) {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, ''); // Format YYYYMMDDTHHMMSS
      const filename = `TravelMundoIA_${selectedDestination.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.jpeg`;
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${generatedImage.base64}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSavePreset = () => {
    const preset = {
      selectedDestination,
      selectedTravelStyle,
      selectedScenario,
      selectedHour,
      selectedClimate,
      selectedClothesStyle,
      selectedFraming,
      selectedPositionAction,
      selectedColorPalette,
      selectedLightingTheme,
    };
    localStorage.setItem('travelMundoPreset', JSON.stringify(preset));
    setPresetMessage(t('presetSaved'));
    setTimeout(() => setPresetMessage(null), 3000); // Hide message after 3 seconds
  };

  const resetForm = () => {
    setUploadedFile(null);
    setUploadedImageBase64(null);
    setSelectedDestination('');
    setSelectedTravelStyle(null);
    setSelectedScenario(null);
    setSelectedHour(null);
    setSelectedClimate(null);
    setSelectedClothesStyle(null);
    setSelectedFraming(null);
    setSelectedPositionAction(null);
    setSelectedColorPalette(null);
    setSelectedLightingTheme(null);
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
    setPresetMessage(null);
  };

  const canGenerate = uploadedImageBase64 && selectedDestination && selectedTravelStyle && selectedScenario && selectedHour && selectedClimate && selectedClothesStyle && selectedFraming && selectedPositionAction && !isLoading && credits > 0;
  const canGenerateVariation = canGenerate; // Variation has same requirements as initial generation

  return (
    <div className="travelmundo-page-container portal-container">
      {/* Fix: Use translation for "Back to Portal" */}
      <button className="back-btn" onClick={onGoBack}>
        <FaChevronLeft className="mr-2" /> {t('backToPortal')}
      </button>

      <div className="language-toggle">
        <button 
          onClick={() => setLanguage('pt')} 
          className={language === 'pt' ? 'active' : ''}
          aria-label="Selecionar Português"
        >
          PT
        </button>
        <button 
          onClick={() => setLanguage('en')} 
          className={language === 'en' ? 'active' : ''}
          aria-label="Select English"
        >
          EN
        </button>
      </div>

      <header className="travelmundo-header">
        <h1 className="title">{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </header>

      <main className="travelmundo-content">
        <div className="input-section">
          {/* Upload Area */}
          <div className="upload-area">
            <label htmlFor="file-upload" className="upload-label">
              {uploadedImageBase64 ? (
                <>
                  <img src={`data:${uploadedFile?.type};base64,${uploadedImageBase64}`} alt="Pré-visualização" className="uploaded-image-preview" />
                  <p className="uploaded-image-text-info">{t('uploadWarning')}</p>
                </>
              ) : (
                <span>{t('uploadLabel')}</span>
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
              <label htmlFor="destination-input">{t('destinationLabel')}</label>
              <input
                id="destination-input"
                type="text"
                list="destinations"
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                placeholder={t('destinationPlaceholder')}
              />
              <datalist id="destinations">
                {DESTINATIONS_LIST.map((dest) => (
                  <option key={dest} value={dest} />
                ))}
              </datalist>
            </div>

            <div className="dropdown-container">
              <label htmlFor="travel-style-select">{t('travelStyleLabel')}</label>
              <select
                id="travel-style-select"
                value={selectedTravelStyle || ''}
                onChange={(e) => setSelectedTravelStyle(e.target.value)}
              >
                {/* Fix: Use translation for "Select an option" */}
                <option value="" disabled>{t('selectOption')}</option>
                {travelStyleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="scenario-select">{t('scenarioLabel')}</label>
              <select
                id="scenario-select"
                value={selectedScenario || ''}
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                {/* Fix: Use translation for "Select an option" */}
                <option value="" disabled>{t('selectOption')}</option>
                {scenarioOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <div className="dropdown-container-group">
              <label>{t('timeDayClimateLabel')}</label>
              <div className="dropdowns-inline">
                <select
                  id="hour-select"
                  value={selectedHour || ''}
                  onChange={(e) => setSelectedHour(e.target.value)}
                >
                  <option value="" disabled>{t('hourLabel')}</option>
                  {hourOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select
                  id="climate-select"
                  value={selectedClimate || ''}
                  onChange={(e) => setSelectedClimate(e.target.value)}
                >
                  <option value="" disabled>{t('climateLabel')}</option>
                  {climateOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            <div className="dropdown-container">
              <label htmlFor="clothes-style-select">{t('clothesStyleLabel')}</label>
              <select
                id="clothes-style-select"
                value={selectedClothesStyle || ''}
                onChange={(e) => setSelectedClothesStyle(e.target.value)}
              >
                {/* Fix: Use translation for "Select an option" */}
                <option value="" disabled>{t('selectOption')}</option>
                {clothesStyleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <div className="dropdown-container-group">
              <label htmlFor="framing-select">{t('framingPositionLabel')}</label>
              <div className="dropdowns-inline">
                <select
                  id="framing-select"
                  value={selectedFraming || ''}
                  onChange={(e) => setSelectedFraming(e.target.value)}
                >
                  <option value="" disabled>{t('framingLabel')}</option>
                  {framingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select
                  id="position-action-select"
                  value={selectedPositionAction || ''}
                  onChange={(e) => setSelectedPositionAction(e.target.value)}
                >
                  <option value="" disabled>{t('positionActionLabel')}</option>
                  {positionActionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            <div className="dropdown-container">
              <label htmlFor="color-palette-select">{t('colorPaletteLabel')}</label>
              <select
                id="color-palette-select"
                value={selectedColorPalette || ''}
                onChange={(e) => setSelectedColorPalette(e.target.value)}
              >
                {colorPaletteOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="lighting-theme-select">{t('lightingThemeLabel')}</label>
              <select
                id="lighting-theme-select"
                value={selectedLightingTheme || ''}
                onChange={(e) => setSelectedLightingTheme(e.target.value)}
              >
                {lightingThemeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

          </div>
        </div> {/* End input-section */}

        {presetMessage && (
          <div className="preset-message animate-fade-in-up">
            {presetMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons-group">
          <button
            className="main-action-btn"
            onClick={() => generateImage(false)}
            disabled={!canGenerate}
          >
            {t('createBtn')}
          </button>
          <button
            className="secondary-action-btn"
            onClick={() => generateImage(true)}
            disabled={!canGenerateVariation}
          >
            <FaMagic className="mr-2" /> {t('generateVariationBtn')}
          </button>
          <button
            className="secondary-action-btn"
            onClick={resetForm}
            disabled={isLoading}
          >
            <FaRedo className="mr-2" /> {t('newGenerationBtn')}
          </button>
          {generatedImage && (
            <button
              className="secondary-action-btn"
              onClick={handleDownload}
            >
              <FaDownload className="mr-2" /> {t('downloadBtn')}
            </button>
          )}
          <button
            className="secondary-action-btn"
            onClick={handleSavePreset}
            disabled={!selectedDestination} // Only allow saving if at least a destination is picked
          >
            <FaSave className="mr-2" /> {t('savePresetBtn')}
          </button>
        </div>

        {/* Loader or Generated Image */}
        <div className="output-section">
          {isLoading ? (
            <div className="generation-loader">
              <div className="spinner"></div>
              <p>{loadingMessage}</p>
              <p className="mt-4 text-sm text-gray-400">{t('loadingTakingFewSeconds')}</p>
            </div>
          ) : generatedImage ? (
            <div className="generated-image-preview-container">
              <img src={`data:image/jpeg;base64,${generatedImage.base64}`} alt="Foto de Viagem Gerada" className="generated-image-output" />
              {error && <p className="error-message text-center mt-4">{error}</p>}
            </div>
          ) : (
            <div className="placeholder-image-preview">
              <p>{t('placeholderImage')}</p>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}
        </div>
        {credits <= 0 && !isLoading && <p className="text-red-400 mt-4 text-center">{t('creditsExhausted')}</p>}
      </main>

      <footer className="travelmundo-footer">
        {t('footer')}
      </footer>
    </div>
  );
};

export default TravelMundoPage;