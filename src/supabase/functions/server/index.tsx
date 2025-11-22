import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Test endpoint to verify Recreation.gov API key is working
app.get('/make-server-908ab15a/test-api', async (c) => {
  try {
    const apiKey = Deno.env.get('RECREATION_GOV_API_KEY');
    
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: 'Recreation.gov API key not configured',
        message: 'Please add RECREATION_GOV_API_KEY to Supabase environment variables'
      }, 500);
    }

    // Test with a simple facilities request
    const url = 'https://ridb.recreation.gov/api/v1/facilities?limit=1';
    
    const response = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ 
        success: false,
        error: `Recreation.gov API returned ${response.status}`,
        details: errorText,
        apiKeyPresent: true,
        apiKeyLength: apiKey.length
      }, response.status);
    }

    const data = await response.json();
    
    return c.json({ 
      success: true,
      message: 'Recreation.gov API key is working correctly!',
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      sampleFacility: data.RECDATA?.[0]?.FacilityName || 'No facilities returned',
      totalRecords: data.METADATA?.[0]?.RESULTS?.TOTAL_COUNT || 0
    });
  } catch (error) {
    console.log(`Error testing API: ${error}`);
    return c.json({ 
      success: false,
      error: 'Failed to test API', 
      details: String(error) 
    }, 500);
  }
});

// Helper function to check Recreation.gov availability using real availability endpoint
async function getRecreationGovAvailability(facilityId: string, startDate: string, endDate: string, apiKey: string) {
  try {
    // Recreation.gov availability endpoint format
    const start = new Date(startDate);
    const end = new Date(endDate);
    const month = start.toISOString().slice(0, 7); // YYYY-MM format

    const url = `https://www.recreation.gov/api/camps/availability/campground/${facilityId}/month?start_date=${month}-01T00:00:00.000Z`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Recreation.gov availability error for facility ${facilityId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`Error fetching availability for facility ${facilityId}: ${error}`);
    return null;
  }
}

// Search campsites across both platforms
app.get('/make-server-908ab15a/search', async (c) => {
  try {
    const { query, state, activityType, source, startDate, endDate, accessible } = c.req.query();
    const results: any[] = [];

    // Search Recreation.gov if source is 'all' or 'recreation.gov'
    if (source === 'all' || source === 'recreation.gov') {
      const recGovResults = await searchRecreationGov(query, state, activityType, startDate, endDate, accessible);
      results.push(...recGovResults);
    }

    // Search ReserveCalifornia if source is 'all' or 'reservecalifornia.com'
    if (source === 'all' || source === 'reservecalifornia.com') {
      const reserveCalResults = await searchReserveCalifornia(query, state, startDate, endDate);
      results.push(...reserveCalResults);
    }

    return c.json({ campsites: results, total: results.length });
  } catch (error) {
    console.log(`Error in search: ${error}`);
    return c.json({ error: 'Failed to search campsites', details: String(error) }, 500);
  }
});

// Recreation.gov search using RIDB API
async function searchRecreationGov(
  query?: string,
  state?: string,
  activityType?: string,
  startDate?: string,
  endDate?: string,
  accessible?: string
) {
  const apiKey = Deno.env.get('RECREATION_GOV_API_KEY');
  
  if (!apiKey) {
    console.log('Recreation.gov API key not configured');
    return [];
  }

  try {
    // Search facilities (campgrounds)
    const url = new URL('https://ridb.recreation.gov/api/v1/facilities');
    if (query) url.searchParams.append('query', query);
    if (state) url.searchParams.append('state', state);
    url.searchParams.append('limit', '50');
    url.searchParams.append('offset', '0');

    const response = await fetch(url.toString(), {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Recreation.gov facilities API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const facilities = data.RECDATA || [];

    // For each facility, get campsites
    const allCampsites: any[] = [];

    for (const facility of facilities.slice(0, 10)) {
      // Get campsites for this facility
      const campsitesUrl = `https://ridb.recreation.gov/api/v1/facilities/${facility.FacilityID}/campsites`;
      const campsitesResponse = await fetch(campsitesUrl, {
        headers: {
          'apikey': apiKey,
          'Accept': 'application/json',
        },
      });

      if (campsitesResponse.ok) {
        const campsitesData = await campsitesResponse.json();
        const campsites = campsitesData.RECDATA || [];

        // Check availability if dates provided
        let availabilityData = null;
        if (startDate && endDate) {
          availabilityData = await getRecreationGovAvailability(
            facility.FacilityID,
            startDate,
            endDate,
            apiKey
          );
        }

        for (const campsite of campsites) {
          // Filter by accessibility if requested
          if (accessible === 'true' && !campsite.CampsiteAccessible) {
            continue;
          }

          // Check if campsite is available during requested dates
          let isAvailable = true;
          let availableDates: string[] = [];
          
          if (availabilityData && availabilityData.campsites && availabilityData.campsites[campsite.CampsiteID]) {
            const siteAvailability = availabilityData.campsites[campsite.CampsiteID].availabilities;
            const start = new Date(startDate!);
            const end = new Date(endDate!);
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              if (siteAvailability[dateStr] === 'Available') {
                availableDates.push(dateStr);
              } else {
                isAvailable = false;
              }
            }
          }

          allCampsites.push({
            id: campsite.CampsiteID,
            name: campsite.CampsiteName,
            facilityName: facility.FacilityName,
            facilityId: facility.FacilityID,
            type: campsite.CampsiteType,
            loop: campsite.Loop,
            latitude: campsite.CampsiteLatitude || facility.FacilityLatitude,
            longitude: campsite.CampsiteLongitude || facility.FacilityLongitude,
            price: campsite.CampsiteFeeWeekend || campsite.CampsiteFee || 0,
            maxNumPeople: campsite.CampsiteMaxNumPeople,
            accessible: campsite.CampsiteAccessible,
            state: facility.AddressStateCode,
            city: facility.AddressCity,
            description: facility.FacilityDescription,
            reservationUrl: `https://www.recreation.gov/camping/campsites/${campsite.CampsiteID}`,
            source: 'recreation.gov',
            available: startDate && endDate ? isAvailable : true,
            availableDates,
            attributes: campsite.ATTRIBUTES || [],
          });
        }
      }
    }

    return allCampsites;
  } catch (error) {
    console.log(`Error searching Recreation.gov: ${error}`);
    return [];
  }
}

// ReserveCalifornia search using UseDirect RDR API
async function searchReserveCalifornia(
  query?: string,
  state?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    // UseDirect RDR API endpoint for ReserveCalifornia
    const searchUrl = 'https://calirdr.usedirect.com/rdr/rdr/search/grid';
    
    const searchParams = {
      PlaceId: -2147483648, // Root node for all of California
      UnitTypeGroupId: -2147483648,
      StartDate: startDate || new Date().toISOString().split('T')[0],
      EndDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      InSeasonOnly: true,
      WebOnly: true,
      UnitSort: 'name',
      UnitCategoryId: 0,
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      console.log(`ReserveCalifornia API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const campsites: any[] = [];

    // Parse ReserveCalifornia response
    if (data.AvailableUnitsOnly) {
      for (const unit of data.AvailableUnitsOnly.slice(0, 20)) {
        // Get detailed unit information
        const detailsUrl = `https://calirdr.usedirect.com/rdr/rdr/fd/citypark/${unit.FacilityId}`;
        
        try {
          const detailsResponse = await fetch(detailsUrl, {
            headers: { 'Accept': 'application/json' },
          });

          if (detailsResponse.ok) {
            const details = await detailsResponse.json();
            
            campsites.push({
              id: `reservecal_${unit.UnitId}`,
              name: unit.Name,
              facilityName: details.Name || 'Unknown',
              facilityId: unit.FacilityId,
              type: unit.UnitType,
              latitude: details.Latitude,
              longitude: details.Longitude,
              price: unit.MinPrice || 0,
              maxNumPeople: unit.MaxOccupants,
              accessible: unit.IsADAAccessible,
              state: 'CA',
              city: details.City,
              description: details.Description,
              reservationUrl: `https://www.reservecalifornia.com/CalendarAvailability.aspx?facilityid=${unit.FacilityId}`,
              source: 'reservecalifornia.com',
              available: true,
              availableDates: [],
              attributes: unit.Attributes || [],
            });
          }
        } catch (err) {
          console.log(`Error fetching details for unit ${unit.UnitId}: ${err}`);
        }
      }
    }

    return campsites;
  } catch (error) {
    console.log(`Error searching ReserveCalifornia: ${error}`);
    return [];
  }
}

// Get detailed availability for a specific facility
app.get('/make-server-908ab15a/availability/:source/:facilityId', async (c) => {
  try {
    const { source, facilityId } = c.req.param();
    const { startDate, endDate } = c.req.query();

    if (source === 'recreation.gov') {
      const apiKey = Deno.env.get('RECREATION_GOV_API_KEY');
      if (!apiKey) {
        return c.json({ error: 'Recreation.gov API key not configured' }, 500);
      }

      const availability = await getRecreationGovAvailability(
        facilityId,
        startDate || new Date().toISOString().split('T')[0],
        endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        apiKey
      );

      return c.json(availability);
    } else if (source === 'reservecalifornia.com') {
      // Get ReserveCalifornia availability
      const availUrl = `https://calirdr.usedirect.com/rdr/rdr/search/filters`;
      const response = await fetch(availUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          FacilityId: facilityId,
          StartDate: startDate || new Date().toISOString().split('T')[0],
          EndDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        return c.json({ error: 'Failed to fetch ReserveCalifornia availability' }, response.status);
      }

      const data = await response.json();
      return c.json(data);
    }

    return c.json({ error: 'Invalid source' }, 400);
  } catch (error) {
    console.log(`Error fetching availability: ${error}`);
    return c.json({ error: 'Failed to fetch availability', details: String(error) }, 500);
  }
});

// Campsite Photos cross-reference
app.get('/make-server-908ab15a/campsite-photos/:siteName', async (c) => {
  try {
    const { siteName } = c.req.param();
    
    const cacheKey = `campsite_photos_${siteName}`;
    const cached = await kv.get(cacheKey);
    
    if (cached) {
      return c.json(JSON.parse(cached));
    }
    
    const result = {
      siteName,
      hasPhotos: false,
      photoCount: 0,
      url: `https://www.campsitephotos.com/search?q=${encodeURIComponent(siteName)}`,
    };
    
    await kv.set(cacheKey, JSON.stringify(result));
    
    return c.json(result);
  } catch (error) {
    console.log(`Error checking campsite photos: ${error}`);
    return c.json({ error: 'Failed to check campsite photos', details: String(error) }, 500);
  }
});

// Get newly available sites (public endpoint)
app.get('/make-server-908ab15a/newly-available', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's newly available sites
    const newlyAvailKey = `newly_available_${today}`;
    const data = await kv.get(newlyAvailKey);
    
    if (!data) {
      // Try to get from yesterday if today's not available yet
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `newly_available_${yesterday.toISOString().split('T')[0]}`;
      const yesterdayData = await kv.get(yesterdayKey);
      
      if (yesterdayData) {
        return c.json(JSON.parse(yesterdayData));
      }
      
      return c.json([]);
    }
    
    return c.json(JSON.parse(data));
  } catch (error) {
    console.log(`Error fetching newly available sites: ${error}`);
    return c.json({ error: 'Failed to fetch newly available sites', details: String(error) }, 500);
  }
});

// Track site views for popularity tracking
app.post('/make-server-908ab15a/track-view', async (c) => {
  try {
    const { siteId, siteName, facilityId } = await c.req.json();
    
    const viewKey = `views_${siteId}`;
    const viewData = await kv.get(viewKey);
    
    let views = 1;
    if (viewData) {
      const parsed = JSON.parse(viewData);
      views = parsed.views + 1;
    }
    
    await kv.set(viewKey, JSON.stringify({
      siteId,
      siteName,
      facilityId,
      views,
      lastViewed: new Date().toISOString(),
    }));
    
    return c.json({ success: true, views });
  } catch (error) {
    console.log(`Error tracking view: ${error}`);
    return c.json({ error: 'Failed to track view', details: String(error) }, 500);
  }
});

// Get popular sites based on view tracking
app.get('/make-server-908ab15a/popular-sites', async (c) => {
  try {
    const viewRecords = await kv.getByPrefix('views_');
    
    const sites = viewRecords
      .map(item => JSON.parse(item))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);
    
    return c.json(sites);
  } catch (error) {
    console.log(`Error fetching popular sites: ${error}`);
    return c.json({ error: 'Failed to fetch popular sites', details: String(error) }, 500);
  }
});

// Get featured parks with available campsites
app.get('/make-server-908ab15a/featured-parks', async (c) => {
  try {
    const apiKey = Deno.env.get('RECREATION_GOV_API_KEY');
    
    if (!apiKey) {
      return c.json({ error: 'Recreation.gov API key not configured' }, 500);
    }

    // Check cache first (refresh every hour)
    const cacheKey = 'featured_parks_cache';
    const cached = await kv.get(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();
      if (cacheAge < 60 * 60 * 1000) { // 1 hour
        return c.json(cachedData.parks);
      }
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date().toISOString().slice(0, 7) + '-01';

    // Get popular camping facilities
    const url = 'https://ridb.recreation.gov/api/v1/facilities';
    const params = new URLSearchParams({
      limit: '50',
      activity: 'CAMPING',
      sort: 'Name',
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Recreation.gov featured parks API error: ${response.status} - ${errorText}`);
      return c.json({ error: `Recreation.gov API error: ${response.status}`, details: errorText }, response.status);
    }

    const data = await response.json();
    const parksWithAvailability = [];
    
    if (data.RECDATA) {
      for (const facility of data.RECDATA.slice(0, 30)) {
        try {
          // Check actual availability for today using the availability API
          const availUrl = `https://www.recreation.gov/api/camps/availability/campground/${facility.FacilityID}/month`;
          const availParams = new URLSearchParams({
            start_date: monthStart,
          });

          const availResponse = await fetch(`${availUrl}?${availParams}`, {
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (availResponse.ok) {
            const availData = await availResponse.json();
            const campsites = availData.campsites || {};
            
            // Count sites that are available today
            let availableToday = 0;
            for (const [siteId, siteData] of Object.entries(campsites)) {
              const todayAvail = siteData.availabilities?.[today];
              if (todayAvail === 'Available') {
                availableToday++;
              }
            }
            
            if (availableToday > 0) {
              const viewKey = `facility_views_${facility.FacilityID}`;
              const viewData = await kv.get(viewKey);
              const views = viewData ? JSON.parse(viewData).views : 0;

              // Fetch media/photos for this facility
              let media = [];
              try {
                const mediaUrl = `https://ridb.recreation.gov/api/v1/facilities/${facility.FacilityID}/media`;
                const mediaResponse = await fetch(mediaUrl, {
                  headers: {
                    'apikey': apiKey,
                    'Accept': 'application/json',
                  },
                });

                if (mediaResponse.ok) {
                  const mediaData = await mediaResponse.json();
                  media = mediaData.RECDATA || [];
                }
              } catch (mediaErr) {
                console.log(`Error fetching media for facility ${facility.FacilityID}: ${mediaErr}`);
              }
              
              parksWithAvailability.push({
                ...facility,
                availableSitesCount: availableToday,
                views,
                MEDIA: media,
              });
            }
          }
        } catch (err) {
          console.log(`Error fetching availability for facility ${facility.FacilityID}: ${err}`);
        }
      }
    }
    
    parksWithAvailability.sort((a, b) => {
      const scoreA = a.availableSitesCount + (a.views * 2);
      const scoreB = b.availableSitesCount + (b.views * 2);
      return scoreB - scoreA;
    });
    
    const featured = parksWithAvailability.slice(0, 8);
    
    // Cache the results
    await kv.set(cacheKey, JSON.stringify({
      parks: featured,
      timestamp: new Date().toISOString(),
    }));
    
    return c.json(featured);
  } catch (error) {
    console.log(`Error fetching featured parks: ${error}`);
    return c.json({ error: 'Failed to fetch featured parks', details: String(error) }, 500);
  }
});

// Track facility/park views
app.post('/make-server-908ab15a/track-facility-view', async (c) => {
  try {
    const { facilityId, facilityName } = await c.req.json();
    
    const viewKey = `facility_views_${facilityId}`;
    const viewData = await kv.get(viewKey);
    
    let views = 1;
    if (viewData) {
      const parsed = JSON.parse(viewData);
      views = parsed.views + 1;
    }
    
    await kv.set(viewKey, JSON.stringify({
      facilityId,
      facilityName,
      views,
      lastViewed: new Date().toISOString(),
    }));
    
    return c.json({ success: true, views });
  } catch (error) {
    console.log(`Error tracking facility view: ${error}`);
    return c.json({ error: 'Failed to track facility view', details: String(error) }, 500);
  }
});

// Test RIDB API connection
app.get('/make-server-908ab15a/test-ridb', async (c) => {
  try {
    const apiKey = Deno.env.get('RECREATION_GOV_API_KEY');
    
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: 'RECREATION_GOV_API_KEY environment variable is not set',
        hasKey: false,
      }, 500);
    }

    // Test the RIDB API with a simple facilities query
    const testUrl = 'https://ridb.recreation.gov/api/v1/facilities?limit=5&state=CA';
    
    const response = await fetch(testUrl, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        success: false,
        error: `RIDB API returned error: ${response.status}`,
        statusCode: response.status,
        errorDetails: errorText,
        hasKey: true,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
      }, response.status);
    }

    const data = await response.json();
    const facilitiesCount = data.RECDATA?.length || 0;

    return c.json({
      success: true,
      message: 'RIDB API is working correctly',
      hasKey: true,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      testQuery: testUrl,
      facilitiesReturned: facilitiesCount,
      sampleFacility: data.RECDATA?.[0]?.FacilityName || 'N/A',
    });
  } catch (error) {
    console.log(`Error testing RIDB API: ${error}`);
    return c.json({ 
      success: false,
      error: 'Failed to test RIDB API', 
      details: String(error),
      hasKey: !!Deno.env.get('RECREATION_GOV_API_KEY'),
    }, 500);
  }
});

// Test ReserveCalifornia API connection
app.get('/make-server-908ab15a/test-reservecalifornia', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Test the UseDirect RDR API
    const testUrl = 'https://calirdr.usedirect.com/rdr/rdr/search/grid';
    const testParams = {
      PlaceId: -2147483648, // Root node for all of California
      UnitTypeGroupId: -2147483648,
      StartDate: today,
      EndDate: nextWeek,
      InSeasonOnly: true,
      WebOnly: true,
      UnitSort: 'name',
      UnitCategoryId: 0,
    };

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testParams),
    });

    // Get response text first to check what we're receiving
    const responseText = await response.text();
    
    if (!response.ok) {
      return c.json({
        success: false,
        error: `ReserveCalifornia API returned error: ${response.status}`,
        statusCode: response.status,
        errorDetails: responseText.substring(0, 500), // First 500 chars
        isHtml: responseText.trim().startsWith('<'),
      }, response.status);
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return c.json({
        success: false,
        error: 'ReserveCalifornia API returned non-JSON response',
        statusCode: response.status,
        responsePreview: responseText.substring(0, 500),
        isHtml: responseText.trim().startsWith('<'),
        parseError: String(parseError),
      }, 500);
    }

    const availableUnitsCount = data.AvailableUnitsOnly?.length || 0;
    const totalResults = data.TotalCount || 0;

    return c.json({
      success: true,
      message: 'ReserveCalifornia API is working correctly',
      testQuery: testUrl,
      testParams: testParams,
      availableUnitsReturned: availableUnitsCount,
      totalResults: totalResults,
      sampleUnit: data.AvailableUnitsOnly?.[0]?.Name || 'N/A',
      sampleFacility: data.AvailableUnitsOnly?.[0]?.FacilityName || 'N/A',
    });
  } catch (error) {
    console.log(`Error testing ReserveCalifornia API: ${error}`);
    return c.json({ 
      success: false,
      error: 'Failed to test ReserveCalifornia API', 
      details: String(error),
    }, 500);
  }
});

// Take daily snapshot of availability and track newly available sites
// Shared function for snapshot logic
async function executeSnapshot() {
  const apiKey = Deno.env.get('RECREATION_GOV_API_KEY');
  
  if (!apiKey) {
    throw new Error('Recreation.gov API key not configured');
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const snapshotKey = `snapshot_${today}_${hour}`;
  
  // Check if we already took a snapshot this hour
  const existingSnapshot = await kv.get(snapshotKey);
  if (existingSnapshot) {
    return { 
      message: 'Snapshot already taken this hour', 
      date: today, 
      hour,
      alreadyExists: true 
    };
  }

  const monthStart = new Date().toISOString().slice(0, 7) + '-01';

  // Get snapshots from 1-4 days ago to compare
  const previousSnapshots: Record<string, any> = {};
  for (let daysAgo = 1; daysAgo <= 4; daysAgo++) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - daysAgo);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    
    // Get all snapshots from that day (multiple hours)
    const pastSnapshots = await kv.getByPrefix(`snapshot_${pastDateStr}`);
    if (pastSnapshots && pastSnapshots.length > 0) {
      // Use the most recent snapshot from that day
      const mostRecent = pastSnapshots[pastSnapshots.length - 1];
      const parsed = JSON.parse(mostRecent);
      if (parsed.sites) {
        Object.assign(previousSnapshots, parsed.sites);
      }
    }
  }

  // Get popular camping facilities
  const url = 'https://ridb.recreation.gov/api/v1/facilities';
  const params = new URLSearchParams({
    limit: '50',
    activity: 'CAMPING',
    sort: 'Name',
  });

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'apikey': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch facilities: ${response.status}`);
  }

  const data = await response.json();
  const todayAvailability: Record<string, any> = {};
  const newlyAvailableSites = [];
  
  if (data.RECDATA) {
    for (const facility of data.RECDATA.slice(0, 30)) {
      try {
        // Check availability for today
        const availUrl = `https://www.recreation.gov/api/camps/availability/campground/${facility.FacilityID}/month`;
        const availParams = new URLSearchParams({
          start_date: monthStart,
        });

        const availResponse = await fetch(`${availUrl}?${availParams}`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (availResponse.ok) {
          const availData = await availResponse.json();
          const campsites = availData.campsites || {};
          
          for (const [siteId, siteData] of Object.entries(campsites)) {
            const todayAvail = siteData.availabilities?.[today];
            
            if (todayAvail === 'Available') {
              todayAvailability[siteId] = {
                facilityId: facility.FacilityID,
                facilityName: facility.FacilityName,
                siteName: siteData.campsite_name || siteData.site,
                siteId,
                date: today,
              };
              
              // Check if this site was NOT available in any previous snapshot (1-4 days ago)
              // This means it was reserved and is now newly available
              const wasPreviouslyAvailable = previousSnapshots.hasOwnProperty(siteId);
              
              if (!wasPreviouslyAvailable) {
                // This is a newly available site (was reserved before, now available)
                newlyAvailableSites.push({
                  ...todayAvailability[siteId],
                  becameAvailableAt: new Date().toISOString(),
                  facilityState: facility.AddressStateCode,
                  facilityCity: facility.AddressCity,
                  reservationUrl: `https://www.recreation.gov/camping/campsites/${siteId}`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.log(`Error checking facility ${facility.FacilityID}: ${err}`);
      }
    }
  }

  // Save this hour's snapshot
  await kv.set(snapshotKey, JSON.stringify({
    date: today,
    hour,
    sites: todayAvailability,
    timestamp: new Date().toISOString(),
  }));

  // Append newly available sites to today's list
  const newlyAvailKey = `newly_available_${today}`;
  const existingNewly = await kv.get(newlyAvailKey);
  let allNewlyAvailable = existingNewly ? JSON.parse(existingNewly) : [];
  
  // Add new sites (avoid duplicates)
  const existingSiteIds = new Set(allNewlyAvailable.map((s: any) => s.siteId));
  const uniqueNewSites = newlyAvailableSites.filter(s => !existingSiteIds.has(s.siteId));
  allNewlyAvailable = [...allNewlyAvailable, ...uniqueNewSites];
  
  await kv.set(newlyAvailKey, JSON.stringify(allNewlyAvailable));

  // Clean up old snapshots (keep only last 5 days)
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const oldDateStr = fiveDaysAgo.toISOString().split('T')[0];
  
  // Delete all snapshots from 5 days ago
  const oldSnapshots = await kv.getByPrefix(`snapshot_${oldDateStr}`);
  if (oldSnapshots && oldSnapshots.length > 0) {
    for (const snapshot of oldSnapshots) {
      const parsed = JSON.parse(snapshot);
      if (parsed.date === oldDateStr) {
        await kv.del(`snapshot_${oldDateStr}_${parsed.hour}`);
      }
    }
  }
  
  const oldNewlyAvailKey = `newly_available_${oldDateStr}`;
  await kv.del(oldNewlyAvailKey);

  return {
    success: true,
    date: today,
    hour,
    totalSitesAvailable: Object.keys(todayAvailability).length,
    newlyAvailable: uniqueNewSites.length,
    totalNewlyAvailableToday: allNewlyAvailable.length,
  };
}

app.post('/make-server-908ab15a/take-snapshot', async (c) => {
  try {
    const result = await executeSnapshot();
    return c.json(result);
  } catch (error) {
    console.log(`Error taking snapshot: ${error}`);
    return c.json({ error: 'Failed to take snapshot', details: String(error) }, 500);
  }
});

// Scheduled endpoint for automatic snapshots (to be called by cron)
// Call this endpoint 3 times daily: 8am, 12pm, 8pm Pacific Time
app.get('/make-server-908ab15a/cron/snapshot', async (c) => {
  try {
    // Verify this is from a cron service - accept secret from header OR query param
    const cronSecretHeader = c.req.header('X-Cron-Secret');
    const cronSecretQuery = c.req.query('secret');
    const cronSecret = cronSecretHeader || cronSecretQuery;
    const expectedSecret = Deno.env.get('CRON_SECRET') || 'campfinder-cron-2024';
    
    // Debug logging
    console.log('=== CRON AUTH DEBUG ===');
    console.log('All headers:', JSON.stringify(Object.fromEntries(c.req.raw.headers)));
    console.log('Header secret:', cronSecretHeader ? '[PRESENT]' : '[MISSING]');
    console.log('Query secret:', cronSecretQuery ? '[PRESENT]' : '[MISSING]');
    console.log('Received secret:', cronSecret ? '[PRESENT]' : '[MISSING]');
    console.log('Expected secret:', expectedSecret ? '[PRESENT]' : '[MISSING]');
    console.log('Match:', cronSecret === expectedSecret);
    console.log('======================');
    
    if (cronSecret !== expectedSecret) {
      console.log('Auth failed: secret mismatch');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Execute snapshot directly using shared function
    console.log('Starting cron snapshot execution...');
    const result = await executeSnapshot();
    console.log('Cron snapshot completed:', result);

    return c.json({
      success: true,
      message: 'Scheduled snapshot completed',
      result,
    });
  } catch (error) {
    console.log(`Cron snapshot error: ${error}`);
    return c.json({ error: 'Failed to run scheduled snapshot', details: String(error) }, 500);
  }
});

// ===== ADMIN AUTHENTICATION ROUTES =====

// Admin signup (only allow first admin or with admin token)
app.post('/make-server-908ab15a/admin/signup', async (c) => {
  try {
    const { email, password, name, adminToken } = await c.req.json();

    // Check if any admin exists
    const adminList = await kv.getByPrefix('admin_user_');
    const hasAdmins = adminList && adminList.length > 0;

    // If admins exist, require admin token (you can set this in env or hardcode)
    if (hasAdmins && adminToken !== 'ADMIN_INVITE_TOKEN_2024') {
      return c.json({ error: 'Invalid admin invitation token' }, 403);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      email_confirm: true, // Auto-confirm since email server not configured
    });

    if (error) {
      console.log(`Admin signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store admin user info
    await kv.set(`admin_user_${data.user.id}`, JSON.stringify({
      id: data.user.id,
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }));

    return c.json({ 
      success: true, 
      message: 'Admin account created successfully',
      userId: data.user.id 
    });
  } catch (error) {
    console.log(`Admin signup error: ${error}`);
    return c.json({ error: 'Failed to create admin account', details: String(error) }, 500);
  }
});

// Admin login (handled by Supabase client-side, but verify admin role)
app.post('/make-server-908ab15a/admin/verify', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    // Check if user is admin
    const adminData = await kv.get(`admin_user_${user.id}`);
    if (!adminData) {
      return c.json({ error: 'User is not an admin' }, 403);
    }

    const admin = JSON.parse(adminData);

    return c.json({ 
      success: true, 
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }
    });
  } catch (error) {
    console.log(`Admin verify error: ${error}`);
    return c.json({ error: 'Failed to verify admin', details: String(error) }, 500);
  }
});

// ===== USER AUTHENTICATION ROUTES =====

// User signup
app.post('/make-server-908ab15a/user/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'user' },
      email_confirm: true, // Auto-confirm since email server not configured
    });

    if (error) {
      console.log(`User signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user info
    await kv.set(`user_${data.user.id}`, JSON.stringify({
      id: data.user.id,
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
    }));

    return c.json({ 
      success: true, 
      message: 'Account created successfully',
      userId: data.user.id 
    });
  } catch (error) {
    console.log(`User signup error: ${error}`);
    return c.json({ error: 'Failed to create account', details: String(error) }, 500);
  }
});

// Get user profile
app.get('/make-server-908ab15a/user/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('User profile: No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log(`User profile: Invalid access token - ${error?.message}`);
      return c.json({ error: 'Invalid access token' }, 401);
    }

    // Get user data from KV store
    const userDataStr = await kv.get(`user_${user.id}`);
    
    if (!userDataStr) {
      console.log(`User profile: User data not found for ${user.id}`);
      return c.json({ error: 'User data not found' }, 404);
    }

    const userData = JSON.parse(userDataStr);

    return c.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      isAdmin: userData.role === 'admin'
    });
  } catch (error) {
    console.log(`User profile error: ${error}`);
    return c.json({ error: 'Failed to fetch user profile', details: String(error) }, 500);
  }
});

// Make user admin (utility endpoint)
app.post('/make-server-908ab15a/admin/promote-user', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log(`Attempting to promote user: ${email}`);

    // Get all users from Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log(`Error listing users: ${listError.message}`);
      return c.json({ error: listError.message }, 500);
    }

    // Find user by email
    const targetUser = users.find(u => u.email === email);
    
    if (!targetUser) {
      console.log(`User not found: ${email}`);
      return c.json({ error: 'User not found' }, 404);
    }

    console.log(`Found user: ${targetUser.id}`);

    // Get current user data
    const userDataStr = await kv.get(`user_${targetUser.id}`);
    
    if (!userDataStr) {
      console.log(`User data not found in KV store for ${targetUser.id}`);
      return c.json({ error: 'User data not found in database' }, 404);
    }

    const userData = JSON.parse(userDataStr);
    
    // Update role to admin
    userData.role = 'admin';
    userData.promotedAt = new Date().toISOString();
    
    await kv.set(`user_${targetUser.id}`, JSON.stringify(userData));
    
    console.log(`User ${email} promoted to admin successfully`);

    return c.json({ 
      success: true, 
      message: `User ${email} is now an admin`,
      userId: targetUser.id 
    });
  } catch (error) {
    console.log(`Error promoting user: ${error}`);
    return c.json({ error: 'Failed to promote user', details: String(error) }, 500);
  }
});

// Get user favorites
app.get('/make-server-908ab15a/user/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const favoritesData = await kv.get(`user_favorites_${user.id}`);
    const favorites = favoritesData ? JSON.parse(favoritesData) : [];

    return c.json({ favorites });
  } catch (error) {
    console.log(`Error fetching favorites: ${error}`);
    return c.json({ error: 'Failed to fetch favorites', details: String(error) }, 500);
  }
});

// Add favorite
app.post('/make-server-908ab15a/user/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const { siteId, siteName, facilityId, facilityName, source } = await c.req.json();

    const favoritesData = await kv.get(`user_favorites_${user.id}`);
    const favorites = favoritesData ? JSON.parse(favoritesData) : [];

    // Check if already favorited
    if (favorites.some((f: any) => f.siteId === siteId)) {
      return c.json({ error: 'Site already in favorites' }, 400);
    }

    favorites.push({
      siteId,
      siteName,
      facilityId,
      facilityName,
      source,
      addedAt: new Date().toISOString(),
    });

    await kv.set(`user_favorites_${user.id}`, JSON.stringify(favorites));

    return c.json({ success: true, favorites });
  } catch (error) {
    console.log(`Error adding favorite: ${error}`);
    return c.json({ error: 'Failed to add favorite', details: String(error) }, 500);
  }
});

// Remove favorite
app.delete('/make-server-908ab15a/user/favorites/:siteId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const { siteId } = c.req.param();

    const favoritesData = await kv.get(`user_favorites_${user.id}`);
    const favorites = favoritesData ? JSON.parse(favoritesData) : [];

    const updatedFavorites = favorites.filter((f: any) => f.siteId !== siteId);

    await kv.set(`user_favorites_${user.id}`, JSON.stringify(updatedFavorites));

    return c.json({ success: true, favorites: updatedFavorites });
  } catch (error) {
    console.log(`Error removing favorite: ${error}`);
    return c.json({ error: 'Failed to remove favorite', details: String(error) }, 500);
  }
});

// Get user alerts
app.get('/make-server-908ab15a/user/alerts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const alertsData = await kv.get(`user_alerts_${user.id}`);
    const alerts = alertsData ? JSON.parse(alertsData) : [];

    return c.json({ alerts });
  } catch (error) {
    console.log(`Error fetching alerts: ${error}`);
    return c.json({ error: 'Failed to fetch alerts', details: String(error) }, 500);
  }
});

// Create alert
app.post('/make-server-908ab15a/user/alerts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const { siteId, siteName, facilityId, facilityName, source, startDate, endDate, email } = await c.req.json();

    const alertsData = await kv.get(`user_alerts_${user.id}`);
    const alerts = alertsData ? JSON.parse(alertsData) : [];

    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    alerts.push({
      alertId,
      siteId,
      siteName,
      facilityId,
      facilityName,
      source,
      startDate,
      endDate,
      email: email || user.email,
      active: true,
      createdAt: new Date().toISOString(),
      lastChecked: null,
      triggeredAt: null,
    });

    await kv.set(`user_alerts_${user.id}`, JSON.stringify(alerts));

    return c.json({ success: true, alertId, alerts });
  } catch (error) {
    console.log(`Error creating alert: ${error}`);
    return c.json({ error: 'Failed to create alert', details: String(error) }, 500);
  }
});

// Delete alert
app.delete('/make-server-908ab15a/user/alerts/:alertId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const { alertId } = c.req.param();

    const alertsData = await kv.get(`user_alerts_${user.id}`);
    const alerts = alertsData ? JSON.parse(alertsData) : [];

    const updatedAlerts = alerts.filter((a: any) => a.alertId !== alertId);

    await kv.set(`user_alerts_${user.id}`, JSON.stringify(updatedAlerts));

    return c.json({ success: true, alerts: updatedAlerts });
  } catch (error) {
    console.log(`Error deleting alert: ${error}`);
    return c.json({ error: 'Failed to delete alert', details: String(error) }, 500);
  }
});

// Get site ratings
app.get('/make-server-908ab15a/ratings/:siteId', async (c) => {
  try {
    const { siteId } = c.req.param();

    const ratingsData = await kv.get(`site_ratings_${siteId}`);
    const ratings = ratingsData ? JSON.parse(ratingsData) : { ratings: [], average: 0, count: 0 };

    return c.json(ratings);
  } catch (error) {
    console.log(`Error fetching ratings: ${error}`);
    return c.json({ error: 'Failed to fetch ratings', details: String(error) }, 500);
  }
});

// Add or update rating
app.post('/make-server-908ab15a/ratings/:siteId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    const { siteId } = c.req.param();
    const { rating, review } = await c.req.json();

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    const ratingsData = await kv.get(`site_ratings_${siteId}`);
    const ratingsObj = ratingsData ? JSON.parse(ratingsData) : { ratings: [], average: 0, count: 0 };

    // Remove existing rating from this user if any
    const existingIndex = ratingsObj.ratings.findIndex((r: any) => r.userId === user.id);
    if (existingIndex !== -1) {
      ratingsObj.ratings.splice(existingIndex, 1);
    }

    // Add new rating
    ratingsObj.ratings.push({
      userId: user.id,
      userName: user.user_metadata?.name || user.email,
      rating,
      review: review || '',
      createdAt: new Date().toISOString(),
    });

    // Calculate new average
    const sum = ratingsObj.ratings.reduce((acc: number, r: any) => acc + r.rating, 0);
    ratingsObj.average = sum / ratingsObj.ratings.length;
    ratingsObj.count = ratingsObj.ratings.length;

    await kv.set(`site_ratings_${siteId}`, JSON.stringify(ratingsObj));

    return c.json({ success: true, ratings: ratingsObj });
  } catch (error) {
    console.log(`Error adding rating: ${error}`);
    return c.json({ error: 'Failed to add rating', details: String(error) }, 500);
  }
});

// Get user's ratings
app.get('/make-server-908ab15a/user/ratings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid access token' }, 401);
    }

    // Get all ratings and filter by user
    const allRatings = await kv.getByPrefix('site_ratings_');
    const userRatings: any[] = [];

    for (const ratingData of allRatings) {
      const ratingsObj = JSON.parse(ratingData);
      const userRating = ratingsObj.ratings.find((r: any) => r.userId === user.id);
      if (userRating) {
        userRatings.push({
          siteId: ratingData.split('site_ratings_')[1],
          ...userRating,
        });
      }
    }

    return c.json({ ratings: userRatings });
  } catch (error) {
    console.log(`Error fetching user ratings: ${error}`);
    return c.json({ error: 'Failed to fetch user ratings', details: String(error) }, 500);
  }
});

// ===== TRAFFIC TRACKING ROUTES =====

// Track page view
app.post('/make-server-908ab15a/track-pageview', async (c) => {
  try {
    const { page, referrer, userAgent } = await c.req.json();
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    const hour = new Date(timestamp).getHours();

    // Track daily stats
    const dailyKey = `stats_daily_${date}`;
    const dailyData = await kv.get(dailyKey);
    let dailyStats = dailyData ? JSON.parse(dailyData) : {
      date,
      pageviews: 0,
      uniqueVisitors: new Set(),
      pages: {},
      referrers: {},
      hourly: Array(24).fill(0),
    };

    dailyStats.pageviews++;
    dailyStats.hourly[hour]++;
    
    // Track page
    if (!dailyStats.pages[page]) {
      dailyStats.pages[page] = 0;
    }
    dailyStats.pages[page]++;

    // Track referrer
    if (referrer && referrer !== '' && referrer !== 'direct') {
      if (!dailyStats.referrers[referrer]) {
        dailyStats.referrers[referrer] = 0;
      }
      dailyStats.referrers[referrer]++;
    }

    // Convert Set back to array for storage
    const visitorsArray = Array.isArray(dailyStats.uniqueVisitors) 
      ? dailyStats.uniqueVisitors 
      : Array.from(dailyStats.uniqueVisitors);

    await kv.set(dailyKey, JSON.stringify({
      ...dailyStats,
      uniqueVisitors: visitorsArray,
    }));

    // Track overall stats
    const overallKey = 'stats_overall';
    const overallData = await kv.get(overallKey);
    let overallStats = overallData ? JSON.parse(overallData) : {
      totalPageviews: 0,
      totalSessions: 0,
      startDate: date,
    };

    overallStats.totalPageviews++;
    overallStats.lastUpdated = timestamp;

    await kv.set(overallKey, JSON.stringify(overallStats));

    return c.json({ success: true });
  } catch (error) {
    console.log(`Track pageview error: ${error}`);
    return c.json({ error: 'Failed to track pageview', details: String(error) }, 500);
  }
});

// Get analytics data (admin only)
app.get('/make-server-908ab15a/admin/analytics', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify admin
    const adminData = await kv.get(`admin_user_${user.id}`);
    if (!adminData) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { days = 7 } = c.req.query();
    const daysNum = parseInt(days);

    // Get stats for the last N days
    const stats = [];
    const today = new Date();
    
    for (let i = 0; i < daysNum; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyKey = `stats_daily_${dateStr}`;
      const dailyData = await kv.get(dailyKey);
      
      if (dailyData) {
        const parsed = JSON.parse(dailyData);
        stats.push({
          date: dateStr,
          pageviews: parsed.pageviews || 0,
          uniqueVisitors: parsed.uniqueVisitors?.length || 0,
          pages: parsed.pages || {},
          referrers: parsed.referrers || {},
          hourly: parsed.hourly || Array(24).fill(0),
        });
      } else {
        stats.push({
          date: dateStr,
          pageviews: 0,
          uniqueVisitors: 0,
          pages: {},
          referrers: {},
          hourly: Array(24).fill(0),
        });
      }
    }

    // Get overall stats
    const overallData = await kv.get('stats_overall');
    const overallStats = overallData ? JSON.parse(overallData) : {
      totalPageviews: 0,
      totalSessions: 0,
    };

    return c.json({
      daily: stats.reverse(),
      overall: overallStats,
    });
  } catch (error) {
    console.log(`Get analytics error: ${error}`);
    return c.json({ error: 'Failed to get analytics', details: String(error) }, 500);
  }
});

// Get snapshot history (admin only)
app.get('/make-server-908ab15a/admin/snapshot-history', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify admin
    const adminData = await kv.get(`admin_user_${user.id}`);
    if (!adminData) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get all snapshots from today
    const todaySnapshots = await kv.getByPrefix(`snapshot_${today}`);
    const todayRuns = [];
    
    if (todaySnapshots && todaySnapshots.length > 0) {
      for (const snapshot of todaySnapshots) {
        const parsed = JSON.parse(snapshot);
        todayRuns.push({
          date: parsed.date,
          hour: parsed.hour,
          timestamp: parsed.timestamp,
          sitesCount: Object.keys(parsed.sites || {}).length,
        });
      }
    }

    // Get newly available sites from today
    const newlyAvailKey = `newly_available_${today}`;
    const newlyAvailData = await kv.get(newlyAvailKey);
    const newlyAvailableSites = newlyAvailData ? JSON.parse(newlyAvailData) : [];

    // Get the most recent snapshot overall
    let lastSnapshot = null;
    if (todayRuns.length > 0) {
      const mostRecent = todayRuns.reduce((latest, current) => {
        return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
      });
      lastSnapshot = mostRecent;
    } else {
      // Check yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdaySnapshots = await kv.getByPrefix(`snapshot_${yesterdayStr}`);
      
      if (yesterdaySnapshots && yesterdaySnapshots.length > 0) {
        const parsed = JSON.parse(yesterdaySnapshots[yesterdaySnapshots.length - 1]);
        lastSnapshot = {
          date: parsed.date,
          hour: parsed.hour,
          timestamp: parsed.timestamp,
          sitesCount: Object.keys(parsed.sites || {}).length,
        };
      }
    }

    return c.json({
      todayRuns: todayRuns.sort((a, b) => a.hour - b.hour),
      lastSnapshot,
      newlyAvailableCount: newlyAvailableSites.length,
    });
  } catch (error) {
    console.log(`Get snapshot history error: ${error}`);
    return c.json({ error: 'Failed to get snapshot history', details: String(error) }, 500);
  }
});

// ===== AD CONFIGURATION ROUTES =====

// Save ad configuration (admin only)
app.post('/make-server-908ab15a/admin/ad-config', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify admin
    const adminData = await kv.get(`admin_user_${user.id}`);
    if (!adminData) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const config = await c.req.json();

    await kv.set('ad_configuration', JSON.stringify({
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    }));

    return c.json({ success: true, message: 'Ad configuration saved' });
  } catch (error) {
    console.log(`Save ad config error: ${error}`);
    return c.json({ error: 'Failed to save ad configuration', details: String(error) }, 500);
  }
});

// Get ad configuration (public, but only returns enabled ads)
app.get('/make-server-908ab15a/ad-config', async (c) => {
  try {
    const configData = await kv.get('ad_configuration');
    
    if (!configData) {
      return c.json({
        googleAdSense: { enabled: false },
        googleAdManager: { enabled: false },
        amazonAssociates: { enabled: false },
      });
    }

    const config = JSON.parse(configData);

    // Return only public-safe configuration
    return c.json({
      googleAdSense: {
        enabled: config.googleAdSense?.enabled || false,
        clientId: config.googleAdSense?.clientId || '',
        slots: config.googleAdSense?.slots || {},
      },
      googleAdManager: {
        enabled: config.googleAdManager?.enabled || false,
        networkCode: config.googleAdManager?.networkCode || '',
        adUnits: config.googleAdManager?.adUnits || {},
      },
      amazonAssociates: {
        enabled: config.amazonAssociates?.enabled || false,
        trackingId: config.amazonAssociates?.trackingId || '',
      },
    });
  } catch (error) {
    console.log(`Get ad config error: ${error}`);
    return c.json({ error: 'Failed to get ad configuration', details: String(error) }, 500);
  }
});

// Get full ad configuration (admin only)
app.get('/make-server-908ab15a/admin/ad-config', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify admin
    const adminData = await kv.get(`admin_user_${user.id}`);
    if (!adminData) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const configData = await kv.get('ad_configuration');
    
    if (!configData) {
      return c.json({
        googleAdSense: { 
          enabled: false,
          clientId: '',
          slots: {
            headerBanner: '',
            sidebarTop: '',
            sidebarBottom: '',
            footerBanner: '',
          }
        },
        googleAdManager: { 
          enabled: false,
          networkCode: '',
          adUnits: {},
        },
        amazonAssociates: { 
          enabled: false,
          trackingId: '',
        },
      });
    }

    return c.json(JSON.parse(configData));
  } catch (error) {
    console.log(`Get full ad config error: ${error}`);
    return c.json({ error: 'Failed to get ad configuration', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);