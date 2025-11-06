import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { GenerateLifeMundoImageParams } from './../types'; // Import the new interface

interface GenerateImageParams {
  imageBase64: string;
  mimeType: string;
  // style: string; // Removed as prompt will be pre-constructed
  // clothes: string; // Removed as prompt will be pre-constructed
  // scenario: string; // Removed as prompt will be pre-constructed
  prompt: string; // New: Accepts a pre-constructed prompt
}

interface GenerateSportImageParams {
  imageBase64: string;
  mimeType: string;
  sport: string;
  scenario: string;
  actionStyle: string;
  uniformName?: string;
  jerseyNumber?: number;
  lightingTheme: string;
  teamName?: string; // New: Optional team name for uniform
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Universal instruction for facial consistency and full-body framing (used by StyleMundo)
const STYLE_PERSON_CONSISTENCY_AND_FULLBODY_INSTRUCTION = `**ABSOLUTE PARAMOUNT CRUCIAL: The PRIMARY focus is to generate a full-body image of the person from the uploaded image, ensuring the MOST PERFECT AND UNWAVERING facial identity and features are maintained. The person's face MUST be recognizable and consistent with the original. The generated image MUST showcase a full-body view, dynamically placing the person in the chosen scenario, clearly depicting their entire clothing and style. The full body of the person from the original image must be entirely visible and integrated into the scene.**`;

// NEW instruction for SportMundo to ensure full-body images with facial consistency
const SPORT_PERSON_CONSISTENCY_AND_FULLBODY_INSTRUCTION = `**ABSOLUTE PARAMOUNT CRUCIAL: The PRIMARY focus is to generate a full-body image of the person from the uploaded image, ensuring the MOST PERFECT AND UNWAVERING facial identity and features are maintained. The person's face MUST be recognizable and consistent with the original. The generated image MUST showcase a full-body view, dynamically placing the person in the chosen sport scenario and action, clearly depicting their athletic form and entire uniform/clothing.**`;


export async function generatePhotographicEssay({
  imageBase64,
  mimeType,
  prompt, // Now receives the full prompt
}: GenerateImageParams): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set. Please ensure it's configured.");
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Appropriate for image editing/manipulation
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt, // Use the pre-constructed prompt directly
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const firstCandidate = response.candidates?.[0];
    if (firstCandidate && firstCandidate.content?.parts) {
      for (const part of firstCandidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    // If no inlineData found after checking all parts, try to get general text explanation
    if (response.text) {
      // The model might have returned text explaining why it couldn't generate an image
      throw new Error(`Model returned text instead of image. Possible reason: Safety policy or inability to generate. Response: "${response.text.substring(0, 200)}..."`);
    } else {
      // No image data and no general text explanation
      throw new Error("No image data or meaningful text found in the response. The model might have filtered the content or encountered an internal issue.");
    }
  } catch (error) {
    console.error("Error generating photographic essay:", error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateSportImage({
  imageBase64,
  mimeType,
  sport,
  scenario,
  actionStyle,
  uniformName,
  jerseyNumber,
  lightingTheme,
  teamName, // New: Accept teamName
}: GenerateSportImageParams): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set. Please ensure it's configured.");
  }

  const promptParts: string[] = [];
  // ABSOLUTE PARAMOUNT CRUCIAL: Facial consistency and framing are the absolute top priority, now for full-body.
  promptParts.push(SPORT_PERSON_CONSISTENCY_AND_FULLBODY_INSTRUCTION);

  promptParts.push(`Generate a realistic and cinematic sport image. The scene should depict:`);
  promptParts.push(`- Framing: Full-body shot`); // Explicitly request full-body
  promptParts.push(`- Sport: ${sport}`);
  promptParts.push(`- Scenario: ${scenario}`);
  promptParts.push(`- Action/Style: ${actionStyle}`);

  // Specific refinements based on user's request for SportMundo
  if (sport === "Surf" && actionStyle === "Saindo do Tubo") {
    promptParts.push(`- Visual Details: The person appears to be inside a translucent wave barrel or dramatically emerging from it. Include dynamic water spray, intense natural light reflecting off the wave's wall, conveying speed, power, and high emotion.`);
  } 
  // NEW: Specific instruction for Futebol, Vestiário, Comemorando to ensure maximum consistency
  else if (sport === "Futebol" && scenario === "Vestiário" && actionStyle === "Comemorando") {
    promptParts.push(`- Scene Composition: The athlete is prominently celebrating inside a modern and well-lit locker room. They are shown in a full-body pose, capturing the emotion of victory. This can include raising a trophy, cheering with arms up, or interacting joyfully with a soccer ball. Ensure the locker room environment (lockers, benches) is clearly visible and authentic to the setting, while maintaining maximum facial consistency and a clear view of the person's entire uniform.`);
  }
  else if (sport === "Futebol" && actionStyle === "Comemorando") {
    promptParts.push(`- Visual Details: The athlete is celebrating, prominently holding a trophy in their hand and looking forward with a victorious expression. The scene should suggest variations like raising the trophy overhead, holding it securely, or having their feet on a soccer ball while holding the trophy.`);
  }

  // This condition for Locker Room + Official Portrait can be independent as it's about scenario + action combination
  if (sport === "Futebol" && scenario === "Vestiário" && actionStyle === "Retrato Oficial") {
    promptParts.push(`- Scene Composition: A formal, front-facing official portrait in a locker room setting. The player can be standing or seated in front of their individual locker bench. Their personalized jersey, displaying name and number, is visibly hanging. The player can also be holding a trophy and looking forward, or have a soccer ball at their feet, enhancing the portrait's narrative.`);
  }

  if (teamName && sport === "Futebol") { // Add teamName to prompt if provided and sport is Futebol
    if (teamName.includes("Seleção")) {
      const countryName = teamName.replace('Seleção ', '');
      promptParts.push(`- Uniform: Official professional player uniform for the year 2025 of the ${countryName} National Team, with authentic colors, crest, and current game details. It must be rendered as an on-field athlete's kit, not fan attire.`.trim());
    } else if (teamName === "Clube do Remo") {
        promptParts.push(`- Uniform Theme: Official professional player uniform for the year 2025 of Clube do Remo, inspired by their classic navy blue kits. The jersey MUST be a solid, classic navy blue (azul-marinho) and feature a subtle, darker jacquard/embossed pattern across the fabric consisting of historical club symbols like crests and anchors. The collar and sleeve cuffs MUST be white. The shorts MUST be white. The team's crest on the chest MUST be a navy blue shield, outlined in white, containing the white intertwined letters 'CR'. It must NOT show an anchor inside the main crest. Below the crest, there should be a small golden banner with the text '20 ANOS DO REI'.`);
    } else if (teamName === "Paysandu Sport Club") {
        promptParts.push(`- Uniform Theme: Official professional player uniform for the year 2025 of Paysandu Sport Club. The jersey MUST feature the team's iconic vertical stripes of sky blue (azul celeste) and white. A subtle, lighter blue topographic/wavy line pattern should be integrated within the stripes. The sleeve cuffs MUST have a thin gold trim. The shorts MUST be white. The team's official crest MUST be accurately rendered on the chest: a shield with vertical sky blue and white stripes, featuring the stylized white monogram 'PSC' in the center. Two gold stars must be positioned above the shield.`);
    } else {
      promptParts.push(`- Uniform Theme: Official professional player uniform for the year 2025 of ${teamName} (with characteristic team colors and crest)`);
    }
  }
  if (uniformName) {
    promptParts.push(`- Uniform Name: "${uniformName}" (on jersey)`);
  }
  if (jerseyNumber !== undefined && jerseyNumber !== null && jerseyNumber !== 0) {
    promptParts.push(`- Jersey Number: "${jerseyNumber}" (on jersey)`);
  }
  promptParts.push(`- Lighting Theme: ${lightingTheme}`); // Lighting theme comes after all details
  promptParts.push(`Focus on a high-quality, professional sports photography aesthetic.`);

  const finalPrompt = promptParts.join('\n');

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const firstCandidate = response.candidates?.[0];
    if (firstCandidate && firstCandidate.content?.parts) {
      for (const part of firstCandidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    // If no inlineData found after checking all parts, try to get general text explanation
    if (response.text) {
      throw new Error(`Model returned text instead of image. Possible reason: Safety policy or inability to generate. Response: "${response.text.substring(0, 200)}..."`);
    } else {
      throw new Error("No image data or meaningful text found in the response. The model might have filtered the content or encountered an internal issue.");
    }
  } catch (error) {
    console.error("Error generating sport image:", error);
    throw new Error(`Failed to generate sport image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateLifeMundoImage({
  imageBase64,
  mimeType,
  lifestyleType,
  scenario,
  actionPosition,
  clothesStyle,
  lightingClimate,
}: GenerateLifeMundoImageParams): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set. Please ensure it's configured.");
  }

  const promptParts: string[] = [];

  // ABSOLUTE PARAMOUNT CRUCIAL: Facial consistency and framing are the absolute top priority.
  promptParts.push(STYLE_PERSON_CONSISTENCY_AND_FULLBODY_INSTRUCTION); // Using the general full-body instruction

  // General lifestyle parameters
  promptParts.push(`Generate a realistic and cinematic lifestyle image. The scene should depict:`);
  promptParts.push(`- Lifestyle Type: ${lifestyleType}`);
  promptParts.push(`- Scenario/Environment: ${scenario}`);
  promptParts.push(`- Action/Position: ${actionPosition}`);
  promptParts.push(`- Clothes Style: ${clothesStyle}`);
  promptParts.push(`- Lighting/Climate: ${lightingClimate}`);
  promptParts.push(`Focus on high-quality, professional photography aesthetics suitable for a luxury lifestyle magazine.`);

  // CRITICAL VISUAL DETAIL: General instruction for vehicles to be shown in full, even with close-up face
  if (
    lifestyleType === "Carros" ||
    lifestyleType === "Motos" ||
    lifestyleType === "Lanchas"
  ) {
    const vehicleName = lifestyleType === "Carros" ? "carro" : lifestyleType === "Motos" ? "moto" : "lancha"; 
    let fullVehicleInstruction = `\n**CRITICAL VISUAL DETAIL: Ensure the ${vehicleName} is prominently featured and 100% visible within the frame, composed to be clearly seen (e.g., in the background or mid-ground), even with the close-up focus on the person's face.`;
    if (lifestyleType === "Carros" || lifestyleType === "Lanchas") {
      fullVehicleInstruction += ` Show it completely, from front to back/side to side.`;
    } else if (lifestyleType === "Motos") {
      fullVehicleInstruction += ` Show it completely, from wheel to wheel.`;
    }
    fullVehicleInstruction += `**`;
    promptParts.push(fullVehicleInstruction);
  }

  // CRITICAL CONTEXT for "Lanchas" and "Rosto voltado ao mar"
  if (
    lifestyleType === "Lanchas" &&
    actionPosition === "Rosto voltado ao mar"
  ) {
    promptParts.push(`\n**CRITICAL CONTEXT: The person is actively on the lancha, with their face turned towards the sea, fully integrated into the boat setting. The lancha itself must be clearly visible as part of the scene composition, even with the close-up focus on the person's face.**`);
  }

  // ULTRA CRITICAL SCENE COMPOSITION: Specific and reinforced logic for "Carros", "Estrada panorâmica", "Dirigindo em movimento"
  if (
    lifestyleType === "Carros" &&
    scenario === "Estrada panorâmica" &&
    actionPosition === "Dirigindo em movimento"
  ) {
    promptParts.push(`\n**ULTRA CRITICAL SCENE COMPOSITION: While maintaining the close-up, front-facing/profile view of the person, the car must also be ENTIRELY visible, centrally prominent, precisely positioned ON THE ROAD, facing the direction of travel. The person must be clearly shown ACTIVELY driving, either facing forward or in profile. The view of the car must be COMPLETE and UNOBSTRUCTED, forming a dynamic background/mid-ground to the focused face.**`);
  }
  
  // ULTRA CRITICAL SCENE COMPOSITION: Specific logic for "Lanchas", "Dirigindo a lancha"
  if (
    lifestyleType === "Lanchas" &&
    actionPosition === "Dirigindo a lancha"
  ) {
    promptParts.push(`\n**ULTRA CRITICAL SCENE COMPOSITION: While maintaining the close-up, front-facing/profile view of the person, the lancha must also be ENTIRELY visible, centrally prominent, precisely positioned ON THE WATER, in clear motion. The person must be clearly shown ACTIVELY driving the lancha, either facing forward or in profile. The view of the lancha must be COMPLETE and UNOBSTRUCTED, forming a dynamic background/mid-ground to the focused face.**`);
  }

  // NEW: ULTRA CRITICAL SCENE COMPOSITION: Specific logic for "Lanchas", "Retrato oficial na lancha"
  if (
    lifestyleType === "Lanchas" &&
    actionPosition === "Retrato oficial na lancha"
  ) {
    promptParts.push(`\n**ULTRA CRITICAL SCENE COMPOSITION: While maintaining the close-up, front-facing/profile view of the person, ensure the person is elegantly positioned at the bow (front) of the lancha, facing forward (towards the camera or horizon). The lancha must be ENTIRELY visible and prominently featured in the composition, with the vast ocean or clear water as a backdrop. The scene should exude luxury and adventure, suitable for an official high-end portrait.**`);
  }


  const finalPrompt = promptParts.join('\n');

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const firstCandidate = response.candidates?.[0];
    if (firstCandidate && firstCandidate.content?.parts) {
      for (const part of firstCandidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    // If no inlineData found after checking all parts, try to get general text explanation
    if (response.text) {
      throw new Error(`Model returned text instead of image. Possible reason: Safety policy or inability to generate. Response: "${response.text.substring(0, 200)}..."`);
    } else {
      throw new Error("No image data or meaningful text found in the response. The model might have filtered the content or encountered an internal issue.");
    }
  } catch (error) {
    console.error("Error generating lifestyle image:", error);
    throw new Error(`Failed to generate lifestyle image: ${error instanceof Error ? error.message : String(error)}`);
  }
}