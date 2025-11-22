"""
Quick search script - pass a campground name as argument.
Usage: python quick_search.py "Joshua Tree"
"""
import sys
from camply.search import SearchRecreationDotGov

def quick_search(query):
    searcher = SearchRecreationDotGov()
    print(f"\nSearching for: {query}\n")
    
    try:
        results = searcher.find_campgrounds(search_query=query)
        
        if results:
            print(f"Found {len(results)} campgrounds:\n")
            for i, camp in enumerate(results, 1):
                print(f"{i}. {camp.facility_name}")
                print(f"   ID: {camp.facility_id}")
                print(f"   Area: {camp.recreation_area}")
                print(f"   URL: https://www.recreation.gov/camping/campgrounds/{camp.facility_id}")
                print()
        else:
            print("No campgrounds found.")
    
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python quick_search.py 'campground name'")
        sys.exit(1)
    
    query = " ".join(sys.argv[1:])
    quick_search(query)
