import express, { Router } from "express";
import serverless from "serverless-http";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const router = Router();

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", JSON.stringify(req.headers));
  next();
});

// Mount router at multiple possible paths to handle different redirect scenarios
app.use("/.netlify/functions/server", router);
app.use("/api", router);
app.use("/", router);

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenAI({ apiKey });
}

// API routes
router.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({ 
    status: "ok", 
    hasKey: !!process.env.GEMINI_API_KEY,
    env: process.env.NODE_ENV,
    path: req.path,
    url: req.url
  });
});

router.post("/crop-suggestions", async (req, res) => {
  console.log("Crop suggestions requested", req.body);
  const { language, location, soilColor, season } = req.body;
  const langName = language === "mr" ? "Marathi" : language === "hi" ? "Hindi" : "English";
  
  try {
    const ai = getAI();
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
            weatherForecast: { type: Type.STRING },
            weatherDetails: {
              type: Type.OBJECT,
              properties: {
                temperature: { type: Type.STRING },
                humidity: { type: Type.STRING },
                rainChance: { type: Type.STRING },
              },
              required: ["temperature", "humidity", "rainChance"],
            },
            suggestedCrops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  expectedYield: { type: Type.STRING },
                  profitability: { type: Type.STRING },
                },
                required: ["name", "reason", "expectedYield", "profitability"],
              },
            },
          },
          required: ["weatherForecast", "weatherDetails", "suggestedCrops"],
        },
      },
    });
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Error in crop-suggestions:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/crop-details", async (req, res) => {
  console.log("Crop details requested", req.body);
  const { language, location, latLng, query } = req.body;
  const langName = language === "mr" ? "Marathi" : language === "hi" ? "Hindi" : "English";
  
  try {
    const ai = getAI();
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
    const mapLinks = chunks
      .filter((chunk: any) => chunk.maps?.uri)
      .map((chunk: any) => ({
        title: chunk.maps.title || "Map Link",
        uri: chunk.maps.uri,
      }));

    res.json({ markdown: text, mapLinks });
  } catch (error: any) {
    console.error("Error in crop-details:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/price-trends", async (req, res) => {
  console.log("Price trends requested", req.body);
  const { language, location, cropName } = req.body;
  const langName = language === "mr" ? "Marathi" : language === "hi" ? "Hindi" : "English";
  
  try {
    const ai = getAI();
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
              month: { type: Type.STRING },
              price: { type: Type.NUMBER },
            },
            required: ["month", "price"],
          },
        },
      },
    });
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Error in price-trends:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/generate-logo", async (req, res) => {
  try {
    const ai = getAI();
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
        return res.json({ 
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` 
        });
      }
    }
    res.status(404).json({ error: "No image generated" });
  } catch (error: any) {
    console.error("Error in generate-logo:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/generate-crop-image", async (req, res) => {
  const { query, aspectRatio } = req.body;
  try {
    const ai = getAI();
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
          aspectRatio: aspectRatio || "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return res.json({ 
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` 
        });
      }
    }
    res.status(404).json({ error: "No image generated" });
  } catch (error: any) {
    console.error("Error in generate-crop-image:", error);
    res.status(500).json({ error: error.message });
  }
});


export const handler = serverless(app);
