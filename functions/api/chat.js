import OpenAI from 'openai';

// Helper function to fetch crypto prices (removed as it's not used in the edited code)


export async function onRequest(context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }

  try {
    const client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: context.env.DEEPSEEK_API_KEY,
    });

    const { messages } = await context.request.json();

    const completion = await client.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant with expertise in technology and programming."
        },
        ...messages
      ]
    });

    return new Response(JSON.stringify(completion), { headers });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers
    });
  }
}