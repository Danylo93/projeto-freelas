package com.freelas.app.data.network

import com.freelas.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Auth endpoints
    @POST("auth/login")
    suspend fun login(@Body request: AuthRequest): Response<AuthResponse>
    
    @POST("auth/register")
    suspend fun register(@Body request: AuthRequest): Response<AuthResponse>
    
    @GET("auth/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
    
    // Services endpoints
    @GET("services")
    suspend fun getServices(
        @Header("Authorization") token: String,
        @Query("status") status: String? = null,
        @Query("category") category: String? = null
    ): Response<List<Service>>
    
    @POST("services")
    suspend fun createService(
        @Header("Authorization") token: String,
        @Body service: Service
    ): Response<Service>
    
    @GET("services/{id}")
    suspend fun getService(
        @Header("Authorization") token: String,
        @Path("id") serviceId: String
    ): Response<Service>
    
    @PUT("services/{id}")
    suspend fun updateService(
        @Header("Authorization") token: String,
        @Path("id") serviceId: String,
        @Body service: Service
    ): Response<Service>
    
    @DELETE("services/{id}")
    suspend fun deleteService(
        @Header("Authorization") token: String,
        @Path("id") serviceId: String
    ): Response<Unit>
    
    // Offers endpoints
    @POST("offers")
    suspend fun createOffer(
        @Header("Authorization") token: String,
        @Body offer: ServiceOffer
    ): Response<ServiceOffer>
    
    @PUT("offers/{id}")
    suspend fun updateOffer(
        @Header("Authorization") token: String,
        @Path("id") offerId: String,
        @Body offer: ServiceOffer
    ): Response<ServiceOffer>
    
    @GET("offers/{id}")
    suspend fun getOffer(
        @Header("Authorization") token: String,
        @Path("id") offerId: String
    ): Response<ServiceOffer>
    
    // Providers endpoints
    @GET("providers")
    suspend fun getProviders(
        @Header("Authorization") token: String,
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Double = 10.0,
        @Query("category") category: String? = null
    ): Response<List<ServiceProviderProfile>>
    
    @POST("provider/profile")
    suspend fun createProviderProfile(
        @Header("Authorization") token: String,
        @Body profile: ServiceProviderProfile
    ): Response<ServiceProviderProfile>
    
    @PUT("provider/profile")
    suspend fun updateProviderProfile(
        @Header("Authorization") token: String,
        @Body profile: ServiceProviderProfile
    ): Response<ServiceProviderProfile>
    
    @GET("provider/profile")
    suspend fun getProviderProfile(
        @Header("Authorization") token: String
    ): Response<ServiceProviderProfile>
    
    // Location endpoints
    @GET("geocode")
    suspend fun geocodeAddress(
        @Query("address") address: String
    ): Response<Location>
    
    @GET("reverse-geocode")
    suspend fun reverseGeocode(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double
    ): Response<Location>
    
    // Real-time endpoints
    @POST("socket/join")
    suspend fun joinRoom(
        @Header("Authorization") token: String,
        @Query("room") room: String
    ): Response<Unit>
    
    @POST("socket/leave")
    suspend fun leaveRoom(
        @Header("Authorization") token: String,
        @Query("room") room: String
    ): Response<Unit>
}

