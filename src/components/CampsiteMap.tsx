import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Campsite } from '../App';

interface CampsiteMapProps {
  campsites: Campsite[];
}

export function CampsiteMap({ campsites }: CampsiteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Get campsites with coordinates
    const sitesWithCoords = campsites.filter(
      site => site.CampsiteLatitude && site.CampsiteLongitude
    );

    if (sitesWithCoords.length === 0) {
      return;
    }

    // Calculate center and bounds
    const lats = sitesWithCoords.map(s => s.CampsiteLatitude!);
    const lngs = sitesWithCoords.map(s => s.CampsiteLongitude!);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    // Initialize Leaflet map
    initializeMap(centerLat, centerLng, sitesWithCoords);
  }, [campsites]);

  const initializeMap = async (lat: number, lng: number, sites: Campsite[]) => {
    try {
      // Dynamically import Leaflet
      const L = (await import('leaflet@1.9.4')).default;
      
      // Add Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapRef.current) return;

      // Clear existing map
      mapRef.current.innerHTML = '';

      // Create map
      const map = L.map(mapRef.current).setView([lat, lng], 6);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add markers for each campsite
      sites.forEach(site => {
        if (site.CampsiteLatitude && site.CampsiteLongitude) {
          const marker = L.marker([site.CampsiteLatitude, site.CampsiteLongitude]).addTo(map);
          
          const popupContent = `
            <div>
              <strong>${site.CampsiteName || 'Unnamed Site'}</strong><br>
              ${site.facilityName || ''}<br>
              ${site.CampsiteType ? `Type: ${site.CampsiteType}<br>` : ''}
              ${site.pricePerNight ? `$${site.pricePerNight}/night` : ''}
            </div>
          `;
          
          marker.bindPopup(popupContent);
        }
      });

      // Fit bounds to show all markers
      if (sites.length > 1) {
        const bounds = L.latLngBounds(
          sites.map(s => [s.CampsiteLatitude!, s.CampsiteLongitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }
  };

  const sitesWithCoords = campsites.filter(
    site => site.CampsiteLatitude && site.CampsiteLongitude
  );

  if (mapError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <MapPin className="w-12 h-12 mb-2" />
        <p>Unable to load map</p>
      </div>
    );
  }

  if (sitesWithCoords.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <MapPin className="w-12 h-12 mb-2" />
        <p>No campsites with coordinates to display</p>
        <p className="text-sm mt-1">Search for campsites to see them on the map</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-96 rounded-lg border border-gray-300"></div>
  );
}