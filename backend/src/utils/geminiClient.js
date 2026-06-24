const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Cascade fallback pattern for Gemini model initialization.
 * Tries preferred models in order, falling back gracefully if unavailable.
 */
const MODEL_CASCADE = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

let _client = null;
let _model = null;

/**
 * Initialize the Gemini client.
 * Lazily creates a singleton instance on first call.
 *
 * @returns {{ client: GoogleGenerativeAI, model: GenerativeModel }}
 */
const getGeminiClient = () => {
  if (_client && _model) {
    return { client: _client, model: _model };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      '[GeminiClient] GEMINI_API_KEY not set — AI features will be unavailable.'
    );
    return { client: null, model: null };
  }

  _client = new GoogleGenerativeAI(apiKey);

  // Try each model in the cascade until one initializes
  for (const modelName of MODEL_CASCADE) {
    try {
      _model = _client.getGenerativeModel({ model: modelName });
      console.log(`[GeminiClient] Initialized with model: ${modelName}`);
      break;
    } catch (err) {
      console.warn(
        `[GeminiClient] Model ${modelName} unavailable, trying next...`
      );
    }
  }

  if (!_model) {
    console.error(
      '[GeminiClient] All models in cascade failed to initialize.'
    );
  }

  return { client: _client, model: _model };
};

module.exports = { getGeminiClient, MODEL_CASCADE };
