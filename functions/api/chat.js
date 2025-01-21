import { OpenAI } from 'openai';

export async function onRequest(context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request for CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Only allow POST requests
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    const client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: context.env.DEEPSEEK_API_KEY
    });

    // Parse the request body
    const { messages } = await context.request.json();

    // Create a new ReadableStream for streaming the response
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
              // Format the chunk as a Server-Sent Event
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

    // Return the streaming response
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