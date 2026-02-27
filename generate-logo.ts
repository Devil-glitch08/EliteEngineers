import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    console.log("Generating logo...");
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
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir);
        }
        fs.writeFileSync(path.join(publicDir, 'logo.png'), buffer);
        console.log("Logo generated and saved to public/logo.png");
        return;
      }
    }
    console.log("No image data found in response.");
  } catch (error) {
    console.error("Error generating logo:", error);
  }
}

main();
