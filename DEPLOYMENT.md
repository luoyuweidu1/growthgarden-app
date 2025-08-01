# Deployment Guide

This guide covers deploying the Growth Garden application with separate backend (Railway) and frontend (Vercel) deployments.

## Backend Deployment (Railway)

### 1. Deploy to Railway

1. Connect your GitHub repository to Railway
2. Create a new service from your repository
3. Set the following environment variables in Railway:

```env
# Database
DATABASE_URL=your_database_url

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_DB_URL=your_supabase_database_url

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key

# Node Environment
NODE_ENV=production

# CORS - Set this to your Vercel frontend URL
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2. Railway Configuration

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `/` (root of repository)

### 3. Get Your Backend URL

After deployment, Railway will provide you with a URL like:
`https://your-app-name-production.up.railway.app`

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Import the project
3. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

### 2. Set Environment Variables

In your Vercel project settings, add these environment variables:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL (use your Railway URL)
VITE_API_URL=https://your-app-name-production.up.railway.app
```

### 3. Deploy

Vercel will automatically deploy your frontend and provide you with a URL like:
`https://your-app-name.vercel.app`

## Testing the Deployment

1. **Test Backend**: Visit your Railway URL + `/api/health` (e.g., `https://your-app-name-production.up.railway.app/api/health`)

2. **Test Frontend**: Visit your Vercel URL and check that it can connect to the backend

3. **Test API Connection**: Open browser dev tools and check the Network tab to ensure API calls are going to your Railway backend

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure `FRONTEND_URL` in Railway matches your Vercel domain exactly
2. **404 Errors**: Ensure your Railway service is running and the build completed successfully
3. **API Connection Issues**: Verify `VITE_API_URL` in Vercel points to your Railway backend URL

### Debugging

- Check Railway logs for backend errors
- Check Vercel build logs for frontend build issues
- Use browser dev tools to see if API calls are reaching the correct backend URL

## Local Development

For local development, you can run both frontend and backend together:

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

The frontend will automatically connect to the local backend when `VITE_API_URL` is not set. 