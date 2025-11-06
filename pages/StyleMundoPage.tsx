
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaInstagram, FaChevronLeft, FaDownload, FaRedo, FaMagic } from 'react-icons/fa'; // Removed FaArrowLeft, FaArrowRight as carousel navigation is removed for grid mode
import { generatePhotographicEssay } from '../services/geminiService';
import { GeneratedImageResult } from '../types';
import { INSTAGRAM_URL } from '../constants';
import '../App.css';
import './StyleMundoPage.css'; // Specific styles for this page

// Declare JSZip and saveAs from FileSaver.js globally as they are loaded via CDN
declare const JSZip: any;
declare const saveAs: any;

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

interface StyleMundoPageProps {
  onGoBack: () => void;
}

// Universal instruction for facial consistency and full-body framing
const STYLE_PERSON_CONSISTENCY_AND_FULLBODY_INSTRUCTION = `**ABSOLUTE PARAMOUNT CRUCIAL: The PRIMARY focus is to generate a full-body image of the person from the uploaded image, ensuring the MOST PERFECT AND UNWAVERING facial identity and features are maintained. The person's face MUST be recognizable and consistent with the original. The generated image MUST showcase a full-body view, dynamically placing the person in the chosen scenario, clearly depicting their entire clothing and style. The full body of the person from the original image must be entirely visible and integrated into the scene.**`;


// --- New Configuration Data ---

const stylesOptions = [
  "Retrato Profissional",
  "Casual",
  "Fashion Editorial",
  "Executivo",
  "Cinematográfico",
  "Ensaio Fotográfico Completo", // The special one
];

const clothesOptions = [
  "Casual moderno",
  "Social elegante",
  "Esportivo",
  "Fantasia criativa",
  "Streetwear",
  "Fashion estilizado",
  "Alta-costura",
  "Criativo",
  "Terno / Blazer / Gravata / Tailleur",
  "Roupa preta / Casaco longo",
  "Blazer / Camisa clara",
  "Jeans / Camisa polo",
];

const scenariosConfig: { [key: string]: string[] } = {
  "Retrato Profissional": ["Estúdio", "Fundo neutro", "Ambiente corporativo"],
  "Casual": ["Parque", "Rua urbana", "Praia", "Natureza"],
  "Fashion Editorial": ["Loft", "Estúdio iluminado", "Passarela", "Fachada moderna"],
  "Executivo": ["Escritório", "Sala de reuniões", "Rooftop empresarial"],
  "Cinematográfico": ["Rua noturna", "Bar", "Ponto urbano com néon", "Interior com contraste"],
  "Ensaio Fotográfico Completo": ["Rooftop Moderno", "Natureza / Externa", "Ambiente Corporativo", "Estúdio Fotográfico"],
  "default": ["Estúdio", "Rua noturna", "Praia", "Paris / Roma / Nova York", "Natureza tropical"], // Fallback if no specific match
};

const getEssayPosePrompts = (scenario: string, clothes: string): string[] => {
  const poses: string[] = [];
  const basePromptPrefix = `${STYLE_PERSON_CONSISTENCY_AND_FULLBODY_INSTRUCTION}\nCrie uma imagem realista e cinematográfica para um ensaio fotográfico.`;

  const scenarioAmbiance: { [key: string]: string } = {
    "Rooftop Moderno": "Ambiente: cobertura urbana moderna, ao pôr do sol, com skyline visível e iluminação suave de fim de tarde. A pessoa está vestindo: ${clothes}.",
    "Natureza / Externa": "Ambiente: floresta, trilha, campo aberto ou praia; luz natural, atmosfera leve e orgânica. A pessoa está vestindo: ${clothes}.",
    "Ambiente Corporativo": "Ambiente: escritório moderno, mesa de vidro, cadeira executiva, janelas amplas com luz branca difusa. A pessoa está vestindo: ${clothes}.",
    "Estúdio Fotográfico": "Ambiente: fundo neutro, controle total de luz e contraste. A pessoa está vestindo: ${clothes}.",
  };

  const finalBasePrompt = `${basePromptPrefix}\n${scenarioAmbiance[scenario].replace('${clothes}', clothes)}`;

  switch (scenario) {
    case "Rooftop Moderno":
      poses.push(
        `${finalBasePrompt} Pose: Em pé, mãos nos bolsos, olhando o horizonte, expressão confiante.`,
        `${finalBasePrompt} Pose: Encostado no corrimão de vidro, observando a cidade, luz dourada lateral.`,
        `${finalBasePrompt} Pose: Sentado em uma cadeira moderna, pernas cruzadas, olhar relaxado.`,
        `${finalBasePrompt} Pose: Caminhando pelo rooftop, blazer nas mãos, vento leve no cabelo.`,
        `${finalBasePrompt} Pose: Braços cruzados, meio perfil com fundo desfocado da cidade.`,
        `${finalBasePrompt} Pose: De costas, olhando o pôr do sol, luz quente atrás.`,
        `${finalBasePrompt} Pose: Sentado no chão com uma perna dobrada, expressão contemplativa.`,
        `${finalBasePrompt} Pose: Segurando uma xícara ou copo, expressão casual e elegante.`,
        `${finalBasePrompt} Pose: De pé, um ombro levemente voltado para a câmera, luz azulada noturna.`,
        `${finalBasePrompt} Pose: Olhando para baixo, mãos unidas à frente, pose introspectiva e cinematográfica.`,
      );
      break;
    case "Natureza / Externa":
      poses.push(
        `${finalBasePrompt} Pose: Caminhando em uma trilha arborizada, sorriso leve e natural.`,
        `${finalBasePrompt} Pose: Sentado em uma pedra, expressão serena, luz suave nas folhas.`,
        `${finalBasePrompt} Pose: De pé, braços abertos, sentindo o vento, olhar voltado ao horizonte.`,
        `${finalBasePrompt} Pose: Encostado em uma árvore, meio perfil, luz filtrada entre os galhos.`,
        `${finalBasePrompt} Pose: Ajoelhado ou agachado, olhando para o chão com expressão calma.`,
        `${finalBasePrompt} Pose: Caminhando descalço na grama, mãos nos bolsos, olhar confiante.`,
        `${finalBasePrompt} Pose: Sentado em um banco de madeira, braços relaxados sobre os joelhos.`,
        `${finalBasePrompt} Pose: Olhando para o alto com luz solar direta no rosto, tom de descoberta.`,
        `${finalBasePrompt} Pose: Em movimento, girando o corpo levemente, roupa fluida e natural.`,
        `${finalBasePrompt} Pose: De costas, caminhando em direção ao pôr do sol, iluminação dourada.`,
      );
      break;
    case "Ambiente Corporativo":
      poses.push(
        `${finalBasePrompt} Pose: Em pé ao lado da mesa, uma mão no bolso, a outra apoiada na mesa.`,
        `${finalBasePrompt} Pose: Sentado na cadeira executiva, corpo levemente inclinado à frente, olhar seguro.`,
        `${finalBasePrompt} Pose: Encostado em uma parede de vidro, expressão concentrada.`,
        `${finalBasePrompt} Pose: Segurando um tablet ou laptop, sorriso leve, pose natural.`,
        `${finalBasePrompt} Pose: Braços cruzados, fundo de escritório desfocado, luz fria.`,
        `${finalBasePrompt} Pose: Caminhando no corredor, olhar direto, expressão determinada.`,
        `${finalBasePrompt} Pose: Sentado lateralmente, mãos sobre o braço da cadeira, postura firme.`,
        `${finalBasePrompt} Pose: Em pé junto à janela, olhando a vista com ar reflexivo.`,
        `${finalBasePrompt} Pose: Mãos na cintura, expressão de liderança, luz de destaque no rosto.`,
        `${finalBasePrompt} Pose: Sentado em uma mesa redonda, gesticulando como em reunião.`,
      );
      break;
    case "Estúdio Fotográfico":
      poses.push(
        `${finalBasePrompt} Pose: Em pé, com mãos nos bolsos, olhando para a câmera.`,
        `${finalBasePrompt} Pose: Sentado em uma cadeira elegante, expressão confiante.`,
        `${finalBasePrompt} Pose: Braços cruzados, meio perfil.`,
        `${finalBasePrompt} Pose: Mãos unidas na frente do corpo, leve sorriso.`,
        `${finalBasePrompt} Pose: Encostado na parede, olhar lateral.`,
        `${finalBasePrompt} Pose: Sentado com perna cruzada, expressão pensativa.`,
        `${finalBasePrompt} Pose: Meio corpo, sorriso leve.`,
        `${finalBasePrompt} Pose: Meio perfil, luz lateral forte.`,
        `${finalBasePrompt} Pose: Retrato close-up, olhar direto.`,
        `${finalBasePrompt} Pose: Caminhando em direção à câmera, expressão natural e confiante.`,
      );
      break;
    default:
      console.warn("Unknown scenario for 'Ensaio Fotográfico Completo', using generic prompts.");
      poses.push(`${basePromptPrefix}\nAmbiente: ${scenario}. A pessoa está vestindo: ${clothes}.`);
      break;
  }
  return poses;
};


const StyleMundoPage: React.FC<StyleMundoPageProps> = ({ onGoBack }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedClothes, setSelectedClothes] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageResult[] | null>(null); // Now an array
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [credits, setCredits] = useState(10); // Initial credits
  const [error, setError] = useState<string | null>(null);
  const [selectionConfirmation, setSelectionConfirmation] = useState<string | null>(null);
  const [generationSuccessMessage, setGenerationSuccessMessage] = useState<string | null>(null); // New state for success message


  const loadingMessages = useRef([
    "Renderizando sua nova imagem...",
    "Ajustando iluminação cinematográfica...",
    "Criando textura e profundidade...",
    "Finalizando seu ensaio...",
    "Adicionando os últimos retoques de IA...",
    "Gerando uma obra-prima para você..."
  ]);

  const showConfirmationMessage = (message: string) => {
    setSelectionConfirmation(message);
    setTimeout(() => {
      setSelectionConfirmation(null);
    }, 3000); // Message disappears after 3 seconds
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setGeneratedImages(null); // Clear previous images on new file upload
    setGenerationSuccessMessage(null); // Clear success message
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

  const getRandomLoadingMessage = () => {
    const messages = loadingMessages.current;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Effect to reset scenario when style changes
  useEffect(() => {
    setSelectedScenario(null);
  }, [selectedStyle]);


  const generateImage = useCallback(async (isVariation: boolean = false) => {
    setError(null);
    setGenerationSuccessMessage(null); // Clear previous success message
    if (!uploadedImageBase64 || !uploadedFile || !selectedStyle || !selectedClothes || !selectedScenario) {
      setError("Por favor, preencha todos os campos obrigatórios (foto, estilo, roupa e cenário).");
      return;
    }

    const requiredCredits = selectedStyle === "Ensaio Fotográfico Completo" ? 10 : 1;
    if (credits < requiredCredits) {
      setError(`Você não tem créditos suficientes para gerar ${requiredCredits} imagem(ns). Por favor, recarregue ou tente mais tarde.`);
      return;
    }

    setIsLoading(true);
    setLoadingMessage(getRandomLoadingMessage());
    setGeneratedImages(null); // Clear previous images while generating new one(s)

    try {
      const generatedResults: GeneratedImageResult[] = [];

      if (selectedStyle === "Ensaio Fotográfico Completo") {
        const essayPrompts = getEssayPosePrompts(selectedScenario, selectedClothes);
        for (let i = 0; i < essayPrompts.length; i++) {
          setLoadingMessage(`Gerando imagem ${i + 1} de ${essayPrompts.length}...`);
          const prompt = essayPrompts[i];
          const newImageBase64 = await generatePhotographicEssay({
            imageBase64: uploadedImageBase64,
            mimeType: uploadedFile.type,
            prompt: prompt,
          });
          generatedResults.push({
            id: crypto.randomUUID(),
            base64: newImageBase64,
            prompt: prompt, // Store the specific prompt for this image
            timestamp: new Date(),
          });
        }
        setCredits(prev => prev - essayPrompts.length); // Deduct 1 credit per image
        setGenerationSuccessMessage(`📸 Suas ${essayPrompts.length} fotos foram geradas com sucesso!`);
      } else {
        // Single image generation
        let finalPrompt = `${STYLE_PERSON_CONSISTENCY_AND_FULLBODY_INSTRUCTION}\n`;
        finalPrompt += `Create a realistic and cinematic photographic essay. Apply the following characteristics:\n`;
        finalPrompt += `- Framing: Full-body shot, showing the person from head to toe.\n`;
        finalPrompt += `- Overall Style: ${selectedStyle}\n`;
        finalPrompt += `- Clothes: ${selectedClothes}\n`;
        finalPrompt += `- Scenario/Environment: ${selectedScenario}`;

        const newImageBase64 = await generatePhotographicEssay({
          imageBase64: uploadedImageBase64,
          mimeType: uploadedFile.type,
          prompt: finalPrompt,
        });

        const promptSummary = `Estilo: ${selectedStyle}, Roupa: ${selectedClothes}, Cenário: ${selectedScenario}`;
        generatedResults.push({
          id: crypto.randomUUID(),
          base64: newImageBase64,
          prompt: promptSummary,
          timestamp: new Date(),
        });
        setCredits(prev => prev - 1);
        setGenerationSuccessMessage(`📸 Sua foto foi gerada com sucesso!`);
      }
      setGeneratedImages(generatedResults);
    } catch (err) {
      console.error("API Error during image generation:", err);
      setError(`Falha ao gerar a imagem: ${err instanceof Error ? err.message : String(err)}. Verifique sua conexão ou tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImageBase64, uploadedFile, selectedStyle, selectedClothes, selectedScenario, credits]);


  const handleDownload = (imageToDownload: GeneratedImageResult) => {
    if (imageToDownload) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${imageToDownload.base64}`; // Assume JPEG output from model
      link.download = `stylumundo_essay_${imageToDownload.id}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAllAsZip = async () => {
    if (!generatedImages || generatedImages.length === 0) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Preparando download de todas as imagens...");
    setError(null); // Clear any previous errors

    try {
      const zip = new JSZip();
      const folderName = "StyleMundo_Ensaio_Completo";

      for (let i = 0; i < generatedImages.length; i++) {
        const img = generatedImages[i];
        const fileName = `stylumundo_essay_${i + 1}.jpeg`;
        // Convert base64 to Blob to add to zip
        const byteCharacters = atob(img.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        zip.file(`${folderName}/${fileName}`, byteArray, { base64: false });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
      setLoadingMessage("Download iniciado!");
    } catch (err) {
      console.error("Error generating ZIP:", err);
      setError(`Falha ao gerar o arquivo ZIP: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage(""); // Clear loading message
    }
  };


  const resetForm = () => {
    setUploadedFile(null);
    setUploadedImageBase64(null);
    setSelectedStyle(null);
    setSelectedClothes(null);
    setSelectedScenario(null);
    setGeneratedImages(null);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
    setSelectionConfirmation(null);
    setGenerationSuccessMessage(null); // Clear success message
  };

  const currentScenarios = selectedStyle ? (scenariosConfig[selectedStyle] || scenariosConfig["default"]) : scenariosConfig["default"];

  const canGenerate = uploadedImageBase64 && selectedStyle && selectedClothes && selectedScenario && !isLoading && credits > 0;
  const canGenerateVariation = uploadedImageBase64 && selectedStyle && selectedClothes && selectedScenario && !isLoading && credits > 0; // Variation can be generated even without previous images

  const isCompleteEssayMode = selectedStyle === "Ensaio Fotográfico Completo";

  return (
    <div className="stylemundo-page-container portal-container">
      <button className="back-btn" onClick={onGoBack}>
        <FaChevronLeft className="mr-2" /> Voltar ao Portal
      </button>

      <header className="stylemundo-header">
        <h1 className="title">StyleMundo IA — Seu Ensaio Fotográfico com Inteligência Artificial</h1>
        <p className="subtitle">Transforme sua foto comum em um ensaio cinematográfico e profissional.</p>
      </header>

      <main className="stylemundo-content">
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
              <label htmlFor="style-select">1. Escolha o Estilo do Ensaio</label>
              <select
                id="style-select"
                value={selectedStyle || ''}
                onChange={(e) => {
                  setSelectedStyle(e.target.value);
                  showConfirmationMessage(`Estilo '${e.target.value}' selecionado! ✨`);
                }}
              >
                <option value="" disabled>Selecione um estilo</option>
                {stylesOptions.map(style => <option key={style} value={style}>{style}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="clothes-select">2. Escolha de Roupas e Acessórios</label>
              <select
                id="clothes-select"
                value={selectedClothes || ''}
                onChange={(e) => {
                  setSelectedClothes(e.target.value);
                  showConfirmationMessage(`Roupa '${e.target.value}' selecionada! 👕`);
                }}
              >
                <option value="" disabled>Selecione a roupa</option>
                {clothesOptions.map(clothes => <option key={clothes} value={clothes}>{clothes}</option>)}
              </select>
            </div>

            <div className="dropdown-container">
              <label htmlFor="scenario-select">3. Escolha do Cenário</label>
              <select
                id="scenario-select"
                value={selectedScenario || ''}
                onChange={(e) => {
                  setSelectedScenario(e.target.value);
                  showConfirmationMessage(`Cenário '${e.target.value}' selecionado! 🏞️`);
                }}
                disabled={!selectedStyle} // Disable if no style selected
              >
                <option value="" disabled>{selectedStyle ? "Selecione um cenário" : "Selecione um Estilo primeiro"}</option>
                {currentScenarios.map(scenario => <option key={scenario} value={scenario}>{scenario}</option>)}
              </select>
            </div>
          </div>
        </div> {/* End input-section */}

        {selectionConfirmation && (
          <div className="selection-confirmation animate-fade-in-up">
            {selectionConfirmation}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons-group">
          <button
            className="main-action-btn"
            onClick={() => generateImage(false)}
            disabled={!canGenerate}
          >
            ⚡ Criar Ensaio Fotográfico ({isCompleteEssayMode ? 10 : 1} créditos)
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
            onClick={() => generateImage(true)} // Call generateImage again for variation
            disabled={!canGenerateVariation}
          >
            <FaMagic className="mr-2" /> Gerar Variação ({isCompleteEssayMode ? 10 : 1} créditos)
          </button>
        </div>

        {/* Loader or Generated Image */}
        <div className="output-section">
          {isLoading ? (
            <div className="generation-loader">
              <div className="spinner"></div>
              <p>{loadingMessage}</p>
              <p className="mt-4 text-sm text-gray-400">Isso pode levar alguns segundos...</p>
            </div>
          ) : generatedImages && generatedImages.length > 0 ? (
            <div className="generated-content-wrapper">
              {generationSuccessMessage && (
                <p className="generation-success-message animate-fade-in-up">
                  {generationSuccessMessage}
                </p>
              )}

              {isCompleteEssayMode && generatedImages.length > 1 && (
                <div className="download-all-container">
                  <button
                    className="download-all-btn"
                    onClick={handleDownloadAllAsZip}
                    disabled={isLoading}
                  >
                    <FaDownload className="mr-2" /> Baixar Todas ({generatedImages.length})
                  </button>
                </div>
              )}

              {isCompleteEssayMode && generatedImages.length > 1 ? (
                // Grid Gallery for "Ensaio Fotográfico Completo"
                <div className="grid-gallery-container">
                  {generatedImages.map((image, index) => (
                    <div key={image.id} className="gallery-item">
                      <img
                        src={`data:image/jpeg;base64,${image.base64}`}
                        alt={`Ensaio Gerado ${index + 1}`}
                        className="generated-image-output-grid"
                      />
                      <button
                        className="small-download-btn"
                        onClick={() => handleDownload(image)}
                        aria-label={`Baixar imagem ${index + 1}`}
                      >
                        <FaDownload />
                      </button>
                    </div>
                  ))}
                  {error && <p className="error-message text-center mt-4 w-full">{error}</p>}
                </div>
              ) : (
                // Single Image Display for other styles
                <div className="generated-image-preview-container">
                  <img
                    src={`data:image/jpeg;base64,${generatedImages[0].base64}`}
                    alt="Ensaio Gerado"
                    className="generated-image-output"
                  />
                  {error && <p className="error-message text-center mt-4">{error}</p>}
                  {/* Single download button for non-essay mode */}
                  {!isCompleteEssayMode && (
                    <button
                      className="secondary-action-btn single-image-download-btn"
                      onClick={() => handleDownload(generatedImages[0])}
                    >
                      <FaDownload className="mr-2" /> Baixar
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="placeholder-image-preview">
              <p>Seu ensaio fotográfico gerado aparecerá aqui.</p>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}
        </div>
        {credits <= 0 && !isLoading && <p className="text-red-400 mt-4 text-center">Créditos esgotados! Recarregue para gerar mais.</p>}
      </main>

      <footer className="stylemundo-footer">
        Gerado com ❤️ por <strong>TravelMundo IA</strong>
      </footer>
    </div>
  );
};

export default StyleMundoPage;