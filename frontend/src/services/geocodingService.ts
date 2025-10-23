const GOOGLE_MAPS_API_KEY = 'AIzaSyCBZOxsRUQIZXhaZ6M74VcMWIKx8RSNQVY';

export interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
}

export class GeocodingService {
  static async getPlacePredictions(query: string): Promise<PlaceResult[]> {
    try {
      console.log('Buscando sugestões para:', query);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&components=country:br&language=pt-BR&types=geocode`
      );
      
      const data = await response.json();
      console.log('Resposta da API:', data);
      
      if (data.status === 'OK') {
        return data.predictions || [];
      } else {
        console.error('Erro na API:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar previsões:', error);
      return [];
    }
  }

  static async getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=geometry,formatted_address`
      );
      
      const data = await response.json();
      
      if (data.result && data.result.geometry) {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          address: data.result.formatted_address
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar detalhes do lugar:', error);
      return null;
    }
  }

  static async getDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    try {
      console.log('Buscando direções da API Google...');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&language=pt-BR`
      );
      
      const data = await response.json();
      console.log('Resposta da API Directions:', data);
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.text,
          distanceValue: leg.distance.value, // em metros
          duration: leg.duration.text,
          durationValue: leg.duration.value, // em segundos
          steps: leg.steps.map((step: any) => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text,
            start_location: step.start_location,
            end_location: step.end_location
          })),
          polyline: route.overview_polyline.points
        };
      } else {
        console.log('API Directions retornou:', data.status, data.error_message);
        // Não mostrar erro ao usuário, apenas usar fallback
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar direções:', error);
      return null;
    }
  }

  static calculatePrice(distanceKm: number, basePrice: number): number {
    // Preço base + R$ 2,50 por km
    const pricePerKm = 2.50;
    const totalPrice = basePrice + (distanceKm * pricePerKm);
    
    // Arredondar para 2 casas decimais
    return Math.round(totalPrice * 100) / 100;
  }

  static formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
      return `${distanceMeters}m`;
    } else {
      const km = distanceMeters / 1000;
      return `${km.toFixed(1)}km`;
    }
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }

  static decodePolyline(encoded: string) {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return poly;
  }
}
