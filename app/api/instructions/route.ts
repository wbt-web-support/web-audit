import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  let siteUrl, instructions, options;
  try {
    // Parse the request body outside the try-catch for error handling
    ({ siteUrl, instructions, options } = await req.json());
  } catch (parseErr: any) {
    console.log("Error parsing request body in instructions API:", parseErr);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not set.' }, { status: 500 });
    }

    // Initialize the SDK
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // Format the prompt with structure instructions
    const structurePrompt = `You are an assistant that returns responses in a JSON object format. For each instruction provided, create a separate property in the object, where the key is a unique identifier (e.g., instruction_1, instruction_2, etc.), and the value is an object with at least 'title' and 'content' fields. If you cannot fulfill an instruction due to limitations, return a message in the 'content' field explaining the limitation. Example:\n{\n  \"instruction_1\": { \"title\": \"...\", \"content\": \"...\" },\n  \"instruction_2\": { \"title\": \"...\", \"content\": \"Sorry, this instruction cannot be fulfilled due to API limitations: [reason here].\" }\n}\nReturn only the JSON object, no extra text.\n`;
    const prompt = `${structurePrompt}Site: ${siteUrl}\nInstructions: ${instructions.map((i: any) => i.text).join('; ')}\nOptions: ${JSON.stringify(options)}`;

    // Generate content
    const result = await model.generateContent(prompt);
    console.log("Gemini raw response:", result);

    // Try to parse the response as JSON
    let structuredResponse = null;
    try {
      structuredResponse = JSON.parse(result.response.text());
    } catch (e) {
      // If parsing fails, fallback to raw text
      structuredResponse = { raw: result.response.text() };
    }
    console.log("Final structured response:", structuredResponse);
    return NextResponse.json(structuredResponse);
  } catch (err: any) {
    console.log("Error in instructions API:", err);
    // If the error is related to a specific instruction, return a structured limitation message
    if (err && err.message && typeof instructions !== 'undefined' && Array.isArray(instructions)) {
      const limitationResponse: Record<string, any> = {};
      instructions.forEach((inst: any, idx: number) => {
        limitationResponse[`instruction_${idx + 1}`] = {
          title: inst.text || `Instruction ${idx + 1}`,
          content: `Sorry, this instruction cannot be fulfilled due to server/API limitations: ${err.message}`
        };
      });
      return NextResponse.json(limitationResponse, { status: 500 });
    }
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 