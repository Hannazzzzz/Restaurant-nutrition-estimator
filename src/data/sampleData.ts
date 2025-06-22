// Sample food entries for demo mode
export const sampleFoodEntries = [
  {
    id: "demo-1",
    user_id: "demo-user",
    created_at: "2025-01-19T10:30:00Z",
    restaurant_name: "Lagkagehuset",
    food_description: "mini croissant",
    estimated_calories: 280,
    raw_ai_response: JSON.stringify({
      rawApiResponse: "Found Lagkagehuset bakery in Copenhagen. Mini croissant estimated at 48g portion with butter pastry dough, typical Danish bakery quality."
    }),
    restaurant_found_name: "Lagkagehuset",
    menu_item_found_name: "Mini Croissant",
    restaurant_calories_exact: 280,
    calorie_estimation_source: "perplexity_ai_exact"
  },
  {
    id: "demo-2", 
    user_id: "demo-user",
    created_at: "2025-01-18T12:15:00Z",
    restaurant_name: "Noma",
    food_description: "lunch tasting menu",
    estimated_calories: 650,
    raw_ai_response: JSON.stringify({
      rawApiResponse: "Noma Copenhagen - world-renowned restaurant. Lunch tasting menu typically 8-10 courses with seasonal Nordic ingredients, estimated portion sizes based on fine dining standards."
    }),
    restaurant_found_name: "Noma",
    menu_item_found_name: "Lunch Tasting Menu",
    similar_dish_calories_estimated: 650,
    calorie_estimation_source: "perplexity_ai_generic"
  },
  {
    id: "demo-3",
    user_id: "demo-user", 
    created_at: "2025-01-17T19:45:00Z",
    restaurant_name: "Local Pizzeria",
    food_description: "margherita pizza slice",
    estimated_calories: 380,
    raw_ai_response: JSON.stringify({
      rawApiResponse: "Standard margherita pizza slice from Copenhagen pizzeria. Typical thin crust with tomato sauce, mozzarella, and fresh basil. Estimated 1/8 of medium pizza."
    }),
    restaurant_found_name: "Local Pizzeria",
    menu_item_found_name: "Margherita Pizza Slice",
    similar_dish_calories_estimated: 380,
    calorie_estimation_source: "perplexity_ai_generic"
  },
  {
    id: "demo-4",
    user_id: "demo-user",
    created_at: "2025-01-16T08:20:00Z", 
    restaurant_name: "Café Central",
    food_description: "avocado toast with coffee",
    estimated_calories: 420,
    raw_ai_response: JSON.stringify({
      rawApiResponse: "Café Central Copenhagen - popular breakfast spot. Avocado toast on sourdough bread with half avocado, olive oil, salt, pepper. Served with medium coffee (cortado style)."
    }),
    restaurant_found_name: "Café Central",
    menu_item_found_name: "Avocado Toast + Coffee",
    restaurant_calories_exact: 420,
    calorie_estimation_source: "perplexity_ai_exact"
  },
  {
    id: "demo-5",
    user_id: "demo-user",
    created_at: "2025-01-15T13:30:00Z",
    restaurant_name: "Thai Palace",
    food_description: "pad thai with chicken",
    estimated_calories: 680,
    raw_ai_response: JSON.stringify({
      rawApiResponse: "Thai Palace Copenhagen - authentic Thai restaurant. Pad Thai with chicken includes rice noodles, chicken breast, bean sprouts, eggs, tamarind sauce, fish sauce, palm sugar. Large restaurant portion."
    }),
    restaurant_found_name: "Thai Palace",
    menu_item_found_name: "Pad Thai with Chicken",
    restaurant_calories_exact: 680,
    calorie_estimation_source: "perplexity_ai_exact"
  },
  {
    id: "demo-6",
    user_id: "demo-user",
    created_at: "2025-01-14T16:45:00Z",
    restaurant_name: "Joe & The Juice",
    food_description: "tunacado sandwich",
    estimated_calories: 520,
    raw_ai_response: JSON.stringify({
      rawApiResponse: "Joe & The Juice chain - popular Danish juice bar. Tunacado sandwich with tuna, avocado, tomato, and pesto on their signature bread, pressed and grilled."
    }),
    restaurant_found_name: "Joe & The Juice",
    menu_item_found_name: "Tunacado Sandwich",
    restaurant_calories_exact: 520,
    calorie_estimation_source: "perplexity_ai_exact"
  },
  {
    id: "demo-7",
    user_id: "demo-user",
    created_at: "2025-01-13T11:00:00Z",
    restaurant_name: "Grod",
    food_description: "porridge with berries and nuts",
    estimated_calories: 340,
    raw_ai_response: JSON.stringify({
      rawApiResponse: "Grød Copenhagen - porridge specialist. Organic oat porridge topped with seasonal berries, chopped almonds, and a drizzle of honey. Healthy breakfast option."
    }),
    restaurant_found_name: "Grød",
    menu_item_found_name: "Berry & Nut Porridge",
    restaurant_calories_exact: 340,
    calorie_estimation_source: "perplexity_ai_exact"
  }
];

// Demo user data
export const demoUser = {
  username: "demo-user",
  displayName: "Demo User"
};