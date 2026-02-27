import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CropSuggestionResponse {
  weatherForecast: string;
  weatherDetails: {
    temperature: string;
    humidity: string;
    rainChance: string;
  };
  suggestedCrops: {
    name: string;
    reason: string;
    expectedYield: string;
    profitability: string;
  }[];
}

export async function getCropSuggestions(
  language: string,
  location: string,
  soilColor: string,
  season: string
): Promise<CropSuggestionResponse> {
  const cacheKey = `suggestions_${language}_${location}_${soilColor}_${season}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn("Cache read error", e);
  }

  const langName = language === "mr" ? "Marathi" : language === "hi" ? "Hindi" : "English";
  const prompt = `You are an expert agricultural assistant.
Language: ${langName}
Location: ${location}
Soil Color: ${soilColor}
Season: ${season}

Provide a short weather forecast for this location and suggest 6 suitable crops to plant in the ${season} season based on the soil color and weather.
Also provide the current estimated temperature, humidity, and chance of rain for this location and season.
For each suggested crop, include the expected yield (e.g., "15-20 quintals per acre") and estimated profitability/market demand.
Return a JSON object with 'weatherForecast' (string), 'weatherDetails' (object with 'temperature', 'humidity', 'rainChance'), and 'suggestedCrops' (array of objects with 'name', 'reason', 'expectedYield', and 'profitability').
All text MUST be in ${langName}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weatherForecast: {
            type: Type.STRING,
            description: `Weather forecast in ${langName}`,
          },
          weatherDetails: {
            type: Type.OBJECT,
            properties: {
              temperature: { type: Type.STRING, description: `e.g., 28°C` },
              humidity: { type: Type.STRING, description: `e.g., 65%` },
              rainChance: { type: Type.STRING, description: `e.g., 20%` },
            },
            required: ["temperature", "humidity", "rainChance"],
          },
          suggestedCrops: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: `Crop name in ${langName}` },
                reason: { type: Type.STRING, description: `Reason for suggestion in ${langName}` },
                expectedYield: { type: Type.STRING, description: `Expected yield per acre in ${langName}` },
                profitability: { type: Type.STRING, description: `Estimated profitability or market demand in ${langName}` },
              },
              required: ["name", "reason", "expectedYield", "profitability"],
            },
          },
        },
        required: ["weatherForecast", "weatherDetails", "suggestedCrops"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  
  const result = JSON.parse(text) as CropSuggestionResponse;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {
    console.warn("Cache write error", e);
  }
  return result;
}

export interface CropDetailsResponse {
  markdown: string;
  mapLinks: { title: string; uri: string }[];
}

export async function getCropDetails(
  language: string,
  location: string,
  latLng: { lat: number; lng: number } | null,
  query: string
): Promise<CropDetailsResponse> {
  const cacheKey = `details_${language}_${location}_${query}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn("Cache read error", e);
  }

  const langName = language === "mr" ? "Marathi" : language === "hi" ? "Hindi" : "English";
  const prompt = `You are an expert agricultural assistant.
Language: ${langName}
Location: ${location}
User Query / Selected Item: ${query}

Please provide detailed information based on the user's query in Markdown format.
- If the query is a **Crop**: Provide recommended pesticides/fertilizers, estimated prices, growth duration, and estimated market price.
- If the query is a **Pesticide/Fertilizer**: Provide its usage, benefits, estimated price, AND a dedicated section for **Clear Usage Instructions & Safety Precautions**.
- If the query is about **Market Prices**: Provide the current estimated market prices for the requested item in the given location.
- Always include: Nearby shops where the user can buy the relevant agricultural products (use Google Maps tool to find real places).

All text MUST be in ${langName}.`;

  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (latLng) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: latLng.lat,
          longitude: latLng.lng,
        },
      },
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config,
  });

  const text = response.text || "";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const mapLinks: { title: string; uri: string }[] = [];
  
  for (const chunk of chunks) {
    if (chunk.maps?.uri) {
      mapLinks.push({
        title: chunk.maps.title || "Map Link",
        uri: chunk.maps.uri,
      });
    }
    if (chunk.maps?.placeAnswerSources?.reviewSnippets) {
        // Just extracting main URIs for simplicity
    }
  }

  const result = { markdown: text, mapLinks };
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {
    console.warn("Cache write error", e);
  }
  return result;
}

export interface PriceTrendData {
  month: string;
  price: number;
}

export async function getCropPriceTrends(
  language: string,
  location: string,
  cropName: string
): Promise<PriceTrendData[]> {
  const cacheKey = `price_trends_${language}_${location}_${cropName}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn("Cache read error", e);
  }

  const langName = language === "mr" ? "Marathi" : language === "hi" ? "Hindi" : "English";
  const prompt = `You are an expert agricultural economist.
Language: ${langName}
Location: ${location}
Crop/Product: ${cropName}

Provide the estimated average market price trends for this crop/product over the last 6 months in the given location.
Return a JSON array of objects, where each object has 'month' (string, e.g., "Jan", "Feb", translated to ${langName}) and 'price' (number, estimated price in local currency per standard unit, e.g., per quintal or kg).
Ensure the prices reflect realistic market fluctuations.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.STRING, description: `Month name in ${langName}` },
            price: { type: Type.NUMBER, description: `Estimated price` },
          },
          required: ["month", "price"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  
  const result = JSON.parse(text) as PriceTrendData[];
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {
    console.warn("Cache write error", e);
  }
  return result;
}

export async function generateLogoImage(): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: "A modern, clean, and vibrant logo for an app called 'Smart Shetkari' (Smart Farmer). The logo should feature a happy Indian farmer, a green leaf, a smartphone or wifi signal, and a sun. White background, vector art style, high quality, professional.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating logo image:", error);
    return null;
  }
}

export async function generateCropImage(query: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9"): Promise<string | null> {
  const cacheKey = `image_${query}_${aspectRatio}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch (e) {
    console.warn("Cache read error", e);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A highly realistic, photorealistic photograph of ${query} in an agricultural farm setting. Natural sunlight, highly detailed, 4k resolution, professional nature photography. No illustrations or cartoons.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const result = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        try {
          localStorage.setItem(cacheKey, result);
        } catch (e) {
          console.warn("Cache write error", e);
        }
        return result;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating crop image:", error);
    return null;
  }
}
