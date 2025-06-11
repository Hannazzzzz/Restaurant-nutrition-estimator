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
  You are a restaurant research assistant. MANDATORY: You must search the web for information about the specific restaurant and menu item mentioned.

  STAGE 1 - RESEARCH (REQUIRED):
  - Search the web for the exact restaurant name and location
  - Find menu descriptions, reviews, food photos, or blog posts about this specific dish
  - Look for actual portion sizes, ingredients, or preparation details mentioned online
  - Gather specific information about this exact restaurant and menu item

  STAGE 2 - ESTIMATION:
  Only after completing web research, estimate calories based on:
  - Specific details found about this dish at this restaurant
  - Restaurant category context (fine dining vs casual vs street food)
  - Realistic portion sizes for this establishment

  If you cannot find specific information about the restaurant or dish online, state clearly: "Unable to find specific information about [dish] at [restaurant]" and ask for more details.

  Always return this structure:
  - Restaurant: [name, type, and any details found online]
  - Location/Context: [city and restaurant details from web search]
  - Menu Item: [what they ordered]
  - Research Found: [specific details discovered through web search]
  - Portion Size: [based on research or restaurant type]
  - Calories: [estimate with reasoning based on research]
  - Confidence: [High/Medium/Low based on actual data found]
  */

  const prompt = `MANDATORY: Search the web first for the specific restaurant and menu item mentioned.

Step 1: Search for '[restaurant name] [location] [menu item]' to find actual menu descriptions, reviews, or food details.

Step 2: If specific restaurant information found, base estimate on those details. If no specific information found, clearly state what was searched and what was missing.

Return:
- Restaurant: [name and details found online]  
- Menu Item: [specific dish]
- Research Found: [what was actually discovered through web search]
- Calories: [estimate based on research or clearly state if generic]
- Confidence: [High if specific details found, Low if generic estimate]

Be explicit about whether information came from actual restaurant research or generic food data.

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

    // Extract calorie number from response
    const calorieMatch = responseText.match(/Calories?:\s*(\d+)/i) || responseText.match(/(\d+)\s*calories?/i);
    if (!calorieMatch) {
      throw new Error('Could not extract calorie estimate from Perplexity response');
    }

    const calories = parseInt(calorieMatch[1], 10);

    // Extract structured information for breakdown
    const breakdown: string[] = [];
    
    const restaurantMatch = responseText.match(/Restaurant:\s*([^\n]+)/i);
    const locationMatch = responseText.match(/Location\/Context:\s*([^\n]+)/i);
    const menuItemMatch = responseText.match(/Menu Item:\s*([^\n]+)/i);
    const researchMatch = responseText.match(/Research Found:\s*([^\n]+)/i);
    const portionMatch = responseText.match(/Portion Size:\s*([^\n]+)/i);
    
    if (restaurantMatch) {
      breakdown.push(`Restaurant: ${restaurantMatch[1].trim()}`);
    }
    if (locationMatch) {
      breakdown.push(`Location: ${locationMatch[1].trim()}`);
    }
    if (menuItemMatch) {
      breakdown.push(`Menu Item: ${menuItemMatch[1].trim()}`);
    }
    if (researchMatch) {
      breakdown.push(`Research Found: ${researchMatch[1].trim()}`);
    }
    if (portionMatch) {
      breakdown.push(`Portion: ${portionMatch[1].trim()}`);
    }

    // Extract confidence level
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    const confidenceMatch = responseText.match(/Confidence:\s*(High|Medium|Low)/i);
    if (confidenceMatch) {
      confidence = confidenceMatch[1].toLowerCase() as 'low' | 'medium' | 'high';
    }

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