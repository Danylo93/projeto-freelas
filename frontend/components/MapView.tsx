import React from 'react';
import { Platform } from 'react-native';

// Conditional imports based on platform
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS === 'web') {
  // Web implementation using react-native-web-maps
  const WebMaps = require('react-native-web-maps');
  MapView = WebMaps.default;
  Marker = WebMaps.Marker;
  Polyline = WebMaps.Polyline;
  PROVIDER_GOOGLE = 'google';
} else {
  // Native implementation using react-native-maps
  const NativeMaps = require('react-native-maps');
  MapView = NativeMaps.default;
  Marker = NativeMaps.Marker;
  Polyline = NativeMaps.Polyline;
  PROVIDER_GOOGLE = NativeMaps.PROVIDER_GOOGLE;
}

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

const CustomMapView = React.forwardRef<any, MapViewProps>((props, ref) => {
  const mapProps = {
    ...props,
    provider: Platform.OS === 'web' ? undefined : props.provider,
    ref: ref,
  };

  if (Platform.OS === 'web') {
    // For web, we need to provide the Google Maps API key
    const webProps = {
      ...mapProps,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    };
    return <MapView {...webProps} />;
  }

  return <MapView {...mapProps} />;
});

const CustomMarker: React.FC<MarkerProps> = (props) => {
  return <Marker {...props} />;
};

const CustomPolyline: React.FC<PolylineProps> = (props) => {
  return <Polyline {...props} />;
};

export default CustomMapView;
export { CustomMarker as Marker, CustomPolyline as Polyline, PROVIDER_GOOGLE };