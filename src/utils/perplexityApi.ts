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

  const prompt = `Search the web for the specific restaurant and menu item. If you find ingredients, add up the calories for each ingredient. If you can't find specific information, say so clearly.

Format:
- Restaurant: [name and location found]
- Menu Item: [dish name]  
- Ingredients Found: [list from web search]
- Calorie Calculation: [ingredient + calories = total] OR [state if no specific info found]
- Total: [number] calories

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

    // Extract calorie number from response - look for "Total:" first, then fallback patterns
    const totalMatch = responseText.match(/Total:\s*(\d+)\s*calories?/i);
    const calorieMatch = totalMatch || responseText.match(/Calories?:\s*(\d+)/i) || responseText.match(/(\d+)\s*calories?/i);
    
    if (!calorieMatch) {
      throw new Error('Could not extract calorie estimate from Perplexity response');
    }

    const calories = parseInt(calorieMatch[1], 10);

    // Extract structured information for breakdown
    const breakdown: string[] = [];
    
    const restaurantMatch = responseText.match(/Restaurant:\s*([^\n]+)/i);
    const menuItemMatch = responseText.match(/Menu Item:\s*([^\n]+)/i);
    const ingredientsMatch = responseText.match(/Ingredients Found:\s*([^\n]+)/i);
    const calculationMatch = responseText.match(/Calorie Calculation:\s*([^\n]+)/i);
    
    if (restaurantMatch) {
      breakdown.push(`Restaurant: ${restaurantMatch[1].trim()}`);
    }
    if (menuItemMatch) {
      breakdown.push(`Menu Item: ${menuItemMatch[1].trim()}`);
    }
    if (ingredientsMatch) {
      breakdown.push(`Ingredients: ${ingredientsMatch[1].trim()}`);
    }
    if (calculationMatch) {
      breakdown.push(`Calculation: ${calculationMatch[1].trim()}`);
    }

    // Determine confidence based on whether specific ingredients were found
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (ingredientsMatch && !ingredientsMatch[1].toLowerCase().includes('no specific')) {
      confidence = 'high';
    } else if (restaurantMatch) {
      confidence = 'medium';
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