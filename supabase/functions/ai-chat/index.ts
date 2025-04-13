
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get AI provider and API key
    const AI_PROVIDER = Deno.env.get('AI_PROVIDER') || 'openai';
    const API_KEY = Deno.env.get(`${AI_PROVIDER.toUpperCase()}_API_KEY`);

    if (!API_KEY) {
      throw new Error(`${AI_PROVIDER.toUpperCase()}_API_KEY not set in environment variables`);
    }

    const { message, chatHistory } = await req.json();

    // Format the history based on the provider
    let response;
    
    if (AI_PROVIDER === 'openai') {
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.is_ai ? 'assistant' : 'user',
        content: msg.content
      }));
      
      // Add the new message
      formattedHistory.push({
        role: 'user',
        content: message
      });

      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant in a group chat. Keep your responses concise but informative.' },
            ...formattedHistory
          ],
        }),
      });
    } else if (AI_PROVIDER === 'gemini') {
      // Build context for Gemini
      const prompt = chatHistory.map(msg => 
        `${msg.is_ai ? 'Assistant' : 'User'}: ${msg.content}`
      ).join('\n') + `\nUser: ${message}\nAssistant:`;
      
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
        }),
      });
    } else {
      throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
    }

    const data = await response.json();
    let aiResponse = '';

    if (AI_PROVIDER === 'openai') {
      aiResponse = data.choices[0].message.content;
    } else if (AI_PROVIDER === 'gemini') {
      aiResponse = data.candidates[0].content.parts[0].text;
    }

    return new Response(JSON.stringify({ reply: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in AI chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
