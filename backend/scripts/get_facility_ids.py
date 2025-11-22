"""
Utility script to fetch facility IDs for campgrounds.
Run this locally to get the correct IDs for your campgrounds.
"""
from camply.search import SearchRecreationDotGov
import json

searcher = SearchRecreationDotGov()

# List of campgrounds to search for
campgrounds_to_search = [
    # Yosemite
    ("Upper Pines Campground", "Yosemite"),
    ("Lower Pines Campground", "Yosemite"),
    ("North Pines Campground", "Yosemite"),
    
    # Grand Canyon
    ("Mather Campground", "Grand Canyon"),
    ("Desert View Campground", "Grand Canyon"),
    
    # Yellowstone
    ("Madison Campground", "Yellowstone"),
    ("Bridge Bay Campground", "Yellowstone"),
    
    # Joshua Tree
    ("Jumbo Rocks Campground", "Joshua Tree"),
    ("Indian Cove Campground", "Joshua Tree"),
    
    # Zion
    ("Watchman Campground", "Zion"),
    ("South Campground", "Zion"),
    
    # Rocky Mountain
    ("Moraine Park Campground", "Rocky Mountain"),
    ("Glacier Basin Campground", "Rocky Mountain"),
    
    # Acadia
    ("Blackwoods Campground", "Acadia"),
    ("Seawall Campground", "Acadia"),
    
    # Great Smoky Mountains
    ("Cades Cove Campground", "Smoky Mountains"),
    ("Elkmont Campground", "Smoky Mountains"),
    
    # Olympic
    ("Kalaloch Campground", "Olympic"),
    ("Sol Duc Hot Springs", "Olympic"),
]

def search_and_display(campground_name, park_name):
    """Search for a campground and display results."""
    print(f"\n{'='*80}")
    print(f"Searching: {campground_name} in {park_name}")
    print('='*80)
    
    try:
        # Try searching with full name
        results = searcher.find_campgrounds(search_query=f"{campground_name} {park_name}")
        
        if not results:
            # Try just the campground name
            results = searcher.find_campgrounds(search_query=campground_name)
        
        if results:
            for i, camp in enumerate(results[:3]):  # Show top 3 results
                print(f"\n[{i+1}] Facility ID: {camp.facility_id}")
                print(f"    Name: {camp.facility_name}")
                print(f"    Recreation Area: {camp.recreation_area}")
                print(f"    Location: {getattr(camp, 'city', 'N/A')}, {getattr(camp, 'state', 'N/A')}")
                print(f"    URL: https://www.recreation.gov/camping/campgrounds/{camp.facility_id}")
        else:
            print("    ❌ No results found")
    
    except Exception as e:
        print(f"    ❌ Error: {str(e)}")

def main():
    print("\n" + "="*80)
    print("CAMPGROUND FACILITY ID LOOKUP TOOL")
    print("="*80)
    
    results_summary = {}
    
    for campground_name, park_name in campgrounds_to_search:
        search_and_display(campground_name, park_name)
    
    print("\n" + "="*80)
    print("SEARCH COMPLETE")
    print("="*80)
    print("\nCopy the facility IDs above to update your server code.")

if __name__ == "__main__":
    main()
