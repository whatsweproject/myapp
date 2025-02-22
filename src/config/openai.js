import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-api-key-here', // Replace with your actual API key
  dangerouslyAllowBrowser: true // Only if you're using it in the browser/client-side
});

export default openai; 