export async function onRequest(context) {
  // More permissive CORS headers for development
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
  };

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers 
    });
  }

  // Handle POST requests
  if (context.request.method === 'POST') {
    try {
      const body = await context.request.json();
      
      if (!body.messages) {
        return new Response(JSON.stringify({ error: 'Messages are required' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages: body.messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
  }

  // Handle any other request method
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
} 