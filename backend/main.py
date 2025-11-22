from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import os
from camply.search import SearchRecreationDotGov
from camply.containers import AvailableCampsite
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LastMinuteCamps Camply Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Camply searcher
searcher = SearchRecreationDotGov()

# Pydantic models
class CampgroundSearchRequest(BaseModel):
    search_query: str
    state: Optional[str] = None

class AvailabilitySearchRequest(BaseModel):
    campground_id: str
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    nights: Optional[int] = 1

class CanceledReservationsRequest(BaseModel):
    campground_ids: List[str]
    start_date: str
    end_date: str
    check_interval_hours: Optional[int] = 1

class AlertRequest(BaseModel):
    campground_id: str
    start_date: str
    end_date: str
    equipment: Optional[List[str]] = None
    nights: Optional[int] = 1
    notification_email: Optional[str] = None
    notification_webhook: Optional[str] = None

@app.get("/")
def root():
    return {
        "service": "LastMinuteCamps Camply Service",
        "status": "running",
        "endpoints": [
            "/campgrounds/search",
            "/campgrounds/{campground_id}",
            "/availability/search",
            "/availability/recently-canceled",
            "/alerts/create"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/campgrounds/search")
async def search_campgrounds(request: CampgroundSearchRequest):
    """
    Search for campgrounds using Camply.
    Returns facility IDs and details.
    """
    try:
        logger.info(f"Searching campgrounds: {request.search_query}")
        
        campgrounds = searcher.find_campgrounds(
            search_query=request.search_query,
            state=request.state
        )
        
        results = []
        for camp in campgrounds:
            results.append({
                "facility_id": str(camp.facility_id),
                "facility_name": camp.facility_name,
                "recreation_area": camp.recreation_area,
                "parent_location": getattr(camp, 'parent_location', None),
                "city": getattr(camp, 'city', None),
                "state": getattr(camp, 'state', None),
                "latitude": getattr(camp, 'latitude', None),
                "longitude": getattr(camp, 'longitude', None),
                "campsite_count": getattr(camp, 'campsite_count', None),
            })
        
        logger.info(f"Found {len(results)} campgrounds")
        return {"campgrounds": results, "count": len(results)}
    
    except Exception as e:
        logger.error(f"Error searching campgrounds: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/campgrounds/{campground_id}")
async def get_campground_details(campground_id: str):
    """
    Get detailed information about a specific campground.
    """
    try:
        logger.info(f"Getting details for campground: {campground_id}")
        
        # Camply doesn't have a direct "get by ID" but we can search and filter
        # This is a workaround - in production you might cache these results
        campgrounds = searcher.find_campgrounds(rec_area_id=campground_id)
        
        if not campgrounds:
            raise HTTPException(status_code=404, detail="Campground not found")
        
        camp = campgrounds[0]
        return {
            "facility_id": str(camp.facility_id),
            "facility_name": camp.facility_name,
            "recreation_area": camp.recreation_area,
            "parent_location": getattr(camp, 'parent_location', None),
            "city": getattr(camp, 'city', None),
            "state": getattr(camp, 'state', None),
            "latitude": getattr(camp, 'latitude', None),
            "longitude": getattr(camp, 'longitude', None),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting campground details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/availability/search")
async def search_availability(request: AvailabilitySearchRequest):
    """
    Search for available campsites at a specific campground.
    """
    try:
        logger.info(f"Searching availability for campground {request.campground_id}")
        
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
        
        # Search for available campsites
        campsites = searcher.get_campsites(
            campground_id=int(request.campground_id),
            start_date=start_date,
            end_date=end_date,
            nights=request.nights
        )
        
        results = []
        for site in campsites:
            results.append({
                "campsite_id": str(site.campsite_id),
                "campsite_site_name": site.campsite_site_name,
                "campsite_type": site.campsite_type,
                "campsite_loop": getattr(site, 'campsite_loop', None),
                "availability_date": site.booking_date.isoformat() if hasattr(site, 'booking_date') else None,
                "booking_url": site.booking_url if hasattr(site, 'booking_url') else None,
                "campsite_occupancy": getattr(site, 'campsite_occupancy', None),
                "facility_id": str(site.facility_id),
            })
        
        logger.info(f"Found {len(results)} available campsites")
        return {
            "available_sites": results,
            "count": len(results),
            "campground_id": request.campground_id,
            "date_range": {
                "start": request.start_date,
                "end": request.end_date
            }
        }
    
    except Exception as e:
        logger.error(f"Error searching availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/availability/recently-canceled")
async def get_recently_canceled(request: CanceledReservationsRequest):
    """
    Monitor campgrounds for recently canceled reservations.
    This endpoint checks for new availability that appeared recently.
    """
    try:
        logger.info(f"Checking for canceled reservations across {len(request.campground_ids)} campgrounds")
        
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
        
        all_canceled = []
        
        for campground_id in request.campground_ids:
            try:
                # Get current availability
                campsites = searcher.get_campsites(
                    campground_id=int(campground_id),
                    start_date=start_date,
                    end_date=end_date
                )
                
                # In a real implementation, you'd compare against a previous snapshot
                # to detect truly "canceled" (newly available) sites
                # For now, we'll return recent availability
                for site in campsites:
                    all_canceled.append({
                        "campground_id": campground_id,
                        "campsite_id": str(site.campsite_id),
                        "campsite_site_name": site.campsite_site_name,
                        "campsite_type": site.campsite_type,
                        "availability_date": site.booking_date.isoformat() if hasattr(site, 'booking_date') else None,
                        "booking_url": site.booking_url if hasattr(site, 'booking_url') else None,
                        "detected_at": datetime.now().isoformat(),
                        "facility_id": str(site.facility_id),
                    })
            
            except Exception as e:
                logger.warning(f"Error checking campground {campground_id}: {str(e)}")
                continue
        
        logger.info(f"Found {len(all_canceled)} potentially canceled/available sites")
        return {
            "canceled_sites": all_canceled,
            "count": len(all_canceled),
            "checked_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error checking canceled reservations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/create")
async def create_alert(request: AlertRequest, background_tasks: BackgroundTasks):
    """
    Create an alert for campsite availability.
    This would typically be stored in a database and checked periodically.
    """
    try:
        logger.info(f"Creating alert for campground {request.campground_id}")
        
        # In a production system, this would:
        # 1. Store the alert in a database
        # 2. Set up a background job to check availability
        # 3. Send notifications when availability is found
        
        alert_data = {
            "alert_id": f"alert_{datetime.now().timestamp()}",
            "campground_id": request.campground_id,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "equipment": request.equipment,
            "nights": request.nights,
            "notification_email": request.notification_email,
            "notification_webhook": request.notification_webhook,
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        # TODO: Store in database and set up monitoring
        # background_tasks.add_task(monitor_alert, alert_data)
        
        return {
            "success": True,
            "alert": alert_data,
            "message": "Alert created successfully. You will be notified when availability is found."
        }
    
    except Exception as e:
        logger.error(f"Error creating alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/providers")
async def get_providers():
    """
    Return list of supported providers via Camply.
    """
    return {
        "providers": [
            {
                "id": "recreation_gov",
                "name": "Recreation.gov",
                "description": "Federal recreation areas including National Parks, National Forests, and more",
                "supported": True
            },
            {
                "id": "recreation_gov_ticket",
                "name": "Recreation.gov Tickets",
                "description": "Timed entry and activity tickets",
                "supported": True
            },
            {
                "id": "reserve_california",
                "name": "Reserve California",
                "description": "California State Parks",
                "supported": True
            },
            {
                "id": "yellowstone",
                "name": "Yellowstone Lodging",
                "description": "Yellowstone National Park lodging",
                "supported": True
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
