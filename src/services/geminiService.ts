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

  const response = await fetch("/api/crop-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, location, soilColor, season }),
  });

  if (!response.ok) throw new Error("Failed to fetch crop suggestions");
  
  const result = await response.json() as CropSuggestionResponse;
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

  const response = await fetch("/api/crop-details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, location, latLng, query }),
  });

  if (!response.ok) throw new Error("Failed to fetch crop details");

  const result = await response.json() as CropDetailsResponse;
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

  const response = await fetch("/api/price-trends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, location, cropName }),
  });

  if (!response.ok) throw new Error("Failed to fetch price trends");
  
  const result = await response.json() as PriceTrendData[];
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {
    console.warn("Cache write error", e);
  }
  return result;
}

export async function generateLogoImage(): Promise<string | null> {
  try {
    const response = await fetch("/api/generate-logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.imageUrl;
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
    const response = await fetch("/api/generate-crop-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, aspectRatio }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const result = data.imageUrl;
    
    try {
      localStorage.setItem(cacheKey, result);
    } catch (e) {
      console.warn("Cache write error", e);
    }
    return result;
  } catch (error) {
    console.error("Error generating crop image:", error);
    return null;
  }
}

