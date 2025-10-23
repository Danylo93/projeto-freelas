package com.freelas.app.ui.components

import com.freelas.app.data.model.Service
import com.freelas.app.data.model.ServiceOffer
import com.freelas.app.data.model.VehicleLocation
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocketManager @Inject constructor() {
    
    private var socket: Socket? = null
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()
    
    private val _serviceUpdates = MutableStateFlow<Service?>(null)
    val serviceUpdates: StateFlow<Service?> = _serviceUpdates.asStateFlow()
    
    private val _offerUpdates = MutableStateFlow<ServiceOffer?>(null)
    val offerUpdates: StateFlow<ServiceOffer?> = _offerUpdates.asStateFlow()
    
    private val _vehicleLocation = MutableStateFlow<VehicleLocation?>(null)
    val vehicleLocation: StateFlow<VehicleLocation?> = _vehicleLocation.asStateFlow()
    
    private val _newServiceRequest = MutableStateFlow<Service?>(null)
    val newServiceRequest: StateFlow<Service?> = _newServiceRequest.asStateFlow()
    
    fun connect(authToken: String) {
        try {
            val options = IO.Options().apply {
                auth = mapOf("token" to authToken)
                forceNew = true
            }
            
            socket = IO.socket("http://10.0.2.2:8000", options)
            
            socket?.on(Socket.EVENT_CONNECT) {
                _isConnected.value = true
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                _isConnected.value = false
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) {
                _isConnected.value = false
            }
            
            // Service events
            socket?.on("service_updated") { args ->
                val serviceData = args[0] as? JSONObject
                serviceData?.let { data ->
                    // Parse service data and update state
                    _serviceUpdates.value = parseServiceFromJson(data)
                }
            }
            
            socket?.on("new_service_request") { args ->
                val serviceData = args[0] as? JSONObject
                serviceData?.let { data ->
                    _newServiceRequest.value = parseServiceFromJson(data)
                }
            }
            
            // Offer events
            socket?.on("offer_created") { args ->
                val offerData = args[0] as? JSONObject
                offerData?.let { data ->
                    _offerUpdates.value = parseOfferFromJson(data)
                }
            }
            
            socket?.on("offer_accepted") { args ->
                val offerData = args[0] as? JSONObject
                offerData?.let { data ->
                    _offerUpdates.value = parseOfferFromJson(data)
                }
            }
            
            // Vehicle tracking events
            socket?.on("vehicle_location_update") { args ->
                val locationData = args[0] as? JSONObject
                locationData?.let { data ->
                    _vehicleLocation.value = parseVehicleLocationFromJson(data)
                }
            }
            
            socket?.connect()
        } catch (e: Exception) {
            _isConnected.value = false
        }
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket = null
        _isConnected.value = false
    }
    
    fun joinRoom(roomId: String) {
        socket?.emit("join_room", roomId)
    }
    
    fun leaveRoom(roomId: String) {
        socket?.emit("leave_room", roomId)
    }
    
    fun sendLocationUpdate(latitude: Double, longitude: Double, userId: String) {
        val locationData = JSONObject().apply {
            put("latitude", latitude)
            put("longitude", longitude)
            put("userId", userId)
            put("timestamp", System.currentTimeMillis())
        }
        socket?.emit("location_update", locationData)
    }
    
    fun sendServiceStatusUpdate(serviceId: String, status: String) {
        val statusData = JSONObject().apply {
            put("serviceId", serviceId)
            put("status", status)
            put("timestamp", System.currentTimeMillis())
        }
        socket?.emit("service_status_update", statusData)
    }
    
    fun sendOfferResponse(offerId: String, accepted: Boolean) {
        val responseData = JSONObject().apply {
            put("offerId", offerId)
            put("accepted", accepted)
            put("timestamp", System.currentTimeMillis())
        }
        socket?.emit("offer_response", responseData)
    }
    
    fun sendMessage(roomId: String, message: String, senderId: String) {
        val messageData = JSONObject().apply {
            put("roomId", roomId)
            put("message", message)
            put("senderId", senderId)
            put("timestamp", System.currentTimeMillis())
        }
        socket?.emit("send_message", messageData)
    }
    
    private fun parseServiceFromJson(json: JSONObject): Service? {
        return try {
            Service(
                id = json.getString("id"),
                clientId = json.getString("clientId"),
                providerId = json.optString("providerId"),
                category = com.freelas.app.data.model.ServiceCategory.valueOf(
                    json.getString("category")
                ),
                title = json.getString("title"),
                description = json.getString("description"),
                price = json.getDouble("price"),
                status = com.freelas.app.data.model.ServiceStatus.valueOf(
                    json.getString("status")
                ),
                location = parseLocationFromJson(json.getJSONObject("location")),
                destination = json.optJSONObject("destination")?.let { parseLocationFromJson(it) },
                estimatedTime = json.getInt("estimatedTime"),
                distance = json.getDouble("distance"),
                createdAt = java.util.Date(json.getLong("createdAt")),
                acceptedAt = json.optLong("acceptedAt")?.let { java.util.Date(it) },
                startedAt = json.optLong("startedAt")?.let { java.util.Date(it) },
                completedAt = json.optLong("completedAt")?.let { java.util.Date(it) },
                rating = json.optInt("rating"),
                review = json.optString("review")
            )
        } catch (e: Exception) {
            null
        }
    }
    
    private fun parseOfferFromJson(json: JSONObject): ServiceOffer? {
        return try {
            ServiceOffer(
                id = json.getString("id"),
                serviceId = json.getString("serviceId"),
                clientId = json.getString("clientId"),
                providerId = json.optString("providerId"),
                clientPrice = json.getDouble("clientPrice"),
                providerPrice = json.optDouble("providerPrice"),
                status = com.freelas.app.data.model.OfferStatus.valueOf(
                    json.getString("status")
                ),
                createdAt = java.util.Date(json.getLong("createdAt")),
                expiresAt = java.util.Date(json.getLong("expiresAt")),
                autoAccept = json.optBoolean("autoAccept", false)
            )
        } catch (e: Exception) {
            null
        }
    }
    
    private fun parseVehicleLocationFromJson(json: JSONObject): VehicleLocation? {
        return try {
            VehicleLocation(
                vehicleId = json.getString("vehicleId"),
                location = parseLocationFromJson(json.getJSONObject("location")),
                heading = json.getDouble("heading").toFloat(),
                speed = json.getDouble("speed").toFloat(),
                timestamp = json.getLong("timestamp"),
                status = com.freelas.app.data.model.VehicleStatus.valueOf(
                    json.getString("status")
                )
            )
        } catch (e: Exception) {
            null
        }
    }
    
    private fun parseLocationFromJson(json: JSONObject): com.freelas.app.data.model.Location {
        return com.freelas.app.data.model.Location(
            latitude = json.getDouble("latitude"),
            longitude = json.getDouble("longitude"),
            address = json.getString("address"),
            city = json.optString("city"),
            state = json.optString("state"),
            zipCode = json.optString("zipCode")
        )
    }
}



