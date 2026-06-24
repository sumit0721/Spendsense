const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CASCADE = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite', // 500 RPD — safety net, highest quota
];

async function callWithRetry(model, promptFn, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await promptFn(model);
    } catch (error) {
      const status = error?.status;
      if (status === 503 && attempt < retries) {
        const delay = attempt * 1500;
        console.warn(`[Gemini] 503 on attempt ${attempt}, retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw error;
    }
  }
}

async function callGeminiWithFallback(promptFn) {
  let lastError = null;

  for (const modelName of MODEL_CASCADE) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await callWithRetry(model, promptFn);

      if (modelName !== MODEL_CASCADE[0]) {
        console.info(`[Gemini] Served by fallback model: ${modelName}`);
      }

      return result;
    } catch (error) {
      const status = error?.status;

      // 404 added: a wrong/deprecated model name should cascade to the
      // next model, not crash the whole request. This is the actual fix
      // for "model not found" — the model-name swap alone doesn't cover it.
      if (status === 429 || status === 503 || status === 404) {
        console.warn(`[Gemini] ${modelName} returned ${status}, moving to next model...`);
        lastError = error;
        continue;
      }

      console.error(`[Gemini] Hard error from ${modelName}:`, error?.message);
      throw error;
    }
  }

  console.error('[Gemini] All models exhausted.');
  const err = new Error('Our AI is at capacity right now. Please try again in a few minutes.');
  err.statusCode = 503;
  throw err;
}

function getModel(modelName = MODEL_CASCADE[0]) {
  return genAI.getGenerativeModel({ model: modelName });
}

module.exports = { callGeminiWithFallback, getModel, MODEL_CASCADE };
