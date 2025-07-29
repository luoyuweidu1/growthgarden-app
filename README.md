# Growth Garden - Personal Growth Tracking App

A beautiful, biomorphic personal growth tracking application that helps you plant goals, nurture them with actions, and reflect on your journey.

## Features

- 🌱 **Goal Planting**: Create and track personal goals with different plant types
- 🌿 **Action Nurturing**: Break down goals into actionable tasks
- 💧 **Progress Tracking**: Visual progress bars and XP system
- 🎯 **Achievement System**: Unlock achievements as you grow
- 🤔 **Reflection System**: Add feelings and insights after completing actions
- 📊 **Weekly AI Reports**: Get personalized insights powered by OpenAI
- 🎨 **Biomorphic Design**: Organic, nature-inspired UI

## OpenAI Integration

The weekly reflection reports feature uses OpenAI's API to generate personalized insights. To enable this:

1. **Get an OpenAI API Key**:
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Create an API key in your dashboard

2. **Set Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```

3. **Fallback Mode**:
   If no API key is provided, the app will use built-in analysis algorithms.

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see above)
4. Start the development server: `npm run dev`

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: In-memory storage (can be extended to PostgreSQL)
- **AI**: OpenAI GPT-3.5-turbo for weekly reports
- **Build Tool**: Vite

## Weekly Reflection Reports

The premium weekly reflection reports feature provides:

- **Feeling Distribution Analysis**: Visual breakdown of your emotional patterns
- **Accomplishment Celebration**: Summary of achievements and progress
- **AI-Powered Insights**: Personalized analysis of your growth patterns
- **Learning Summary**: Key insights and recommendations for continued growth

## Contributing

Feel free to submit issues and enhancement requests! 