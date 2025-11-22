# Integration Guide: Python Availability Service

## Architecture

```
Frontend (React) → Supabase Edge Function (Deno) → Python FastAPI Service (camply)
```

## Setup Steps

### 1. Deploy Python Service

**Option A: Local Development**
```bash
cd /path/to/your/project
pip install camply fastapi uvicorn pydantic
python availability_service.py
# Service runs on http://localhost:8000
```

**Option B: Production (Docker)**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install camply fastapi uvicorn pydantic
COPY availability_service.py .
CMD ["python", "availability_service.py"]
```

**Option C: Cloud Deployment (Railway, Render, Fly.io)**
- Upload `availability_service.py`
- Add build command: `pip install camply fastapi uvicorn pydantic`
- Add start command: `python availability_service.py`
- Note the deployed URL (e.g., `https://your-service.railway.app`)

### 2. Configure Supabase Environment Variable

In your Supabase project dashboard:
1. Go to Project Settings → Edge Functions
2. Add environment variable:
   - **Key**: `PYTHON_AVAILABILITY_SERVICE_URL`
   - **Value**: Your Python service URL (e.g., `https://your-service.railway.app` or `http://localhost:8000`)

### 3. Add Proxy Code to Edge Function

Copy the contents of `/supabase/functions/server/python_proxy.tsx` and paste it into your `/supabase/functions/server/index.tsx` file (before the `Deno.serve()` line).

### 4. Update Frontend to Use New Endpoints

**For direct availability checks:**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/availability?provider=recreation.gov&campground_id=234567&start_date=2025-06-01&end_date=2025-06-05`,
  {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  }
);
const data = await response.json();
console.log(`${data.total_available} sites available`);
```

**For search with availability:**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/search-with-availability?query=yosemite&state=CA&source=all&startDate=2025-06-01&endDate=2025-06-05`,
  {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  }
);
const data = await response.json();
// Each campsite now includes availability.available_sites and availability.total_available
```

## API Endpoints

### Python Service (Direct)
- `GET /availability?provider={provider}&campground_id={id}&start_date={date}&end_date={date}`

### Supabase Edge Function (Proxied)
- `GET /make-server-908ab15a/availability` - Proxies to Python service
- `GET /make-server-908ab15a/search-with-availability` - Enhanced search with real-time availability

## Testing

### Test Python Service Directly
```bash
curl "http://localhost:8000/availability?provider=recreation.gov&campground_id=234567&start_date=2025-06-01&end_date=2025-06-05"
```

### Test Through Supabase Proxy
```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/make-server-908ab15a/availability?provider=recreation.gov&campground_id=234567&start_date=2025-06-01&end_date=2025-06-05" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Campground ID Examples

**Recreation.gov:**
- Yosemite: `234650`
- Grand Canyon: `232782`
- Joshua Tree: `232781`

**ReserveCalifornia:**
- Check the ReserveCalifornia website URL for the PlaceId parameter

## Benefits of This Approach

1. ✅ **Uses proven camply library** - Battle-tested by thousands of users
2. ✅ **Real availability data** - Direct from Recreation.gov and ReserveCalifornia APIs
3. ✅ **Separation of concerns** - Python handles complex scraping, TypeScript handles web API
4. ✅ **Easy to scale** - Deploy Python service independently
5. ✅ **Maintainable** - When camply updates, you just update the package

## Troubleshooting

**"Connection refused" errors:**
- Ensure Python service is running
- Check `PYTHON_AVAILABILITY_SERVICE_URL` is set correctly
- Verify firewall/network allows connection

**"No sites found" but expect results:**
- Check campground_id is correct
- Verify dates are in YYYY-MM-DD format
- Ensure dates are in the future and within 6 months

**ReserveCalifornia not working:**
- camply's UseDirect provider may need updates
- Check camply issues: https://github.com/juftin/camply/issues
