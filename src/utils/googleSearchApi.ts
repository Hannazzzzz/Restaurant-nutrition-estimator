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
  };
}

export async function callGoogleCustomSearch(query: string, maxResults: number = 10): Promise<GoogleSearchResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    throw new Error('Google Custom Search API key or Search Engine ID not configured. Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_SEARCH_ENGINE_ID to your .env file.');
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', query);
    url.searchParams.append('num', Math.min(maxResults, 10).toString()); // Google allows max 10 results per request

    console.log('Google Custom Search query:', query);
    
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google Custom Search API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data: GoogleSearchResponse = await response.json();

    if (data.error) {
      throw new Error(`Google Custom Search API error: ${data.error.code} - ${data.error.message}`);
    }

    if (!data.items || data.items.length === 0) {
      console.log('No search results found for query:', query);
      return [];
    }

    console.log(`Found ${data.items.length} search results`);
    return data.items;

  } catch (error) {
    console.error('Google Custom Search error:', error);
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

  let formatted = `Google Search Results for: "${originalQuery}"\n\n`;
  
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