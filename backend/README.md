# LastMinuteCamps Python Backend

This is a Python FastAPI service that leverages the Camply library to interact with Recreation.gov and other camping reservation systems.

## Features

- **Search Campgrounds**: Find campgrounds by name and get facility IDs
- **Check Availability**: Query real-time campsite availability
- **Monitor Cancellations**: Track recently canceled reservations
- **Set Alerts**: Create custom alerts for specific campgrounds and dates

## Local Development

### Prerequisites
- Python 3.11+
- pip

### Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### API Documentation
Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push this directory to a GitHub repository
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` and deploy

### Option 2: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: lastminutecamps-python-backend
   - **Environment**: Python 3
   - **Region**: Oregon (or nearest)
   - **Branch**: main
   - **Root Directory**: python-backend
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Add environment variables (optional):
   - `RECREATION_GOV_API_KEY` (if you have one)

6. Click "Create Web Service"

### After Deployment

Once deployed, you'll get a URL like: `https://lastminutecamps-python-backend.onrender.com`

Save this URL as an environment variable in your main Deno backend:
- Variable name: `PYTHON_AVAILABILITY_SERVICE_URL`
- Value: Your Render URL

## API Endpoints

### Search Campgrounds
```bash
POST /campgrounds/search
Content-Type: application/json

{
  "search_query": "Joshua Tree",
  "state": "CA"
}
```

### Get Campground Details
```bash
GET /campgrounds/{campground_id}
```

### Search Availability
```bash
POST /availability/search
Content-Type: application/json

{
  "campground_id": "232450",
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "nights": 2
}
```

### Check Recently Canceled
```bash
POST /availability/recently-canceled
Content-Type: application/json

{
  "campground_ids": ["232450", "232449"],
  "start_date": "2024-06-01",
  "end_date": "2024-06-30"
}
```

### Create Alert
```bash
POST /alerts/create
Content-Type: application/json

{
  "campground_id": "232450",
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "nights": 2,
  "notification_email": "user@example.com"
}
```

## Integration with Main Backend

Add this function to your Deno backend to call the Python service:

```typescript
// In your Deno backend (index.tsx)
const PYTHON_SERVICE_URL = Deno.env.get('PYTHON_AVAILABILITY_SERVICE_URL')

async function searchCampgrounds(query: string, state?: string) {
  const response = await fetch(`${PYTHON_SERVICE_URL}/campgrounds/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_query: query, state })
  })
  return await response.json()
}
```

## Notes

- Free tier on Render may spin down after inactivity (takes ~30s to wake up)
- Consider upgrading to a paid plan for production use
- The Camply library handles rate limiting automatically
- Recreation.gov API key is optional but recommended for higher rate limits
