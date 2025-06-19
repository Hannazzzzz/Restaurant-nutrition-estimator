interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callPerplexityAPI(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Perplexity API key not configured. Please check your .env file and ensure VITE_PERPLEXITY_API_KEY is set.');
  }

  // Log API key status for debugging (without exposing the actual key)
  console.log('Perplexity API Key status:', apiKey ? `Present (${apiKey.length} chars)` : 'Missing');

  try {
    console.log('Making request to Perplexity API...');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 750,
        temperature: 0.2
      })
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Perplexity API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage += `. ${errorData.error.message}`;
        }
        console.error('API Error Details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data: PerplexityResponse = await response.json();
    const responseText = data.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response content from Perplexity API');
    }

    console.log('Perplexity API call successful');
    return responseText;

  } catch (error) {
    console.error('Perplexity API call failed:', error);
    
    // Enhanced error handling for common network issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Network error: Unable to connect to Perplexity API. This could be due to:\n' +
        '• Network connectivity issues\n' +
        '• CORS restrictions (check browser console for CORS errors)\n' +
        '• Browser extensions blocking the request\n' +
        '• Invalid API endpoint or configuration\n\n' +
        'Please check your internet connection and browser console for more details.'
      );
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while calling Perplexity API');
  }
}

// Test function for debugging Perplexity API
export async function testPerplexityAPI(): Promise<{ success: boolean; message: string; response?: string }> {
  try {
    console.log('🧪 Testing Perplexity API...');
    
    const testPrompt = 'What are the main ingredients in a Big Mac from McDonald\'s? Provide a brief answer.';
    const response = await callPerplexityAPI(testPrompt);
    
    return {
      success: true,
      message: `✅ Perplexity API test successful! Response received (${response.length} characters)`,
      response: response
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Perplexity API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}