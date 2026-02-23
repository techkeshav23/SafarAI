import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Hotel } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// Dynamically import the map component with no SSR
const MapContent = dynamic(() => Promise.resolve(LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center text-sm text-gray-400">
      Loading map...
    </div>
  ),
});

// Well-known city coordinates for destination centering
const CITY_COORDS: Record<string, [number, number]> = {
  // ... (keep existing coords)
  delhi: [28.6139, 77.209],
  "new delhi": [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  hyderabad: [17.385, 78.4867],
  goa: [15.2993, 74.124],
  jaipur: [26.9124, 75.7873],
  agra: [27.1767, 78.0081],
  varanasi: [25.3176, 82.9739],
  shimla: [31.1048, 77.1734],
  manali: [32.2396, 77.1887],
  udaipur: [24.5854, 73.7125],
  paris: [48.8566, 2.3522],
  london: [51.5074, -0.1278],
  "new york": [40.7128, -74.006],
  tokyo: [35.6762, 139.6503],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  bangkok: [13.7563, 100.5018],
  bali: [-8.3405, 115.092],
  rome: [41.9028, 12.4964],
  barcelona: [41.3874, 2.1686],
  sydney: [-33.8688, 151.2093],
  "los angeles": [34.0522, -118.2437],
  maldives: [3.2028, 73.2207],
  switzerland: [46.8182, 8.2275],
  zurich: [47.3769, 8.5417],
  amsterdam: [52.3676, 4.9041],
  istanbul: [41.0082, 28.9784],
  cairo: [30.0444, 31.2357],
  phuket: [7.8804, 98.3923],
  "kuala lumpur": [3.139, 101.6869],
  "hong kong": [22.3193, 114.1694],
  seoul: [37.5665, 126.978],
  moscow: [55.7558, 37.6173],
  berlin: [52.52, 13.405],
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center
const DEFAULT_ZOOM = 5;

interface MapViewProps {
  hotels: Hotel[];
  destination?: string | null;
  center?: [number, number];
  zoom?: number;
}

export function MapView(props: MapViewProps) {
  return <MapContent {...props} />;
}

function LeafletMap({
  hotels,
  destination,
  center,
  zoom,
}: {
  hotels: Hotel[];
  destination?: string | null;
  center?: [number, number];
  zoom?: number;
}) {
  // Safe imports for client-side only
  const { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } = require("react-leaflet");
  const L = require("leaflet");

  // Fix icon issues
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const hotelIcon = useMemo(() => new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }), []);

  const activeIcon = useMemo(() => new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }), []);

  // Resolve center
  const [dynamicCenter, setDynamicCenter] = useState<[number, number] | null>(null);

  let mapCenter: [number, number] = dynamicCenter || DEFAULT_CENTER;
  let mapZoom = DEFAULT_ZOOM;

  if (center) {
    mapCenter = center;
    mapZoom = zoom ?? 12;
  } else if (hotels.length > 0 && hotels[0].latitude && hotels[0].longitude) {
    mapCenter = [hotels[0].latitude, hotels[0].longitude];
    mapZoom = hotels.length === 1 ? 13 : 10; // Zoom closer if single hotel
  } else if (destination) {
    const key = destination.toLowerCase().trim();
    if (CITY_COORDS[key] && !center && hotels.length === 0) {
      mapCenter = CITY_COORDS[key];
      mapZoom = 11;
    }
  }

  useEffect(() => {
     // Safety check: Don't run if destination is missing or we already have a solid center
     if (!destination) return;
     if (center) return;
     
     // Don't geocode if we have hotels (primary fallback)
     if (hotels.length > 0 && hotels[0].latitude) return;

     // Don't geocode if in CITY_COORDS static list
     if (CITY_COORDS[destination.toLowerCase().trim()]) return;

      const controller = new AbortController();
      const fetchCoords = async () => {
          try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`,
                { signal: controller.signal }
              );
              if (!res.ok) return;
              const data = await res.json();
              if (data && data.length > 0) {
                  setDynamicCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
              }
          } catch {
              // AbortError or network failure — ignore silently
          }
      };
      
      const timer = setTimeout(fetchCoords, 800);
      return () => { clearTimeout(timer); controller.abort(); };
  }, [destination, center, hotels]);


  // Component to handle flying
  const Recenter = () => {
    const map = useMap();
    useEffect(() => {
      if (mapCenter) {
          map.flyTo(mapCenter, mapZoom, {
            duration: 2
          });
      }
    }, [mapCenter, mapZoom, map]);
    return null;
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <Recenter />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hotel markers */}
        {hotels.map(
          (hotel, idx) =>
            hotel.latitude &&
            hotel.longitude && (
              <Marker
                key={hotel.id}
                position={[hotel.latitude, hotel.longitude]}
                icon={idx === 0 ? activeIcon : hotelIcon}
              >
                <Popup>
                  <div className="text-sm min-w-[180px]">
                    <strong className="text-gray-900 text-base">{hotel.name}</strong>
                    <br />
                    <span className="text-gray-500">
                      {hotel.city}
                      {hotel.country ? `, ${hotel.country}` : ""}
                    </span>
                    <br />
                    <div className="mt-1 flex items-center gap-2">
                        {hotel.star_rating && hotel.star_rating > 0 && (
                        <span className="text-yellow-500 text-xs">
                            {"★".repeat(Math.round(hotel.star_rating))}
                        </span>
                        )}
                        <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                        ${Math.round(hotel.price_per_night)}
                        </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
        )}

        {/* Destination pin when no hotel markers */}
        {hotels.length === 0 &&
          destination && (
           CITY_COORDS[destination.toLowerCase().trim()] ? (
            <Marker
              position={CITY_COORDS[destination.toLowerCase().trim()]}
              icon={activeIcon}
            >
              <Popup>
                <div className="text-sm font-semibold">{destination}</div>
              </Popup>
            </Marker>
           ) : null
          )}
      </MapContainer>
    </div>
  );
}
