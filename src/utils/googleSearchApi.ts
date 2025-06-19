interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: {
    code: number;
    message: string;
    details?: any[];
  };
}

export async function callGoogleCustomSearch(query: string, maxResults: number = 10): Promise<GoogleSearchResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
  
  console.log('Google API Configuration Check:');
  console.log('- API Key present:', !!apiKey, apiKey ? `(${apiKey.length} chars)` : '(missing)');
  console.log('- Search Engine ID present:', !!searchEngineId, searchEngineId ? `(${searchEngineId.length} chars)` : '(missing)');
  
  if (!apiKey || !searchEngineId) {
    throw new Error(
      'Google Custom Search API configuration missing:\n' +
      `• API Key: ${apiKey ? '✅ Present' : '❌ Missing'}\n` +
      `• Search Engine ID: ${searchEngineId ? '✅ Present' : '❌ Missing'}\n\n` +
      'Please add these to your .env file:\n' +
      'VITE_GOOGLE_API_KEY=your_api_key_here\n' +
      'VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here'
    );
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', query);
    url.searchParams.append('num', Math.min(maxResults, 10).toString());
    
    // Add additional parameters for better restaurant/food results
    url.searchParams.append('safe', 'active');
    url.searchParams.append('lr', 'lang_en');

    console.log('Making Google Custom Search request:');
    console.log('- Query:', query);
    console.log('- Max Results:', Math.min(maxResults, 10));
    console.log('- Full URL:', url.toString().replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url.toString());
    
    console.log('Google API Response Status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Google Custom Search API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('Google API Error Details:', errorData);
        
        if (errorData.error) {
          errorMessage += `\n• Error Code: ${errorData.error.code}`;
          errorMessage += `\n• Error Message: ${errorData.error.message}`;
          
          if (errorData.error.details) {
            errorMessage += `\n• Details: ${JSON.stringify(errorData.error.details)}`;
          }
          
          // Provide specific guidance for common errors
          if (errorData.error.code === 403) {
            errorMessage += '\n\n🔧 Troubleshooting Tips:';
            errorMessage += '\n• Check if your Google API key is valid and active';
            errorMessage += '\n• Ensure Custom Search API is enabled in Google Cloud Console';
            errorMessage += '\n• Verify you haven\'t exceeded your daily quota';
            errorMessage += '\n• Make sure your Search Engine ID is correct';
          } else if (errorData.error.code === 400) {
            errorMessage += '\n\n🔧 This might be a configuration issue with your Custom Search Engine';
          }
        }
      } catch (parseError) {
        console.error('Could not parse Google API error response:', parseError);
        errorMessage += '\n• Could not parse error details from response';
      }
      
      throw new Error(errorMessage);
    }

    const data: GoogleSearchResponse = await response.json();
    console.log('Google API Response Data:', {
      totalResults: data.searchInformation?.totalResults,
      searchTime: data.searchInformation?.searchTime,
      itemsCount: data.items?.length || 0
    });

    if (data.error) {
      throw new Error(`Google Custom Search API error: ${data.error.code} - ${data.error.message}`);
    }

    if (!data.items || data.items.length === 0) {
      console.log('No search results found for query:', query);
      console.log('Search Information:', data.searchInformation);
      return [];
    }

    console.log(`✅ Successfully found ${data.items.length} search results`);
    
    // Log first result for debugging
    if (data.items.length > 0) {
      console.log('First result preview:', {
        title: data.items[0].title,
        domain: data.items[0].displayLink,
        snippetLength: data.items[0].snippet.length
      });
    }
    
    return data.items;

  } catch (error) {
    console.error('Google Custom Search error:', error);
    
    // Enhanced error handling for common network issues
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Network error: Unable to connect to Google Custom Search API. This could be due to:\n' +
        '• Network connectivity issues\n' +
        '• CORS restrictions (check browser console for CORS errors)\n' +
        '• Browser extensions blocking the request\n' +
        '• Firewall or proxy blocking Google APIs\n\n' +
        'Please check your internet connection and browser console for more details.'
      );
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while calling Google Custom Search API');
  }
}

export function formatSearchResultsForAI(results: GoogleSearchResult[], originalQuery: string): string {
  if (results.length === 0) {
    return `No search results found for query: "${originalQuery}"`;
  }

  let formatted = `Google Search Results for: "${originalQuery}"\n`;
  formatted += `Found ${results.length} results\n\n`;
  
  results.forEach((result, index) => {
    formatted += `RESULT ${index + 1}:\n`;
    formatted += `Title: ${result.title}\n`;
    formatted += `URL: ${result.link}\n`;
    formatted += `Domain: ${result.displayLink}\n`;
    formatted += `Content: ${result.snippet}\n`;
    formatted += `---\n\n`;
  });

  return formatted;
}

// Test function for debugging Google Search
export async function testGoogleSearch(): Promise<{ success: boolean; message: string; results?: GoogleSearchResult[] }> {
  try {
    console.log('🧪 Testing Google Custom Search API...');
    
    const testQuery = 'McDonald\'s Big Mac calories menu';
    const results = await callGoogleCustomSearch(testQuery, 3);
    
    return {
      success: true,
      message: `✅ Google Search test successful! Found ${results.length} results for "${testQuery}"`,
      results: results
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Google Search test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}