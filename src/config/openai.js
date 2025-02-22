import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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', // Replace with your actual API key
  dangerouslyAllowBrowser: true // Only if you're using it in the browser/client-side
});

export default openai;

export const OPENAI_API_KEY = "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"; 