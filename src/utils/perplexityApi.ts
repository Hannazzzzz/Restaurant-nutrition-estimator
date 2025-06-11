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

  const prompt = `You are a restaurant calorie estimation expert. For each food description:

1. FIRST identify the specific restaurant mentioned - search the web if needed to find the exact establishment
2. Research typical portion sizes at that exact restaurant or restaurant type
3. Consider restaurant category (fine dining = smaller elegant portions, casual = larger portions, street food = varies by location)
4. Estimate calories based on realistic serving size for that specific restaurant, NOT per-100g nutritional data
4a. If the user provides specific weight (like '48g' or 'mini'), prioritize this information over typical portions. Calculate calories based on the exact weight given combined with typical nutritional density for that food item.

Examples of portion context:
- 'takoyaki at Jordnaer' (Michelin restaurant) = 1 small artistic ball ≈ 60 calories
- 'takoyaki in Osaka street market' = 6 large traditional balls ≈ 400 calories  
- 'croissant from Lagkagehuset' (Danish bakery chain) = 1 medium pastry ≈ 280 calories
- 'mini croissant (48g) from Lagkagehuset' = Use 48g weight, not standard croissant size ≈ 190 calories

Always return this structure:
- Restaurant: [name and type]
- Location/Context: [city or restaurant category]  
- Menu Item: [what they ordered]
- Portion Size: [realistic serving for this restaurant]
- Calories: [estimate with brief reasoning]
- Confidence: [High/Medium/Low based on available data]

Be specific about the restaurant context and portion reasoning. If restaurant is unclear, ask for city or more details.

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