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

  const prompt = `Search for the word 'calories in' + ${mealDescription}. Find the restaurant and menu item. 

IMPORTANT: Remember that menu items include ALL standard components (e.g., burgers include buns, sandwiches include bread, pasta dishes include pasta, salads include base greens, etc.). Calculate calories for the complete dish as served, not just the toppings or special ingredients mentioned.

However, if the user specifically excludes components (e.g., 'burger without bun', 'pasta without cheese', 'salad no dressing'), respect those modifications and calculate accordingly.

Calculate total calories by picking reasonable portions for the restaurant found, and adjust the calculation based on information about ingredients or portion sizes you can find. Give one specific number, not a range.

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
        max_tokens: 150,
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