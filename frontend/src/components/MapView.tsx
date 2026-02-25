import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Hotel } from "@/lib/types";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

/* ────────────────────────────────────────────
   Dynamic import — no SSR for Leaflet
   ──────────────────────────────────────────── */
const MapContent = dynamic(() => Promise.resolve(LeafletMap), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

/* ────────────────────────────────────────────
   Animated loading skeleton
   ──────────────────────────────────────────── */
function MapLoadingSkeleton() {
  return (
    <div className="h-full w-full relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Animated shimmer overlay */}
      <div className="absolute inset-0 map-skeleton-shimmer" />
      {/* Fake map grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Center spinner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-blue-200 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <span className="text-sm font-medium text-blue-400 tracking-wide animate-pulse">
          Loading map…
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   City coordinates lookup
   ──────────────────────────────────────────── */
const CITY_COORDS: Record<string, [number, number]> = {
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

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

/* ────────────────────────────────────────────
   Props
   ──────────────────────────────────────────── */
interface MapViewProps {
  hotels: Hotel[];
  destination?: string | null;
  center?: [number, number];
  zoom?: number;
  highlightHotelId?: string | null;
}

export function MapView(props: MapViewProps) {
  return <MapContent {...props} />;
}

/* ────────────────────────────────────────────
   Main Leaflet Map
   ──────────────────────────────────────────── */
function LeafletMap({
  hotels,
  destination,
  center,
  zoom,
  highlightHotelId,
}: {
  hotels: Hotel[];
  destination?: string | null;
  center?: [number, number];
  zoom?: number;
  highlightHotelId?: string | null;
}) {
  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    ZoomControl,
  } = require("react-leaflet");
  const L = require("leaflet");
  const MarkerClusterGroup = require("react-leaflet-cluster").default;

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const markersRef = useRef<Record<string, any>>({});

  // Fix default icon paths
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  /* ── Price bubble marker factory ── */
  const createPriceBubble = useCallback(
    (price: number, isActive: boolean, isHighlighted: boolean) => {
      const formattedPrice =
        price >= 1000
          ? `₹${(price / 1000).toFixed(price >= 10000 ? 0 : 1)}K`
          : `₹${price}`;

      const bg = isHighlighted
        ? "#1d4ed8"
        : isActive
        ? "#dc2626"
        : "#111827";

      const shadow = isHighlighted
        ? "0 0 0 3px rgba(59,130,246,0.35), 0 4px 12px rgba(29,78,216,0.4)"
        : isActive
        ? "0 0 0 3px rgba(220,38,38,0.25), 0 4px 12px rgba(220,38,38,0.35)"
        : "0 2px 8px rgba(0,0,0,0.25), 0 0 0 1.5px rgba(255,255,255,0.9)";

      const scale = isHighlighted ? "scale(1.18)" : isActive ? "scale(1.08)" : "scale(1)";

      return L.divIcon({
        className: "price-marker-icon",
        html: `
          <div class="price-bubble-wrapper" style="transform: ${scale};">
            <div class="price-bubble" style="
              background: ${bg};
              box-shadow: ${shadow};
            ">
              <span>${formattedPrice}</span>
            </div>
            <div class="price-bubble-arrow" style="
              border-top-color: ${bg};
            "></div>
          </div>
        `,
        iconSize: [80, 42],
        iconAnchor: [40, 42],
        popupAnchor: [0, -46],
      });
    },
    [L]
  );

  /* ── Destination pin icon ── */
  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: "destination-pin-icon",
        html: `
          <div class="dest-pin-wrapper">
            <div class="dest-pin-pulse"></div>
            <div class="dest-pin-dot"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [L]
  );

  /* ── Resolve map center ── */
  const [dynamicCenter, setDynamicCenter] = useState<[number, number] | null>(null);

  let mapCenter: [number, number] = dynamicCenter || DEFAULT_CENTER;
  let mapZoom = DEFAULT_ZOOM;

  if (center) {
    mapCenter = center;
    mapZoom = zoom ?? 12;
  } else if (hotels.length > 0 && hotels[0].latitude && hotels[0].longitude) {
    mapCenter = [hotels[0].latitude, hotels[0].longitude];
    mapZoom = hotels.length === 1 ? 14 : 12;
  } else if (destination) {
    const key = destination.toLowerCase().trim();
    if (CITY_COORDS[key]) {
      mapCenter = CITY_COORDS[key];
      mapZoom = 12;
    }
  }

  /* ── Geocode unknown destinations ── */
  useEffect(() => {
    if (!destination || center) return;
    if (hotels.length > 0 && hotels[0].latitude) return;
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
        if (data?.length > 0) {
          setDynamicCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch {
        /* Aborted or network error */
      }
    };

    const timer = setTimeout(fetchCoords, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, center, hotels]);

  /* ── Cinematic fly-to ── */
  const Recenter = () => {
    const map = useMap();
    const prevCenter = useRef<string>("");

    useEffect(() => {
      const key = `${mapCenter[0]},${mapCenter[1]},${mapZoom}`;
      if (key === prevCenter.current) return;
      prevCenter.current = key;

      // Cinematic zoom-out then zoom-in
      const currentZoom = map.getZoom();
      const pullBackZoom = Math.max(currentZoom - 3, 3);

      map.flyTo(mapCenter, pullBackZoom, { duration: 0.8, easeLinearity: 0.1 });

      setTimeout(() => {
        map.flyTo(mapCenter, mapZoom, { duration: 1.6, easeLinearity: 0.25 });
      }, 900);
    }, [mapCenter, mapZoom, map]);

    return null;
  };

  /* ── Highlight from external hover ── */
  useEffect(() => {
    if (highlightHotelId && markersRef.current[highlightHotelId]) {
      markersRef.current[highlightHotelId].openPopup();
    }
  }, [highlightHotelId]);

  /* ── Cluster style ── */
  const createClusterIcon = useCallback(
    (cluster: any) => {
      const count = cluster.getChildCount();
      const size = count < 10 ? 36 : count < 30 ? 44 : 52;
      return L.divIcon({
        html: `<div class="cluster-icon" style="width:${size}px;height:${size}px;">
                 <span>${count}</span>
               </div>`,
        className: "custom-cluster-icon",
        iconSize: L.point(size, size),
      });
    },
    [L]
  );

  return (
    <div className="h-full w-full relative z-0 map-container">
      {/* Hotel count badge */}
      {hotels.length > 0 && (
        <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur-md shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-700">
            {hotels.filter(h => h.latitude && h.longitude).length} hotels on map
          </span>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
        className="voyager-map"
      >
        <Recenter />
        <ZoomControl position="bottomright" />

        {/* CartoDB Voyager tiles — modern, clean, travel-optimized */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
          subdomains="abcd"
        />

        {/* Clustered hotel markers */}
        {hotels.some(h => h.latitude && h.longitude) && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            iconCreateFunction={createClusterIcon}
            animate={true}
            animateAddingMarkers={true}
          >
            {hotels.map(
              (hotel, idx) =>
                hotel.latitude &&
                hotel.longitude && (
                  <Marker
                    key={hotel.id}
                    position={[hotel.latitude, hotel.longitude]}
                    icon={createPriceBubble(
                      Math.round(hotel.price_per_night),
                      activeMarkerId === hotel.id || idx === 0,
                      highlightHotelId === hotel.id
                    )}
                    ref={(ref: any) => {
                      if (ref) markersRef.current[hotel.id] = ref;
                    }}
                    eventHandlers={{
                      click: () => setActiveMarkerId(hotel.id),
                    }}
                  >
                    <Popup className="rich-popup" maxWidth={280} minWidth={240}>
                      <div className="popup-card">
                        {/* Hotel thumbnail */}
                        {hotel.image_url && (
                          <div className="popup-card-image">
                            <img
                              src={hotel.image_url}
                              alt={hotel.name}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.onerror = null;
                                img.src = "/placeholder-hotel.svg";
                              }}
                            />
                            {/* Source badge */}
                            {hotel.source && (
                              <span
                                className={`popup-source-badge ${
                                  hotel.source === "tbo" ? "live" : "sample"
                                }`}
                              >
                                {hotel.source === "tbo" ? "Live" : "Sample"}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="popup-card-body">
                          <h3 className="popup-hotel-name">{hotel.name}</h3>
                          <p className="popup-hotel-location">
                            {hotel.city}
                            {hotel.country ? `, ${hotel.country}` : ""}
                          </p>
                          <div className="popup-card-footer">
                            {hotel.star_rating && hotel.star_rating > 0 && (
                              <span className="popup-stars">
                                {"★".repeat(Math.round(hotel.star_rating))}
                              </span>
                            )}
                            <span className="popup-price">
                              ₹{Math.round(hotel.price_per_night).toLocaleString("en-IN")}
                              <small>/night</small>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
            )}
          </MarkerClusterGroup>
        )}

        {/* Destination pin when no hotels */}
        {hotels.length === 0 && destination && (
          (() => {
            const key = destination.toLowerCase().trim();
            const coords = CITY_COORDS[key] || dynamicCenter;
            if (!coords) return null;
            return (
              <Marker position={coords} icon={destinationIcon}>
                <Popup className="rich-popup">
                  <div className="popup-card-body" style={{ padding: "8px 12px" }}>
                    <h3 className="popup-hotel-name">{destination}</h3>
                    <p className="popup-hotel-location" style={{ marginTop: 2 }}>
                      Searching hotels…
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })()
        )}
      </MapContainer>
    </div>
  );
}
