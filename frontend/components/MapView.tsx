import React, { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

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
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
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
const WebMapView: React.FC<MapViewProps> = ({ style, initialRegion, children }) => {
  const region = initialRegion;
  const mapsUrl = region 
    ? `https://www.google.com/maps/embed/v1/view?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${region.latitude},${region.longitude}&zoom=15`
    : 'about:blank';

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

  useEffect(() => {
    const fetchRoute = async () => {
      if (!origin || !destination) {
        setRouteCoords([]);
        return;
      }
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
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
  }, [origin, destination]);

  if (Platform.OS === 'web') {
    return (
      <WebMapView {...rest}>
        {origin && <CustomMarker coordinate={origin} />}
        {destination && <CustomMarker coordinate={destination} />}
        {routeCoords.length > 0 && (
          <CustomPolyline coordinates={routeCoords} strokeColor="blue" strokeWidth={4} />
        )}
        {children}
      </WebMapView>
    );
  }

  if (NativeMapView) {
    return (
      <NativeMapView {...rest} ref={ref}>
        {origin && <CustomMarker coordinate={origin} />}
        {destination && <CustomMarker coordinate={destination} />}
        {routeCoords.length > 0 && (
          <CustomPolyline coordinates={routeCoords} strokeColor="blue" strokeWidth={4} />
        )}
        {children}
      </NativeMapView>
    );
  }

  // Fallback if native maps not available
  return (
    <View style={[styles.fallbackContainer, rest.style]}>
      <Text style={styles.fallbackText}>Mapa não disponível</Text>
    </View>
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
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  fallbackText: {
    fontSize: 16,
    color: '#666',
  },
});

export default CustomMapView;
export { CustomMarker as Marker, CustomPolyline as Polyline, PROVIDER_GOOGLE };
