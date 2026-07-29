import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function transliterateTextToHinglish(text: string): Promise<string> {
  // Check if the text contains Devanagari characters (Hindi script)
  const containsDevanagari = /[\u0900-\u097F]/.test(text);
  if (!containsDevanagari || !GEMINI_API_KEY) {
    return text;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const systemPrompt = "You are a specialized transliteration AI that converts Hindi written in Devanagari script (Hindi characters) to Hinglish script (Hindi written in Roman/English characters, e.g. 'namaste' for 'नमस्ते', 'aap kaise hain' for 'आप कैसे हैं').";
    const prompt = `Convert the following text/srt data to Hinglish script. Do NOT translate it to English meaning. Keep the words in Hindi but write them using Roman/English letters. Keep all timing markers, indices, structure, and spacing exactly the same if it is SRT. Return ONLY the transliterated text without any codeblocks, explanation, notes, or markdown formatting.\n\nText:\n${text}`;
    
    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
    const resultText = result.response.text().trim();
    if (resultText) {
      // Strip markdown code block wrapping if the LLM returned it
      return resultText.replace(/^```(srt|txt|json)?\n/, '').replace(/\n```$/, '').trim();
    }
  } catch (err) {
    console.error('Hinglish transliteration failed:', err);
  }
  return text;
}

export async function transliterateWordsListToHinglish(words: Array<{ text: string; start: number; end: number }>): Promise<Array<{ text: string; start: number; end: number }>> {
  if (!words || words.length === 0 || !GEMINI_API_KEY) {
    return words;
  }

  // Check if any word contains Devanagari
  const needsTransliteration = words.some(w => /[\u0900-\u097F]/.test(w.text));
  if (!needsTransliteration) {
    return words;
  }

  try {
    const wordTexts = words.map(w => w.text);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemPrompt = "You are a specialized transliteration AI that converts a JSON list of Hindi words in Devanagari script to Hinglish script (Hindi written in Roman/English characters, e.g. 'namaste' for 'नमस्ते'). Maintain a 1:1 mapping, preserving the array index order. Output a valid JSON array of strings only. Do not include any explanation or markdown formatting.";
    const prompt = `Transliterate this list of words:\n${JSON.stringify(wordTexts)}`;
    
    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
    const resultText = result.response.text().trim();
    if (resultText) {
      const cleanJson = resultText.replace(/^```(json)?\n/, '').replace(/\n```$/, '').trim();
      const parsedArray = JSON.parse(cleanJson);
      if (Array.isArray(parsedArray) && parsedArray.length === words.length) {
        return words.map((w, idx) => ({
          ...w,
          text: parsedArray[idx] || w.text
        }));
      }
    }
  } catch (err) {
    console.error('Hinglish words list transliteration failed:', err);
  }
  return words;
}
