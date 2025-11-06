

export interface ModuleInfo {
  name: string;
  icon: string;
  desc: string;
  link: string;
  isInternal?: boolean; // Added to distinguish internal pages
}

export interface GeneratedImageResult {
  id: string;
  base64: string;
  prompt: string;
  timestamp: Date;
}

export interface GenerateLifeMundoImageParams {
  imageBase64: string;
  mimeType: string;
  lifestyleType: string;
  scenario: string;
  actionPosition: string;
  clothesStyle: string;
  lightingClimate: string;
}