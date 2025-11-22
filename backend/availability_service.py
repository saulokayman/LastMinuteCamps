from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from camply.search import SearchRecreationGov, SearchUsedirect
from camply.containers import SearchWindow

app = FastAPI()

class AvailabilityResponse(BaseModel):
    provider: str
    campground_id: str
    available_sites: List[Dict[str, Any]]
    total_available: int
    search_window: Dict[str, str]

def check_reserve_california(
    campground_id: str,
    start_date: str,
    end_date: str
) -> Dict[str, Any]:
    """
    Check ReserveCalifornia availability using camply's UseDirect provider.
    
    Args:
        campground_id: The campground/facility ID
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    
    Returns:
        Dict with available sites and metadata
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        search_window = SearchWindow(start_date=start, end_date=end)
        
        searcher = SearchUsedirect(
            search_window=search_window,
            recreation_area=[int(campground_id)]
        )
        
        available_sites = list(searcher.get_matching_campsites(log=False))
        
        sites_data = []
        for site in available_sites:
            sites_data.append({
                "campsite_id": str(site.campsite_id),
                "campsite_name": site.campsite_title,
                "facility_name": site.facility_name,
                "facility_id": str(site.facility_id),
                "campsite_site_type": site.campsite_site_type,
                "campsite_type": site.campsite_type,
                "campsite_occupancy": site.campsite_occupancy,
                "availability_status": site.availability_status,
                "recreation_area": site.recreation_area,
                "recreation_area_id": site.recreation_area_id,
                "booking_url": site.booking_url,
                "booking_date": site.booking_date.isoformat() if site.booking_date else None,
            })
        
        return {
            "provider": "reservecalifornia",
            "campground_id": campground_id,
            "available_sites": sites_data,
            "total_available": len(sites_data),
            "search_window": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking ReserveCalifornia availability: {str(e)}"
        )

def check_recreation_gov(
    campground_id: str,
    start_date: str,
    end_date: str
) -> Dict[str, Any]:
    """
    Check Recreation.gov availability using camply's RecreationGov provider.
    
    Args:
        campground_id: The campground/facility ID
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    
    Returns:
        Dict with available sites and metadata
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        search_window = SearchWindow(start_date=start, end_date=end)
        
        searcher = SearchRecreationGov(
            search_window=search_window,
            recreation_area=[int(campground_id)]
        )
        
        available_sites = list(searcher.get_matching_campsites(log=False))
        
        sites_data = []
        for site in available_sites:
            sites_data.append({
                "campsite_id": str(site.campsite_id),
                "campsite_name": site.campsite_title,
                "facility_name": site.facility_name,
                "facility_id": str(site.facility_id),
                "campsite_site_type": site.campsite_site_type,
                "campsite_type": site.campsite_type,
                "campsite_occupancy": site.campsite_occupancy,
                "availability_status": site.availability_status,
                "recreation_area": site.recreation_area,
                "recreation_area_id": site.recreation_area_id,
                "booking_url": site.booking_url,
                "booking_date": site.booking_date.isoformat() if site.booking_date else None,
            })
        
        return {
            "provider": "recreation.gov",
            "campground_id": campground_id,
            "available_sites": sites_data,
            "total_available": len(sites_data),
            "search_window": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking Recreation.gov availability: {str(e)}"
        )

@app.get("/availability", response_model=AvailabilityResponse)
async def get_availability(
    provider: str = Query(..., description="Provider: 'recreation.gov' or 'reservecalifornia'"),
    campground_id: str = Query(..., description="Campground/Facility ID"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Get campsite availability from Recreation.gov or ReserveCalifornia.
    """
    if provider == "recreation.gov":
        return check_recreation_gov(campground_id, start_date, end_date)
    elif provider == "reservecalifornia":
        return check_reserve_california(campground_id, start_date, end_date)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider: {provider}. Must be 'recreation.gov' or 'reservecalifornia'"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
