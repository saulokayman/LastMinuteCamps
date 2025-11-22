// Proxy endpoint to call Python availability service
// Add this to your existing index.tsx file

// Environment variable for Python service URL
const PYTHON_SERVICE_URL = Deno.env.get('PYTHON_AVAILABILITY_SERVICE_URL') || 'http://localhost:8000';

app.get('/make-server-908ab15a/availability', async (c) => {
  try {
    const { provider, campground_id, start_date, end_date } = c.req.query();
    
    if (!provider || !campground_id || !start_date || !end_date) {
      return c.json({
        error: 'Missing required parameters: provider, campground_id, start_date, end_date'
      }, 400);
    }
    
    // Call Python FastAPI service
    const pythonUrl = new URL('/availability', PYTHON_SERVICE_URL);
    pythonUrl.searchParams.append('provider', provider);
    pythonUrl.searchParams.append('campground_id', campground_id);
    pythonUrl.searchParams.append('start_date', start_date);
    pythonUrl.searchParams.append('end_date', end_date);
    
    const response = await fetch(pythonUrl.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      return c.json({
        error: 'Python service error',
        details: errorData
      }, response.status);
    }
    
    const data = await response.json();
    return c.json(data);
    
  } catch (error) {
    console.log(`Error proxying to Python service: ${error}`);
    return c.json({
      error: 'Failed to fetch availability from Python service',
      details: String(error)
    }, 500);
  }
});

// Enhanced search that uses Python service for availability checking
app.get('/make-server-908ab15a/search-with-availability', async (c) => {
  try {
    const { query, state, source, startDate, endDate } = c.req.query();
    
    if (!startDate || !endDate) {
      return c.json({
        error: 'start_date and end_date are required for availability checking'
      }, 400);
    }
    
    const results: any[] = [];
    
    // Get campground IDs first (from existing search)
    const searchUrl = new URL('/make-server-908ab15a/search', c.req.url);
    if (query) searchUrl.searchParams.append('query', query);
    if (state) searchUrl.searchParams.append('state', state);
    if (source) searchUrl.searchParams.append('source', source);
    
    // For each campground, check availability via Python service
    if (source === 'all' || source === 'recreation.gov') {
      // Get Recreation.gov campgrounds
      const recGovResults = await searchRecreationGov(query, state, '', startDate, endDate, '');
      
      // Check availability for each using Python service
      for (const campground of recGovResults.slice(0, 10)) {
        try {
          const availUrl = new URL('/availability', PYTHON_SERVICE_URL);
          availUrl.searchParams.append('provider', 'recreation.gov');
          availUrl.searchParams.append('campground_id', campground.FacilityID || campground.id);
          availUrl.searchParams.append('start_date', startDate);
          availUrl.searchParams.append('end_date', endDate);
          
          const availResponse = await fetch(availUrl.toString());
          if (availResponse.ok) {
            const availData = await availResponse.json();
            results.push({
              ...campground,
              availability: availData,
              available_sites_count: availData.total_available
            });
          } else {
            results.push(campground);
          }
        } catch (err) {
          console.log(`Error checking availability for ${campground.FacilityID}: ${err}`);
          results.push(campground);
        }
      }
    }
    
    if (source === 'all' || source === 'reservecalifornia.com') {
      // Similar for ReserveCalifornia
      const reserveCalResults = await searchReserveCalifornia(query, state, startDate, endDate);
      
      for (const campground of reserveCalResults.slice(0, 10)) {
        try {
          const availUrl = new URL('/availability', PYTHON_SERVICE_URL);
          availUrl.searchParams.append('provider', 'reservecalifornia');
          availUrl.searchParams.append('campground_id', campground.facilityId || campground.id);
          availUrl.searchParams.append('start_date', startDate);
          availUrl.searchParams.append('end_date', endDate);
          
          const availResponse = await fetch(availUrl.toString());
          if (availResponse.ok) {
            const availData = await availResponse.json();
            results.push({
              ...campground,
              availability: availData,
              available_sites_count: availData.total_available
            });
          } else {
            results.push(campground);
          }
        } catch (err) {
          console.log(`Error checking availability for ${campground.facilityId}: ${err}`);
          results.push(campground);
        }
      }
    }
    
    return c.json({
      campsites: results,
      total: results.length,
      with_availability: true
    });
    
  } catch (error) {
    console.log(`Error in search-with-availability: ${error}`);
    return c.json({
      error: 'Failed to search with availability',
      details: String(error)
    }, 500);
  }
});
