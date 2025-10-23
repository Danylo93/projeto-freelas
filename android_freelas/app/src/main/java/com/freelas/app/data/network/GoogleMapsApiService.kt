package com.freelas.app.data.network

import com.freelas.app.data.model.Route
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface GoogleMapsApiService {
    
    @GET("directions/json")
    suspend fun getDirections(
        @Query("origin") origin: String,
        @Query("destination") destination: String,
        @Query("waypoints") waypoints: String? = null,
        @Query("key") apiKey: String,
        @Query("mode") mode: String = "driving",
        @Query("alternatives") alternatives: Boolean = false,
        @Query("avoid") avoid: String? = null,
        @Query("language") language: String = "pt-BR",
        @Query("units") units: String = "metric"
    ): Response<GoogleDirectionsResponse>
    
    @GET("geocode/json")
    suspend fun geocodeAddress(
        @Query("address") address: String,
        @Query("key") apiKey: String,
        @Query("language") language: String = "pt-BR"
    ): Response<GoogleGeocodeResponse>
    
    @GET("geocode/json")
    suspend fun reverseGeocode(
        @Query("latlng") latlng: String,
        @Query("key") apiKey: String,
        @Query("language") language: String = "pt-BR"
    ): Response<GoogleGeocodeResponse>
}

data class GoogleDirectionsResponse(
    val routes: List<GoogleRoute>?,
    val status: String?
)

data class GoogleRoute(
    val legs: List<GoogleLeg>?,
    val overview_polyline: GooglePolyline?,
    val bounds: GoogleBounds?,
    val summary: String?
)

data class GoogleLeg(
    val distance: GoogleDistance?,
    val duration: GoogleDuration?,
    val steps: List<GoogleStep>?,
    val start_address: String?,
    val end_address: String?
)

data class GoogleStep(
    val distance: GoogleDistance?,
    val duration: GoogleDuration?,
    val html_instructions: String?,
    val maneuver: String?,
    val start_location: GoogleLocation?,
    val end_location: GoogleLocation?
)

data class GooglePolyline(
    val points: String?
)

data class GoogleBounds(
    val northeast: GoogleLocation?,
    val southwest: GoogleLocation?
)

data class GoogleLocation(
    val lat: Double?,
    val lng: Double?
)

data class GoogleDistance(
    val text: String?,
    val value: Int?
)

data class GoogleDuration(
    val text: String?,
    val value: Int?
)

data class GoogleGeocodeResponse(
    val results: List<GoogleGeocodeResult>?,
    val status: String?
)

data class GoogleGeocodeResult(
    val formatted_address: String?,
    val geometry: GoogleGeometry?,
    val place_id: String?
)

data class GoogleGeometry(
    val location: GoogleLocation?,
    val location_type: String?,
    val viewport: GoogleBounds?
)



