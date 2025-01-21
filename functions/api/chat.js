import { OpenAI } from 'openai';

// Helper function to fetch crypto prices
async function fetchCryptoPrices() {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
  );
  return response.json();
}

export async function onRequest(context) {
  // More specific CORS headers
  const headers = {
    'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };

  // Handle OPTIONS request for CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Handle GET request for crypto prices
  if (context.request.method === 'GET') {
    try {
      const prices = await fetchCryptoPrices();
      return new Response(JSON.stringify(prices), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch crypto prices' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
  }

  // Handle POST request for chat
  if (context.request.method === 'POST') {
    try {
      const client = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: context.env.DEEPSEEK_API_KEY
      });

      const { messages } = await context.request.json();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const response = await client.chat.completions.create({
              model: "deepseek-reasoner",
              messages,
              stream: true
            });

            for await (const chunk of response) {
              if (chunk.choices[0].delta.content) {
                const data = `data: ${JSON.stringify({ content: chunk.choices[0].delta.content })}\n\n`;
                controller.enqueue(new TextEncoder().encode(data));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...headers,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
} 