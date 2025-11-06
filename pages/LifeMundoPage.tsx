

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaInstagram, FaChevronLeft, FaDownload, FaRedo, FaMagic } from 'react-icons/fa';
import { generateLifeMundoImage } from '../services/geminiService';
import { GeneratedImageResult } from '../types';
import { INSTAGRAM_URL } from '../constants';
import '../App.css';
import './LifeMundoPage.css'; // Specific styles for this page

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

interface LifeMundoPageProps {
  onGoBack: () => void;
}

const LifeMundoPage: React.FC<LifeMundoPageProps> = ({ onGoBack }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [selectedLifestyle, setSelectedLifestyle] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedClothesStyle, setSelectedClothesStyle] = useState<string | null>(null);
  const [selectedLightingClimate, setSelectedLightingClimate] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [credits, setCredits] = useState(10); // Initial credits
  const [error, setError] = useState<string | null>(null);

  const loadingMessages = useRef([
    "🌅 Preparando o cenário dos seus sonhos...",
    "🚗 Posicionando sua melhor pose...",
    "🎬 Ajustando a iluminação cinematográfica...",
    "✨ Criando seu ensaio de lifestyle...",
    "✈️ Desenhando sua próxima aventura...",
    "🥂 Detalhando o momento perfeito...",
  ]);

  const lifestyleTypes = ["Carros", "Motos", "Lanchas", "Balões", "Natureza / Praia", "Cidade / Urbano", "Luxo / Fashion"];
  const clothesStyles = ["Casual elegante", "Social minimalista", "Esportivo", "Verão / Praia", "Fashion cinematográfico", "Luxo internacional"]; // Added "Luxo internacional"
  const lightingClimates = ["Diurno ensolarado", "Pôr do sol dourado", "Noturno urbano", "Cinematográfico azul", "Nevoado / Frio"];

  // New: Maps for dynamic scenarios and actions based on lifestyle
  const lifestyleScenariosMap: { [key: string]: string[] } = {
    "Carros": ["Estrada panorâmica", "Estacionamento de luxo", "Garagem esportiva", "Pista iluminada"], // Removed "Rooftop moderno"
    "Motos": ["Estrada litorânea", "Ponte moderna", "Estrada nas montanhas", "Mirante urbano"],
    "Lanchas": ["Marina / Iate", "Baía tropical", "Píer de luxo", "Mar aberto ao pôr do sol"],
    "Balões": ["Céu ao amanhecer", "Vale aberto", "Campo florido", "Horizonte com montanhas"],
    "Natureza / Praia": ["Praia paradisíaca", "Floresta tropical", "Dunas", "Cachoeira", "Campo aberto"],
    "Cidade / Urbano": ["Avenida noturna", "Cafeteria europeia", "Rooftop moderno", "Estação de metrô"],
    "Luxo / Fashion": ["Hotel 5 estrelas", "Studio minimalista", "Passarela fashion", "Loft moderno"],
  };

  const lifestyleActionsMap: { [key: string]: string[] } = {
    "Carros": ["De braços cruzados ao lado do carro", "Encostado na porta do carro", "Dirigindo em movimento", "Sentado no banco do motorista", "Caminhando próximo ao carro"],
    "Motos": ["Sentado na moto", "Acelerando em movimento", "Encostado na moto com capacete na mão", "Olhando para o horizonte", "Em modo retrato cinematográfico"],
    "Lanchas": ["De pé na proa da lancha", "Sentado relaxando no convés", "Pousando em uma lancha com roupa de verão", "Rosto voltado ao mar", "Retrato oficial na lancha", "Dirigindo a lancha"], // Updated
    "Balões": ["Dentro do cesto do balão", "Sorrindo durante o voo", "Olhando a paisagem de cima", "Segurando as cordas do balão", "Com o vento movimentando o cabelo"],
    "Natureza / Praia": ["Caminhando na areia", "Olhando o horizonte", "Correndo na praia", "De pé em uma rocha com o mar ao fundo", "Deitado em uma rede"],
    "Cidade / Urbano": ["Caminhando em rua noturna", "Parado em frente a vitrines", "Sentado em um café", "Andando na chuva com guarda-chuva", "Retrato fashion na calçada"],
    "Luxo / Fashion": ["Sentado em poltrona de luxo", "Pousando como modelo", "Em pé ao lado de uma mesa elegante", "Caminhando com estilo", "Olhar confiante para a câmera"],
  };

  const getRandomLoadingMessage = () => {
    const messages = loadingMessages.current;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Effect to reset scenario and action when lifestyle changes
  useEffect(() => {
    setSelectedScenario(null);
    setSelectedAction(null);
  }, [selectedLifestyle]);

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

  const generateImage = useCallback(async () => {
    setError(null);
    if (!uploadedImageBase64 || !uploadedFile || !selectedLifestyle || !selectedScenario || !selectedAction || !selectedClothesStyle || !selectedLightingClimate) {
      setError("Por favor, preencha todos os campos obrigatórios (foto, tipo de lifestyle, cenário, ação, roupa e iluminação).");
      return;
    }
    if (credits <= 0) {
      setError("Você não tem créditos suficientes para gerar uma nova imagem. Por favor, recarregue ou tente mais tarde.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage(getRandomLoadingMessage());

    try {
      const newImageBase64 = await generateLifeMundoImage({
        imageBase64: uploadedImageBase64,
        mimeType: uploadedFile.type,
        lifestyleType: selectedLifestyle,
        scenario: selectedScenario,
        actionPosition: selectedAction,
        clothesStyle: selectedClothesStyle,
        lightingClimate: selectedLightingClimate,
      });

      const promptSummary = `Lifestyle: ${selectedLifestyle}, Cenário: ${selectedScenario}, Ação: ${selectedAction}, Roupa: ${selectedClothesStyle}, Iluminação: ${selectedLightingClimate}`;

      setGeneratedImage({
        id: crypto.randomUUID(),
        base64: newImageBase64,
        prompt: promptSummary,
        timestamp: new Date(),
      });
      setCredits(prev => prev - 1);

    } catch (err) {
      console.error("API Error during image generation:", err);
      setError(`Falha ao gerar a imagem: ${err instanceof Error ? err.message : String(err)}. Verifique sua conexão ou tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImageBase64, uploadedFile, selectedLifestyle, selectedScenario, selectedAction, selectedClothesStyle, selectedLightingClimate, credits]);

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${generatedImage.base64}`;
      link.download = `lifemundo_ia_${generatedImage.id}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setUploadedImageBase64(null);
    setSelectedLifestyle(null); // Reset lifestyle
    setSelectedScenario(null);  // Will be reset by useEffect too, but good for clarity
    setSelectedAction(null);    // Will be reset by useEffect too
    setSelectedClothesStyle(null);
    setSelectedLightingClimate(null);
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
  };

  // Ensure scenarios and actions are only available if a lifestyle is selected
  const availableScenarios = selectedLifestyle ? lifestyleScenariosMap[selectedLifestyle] : [];
  const availableActions = selectedLifestyle ? lifestyleActionsMap[selectedLifestyle] : [];

  const canGenerate = uploadedImageBase64 && selectedLifestyle && selectedScenario && selectedAction && selectedClothesStyle && selectedLightingClimate && !isLoading && credits > 0;
  const canGenerateVariation = generatedImage && !isLoading && credits > 0;

  return (
    <div className="lifemundo-page-container portal-container">
      <button className="back-btn" onClick={onGoBack}>
        <FaChevronLeft className="mr-2" /> Voltar ao Portal
      </button>

      <header className="lifemundo-header">
        <h1 className="title">LifeMundo IA — Viva Seu Estilo de Vida Cinematográfico com IA</h1>
        <p className="subtitle">Gere imagens realistas e profissionais do seu lifestyle — carros, viagens, aventuras e momentos épicos.</p>
      </header>

      <main className="lifemundo-content">
        <div className="input-section">
          {/* Upload Area */}
          <div className="upload-area">
            <label htmlFor="file-upload" className="upload-label">
              {uploadedImageBase64 ? (
                <img src={`data:${uploadedFile?.type};base64,${uploadedImageBase64}`} alt="Pré-visualização" className="uploaded-image-preview" />
              ) : (
                <span>Envie sua foto base (rosto visível e bem iluminado).</span>
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
              <label htmlFor="lifestyle-select">Tipo de Lifestyle</label>
              <select
                id="lifestyle-select"
                value={selectedLifestyle || ''}
                onChange={(e) => setSelectedLifestyle(e.target.value)}
              >
                <option value="" disabled>Selecione um tipo</option>
                {lifestyleTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="scenario-select">Cenário / Ambiente</label>
              <select
                id="scenario-select"
                value={selectedScenario || ''}
                onChange={(e) => setSelectedScenario(e.target.value)}
                disabled={!selectedLifestyle} // Disable if no lifestyle selected
              >
                <option value="" disabled>{selectedLifestyle ? "Selecione um cenário" : "Selecione um Lifestyle primeiro"}</option>
                {availableScenarios.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="action-select">Ação / Posição</label>
              <select
                id="action-select"
                value={selectedAction || ''}
                onChange={(e) => setSelectedAction(e.target.value)}
                disabled={!selectedLifestyle} // Disable if no lifestyle selected
              >
                <option value="" disabled>{selectedLifestyle ? "Selecione uma ação/posição" : "Selecione um Lifestyle primeiro"}</option>
                {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="clothes-select">Estilo de Roupa</label>
              <select
                id="clothes-select"
                value={selectedClothesStyle || ''}
                onChange={(e) => setSelectedClothesStyle(e.target.value)}
              >
                <option value="" disabled>Selecione o estilo da roupa</option>
                {clothesStyles.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="lighting-select">Iluminação / Clima</label>
              <select
                id="lighting-select"
                value={selectedLightingClimate || ''}
                onChange={(e) => setSelectedLightingClimate(e.target.value)}
              >
                <option value="" disabled>Selecione a iluminação/clima</option>
                {lightingClimates.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div> {/* End input-section */}

        {/* Action Buttons */}
        <div className="action-buttons-group">
          <button
            className="main-action-btn"
            onClick={() => generateImage()}
            disabled={!canGenerate}
          >
            ⚡ Criar Foto Cinematográfica ({credits} créditos)
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
            onClick={() => generateImage()} // Call generateImage again for variation
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
              <p className="mt-4 text-sm text-gray-400">Transformando sua visão em realidade...</p>
            </div>
          ) : generatedImage ? (
            <div className="generated-image-preview-container">
              <img src={`data:image/jpeg;base64,${generatedImage.base64}`} alt="Foto Lifestyle Gerada" className="generated-image-output" />
              {error && <p className="error-message text-center mt-4">{error}</p>}
            </div>
          ) : (
            <div className="placeholder-image-preview">
              <p>Sua foto de lifestyle cinematográfica aparecerá aqui.</p>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}
        </div>
        {credits <= 0 && !isLoading && <p className="text-red-400 mt-4 text-center">Créditos esgotados! Recarregue para gerar mais.</p>}
      </main>

      <footer className="lifemundo-footer">
        © 2025 <strong>LifeMundo IA</strong> | Desenvolvido por Fabricio Menezes IA
      </footer>
    </div>
  );
};

export default LifeMundoPage;