# Canøpy 🌿
**Your mindful guide through the restaurant jungle**

Psychology-conscious restaurant nutrition estimator built during World's Largest Hackathon 2025.

## 🎯 The Problem We Didn't Know We Needed To Solve

**62% of nutrition app users** complain about missing restaurant data, but the real issue runs deeper. **71% develop disordered eating patterns** from obsessive calorie tracking. I discovered three user types completely abandoned by existing apps:

- **ED Recovery users**: *"Since my eating disorder I try to avoid everything that has to do with food tracking... But I think it has potential!"*
- **Insight Seekers**: *"Some insights would be nice... it is sometimes very surprising what things make or break your diet"*  
- **Diet Philosophy followers**: Want restaurant guidance without calorie obsession

## 🌱 What I Built

Conversational restaurant calorie estimation with a psychology-first approach:

- **Natural input**: "pad thai with chicken from the place downtown"
- **3-phase AI system**: Restaurant discovery → Dish analysis → Modifications  
- **Jungle aesthetic**: Nature-inspired UI reducing app anxiety
- **Dual interface**: Beautiful customer UI vs debug mode (?debug=true)

## 🛠 Technical Reality

**AI Integration Journey**: Started wanting perfect accuracy, learned that "good enough" builds trust better than black-box precision. Struggled with LLM API reliability - Perplexity sometimes misses obvious Copenhagen restaurants that Google finds instantly. The 3-phase approach works but isn't as smooth as I'd wish.

**Current Stack**:
- **Frontend**: React/Tailwind on Bolt.new  
- **Database**: Supabase with comprehensive tracking
- **AI**: Perplexity + Google Custom Search hybrid
- **Design**: Pure CSS jungle with glassmorphism
- **Domain**: Custom IONOS domain via Entri integration

## 🎨 Design Philosophy

**"We Didn't Know We Needed This"**: Nutrition apps look like medical software. Canøpy feels like pushing through jungle foliage to find clarity - organic, calming, with hidden fireflies and light beams. The Danish ø connects to Copenhagen's restaurant scene.

## 👥 User Validation

Three distinct archetypes all confirmed the restaurant estimation gap, but each needs different psychology-conscious approaches. Traditional apps actively drive these users away - we're serving the abandoned market.

## 🚀 Live Demos

- **Customer Interface**: https://splendorous-manatee-3eb978.netlify.app/
- **Debug Interface**: https://splendorous-manatee-3eb978.netlify.app/?debug=true  
- **Custom Domain**: [Coming after Entri setup]

## 🏆 Hackathon Categories

- **Uniquely Useful Tool**: Psychology-conscious users no competitor serves
- **Creative Use of AI**: 3-phase conversational analysis  
- **Most Beautiful UI**: Jungle aesthetic vs sterile nutrition apps
- **Future Unicorn**: $6B+ market with validated underserved archetypes
- **We Didn't Know We Needed This**: Anti-obsession nutrition awareness
- **Custom Domain Challenge**: IONOS domain via Entri integration
- **Deploy Challenge**: Netlify deployment
- **Top Build-in-Public Journey**: Daily logs below, and blog on hannazoon.wordpress.com

## 📊 The Opportunity

**Global nutrition app market**: $6.05B → $17.4B by 2035  
**Psychology-conscious gap**: 71% abandon traditional apps  
**Restaurant accuracy problem**: 35-50% errors for independent restaurants

## 🌿 Built in Copenhagen

Created with systematic user validation, evidence-based decisions, and honest assessment of limitations. Sometimes shipping something real beats perfecting something imaginary.

---

**Built with Bolt** ⚡ [bolt.new](https://bolt.new/)

*Canøpy - Where mindful eating meets jungle aesthetics*
---
## Daily Progress
- **Day 1: Market research and strategic positioning** - Dove deep into the calorie tracking market and discovered the restaurant estimation gap is huge (see research files in repo). Found that 62% of users complain about missing local restaurants while existing apps focus on packaged foods and chains. Tested USDA FoodData Central API - 1,000 free requests/hour should be plenty for MVP testing. Also set up project voice guidelines and hackathon strategy docs to keep the 25-day timeline realistic. Main insight: positioning as "restaurant calorie estimator" rather than "another MyFitnessPal clone" gives us actual differentiation in a crowded market.
- **Day 2: Technical foundation and reality check** - Got the Bolt.new app working and deployed to Netlify (https://splendorous-manatee-3eb978.netlify.app/). Hit a wall with Claude API integration, but the fallback data-based estimation system actually proved the thesis: recognizes McDonald's fries easily but struggles with more exotic restaurant items. No LLM API sponsors found in hackathon docs, so we'll stick with validation using the current system and add real AI later. 
- **Day 3: Working AI integration and user validation** - Major breakthrough: got Perplexity API working in the app for real restaurant calorie estimation! It successfully recognized "Halle Berry from Halifax" as a milkshake from Copenhagen burger chain, proving the local restaurant knowledge works. Added quality checking features: raw AI response display and requirement for restaurant/city/menu item confirmation. Found some accuracy gaps (Lagkagehuset croissant gave 100g calories instead of actual portion size) but the core concept is validated. Also got enthusiastic user validation from friend who wants to test future prototypes. Posted blog restart announcement to document the journey: https://hannazoon.wordpress.com/2025/06/07/back-to-building-and-blogging/. Ready for tomorrow's prompt refinement to improve portion size reasoning.
- **Day 4: Restaurant context breakthrough + user psychology goldmine** - I finally got the Perplexity integration working properly by bumping the token limit to 750 - now when someone types "croissant from Lagkagehuset" it actually gives realistic portion estimates (280 calories) instead of confusing per-100g data. The restaurant research is working much better, though I'm still tweaking how it handles specific weights like "mini croissant (48g)". But the real breakthrough today was user feedback - talked to three people and discovered there are actually distinct user types who all want restaurant calorie help but can't stand traditional tracking apps. One person with eating disorder history said it "has potential" but avoids anything calorie-focused, another guy wants insights without obsessive counting, and the Slow Carb Reddit community specifically avoids calorie tracking but needs restaurant guidance. I'm realising we might be solving a much bigger psychology problem than I initially thought - curious to test this delayed visibility approach with more people who've been burned by MyFitnessPal-style apps.
- **Day 5+6: Database Foundation + Full App Functionality** - Got Supabase integrated and now have a completely functional restaurant nutrition estimator! Users can log meals naturally ("Liverpool burger from Halifax"), get AI calorie estimates, and see their personal food history. The core concept is working but I discovered the AI search quality needs serious improvement - it's giving generic "hamburger" estimates instead of finding Halifax's actual menu and portion sizes. Still, people can actually use this app now which feels like a major milestone. Also captured some beautiful forest/jungle design inspiration for the UI polish phase. Tomorrow I'm curious to dive deep into why Perplexity isn't finding restaurant-specific details and see if I can get much better estimates.
- **Day 7: There's a new repo in town!** - I've started to use Github for real, so I can do version control of my app. I've copied over the readme I started before: https://github.com/Hannazzzzz/bolt-hackathon-1, so the complete history is captured here. Fixed the core estimation problem by forcing ingredient-based calculations instead of generic ranges, getting Liverpool burger estimates from 500-700 to proper 900+ calories matching manual verification. Also published my first substantial blog post about why having AI tell me what I already know works so well - turns out there's solid research backing the "scaffolded mind" concept (read it here: https://hannazoon.wordpress.com/2025/06/11/why-i-needed-ai-to-tell-me-what-i-already-knew/)
- **Day 8: Technical roadblocks and strategic patience** - Hit some technical friction today when my old MacBook couldn’t handle Bolt.new properly - the fan was going crazy and Supabase connections kept failing. Tried a few times to implement the weekly analytics card that would transform the app from estimator to insights platform, but the browser kept crashing. Sometimes the tools don’t cooperate and you have to know when to step back.
- **Day 9: Three-phase system working but search struggles** - Built the complete restaurant discovery → dish analysis → modifications flow with database saving. Perplexity keeps missing menu items that are clearly on restaurant websites, even with detailed prompts targeting PDFs and review sites. I'm switching to separate food/restaurant input fields with Google Custom Search API tomorrow - see if that works better!
- **Day 10: Strategic Planning & New Opportunities** - Today I focused on research and strategic planning rather than coding. Discovered the Bolt.new Supabase Startup Challenge - my restaurant app is already 90% qualified since I'm using Supabase for the database. Just need to add authentication and get my organization slug.
- **Day 11: AI search jungle** Successfully implemented jungle aesthetic with Playfair Display + Montserrat fonts. Customer UI now has the magical rainforest canopy design with CSS-generated leaves, fireflies, and light beams. I now have 2 UIs - a clean customer interface and full debug mode (?debug=true). AI-powered 3-phase restaurant analysis solid. Tomorrow: final polish for hackathon submission.
