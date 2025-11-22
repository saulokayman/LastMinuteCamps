# Deployment Guide - Python Backend for LastMinuteCamps

## Step 1: Get Facility IDs Locally

Before deploying, let's get the correct facility IDs for all campgrounds.

### Setup Local Environment

```bash
cd python-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run the Facility ID Script

```bash
python scripts/get_facility_ids.py
```

This will search for all campgrounds and display their correct facility IDs. Copy these IDs and update them in `/supabase/functions/server/index.tsx` in the CAMPGROUNDS array.

Alternatively, search for individual campgrounds:

```bash
python scripts/quick_search.py "Joshua Tree"
python scripts/quick_search.py "Upper Pines Yosemite"
python scripts/quick_search.py "Mather Grand Canyon"
```

## Step 2: Test Locally

Start the FastAPI server locally:

```bash
uvicorn main:app --reload --port 8000
```

Visit http://localhost:8000/docs to see the interactive API documentation.

Test a search:

```bash
curl -X POST http://localhost:8000/campgrounds/search \
  -H "Content-Type: application/json" \
  -d '{"search_query": "Joshua Tree"}'
```

## Step 3: Deploy to Render

### Option A: Using GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Python backend for Camply integration"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `lastminutecamps-python`
     - **Environment**: Python 3
     - **Region**: Oregon (or nearest to your users)
     - **Branch**: main
     - **Root Directory**: `python-backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Plan**: Free (or Starter for production)

3. **Add Environment Variables** (Optional)
   - `RECREATION_GOV_API_KEY`: Your Recreation.gov API key (if you have one)
   - This increases rate limits but is not required

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your service URL: `https://lastminutecamps-python.onrender.com`

### Option B: Manual Deploy

If you don't want to use GitHub:

1. Install Render CLI: https://render.com/docs/cli
2. Run `render deploy` from the python-backend directory

## Step 4: Configure Main Backend

Once deployed, add the Python service URL to your Supabase environment variables:

1. Go to your Supabase project settings
2. Add environment variable:
   - **Key**: `PYTHON_AVAILABILITY_SERVICE_URL`
   - **Value**: `https://lastminutecamps-python.onrender.com` (your Render URL)

Or if you're already set the environment variable, the system will automatically use it.

## Step 5: Verify Integration

Test the integration by calling your main backend's Camply endpoints:

```bash
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/make-server-2b623195/camply/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"search_query": "Yosemite", "state": "CA"}'
```

## Step 6: Update Frontend (Future)

When you're ready to use real data instead of mock data, update your frontend to call the Camply endpoints:

```typescript
// Instead of: /make-server-2b623195/campgrounds
// Use: /make-server-2b623195/camply/search

const response = await fetch(`${API_URL}/camply/search`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`
  },
  body: JSON.stringify({
    search_query: searchTerm,
    state: selectedState
  })
})
```

## Important Notes

### Free Tier Limitations
- Render's free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to Starter plan ($7/month) for always-on service

### Rate Limiting
- Recreation.gov has rate limits
- Camply handles basic rate limiting automatically
- Consider caching results for better performance

### Monitoring
- Check Render logs for errors: https://dashboard.render.com/
- Python service logs all requests
- Main Deno backend logs when Python service is unavailable

## Next Steps

1. **Get Facility IDs**: Run the scripts to get correct IDs
2. **Update CAMPGROUNDS**: Fix all facility IDs in your Deno backend
3. **Deploy**: Push to Render
4. **Test**: Verify the integration works
5. **Monitor**: Watch logs for any issues

## Troubleshooting

### Service Returns 503
- Python service is not deployed or URL is wrong
- Check `PYTHON_AVAILABILITY_SERVICE_URL` environment variable

### Camply Errors
- Check Render logs for detailed Python errors
- May need Recreation.gov API key for higher rate limits
- Some campgrounds may not be available via API

### Slow Responses
- Free tier spin-down (upgrade to Starter plan)
- Recreation.gov API can be slow during peak hours
- Consider implementing caching layer
