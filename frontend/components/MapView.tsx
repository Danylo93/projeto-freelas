import React from 'react';
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
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
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

const CustomMapView = React.forwardRef<any, MapViewProps>((props, ref) => {
  if (Platform.OS === 'web') {
    return <WebMapView {...props} />;
  }

  if (NativeMapView) {
    return <NativeMapView {...props} ref={ref} />;
  }

  // Fallback if native maps not available
  return (
    <View style={[styles.fallbackContainer, props.style]}>
      <Text style={styles.fallbackText}>Mapa não disponível</Text>
    </View>
  );
});

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