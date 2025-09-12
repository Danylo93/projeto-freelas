import React, { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapViewProps {
  style?: any;
  provider?: string;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  children?: React.ReactNode;
  onRegionChange?: (region: any) => void;
    origin?: { latitude: number; longitude: number } | string;
    destination?: { latitude: number; longitude: number } | string;
  ref?: any;
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
  children?: React.ReactNode;
}

interface PolylineProps {
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  strokeColor?: string;
  strokeWidth?: number;
}

// Web fallback component
const WebMapView: React.FC<MapViewProps> = ({ style, initialRegion, origin, destination, children }) => {
  let mapsUrl = 'about:blank';
  if (origin && destination && typeof origin !== 'string' && typeof destination !== 'string') {
    mapsUrl = `https://www.google.com/maps/embed/v1/directions?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`;
  } else if (initialRegion) {
    mapsUrl = `https://www.google.com/maps/embed/v1/view?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${initialRegion.latitude},${initialRegion.longitude}&zoom=15`;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webMapContainer, style]}>
        <iframe
          src={mapsUrl}
          style={styles.webMap}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.webMapContainer, style]}>
      <WebView source={{ uri: mapsUrl }} style={styles.webMap} />
      {children}
    </View>
  );
};

const WebMarker: React.FC<MarkerProps> = ({ title }) => (
  <View style={styles.markerContainer}>
    <View style={styles.marker}>
      <Text style={styles.markerText}>📍</Text>
    </View>
    {title && <Text style={styles.markerTitle}>{title}</Text>}
  </View>
);

const WebPolyline: React.FC<PolylineProps> = () => null;

// Native components (lazy loaded)
let NativeMapView: any = null;
let NativeMarker: any = null;
let NativePolyline: any = null;
let PROVIDER_GOOGLE: any = 'google';

if (Platform.OS !== 'web') {
  try {
    const NativeMaps = require('react-native-maps');
    NativeMapView = NativeMaps.default;
    NativeMarker = NativeMaps.Marker;
    NativePolyline = NativeMaps.Polyline;
    PROVIDER_GOOGLE = NativeMaps.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
  }
}

const CustomMarker: React.FC<MarkerProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebMarker {...props} />;
  }
  if (NativeMarker) {
    return <NativeMarker {...props} />;
  }
  return null;
};

const CustomPolyline: React.FC<PolylineProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebPolyline {...props} />;
  }
  if (NativePolyline) {
    return <NativePolyline {...props} />;
  }
  return null;
};

function decodePolyline(encoded: string) {
  let points: Array<{ latitude: number; longitude: number }> = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const CustomMapView = React.forwardRef<any, MapViewProps>((props, ref) => {
  const { origin, destination, children, ...rest } = props;
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [resolvedOrigin, setResolvedOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [resolvedDestination, setResolvedDestination] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const resolveLocation = async (loc: any) => {
      if (!loc) return null;
      if (typeof loc === 'string') {
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(loc)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
          const json = await res.json();
          const geo = json.results?.[0]?.geometry?.location;
          if (geo) {
            return { latitude: geo.lat, longitude: geo.lng };
          }
        } catch (err) {
          console.warn('geocoding error', err);
        }
        return null;
      }
      return loc;
    };

    const resolve = async () => {
      const o = await resolveLocation(origin);
      const d = await resolveLocation(destination);
      setResolvedOrigin(o);
      setResolvedDestination(d);
    };
    resolve();
  }, [origin, destination]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!resolvedOrigin || !resolvedDestination) {
        setRouteCoords([]);
        return;
      }
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${resolvedOrigin.latitude},${resolvedOrigin.longitude}&destination=${resolvedDestination.latitude},${resolvedDestination.longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const points = data.routes?.[0]?.overview_polyline?.points;
        if (points) {
          setRouteCoords(decodePolyline(points));
        }
      } catch (err) {
        console.warn('directions error', err);
      }
    };
    fetchRoute();
  }, [resolvedOrigin, resolvedDestination]);

  if (Platform.OS === 'web' || !NativeMapView) {
    return (
      <WebMapView
        {...rest}
        origin={resolvedOrigin || undefined}
        destination={resolvedDestination || undefined}
      >
        {children}
      </WebMapView>
    );
  }

  return (
    <NativeMapView {...rest} ref={ref}>
      {resolvedOrigin && <CustomMarker coordinate={resolvedOrigin} />}
      {resolvedDestination && <CustomMarker coordinate={resolvedDestination} />}
      {routeCoords.length > 0 && (
        <CustomPolyline coordinates={routeCoords} strokeColor="blue" strokeWidth={4} />
      )}
      {children}
    </NativeMapView>
  );
});
CustomMapView.displayName = 'CustomMapView';

const styles = StyleSheet.create({
  webMapContainer: {
    position: 'relative',
  },
  webMap: {
    width: '100%',
    height: '100%',
    border: 0,
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
  markerTitle: {
    fontSize: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  });

export default CustomMapView;
export { CustomMarker as Marker, CustomPolyline as Polyline, PROVIDER_GOOGLE };
