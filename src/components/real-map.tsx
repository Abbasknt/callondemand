"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Truck, Navigation, MapPin, CheckCircle2, Clock, ShieldCheck, Route as RouteIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MockRouteMap } from "@/components/mock-route-map"

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidMapsKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== 'YOUR_API_KEY';

// Coordinate dictionary for major Nigerian states, hubs & municipal districts
const NIGERIA_STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  // Major States
  "lagos": { lat: 6.5244, lng: 3.3792 },
  "abuja": { lat: 9.0765, lng: 7.3986 },
  "rivers": { lat: 4.8156, lng: 7.0498 },
  "port harcourt": { lat: 4.8156, lng: 7.0498 },
  "kano": { lat: 12.0022, lng: 8.5920 },
  "enugu": { lat: 6.4584, lng: 7.5464 },
  "oyo": { lat: 7.3775, lng: 3.9470 },
  "ibadan": { lat: 7.3775, lng: 3.9470 },
  "anambra": { lat: 6.1372, lng: 6.8020 },
  "onitsha": { lat: 6.1372, lng: 6.8020 },
  "edo": { lat: 6.3350, lng: 5.6037 },
  "benin": { lat: 6.3350, lng: 5.6037 },
  "ogun": { lat: 7.1557, lng: 3.3458 },
  "abeokuta": { lat: 7.1557, lng: 3.3458 },
  "delta": { lat: 5.5325, lng: 5.8987 },
  "warri": { lat: 5.5325, lng: 5.8987 },
  "asaba": { lat: 6.1979, lng: 6.7262 },
  "kaduna": { lat: 10.5105, lng: 7.4165 },
  "plateau": { lat: 9.8965, lng: 8.8583 },
  "jos": { lat: 9.8965, lng: 8.8583 },
  "cross river": { lat: 4.9602, lng: 8.3223 },
  "calabar": { lat: 4.9602, lng: 8.3223 },
  "akwa ibom": { lat: 5.0377, lng: 7.9128 },
  "uyo": { lat: 5.0377, lng: 7.9128 },
  "imo": { lat: 5.4832, lng: 7.0358 },
  "owerri": { lat: 5.4832, lng: 7.0358 },
  "abia": { lat: 5.5265, lng: 7.4896 },
  "aba": { lat: 5.1066, lng: 7.3667 },
  "umuahia": { lat: 5.5265, lng: 7.4896 },
  "kwara": { lat: 8.4966, lng: 4.5421 },
  "ilorin": { lat: 8.4966, lng: 4.5421 },
  "osun": { lat: 7.7827, lng: 4.5418 },
  "osogbo": { lat: 7.7827, lng: 4.5418 },
  "ondo": { lat: 7.2571, lng: 5.2058 },
  "akure": { lat: 7.2571, lng: 5.2058 },
  "benue": { lat: 7.7322, lng: 8.5218 },
  "makurdi": { lat: 7.7322, lng: 8.5218 },
  "kogi": { lat: 7.8023, lng: 6.7333 },
  "lokoja": { lat: 7.8023, lng: 6.7333 },
  "borno": { lat: 11.8333, lng: 13.1500 },
  "maiduguri": { lat: 11.8333, lng: 13.1500 },
  "bauchi": { lat: 10.3158, lng: 9.8442 },
  "sokoto": { lat: 13.0059, lng: 5.2476 },
  "katsina": { lat: 12.9887, lng: 7.6009 },
  "kebbi": { lat: 12.4539, lng: 4.1975 },
  "zamfara": { lat: 12.1702, lng: 6.6641 },
  "niger": { lat: 9.6139, lng: 6.5569 },
  "minna": { lat: 9.6139, lng: 6.5569 },
  "nasarawa": { lat: 8.4933, lng: 8.5153 },
  "lafia": { lat: 8.4933, lng: 8.5153 },
  "taraba": { lat: 8.8937, lng: 11.3600 },
  "jalingo": { lat: 8.8937, lng: 11.3600 },
  "adamawa": { lat: 9.2035, lng: 12.4954 },
  "yola": { lat: 9.2035, lng: 12.4954 },
  "yobe": { lat: 11.7489, lng: 11.9660 },
  "damaturu": { lat: 11.7489, lng: 11.9660 },
  "gombe": { lat: 10.2897, lng: 11.1673 },
  "jigawa": { lat: 12.2280, lng: 9.5616 },
  "dutse": { lat: 11.7594, lng: 9.3392 },
  "ebonyi": { lat: 6.3249, lng: 8.1137 },
  "abakaliki": { lat: 6.3249, lng: 8.1137 },
  "ekiti": { lat: 7.6211, lng: 5.2215 },
  "ado ekiti": { lat: 7.6211, lng: 5.2215 },
  "bayelsa": { lat: 4.9267, lng: 6.2676 },
  "yenagoa": { lat: 4.9267, lng: 6.2676 },

  // Lagos Municipal & Intra-State Districts
  "ikeja": { lat: 6.6018, lng: 3.3515 },
  "lekki": { lat: 6.4698, lng: 3.5852 },
  "victoria island": { lat: 6.4281, lng: 3.4219 },
  "ikoyi": { lat: 6.4549, lng: 3.4346 },
  "yaba": { lat: 6.5095, lng: 3.3711 },
  "surulere": { lat: 6.4969, lng: 3.3556 },
  "ikorodu": { lat: 6.6194, lng: 3.5105 },
  "festac": { lat: 6.4674, lng: 3.2842 },
  "alaba": { lat: 6.4589, lng: 3.1950 },
  "ajah": { lat: 6.4658, lng: 3.5684 },
  "oshodi": { lat: 6.5385, lng: 3.3429 },
  "maryland": { lat: 6.5744, lng: 3.3667 },
  "epe": { lat: 6.5841, lng: 3.9834 },
  "badagry": { lat: 6.4167, lng: 2.8833 },
  "agege": { lat: 6.6180, lng: 3.3209 },

  // Abuja (FCT) Municipal & Intra-State Districts
  "central business district": { lat: 9.0579, lng: 7.4951 },
  "cbd": { lat: 9.0579, lng: 7.4951 },
  "maitama": { lat: 9.0882, lng: 7.4934 },
  "wuse": { lat: 9.0667, lng: 7.4667 },
  "garki": { lat: 9.0333, lng: 7.4833 },
  "asokoro": { lat: 9.0435, lng: 7.5255 },
  "jabi": { lat: 9.0747, lng: 7.4244 },
  "utako": { lat: 9.0645, lng: 7.4397 },
  "gwarinpa": { lat: 9.1122, lng: 7.3986 },
  "kubwa": { lat: 9.1554, lng: 7.3372 },
  "lugbe": { lat: 8.9774, lng: 7.3711 },
  "apo": { lat: 9.0064, lng: 7.5029 },
  "guzape": { lat: 9.0278, lng: 7.5278 },

  // Rivers / Port Harcourt Intra-State Districts
  "trans amadi": { lat: 4.8150, lng: 7.0310 },
  "gra": { lat: 4.8180, lng: 7.0050 },
  "diobu": { lat: 4.7920, lng: 7.0010 },
  "rumuokoro": { lat: 4.8690, lng: 6.9850 },
  "woji": { lat: 4.8214, lng: 7.0625 },
  "eleme": { lat: 4.7892, lng: 7.1235 },
  "choba": { lat: 4.8986, lng: 6.9118 },

  // Oyo / Ibadan Intra-State Districts
  "bodija": { lat: 7.4344, lng: 3.9056 },
  "dugbe": { lat: 7.3878, lng: 3.8789 },
  "ring road": { lat: 7.3603, lng: 3.8642 },
  "iwo road": { lat: 7.4069, lng: 3.9392 },
  "oluyole": { lat: 7.3481, lng: 3.8569 },
  "jericho": { lat: 7.3912, lng: 3.8698 }
};

export function resolveCoordinates(
  providedCoords?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null,
  locationName?: string | null,
  fallback: { lat: number; lng: number } = { lat: 6.5244, lng: 3.3792 }
): { lat: number; lng: number } {
  if (providedCoords) {
    const lat = providedCoords.lat ?? providedCoords.latitude;
    const lng = providedCoords.lng ?? providedCoords.longitude;
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  if (locationName && typeof locationName === 'string') {
    const clean = locationName.toLowerCase().trim();
    for (const [key, coords] of Object.entries(NIGERIA_STATE_COORDS)) {
      if (clean.includes(key) || key.includes(clean)) {
        return coords;
      }
    }
  }

  return fallback;
}

interface RealMapProps {
  origin: string;
  destination: string;
  status?: string;
  originCoords?: { lat: number; lng: number } | null;
  destinationCoords?: { lat: number; lng: number } | null;
  consignmentId?: string;
  height?: string;
  className?: string;
  showRouteSummary?: boolean;
  showFooter?: boolean;
  title?: string;
}

function RouteDisplay({ 
  originLatLng, 
  destinationLatLng, 
  onRouteInfo 
}: { 
  originLatLng: google.maps.LatLngLiteral; 
  destinationLatLng: google.maps.LatLngLiteral;
  onRouteInfo?: (info: { distanceText: string; durationText: string }) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    let isCancelled = false;

    if (routesLib) {
      routesLib.Route.computeRoutes({
        origin: originLatLng,
        destination: destinationLatLng,
        travelMode: 'DRIVING',
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      }).then(({ routes }) => {
        if (isCancelled) return;
        if (routes?.[0]) {
          const newPolylines = routes[0].createPolylines({
            strokeColor: '#0066FF',
            strokeWeight: 5,
            strokeOpacity: 0.85,
          });
          newPolylines.forEach(p => p.setMap(map));
          polylinesRef.current = newPolylines;

          if (routes[0].viewport) {
            map.fitBounds(routes[0].viewport, 60);
          }

          const distanceKm = Math.round((routes[0].distanceMeters || 0) / 1000);
          const durationMins = Math.round((routes[0].durationMillis || 0) / 60000);
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

          if (onRouteInfo) {
            onRouteInfo({ distanceText: `${distanceKm} km`, durationText });
          }
          return;
        }
        throw new Error('No routes found');
      }).catch((err) => {
        if (isCancelled) return;
        console.warn("Routes API computeRoutes fallback:", err);

        // Fallback: create direct line Polyline & fit bounds
        if (window.google?.maps?.Polyline) {
          const fallbackPoly = new google.maps.Polyline({
            path: [originLatLng, destinationLatLng],
            geodesic: true,
            strokeColor: '#0066FF',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map,
          });
          polylinesRef.current = [fallbackPoly];

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(originLatLng);
          bounds.extend(destinationLatLng);
          map.fitBounds(bounds, 60);

          // Estimate rough distance
          const dLat = (destinationLatLng.lat - originLatLng.lat) * 111;
          const dLng = (destinationLatLng.lng - originLatLng.lng) * 111 * Math.cos(originLatLng.lat * (Math.PI / 180));
          const approxKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
          const approxHours = Math.max(1, Math.round(approxKm / 65));

          if (onRouteInfo) {
            onRouteInfo({ 
              distanceText: `~${approxKm} km`, 
              durationText: `~${approxHours}h (${approxKm < 150 ? 'Intra' : 'Inter'}-State)` 
            });
          }
        }
      });
    } else if (window.google?.maps?.Polyline) {
      // Direct Polyline fallback while routes library is loading
      const fallbackPoly = new google.maps.Polyline({
        path: [originLatLng, destinationLatLng],
        geodesic: true,
        strokeColor: '#0066FF',
        strokeOpacity: 0.7,
        strokeWeight: 4,
        map,
      });
      polylinesRef.current = [fallbackPoly];

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originLatLng);
      bounds.extend(destinationLatLng);
      map.fitBounds(bounds, 60);
    }

    return () => {
      isCancelled = true;
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesLib, map, originLatLng.lat, originLatLng.lng, destinationLatLng.lat, destinationLatLng.lng, onRouteInfo]);

  return null;
}

export function RealMap({ 
  origin, 
  destination, 
  status = 'Active Dispatch', 
  originCoords, 
  destinationCoords, 
  consignmentId,
  height = '380px',
  className,
  showRouteSummary = true,
  showFooter = true,
  title,
}: RealMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<'origin' | 'destination' | 'courier' | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceText: string; durationText: string }>({
    distanceText: "Calculating...",
    durationText: "Calculating..."
  });

  const originLatLng = useMemo(() => {
    return resolveCoordinates(originCoords, origin, { lat: 6.5244, lng: 3.3792 });
  }, [originCoords, origin]);

  const destLatLng = useMemo(() => {
    return resolveCoordinates(destinationCoords, destination, { lat: 9.0765, lng: 7.3986 });
  }, [destinationCoords, destination]);

  // Intermediate position for live tracking courier vehicle
  const courierLatLng = useMemo(() => {
    const isTransit = status === 'In Transit' || status === 'Out for Delivery';
    if (!isTransit) return null;
    const progress = status === 'Out for Delivery' ? 0.88 : 0.55;
    return {
      lat: originLatLng.lat + (destLatLng.lat - originLatLng.lat) * progress,
      lng: originLatLng.lng + (destLatLng.lng - originLatLng.lng) * progress,
    };
  }, [status, originLatLng, destLatLng]);

  const handleRouteInfo = useCallback((info: { distanceText: string; durationText: string }) => {
    setRouteInfo(info);
  }, []);

  if (!hasValidMapsKey) {
    return (
      <MockRouteMap
        origin={origin}
        destination={destination}
        status={status}
        shipmentId={consignmentId}
      />
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
      <div className={cn("relative w-full rounded-3xl overflow-hidden border-2 border-slate-200 shadow-lg bg-slate-950 group", className)}>
        {/* Top Route Summary Bar */}
        {showRouteSummary && (
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2.5 px-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl text-slate-100 shadow-xl">
            <div className="flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-blue-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-wider">
                {title || (consignmentId ? `Corridor Route #${consignmentId.slice(0, 8)}` : 'Live Route Corridor')}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold">
              <div className="flex items-center gap-1 text-slate-300">
                <Navigation className="h-3 w-3 text-emerald-400" />
                <span>{routeInfo.distanceText}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>{routeInfo.durationText}</span>
              </div>
              <span className="text-slate-600">|</span>
              <Badge variant="outline" className="text-[8px] font-black uppercase bg-blue-500/20 text-blue-300 border-blue-400/40">
                {status}
              </Badge>
            </div>
          </div>
        )}

        {/* Google Map Canvas */}
        <div style={{ height, width: '100%' }}>
          <GoogleMap
            defaultCenter={originLatLng}
            defaultZoom={6}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Real-Time Route Polyline Computation */}
            <RouteDisplay
              originLatLng={originLatLng}
              destinationLatLng={destLatLng}
              onRouteInfo={handleRouteInfo}
            />

            {/* Origin Marker */}
            <AdvancedMarker
              position={originLatLng}
              onClick={() => setSelectedMarker('origin')}
              title={`Origin: ${origin}`}
            >
              <Pin background="#10b981" glyphColor="#ffffff" borderColor="#047857" />
            </AdvancedMarker>

            {selectedMarker === 'origin' && (
              <InfoWindow
                position={originLatLng}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-1 text-slate-900 font-sans space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600">
                    <MapPin className="h-3 w-3" /> Origin Node
                  </div>
                  <p className="text-xs font-bold leading-tight">{origin}</p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    {originLatLng.lat.toFixed(4)}, {originLatLng.lng.toFixed(4)}
                  </p>
                </div>
              </InfoWindow>
            )}

            {/* Destination Marker */}
            <AdvancedMarker
              position={destLatLng}
              onClick={() => setSelectedMarker('destination')}
              title={`Destination: ${destination}`}
            >
              <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1d4ed8" />
            </AdvancedMarker>

            {selectedMarker === 'destination' && (
              <InfoWindow
                position={destLatLng}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-1 text-slate-900 font-sans space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600">
                    <CheckCircle2 className="h-3 w-3" /> Target Endpoint
                  </div>
                  <p className="text-xs font-bold leading-tight">{destination}</p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    {destLatLng.lat.toFixed(4)}, {destLatLng.lng.toFixed(4)}
                  </p>
                </div>
              </InfoWindow>
            )}

            {/* Live Courier / Vehicle Marker */}
            {courierLatLng && (
              <>
                <AdvancedMarker
                  position={courierLatLng}
                  onClick={() => setSelectedMarker('courier')}
                  title="Live Transit Vehicle"
                >
                  <div className="relative flex items-center justify-center p-2 rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-blue-400/50 animate-bounce">
                    <Truck className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-ping" />
                  </div>
                </AdvancedMarker>

                {selectedMarker === 'courier' && (
                  <InfoWindow
                    position={courierLatLng}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-1 text-slate-900 font-sans space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600">
                        <Truck className="h-3 w-3" /> Active Vehicle Position
                      </div>
                      <p className="text-xs font-bold">{status}</p>
                      <p className="text-[9px] text-slate-500">En route on state corridor</p>
                    </div>
                  </InfoWindow>
                )}
              </>
            )}
          </GoogleMap>
        </div>

        {/* Bottom Corridor Footer */}
        {showFooter && (
          <div className="p-3 bg-slate-900 text-slate-300 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold">
            <div className="flex items-center gap-2 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">Origin: <strong className="text-white">{origin}</strong></span>
            </div>
            <span className="text-slate-600">➔</span>
            <div className="flex items-center gap-2 truncate text-right">
              <span className="truncate">Destination: <strong className="text-white">{destination}</strong></span>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  )
}
