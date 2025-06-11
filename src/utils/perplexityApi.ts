interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface CalorieEstimationResult {
  calories: number;
  confidence: 'low' | 'medium' | 'high';
  breakdown: string[];
  rawApiResponse?: string;
}

export async function estimateCaloriesWithPerplexity(mealDescription: string): Promise<CalorieEstimationResult> {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  // BACKUP PROMPT - Day 7 - Working version before WhatsApp optimization  
  /*
  MANDATORY: Search the web first for the specific restaurant and menu item mentioned.

  Step 1: Search for '[restaurant name] [location] [menu item]' to find actual menu descriptions, reviews, or food details.

  Step 2: If specific restaurant information found, base estimate on those details. If no specific information found, clearly state what was searched and what was missing.

  Return:
  - Restaurant: [name and details found online]  
  - Menu Item: [specific dish]
  - Research Found: [what was actually discovered through web search]
  - Calories: [estimate based on research or clearly state if generic]
  - Confidence: [High if specific details found, Low if generic estimate]

  Be explicit about whether information came from actual restaurant research or generic food data.
  */

  const prompt = `Search for the word 'calories in' + ${mealDescription}. Find the restaurant and menu item. Calculate total calories by picking reasonable portions for the restaurant found, and adjust the calculation based on information about ingredients or portion sizes you can find. Give one specific number, not a range.

Food description: "${mealDescription}"`;

  try {
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    const data: PerplexityResponse = await response.json();
    const responseText = data.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from Perplexity API');
    }

    // Extract calorie number from response - look for any number followed by "calories"
    const calorieMatch = responseText.match(/(\d+)\s*calories?/i);
    
    if (!calorieMatch) {
      throw new Error('Could not extract calorie estimate from Perplexity response');
    }

    const calories = parseInt(calorieMatch[1], 10);

    // Since the prompt is now very simple, just split the response into lines for breakdown
    const lines = responseText.split('\n').filter(line => line.trim().length > 0);
    const breakdown = lines.slice(0, 4); // Take first few lines as breakdown

    // Set confidence to medium by default since we're asking for specific calculations
    const confidence: 'low' | 'medium' | 'high' = 'medium';

    return {
      calories,
      confidence,
      breakdown,
      rawApiResponse: responseText
    };

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while calling Perplexity API');
  }
}