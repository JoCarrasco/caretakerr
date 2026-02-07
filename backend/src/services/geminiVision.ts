import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface InventoryExtraction {
    name: string | null;
    category: 'medicine' | 'supply' | null;
    quantity: number | null;
    unit: string | null;
    expiry_date: string | null;
    manufacturer: string | null;
    description: string | null;
    warnings: string | null;
    confidence: number;
    raw_response?: string;
}

/**
 * Analyze an image using Gemini Vision API to extract inventory item details
 */
export async function analyzeInventoryImage(
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg'
): Promise<InventoryExtraction> {
    try {
        // Preprocess image: resize and optimize
        const processedImage = await sharp(imageBuffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Convert to base64
        const base64Image = processedImage.toString('base64');

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Structured prompt for inventory extraction
        const prompt = `Analyze this product image and extract inventory details. Return ONLY a valid JSON object with this exact structure:

{
  "name": "Full product name",
  "category": "medicine" or "supply",
  "quantity": number (if visible on packaging, otherwise null),
  "unit": "tablets/ml/units/pieces/etc" (if applicable),
  "expiry_date": "YYYY-MM-DD" (if visible, otherwise null),
  "manufacturer": "Brand/manufacturer name",
  "description": "Brief product description",
  "warnings": "Any warnings, dosage info, or special notes",
  "confidence": 0-100 (your confidence in this extraction)
}

Guidelines:
- For medicines: Include dosage, active ingredients, NDC code if visible
- For supplies (diapers, wipes, food): Include size, count, material, intended use
- If a field is unclear or not visible, set it to null
- Set confidence lower if image quality is poor or text is unclear
- Category should be "medicine" for any pharmaceutical product, "supply" for everything else
- Be precise with expiry dates - only include if clearly visible

Return ONLY the JSON object, no additional text.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Parse JSON response
        let extraction: InventoryExtraction;
        try {
            // Remove markdown code blocks if present
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            extraction = JSON.parse(cleanedText);
            extraction.raw_response = text;
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', text);
            throw new Error('AI response was not valid JSON. Please try again or use manual entry.');
        }

        // Validate and sanitize the extraction
        return {
            name: extraction.name || null,
            category: ['medicine', 'supply'].includes(extraction.category as string)
                ? (extraction.category as 'medicine' | 'supply')
                : null,
            quantity: typeof extraction.quantity === 'number' ? extraction.quantity : null,
            unit: extraction.unit || null,
            expiry_date: extraction.expiry_date || null,
            manufacturer: extraction.manufacturer || null,
            description: extraction.description || null,
            warnings: extraction.warnings || null,
            confidence: Math.min(100, Math.max(0, extraction.confidence || 0)),
            raw_response: extraction.raw_response,
        };
    } catch (error: any) {
        console.error('Gemini Vision API error:', error);
        throw new Error(`AI analysis failed: ${error.message}`);
    }
}

/**
 * Validate that the API key is configured
 */
export function validateGeminiConfig(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
}
