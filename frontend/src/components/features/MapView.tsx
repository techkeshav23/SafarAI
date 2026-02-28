import { useEffect, useState, useMemo, useCallback, useRef, Fragment } from "react";
import dynamic from "next/dynamic";
import { Hotel, Flight, CartItem } from "@/lib/types";
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
   Google Maps–style loading skeleton
   ──────────────────────────────────────────── */
function MapLoadingSkeleton() {
  return (
    <div className="h-full w-full relative overflow-hidden bg-[#e8e4df]">
      <div className="absolute inset-0 gmap-skeleton-shimmer" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-[3px] border-gray-300 border-t-[#4285f4] animate-spin" />
        </div>
        <span className="text-sm font-medium text-gray-500 tracking-wide">
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
  /* ── Indian Cities ── */
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
  lucknow: [26.8467, 80.9462],
  ahmedabad: [23.0225, 72.5714],
  pune: [18.5204, 73.8567],
  kochi: [9.9312, 76.2673],
  thiruvananthapuram: [8.5241, 76.9366],
  amritsar: [31.634, 74.8723],
  srinagar: [34.0837, 74.7973],
  patna: [25.6093, 85.1376],
  bhopal: [23.2599, 77.4126],
  indore: [22.7196, 75.8577],
  chandigarh: [30.7333, 76.7794],
  coimbatore: [11.0168, 76.9558],
  mangalore: [12.9141, 74.856],
  visakhapatnam: [17.6868, 83.2185],
  nagpur: [21.1458, 79.0882],
  ranchi: [23.3441, 85.3096],
  raipur: [21.2514, 81.6296],
  guwahati: [26.1445, 91.7362],
  dehradun: [30.3165, 78.0322],
  leh: [34.1526, 77.5771],
  bagdogra: [26.6812, 88.3286],
  portblair: [11.6234, 92.7265],

  /* ── Indian IATA Airport Codes ── */
  del: [28.5562, 77.1],      // Delhi IGI
  bom: [19.0896, 72.8656],   // Mumbai CSI
  blr: [13.1986, 77.7066],   // Bangalore Kempegowda
  maa: [12.994, 80.1709],    // Chennai
  ccu: [22.6547, 88.4467],   // Kolkata Netaji
  hyd: [17.2403, 78.4294],   // Hyderabad Rajiv Gandhi
  goi: [15.3808, 73.8314],   // Goa Dabolim
  jai: [26.8242, 75.8122],   // Jaipur
  vns: [25.4524, 82.8593],   // Varanasi
  ixc: [30.6735, 76.7885],   // Chandigarh
  cok: [10.152, 76.4019],    // Kochi
  trv: [8.4821, 76.9208],    // Thiruvananthapuram
  amd: [23.0772, 72.6347],   // Ahmedabad
  pnq: [18.5822, 73.9197],   // Pune
  lko: [26.7606, 80.8893],   // Lucknow
  ixm: [11.03, 77.0434],     // Coimbatore
  ixe: [12.9613, 74.8901],   // Mangalore
  viz: [17.7212, 83.2245],   // Visakhapatnam
  nag: [21.0922, 79.0472],   // Nagpur
  pat: [25.5913, 85.088],    // Patna
  bho: [23.2875, 77.3374],   // Bhopal
  idr: [22.7218, 75.8011],   // Indore
  atr: [31.7096, 74.7973],   // Amritsar
  sxr: [33.987, 74.7742],    // Srinagar
  gau: [26.1061, 91.5859],   // Guwahati
  ded: [30.1897, 78.1803],   // Dehradun
  ixl: [34.1359, 77.5465],   // Leh
  ixb: [26.6812, 88.3286],   // Bagdogra
  ixz: [11.6412, 92.7297],   // Port Blair
  rpr: [21.1804, 81.7388],   // Raipur
  rnc: [23.3143, 85.3217],   // Ranchi
  bbi: [20.2444, 85.8178],   // Bhubaneswar
  jrh: [26.7315, 94.1753],   // Jorhat
  ixa: [23.886, 91.2404],    // Agartala
  imf: [24.76, 93.8967],     // Imphal
  dmu: [25.8839, 93.7711],   // Dimapur
  shl: [25.7036, 91.9787],   // Shillong
  udp: [24.5854, 73.7125],   // Udaipur (alias for city too)

  /* ── International Cities ── */
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
  kathmandu: [27.7172, 85.324],
  colombo: [6.9271, 79.8612],
  dhaka: [23.8103, 90.4125],
  "male": [4.1755, 73.5093],

  /* ── International IATA Codes ── */
  cdg: [49.0097, 2.5479],    // Paris CDG
  lhr: [51.47, -0.4543],     // London Heathrow
  jfk: [40.6413, -73.7781],  // New York JFK
  nrt: [35.7647, 140.3864],  // Tokyo Narita
  hnd: [35.5494, 139.7798],  // Tokyo Haneda
  dxb: [25.2532, 55.3657],   // Dubai
  sin: [1.3644, 103.9915],   // Singapore Changi
  bkk: [13.6812, 100.7474],  // Bangkok Suvarnabhumi
  dps: [-8.7482, 115.1672],  // Bali Ngurah Rai
  fco: [41.8003, 12.2389],   // Rome Fiumicino
  bcn: [41.2971, 2.0785],    // Barcelona
  syd: [-33.9461, 151.1772], // Sydney
  lax: [33.9425, -118.4081], // Los Angeles
  zrh: [47.4647, 8.5492],    // Zurich
  ams: [52.3105, 4.7683],    // Amsterdam Schiphol
  ist: [41.2611, 28.7416],   // Istanbul
  cai: [30.1219, 31.4056],   // Cairo
  hkt: [8.1132, 98.3169],    // Phuket
  kul: [2.7456, 101.7099],   // Kuala Lumpur
  hkg: [22.308, 113.9185],   // Hong Kong
  icn: [37.4602, 126.4407],  // Seoul Incheon
  svo: [55.9726, 37.4146],   // Moscow Sheremetyevo
  ber: [52.362, 13.5033],    // Berlin Brandenburg
  ktm: [27.6966, 85.3591],   // Kathmandu
  cmb: [7.1808, 79.8841],    // Colombo
  dac: [23.8433, 90.3978],   // Dhaka
  mle: [4.1918, 73.5292],    // Male (Maldives)
};

/* IATA code → friendly city name for flight labels */
const IATA_CITY_NAME: Record<string, string> = {
  del: "Delhi", bom: "Mumbai", blr: "Bangalore", maa: "Chennai", ccu: "Kolkata",
  hyd: "Hyderabad", goi: "Goa", jai: "Jaipur", vns: "Varanasi", cok: "Kochi",
  trv: "Trivandrum", amd: "Ahmedabad", pnq: "Pune", lko: "Lucknow", pat: "Patna",
  bho: "Bhopal", idr: "Indore", atr: "Amritsar", sxr: "Srinagar", gau: "Guwahati",
  ded: "Dehradun", ixl: "Leh", ixb: "Bagdogra", ixz: "Port Blair", rpr: "Raipur",
  rnc: "Ranchi", bbi: "Bhubaneswar", nag: "Nagpur", viz: "Vizag", ixc: "Chandigarh",
  ixm: "Coimbatore", ixe: "Mangalore", dmu: "Dimapur", imf: "Imphal",
  cdg: "Paris", lhr: "London", jfk: "New York", nrt: "Tokyo", hnd: "Tokyo",
  dxb: "Dubai", sin: "Singapore", bkk: "Bangkok", dps: "Bali", fco: "Rome",
  bcn: "Barcelona", syd: "Sydney", lax: "Los Angeles", zrh: "Zurich",
  ams: "Amsterdam", ist: "Istanbul", cai: "Cairo", hkt: "Phuket",
  kul: "Kuala Lumpur", hkg: "Hong Kong", icn: "Seoul", svo: "Moscow",
  ber: "Berlin", ktm: "Kathmandu", cmb: "Colombo", dac: "Dhaka", mle: "Maldives",
};

/* Reverse: city name → IATA code (for airport marker on hotel tab) */
const CITY_TO_IATA: Record<string, string> = {};
for (const [iata, city] of Object.entries(IATA_CITY_NAME)) {
  CITY_TO_IATA[city.toLowerCase()] = iata;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

/* ── Tile layer configs ── */
type MapTypeKey = "clean" | "google" | "satellite";

const TILE_LAYERS: Record<MapTypeKey, { url: string; attribution: string; subdomains: string }> = {
  clean: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
  },
  google: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: '&copy; Google Maps',
    subdomains: "",
  },
  satellite: {
    url: "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
    attribution: '&copy; Google Maps',
    subdomains: "",
  },
};

const MAP_TYPE_META: Record<MapTypeKey, { label: string; thumb: string }> = {
  clean: {
    label: "Map",
    thumb: "https://a.basemaps.cartocdn.com/rastertiles/voyager/1/1/1.png",
  },
  google: {
    label: "Google",
    thumb: "https://mt1.google.com/vt/lyrs=m&x=1&y=1&z=1",
  },
  satellite: {
    label: "Satellite",
    thumb: "https://mt1.google.com/vt/lyrs=s&x=1&y=1&z=1",
  },
};

/* ────────────────────────────────────────────
   Props
   ──────────────────────────────────────────── */
interface MapViewProps {
  hotels: Hotel[];
  flights?: Flight[];
  origin?: string | null;
  destination?: string | null;
  center?: [number, number];
  zoom?: number;
  highlightHotelId?: string | null;
  activeTab?: string;
  onAddToCart?: (item: CartItem) => void;
  cart?: CartItem[];
}

export function MapView(props: MapViewProps) {
  return <MapContent {...props} />;
}

/* ────────────────────────────────────────────
   Animated Plane — moves along the arc path
   ──────────────────────────────────────────── */
function AnimatedPlane({
  arcPoints,
  originCoords,
  destCoords,
  createPlaneIcon,
  Marker: MarkerComponent,
}: {
  arcPoints: [number, number][];
  originCoords: [number, number];
  destCoords: [number, number];
  createPlaneIcon: (from: [number, number], to: [number, number]) => any;
  Marker: any;
}) {
  const [posIdx, setPosIdx] = useState(0);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let idx = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const total = arcPoints.length - 1;
    const interval = setInterval(() => {
      if (idx >= total) {
        // Pause 2s at destination, then restart from origin
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            idx = 0;
            setPosIdx(0);
            timeoutId = null;
          }, 1000);
        }
        return;
      }
      idx++;
      setPosIdx(idx);
    }, 40); // 40ms × 200 pts ≈ 8s origin → destination, loops
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [arcPoints]);

  /* Move the Leaflet marker element directly for buttery-smooth motion */
  useEffect(() => {
    const m = markerRef.current;
    if (!m) return;
    const pos = arcPoints[posIdx] || arcPoints[0];
    m.setLatLng(pos);
  }, [posIdx, arcPoints]);

  const position = arcPoints[posIdx] || arcPoints[0];

  // Use nearby points for local heading direction
  const prevIdx = Math.max(0, posIdx - 2);
  const nextIdx = Math.min(arcPoints.length - 1, posIdx + 2);
  const localFrom = arcPoints[prevIdx];
  const localTo = arcPoints[nextIdx];

  return (
    <MarkerComponent
      ref={markerRef}
      position={position}
      icon={createPlaneIcon(localFrom, localTo)}
      zIndexOffset={1000}
    />
  );
}

/* ────────────────────────────────────────────
   Main Leaflet Map (Google Maps style)
   ──────────────────────────────────────────── */
function LeafletMap({
  hotels,
  flights = [],
  origin,
  destination,
  center,
  zoom,
  highlightHotelId,
  activeTab = "flights",
  onAddToCart,
  cart = [],
}: {
  hotels: Hotel[];
  flights?: Flight[];
  origin?: string | null;
  destination?: string | null;
  center?: [number, number];
  zoom?: number;
  highlightHotelId?: string | null;
  activeTab?: string;
  onAddToCart?: (item: CartItem) => void;
  cart?: CartItem[];
}) {
  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
    ZoomControl,
  } = require("react-leaflet");
  const L = require("leaflet");
  const MarkerClusterGroup = require("react-leaflet-cluster").default;

  /* ── Resolve flight routes ── */
  const hasFlights = flights.length > 0;
  const flightRoutes = useMemo(() => {
    if (!hasFlights) return [];
    const routes: { id: string; originCoords: [number, number]; destCoords: [number, number]; originCity: string; destCity: string; airline: string; flightNumber: string; price: number }[] = [];
    const seen = new Set<string>();
    for (const f of flights) {
      const oKey = f.origin.toLowerCase().trim();
      const dKey = f.destination.toLowerCase().trim();
      const routeKey = `${oKey}-${dKey}`;
      const reverseKey = `${dKey}-${oKey}`;
      if (seen.has(routeKey) || seen.has(reverseKey)) continue;
      const oCoords = CITY_COORDS[oKey];
      const dCoords = CITY_COORDS[dKey];
      if (!oCoords || !dCoords) {
        console.warn(`[MapView] Flight route skipped: ${f.origin}→${f.destination} (no coords for ${!oCoords ? oKey : dKey})`);
        continue;
      }
      seen.add(routeKey);
      routes.push({
        id: routeKey,
        originCoords: oCoords,
        destCoords: dCoords,
        originCity: IATA_CITY_NAME[oKey] || f.origin,
        destCity: IATA_CITY_NAME[dKey] || f.destination,
        airline: f.airline,
        flightNumber: f.flight_number || '',
        price: f.price,
      });
    }
    return routes;
  }, [flights, hasFlights]);

  /* ── Curved arc points between two coords ── */
  const getArcPoints = useCallback((from: [number, number], to: [number, number], numPoints = 200): [number, number][] => {
    const points: [number, number][] = [];
    const dx = to[1] - from[1];
    const dy = to[0] - from[0];
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.2, 8); // Arc height proportional to distance
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const lat = from[0] + t * (to[0] - from[0]);
      const lng = from[1] + t * (to[1] - from[1]);
      // Parabolic arc offset
      const offset = curvature * Math.sin(Math.PI * t);
      // Perpendicular offset direction
      const angle = Math.atan2(dy, dx);
      const latOffset = offset * Math.cos(angle + Math.PI / 2) * 0.3;
      const lngOffset = offset * Math.sin(angle + Math.PI / 2) * 0.3;
      points.push([lat + latOffset, lng + lngOffset]);
    }
    return points;
  }, []);

  /* ── Airport-style marker ── */
  const createAirportIcon = useCallback((label: string, isOrigin: boolean) => {
    return L.divIcon({
      className: 'flight-airport-icon',
      html: `
        <div class="flight-airport-marker ${isOrigin ? 'flight-airport-origin' : 'flight-airport-dest'}">
          <div class="flight-airport-dot"></div>
          <div class="flight-airport-label">${label}</div>
        </div>
      `,
      iconSize: [100, 40],
      iconAnchor: [50, 20],
    });
  }, [L]);

  /* ── Plane icon — points in flight direction ── */
  const createPlaneIcon = useCallback((from: [number, number], to: [number, number]) => {
    // Calculate bearing: lon difference = x, lat difference = y
    // On a map, east is right (+x) and north is up (+y)
    // atan2(dlng, dlat) gives angle from north, clockwise
    const dlat = to[0] - from[0];
    const dlng = to[1] - from[1];
    // Convert to degrees: 0 = north, 90 = east, 180 = south, 270 = west
    const bearing = (Math.atan2(dlng, dlat) * 180 / Math.PI);
    // The SVG plane points UP (north), so rotate by bearing
    return L.divIcon({
      className: 'flight-plane-icon',
      html: `
        <div class="flight-plane-wrapper">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#1a73e8" style="transform: rotate(${bearing}deg)">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, [L]);

  const [mapType, setMapType] = useState<MapTypeKey>("clean");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const markersRef = useRef<Record<string, any>>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  /* ── Fullscreen toggle ── */
  const toggleFullscreen = useCallback(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ── Google Maps–style price pill marker ── */
  const createHotelPin = useCallback(
    (price: number, isActive: boolean, isHighlighted: boolean) => {
      const formattedPrice =
        price >= 1000
          ? `₹${(price / 1000).toFixed(price >= 10000 ? 0 : 1)}K`
          : `₹${price}`;

      const isSelected = isHighlighted || isActive;

      return L.divIcon({
        className: "gmap-marker-icon",
        html: `
          <div class="gmap-price-pin ${isSelected ? "gmap-price-pin--active" : ""}">
            <svg class="gmap-price-pin-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-1V5c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h1v2c0 .55.45 1 1 1h14c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1zM4 12V6h12v1h-3c-.55 0-1 .45-1 1v4H4zm14 2H7v-1h5c.55 0 1-.45 1-1V9h5v5z"/></svg>
            <span>${formattedPrice}</span>
          </div>
        `,
        iconSize: [90, 40],
        iconAnchor: [45, 40],
        popupAnchor: [0, -42],
      });
    },
    [L]
  );

  /* ── Destination pin icon (Google Maps blue dot) ── */
  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: "gmap-dest-icon",
        html: `
          <div class="gmap-dest-wrapper">
            <div class="gmap-dest-pulse"></div>
            <div class="gmap-dest-dot"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [L]
  );

  /* ── Airport marker for hotel tab ── */
  const createHotelTabAirportIcon = useCallback((label: string) => {
    return L.divIcon({
      className: 'hotel-airport-icon',
      html: `
        <div class="hotel-airport-pin">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
          <span>${label}</span>
        </div>
      `,
      iconSize: [120, 44],
      iconAnchor: [60, 44],
      popupAnchor: [0, -46],
    });
  }, [L]);

  /* ── Resolve map center (tab-aware) ── */
  const [dynamicCenter, setDynamicCenter] = useState<[number, number] | null>(null);
  const showFlightRoutes = activeTab === "flights" && flightRoutes.length > 0;
  const showHotelMarkers = activeTab !== "flights";

  /* ── Stable center/zoom — only recomputes when data source actually changes,
       NOT on every marker click re-render ── */
  const stableCenter = useMemo((): [number, number] => {
    if (showFlightRoutes && flightRoutes.length > 0) {
      const r = flightRoutes[0];
      return [
        (r.originCoords[0] + r.destCoords[0]) / 2,
        (r.originCoords[1] + r.destCoords[1]) / 2,
      ];
    }
    if (center) return center;
    if (hotels.length > 0 && hotels[0].latitude && hotels[0].longitude) {
      return [hotels[0].latitude, hotels[0].longitude];
    }
    if (destination) {
      const key = destination.toLowerCase().trim();
      if (CITY_COORDS[key]) return CITY_COORDS[key];
    }
    return dynamicCenter || DEFAULT_CENTER;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFlightRoutes, flightRoutes.length, center?.[0], center?.[1],
      hotels.length > 0 ? hotels[0]?.id : null, destination, dynamicCenter?.[0]]);

  const stableZoom = useMemo((): number => {
    if (showFlightRoutes && flightRoutes.length > 0) {
      const r = flightRoutes[0];
      const dist = Math.sqrt(
        Math.pow(r.destCoords[0] - r.originCoords[0], 2) +
        Math.pow(r.destCoords[1] - r.originCoords[1], 2)
      );
      return dist > 20 ? 4 : dist > 10 ? 5 : dist > 5 ? 6 : 7;
    }
    if (center) return zoom ?? 12;
    if (hotels.length > 0 && hotels[0].latitude) return hotels.length === 1 ? 14 : 12;
    return DEFAULT_ZOOM;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFlightRoutes, flightRoutes.length, center?.[0], center?.[1],
      hotels.length > 0 ? hotels[0]?.id : null, zoom]);

  const mapCenter = stableCenter;
  const mapZoom = stableZoom;

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

    fetchCoords();
    return () => {
      controller.abort();
    };
  }, [destination, center, hotels]);

  /* ── Smooth fly-to (re-triggers on tab change) ── */
  const Recenter = () => {
    const map = useMap();
    const prevKey = useRef<string>("");

    useEffect(() => {
      const key = `${activeTab}-${stableCenter[0]},${stableCenter[1]},${stableZoom}`;
      if (key === prevKey.current) return;
      prevKey.current = key;
      map.flyTo(stableCenter, stableZoom, { duration: 0.6, easeLinearity: 0.5 });
    }, [stableCenter, stableZoom, map, activeTab]);

    return null;
  };

  /* ── Invalidate map size on fullscreen change ── */
  const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
      setTimeout(() => map.invalidateSize(), 100);
    }, [isFullscreen, map]);
    return null;
  };

  /* ── My Location ── */
  const MyLocationButton = () => {
    const map = useMap();
    const handleMyLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.flyTo([latitude, longitude], 15, { duration: 0.5 });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    };
    return (
      <div className="gmap-my-location" onClick={handleMyLocation} title="Your location">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </div>
    );
  };

  /* ── Highlight from external hover ── */
  useEffect(() => {
    if (highlightHotelId && markersRef.current[highlightHotelId]) {
      markersRef.current[highlightHotelId].openPopup();
    }
  }, [highlightHotelId]);

  /* ── Cluster style (Google Maps–style pill) ── */
  const createClusterIcon = useCallback(
    (cluster: any) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="gmap-cluster">
                 <span>${count}+</span>
               </div>`,
        className: "gmap-cluster-wrapper",
        iconSize: L.point(46, 30),
      });
    },
    [L]
  );

  const tileConfig = TILE_LAYERS[mapType];

  return (
    <div ref={mapContainerRef} className="h-full w-full relative z-0 gmap-container">
      
      {/* ── Google Maps–style top-right controls ── */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="gmap-ctrl-btn"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Map type toggle (thumbnail row) ── */}
      <div className="absolute bottom-6 left-3 z-[1000] flex gap-2">
        {(Object.keys(MAP_TYPE_META) as MapTypeKey[]).filter(k => k !== mapType).map((key) => (
          <button
            key={key}
            className="gmap-layer-thumb"
            onClick={() => setMapType(key)}
            title={`Show ${MAP_TYPE_META[key].label}`}
          >
            <img
              src={MAP_TYPE_META[key].thumb}
              alt={MAP_TYPE_META[key].label}
              className="gmap-layer-thumb-img"
            />
            <span className="gmap-layer-thumb-label">
              {MAP_TYPE_META[key].label}
            </span>
          </button>
        ))}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
        className="gmap-leaflet"
      >
        <Recenter />
        <MapResizer />
        <ZoomControl position="bottomright" />
        <MyLocationButton />

        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={20}
          {...(tileConfig.subdomains ? { subdomains: tileConfig.subdomains } : {})}
          updateWhenIdle={false}
          updateWhenZooming={false}
          keepBuffer={4}
        />

        {/* Clustered hotel markers (only when NOT on flights tab) */}
        {showHotelMarkers && hotels.some(h => h.latitude && h.longitude) && (
          <MarkerClusterGroup
            chunkedLoading
            chunkInterval={100}
            chunkDelay={10}
            maxClusterRadius={60}
            spiderfyOnMaxZoom
            disableClusteringAtZoom={18}
            showCoverageOnHover={false}
            iconCreateFunction={createClusterIcon}
            animate={false}
            animateAddingMarkers={false}
            removeOutsideVisibleBounds={true}
          >
            {hotels.map(
              (hotel, idx) =>
                hotel.latitude &&
                hotel.longitude && (
                  <Marker
                    key={hotel.id}
                    position={[hotel.latitude, hotel.longitude]}
                    icon={createHotelPin(
                      Math.round(hotel.price_per_night),
                      false,
                      highlightHotelId === hotel.id
                    )}
                    ref={(ref: any) => {
                      if (ref) markersRef.current[hotel.id] = ref;
                    }}
                  >
                    <Popup className="gmap-popup" maxWidth={300} minWidth={260}>
                      <div className="gmap-popup-card">
                        {hotel.image_url && (
                          <div className="gmap-popup-img">
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
                            {hotel.source && (
                              <span className={`gmap-popup-badge ${hotel.source === "tbo" ? "live" : "sample"}`}>
                                {hotel.source === "tbo" ? "Live" : "Sample"}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="gmap-popup-body">
                          <h3 className="gmap-popup-title">{hotel.name}</h3>
                          <p className="gmap-popup-subtitle">
                            {hotel.city}
                            {hotel.country ? `, ${hotel.country}` : ""}
                          </p>
                          <div className="gmap-popup-footer">
                            {hotel.star_rating && hotel.star_rating > 0 && (
                              <div className="gmap-popup-rating">
                                <span className="gmap-popup-stars">
                                  {hotel.star_rating.toFixed(1)}
                                </span>
                                <span className="gmap-popup-stars-dots">
                                  {"★".repeat(Math.round(hotel.star_rating))}
                                </span>
                              </div>
                            )}
                            <span className="gmap-popup-price">
                              ₹{Math.round(hotel.price_per_night).toLocaleString("en-IN")}
                              <small>/night</small>
                            </span>
                          </div>
                          {onAddToCart && (() => {
                            const isInCart = cart.some(c => c.id === `hotel-${hotel.id}`);
                            return (
                              <button
                                className={`gmap-popup-cart-btn ${isInCart ? 'gmap-popup-cart-btn--added' : ''}`}
                                disabled={isInCart}
                                onClick={() => {
                                  if (!isInCart) {
                                    onAddToCart({
                                      id: `hotel-${hotel.id}`,
                                      type: "hotel",
                                      name: hotel.name,
                                      price: Math.round(hotel.price_per_night),
                                      quantity: 1,
                                      image_url: hotel.image_url,
                                      details: `${hotel.city}${hotel.country ? `, ${hotel.country}` : ''} • ${hotel.star_rating || 0}★ • ₹${Math.round(hotel.price_per_night).toLocaleString('en-IN')}/night`,
                                      originalData: hotel,
                                    });
                                  }
                                }}
                              >
                                {isInCart ? (
                                  <><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Added</>
                                ) : (
                                  <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg> Add to Itinerary</>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
            )}
          </MarkerClusterGroup>
        )}

        {/* ── Airport marker on hotel tab ── */}
        {showHotelMarkers && destination && (() => {
          const cityKey = destination.toLowerCase().trim();
          const iata = CITY_TO_IATA[cityKey] || cityKey;
          const airportCoords = CITY_COORDS[iata];
          if (!airportCoords) return null;
          const airportName = IATA_CITY_NAME[iata]
            ? `${IATA_CITY_NAME[iata]} Airport (${iata.toUpperCase()})`
            : `${destination} Airport`;
          return (
            <Marker
              position={airportCoords}
              icon={createHotelTabAirportIcon(iata.toUpperCase())}
              zIndexOffset={1000}
            >
              <Popup className="gmap-popup">
                <div className="gmap-popup-body" style={{ padding: '10px 14px' }}>
                  <h3 className="gmap-popup-title">✈️ {airportName}</h3>
                  <p className="gmap-popup-subtitle" style={{ marginTop: 2, color: '#70757a', fontSize: 12 }}>
                    Airport Location
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })()}

        {/* ── Flight route arcs & markers (only on flights tab) ── */}
        {showFlightRoutes && flightRoutes.map((route) => {
          const arcPoints = getArcPoints(route.originCoords, route.destCoords);
          return (
            <Fragment key={route.id}>
              {/* Dashed shadow line */}
              <Polyline
                key={`shadow-${route.id}`}
                positions={arcPoints}
                pathOptions={{
                  color: '#1a73e8',
                  weight: 1.5,
                  opacity: 0.15,
                  dashArray: '6 4',
                }}
              />
              {/* Animated arc */}
              <Polyline
                key={`arc-${route.id}`}
                positions={arcPoints}
                pathOptions={{
                  color: '#1a73e8',
                  weight: 3,
                  opacity: 0.7,
                  lineCap: 'round',
                  className: 'flight-arc-animated',
                }}
              />
              {/* Origin airport marker */}
              <Marker
                key={`origin-${route.id}`}
                position={route.originCoords}
                icon={createAirportIcon(route.originCity, true)}
              >
                <Popup className="gmap-popup">
                  <div className="gmap-popup-body" style={{ padding: '10px 14px' }}>
                    <h3 className="gmap-popup-title">✈ {route.originCity}</h3>
                    <p className="gmap-popup-subtitle">Departure</p>
                  </div>
                </Popup>
              </Marker>
              {/* Destination airport marker */}
              <Marker
                key={`dest-${route.id}`}
                position={route.destCoords}
                icon={createAirportIcon(route.destCity, false)}
              >
                <Popup className="gmap-popup">
                  <div className="gmap-popup-body" style={{ padding: '10px 14px' }}>
                    <h3 className="gmap-popup-title">📍 {route.destCity}</h3>
                    <p className="gmap-popup-subtitle">Arrival</p>
                  </div>
                </Popup>
              </Marker>
              {/* Animated plane — moves along the arc */}
              <AnimatedPlane
                key={`plane-${route.id}`}
                arcPoints={arcPoints}
                originCoords={route.originCoords}
                destCoords={route.destCoords}
                createPlaneIcon={createPlaneIcon}
                Marker={Marker}
              />
            </Fragment>
          );
        })}

        {/* Destination pin when no hotels and no flights */}
        {hotels.length === 0 && flightRoutes.length === 0 && destination && (
          (() => {
            const key = destination.toLowerCase().trim();
            const coords = CITY_COORDS[key] || dynamicCenter;
            if (!coords) return null;
            return (
              <Marker position={coords} icon={destinationIcon}>
                <Popup className="gmap-popup">
                  <div className="gmap-popup-body" style={{ padding: "10px 14px" }}>
                    <h3 className="gmap-popup-title">{destination}</h3>
                    <p className="gmap-popup-subtitle" style={{ marginTop: 2 }}>
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
