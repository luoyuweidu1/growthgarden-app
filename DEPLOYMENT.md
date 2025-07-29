# GrowthGarden Deployment Guide

This guide will help you deploy GrowthGarden with authentication and a production database.

## Option 1: Vercel + Supabase (Recommended)

### Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings > API to get your credentials:
   - Project URL
   - Anon public key
   - Service role key (for database migrations)

### Step 2: Set up the Database

1. In your Supabase dashboard, go to SQL Editor
2. Run the following SQL to create the tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  plant_type TEXT NOT NULL,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  max_xp INTEGER NOT NULL DEFAULT 100,
  timeline_months INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'active',
  last_watered TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 15,
  personal_reward TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  feeling TEXT,
  reflection TEXT,
  difficulty INTEGER,
  satisfaction INTEGER,
  reflected_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create daily_habits table
CREATE TABLE IF NOT EXISTS daily_habits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  eat_healthy BOOLEAN NOT NULL DEFAULT FALSE,
  exercise BOOLEAN NOT NULL DEFAULT FALSE,
  sleep_before_11pm BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Step 3: Set up Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Configure your authentication settings:
   - Enable Email auth
   - Set up your site URL
   - Configure redirect URLs

### Step 4: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your app:
   ```bash
   vercel
   ```

4. Set up environment variables in Vercel dashboard:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_DB_URL=your_supabase_database_url
   OPENAI_API_KEY=your_openai_api_key (optional)
   ```

### Step 5: Configure Environment Variables

In your Vercel project settings, add these environment variables:

**Backend Variables:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_DB_URL`: Your Supabase database URL (with service role key for migrations)
- `OPENAI_API_KEY`: Your OpenAI API key (optional, for AI insights)

**Frontend Variables:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Option 2: Railway + PostgreSQL

### Step 1: Set up Railway

1. Go to [railway.app](https://railway.app) and create an account
2. Create a new project
3. Add a PostgreSQL database service
4. Add a Node.js service for your app

### Step 2: Configure Environment Variables

In Railway, add these environment variables:

```
DATABASE_URL=your_railway_postgres_url
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key (optional)
```

### Step 3: Deploy

1. Connect your GitHub repository to Railway
2. Railway will automatically deploy your app
3. Set up custom domain if needed

## Option 3: Render + PostgreSQL

### Step 1: Set up Render

1. Go to [render.com](https://render.com) and create an account
2. Create a new PostgreSQL database
3. Create a new Web Service

### Step 2: Configure Environment Variables

In Render, add these environment variables:

```
DATABASE_URL=your_render_postgres_url
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key (optional)
```

### Step 3: Deploy

1. Connect your GitHub repository to Render
2. Render will automatically deploy your app
3. Set up custom domain if needed

## Local Development

1. Create a `.env` file in your project root:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_DB_URL=your_supabase_database_url

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key

# Frontend
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Database Migrations

To run database migrations:

```bash
npm run db:push
```

## Features

Your deployed app will have:

✅ **User Authentication**: Sign up, sign in, sign out
✅ **Persistent Data**: All user data stored in PostgreSQL
✅ **User Isolation**: Each user only sees their own data
✅ **Production Ready**: Scalable and secure
✅ **AI Insights**: Optional OpenAI integration for weekly reports

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check your Supabase URL and keys
2. **Database connection errors**: Verify your database URL
3. **CORS errors**: Configure your Supabase auth settings
4. **Build errors**: Make sure all environment variables are set

### Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs in your deployment platform
3. Verify all environment variables are correctly set
4. Ensure your database tables are created correctly

## Security Notes

- Never commit your environment variables to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your app for unusual activity 