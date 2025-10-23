package com.freelas.app.data.repository

import com.freelas.app.data.model.ChatMessage
import com.freelas.app.data.model.ChatRoom
import com.freelas.app.data.network.ApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    fun getChatMessages(serviceId: String): Flow<Result<List<ChatMessage>>> = flow {
        try {
            val token = "Bearer ${getAuthToken()}"
            // This would call a chat messages endpoint
            // For now, return mock data
            val mockMessages = createMockMessages(serviceId)
            emit(Result.success(mockMessages))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun sendMessage(message: ChatMessage): Result<ChatMessage> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            // This would call the send message endpoint
            // For now, return the message with a generated ID
            val sentMessage = message.copy(id = "msg_${System.currentTimeMillis()}")
            Result.success(sentMessage)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun markMessageAsRead(messageId: String): Result<Unit> {
        return try {
            val token = "Bearer ${getAuthToken()}"
            // This would call the mark as read endpoint
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun getChatRooms(): Flow<Result<List<ChatRoom>>> = flow {
        try {
            val token = "Bearer ${getAuthToken()}"
            // This would call the chat rooms endpoint
            val mockRooms = createMockChatRooms()
            emit(Result.success(mockRooms))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    fun getCurrentUserId(): String {
        // This should get the current user ID from auth repository
        return "current_user_id"
    }
    
    private fun createMockMessages(serviceId: String): List<ChatMessage> {
        return listOf(
            ChatMessage(
                id = "msg_1",
                serviceId = serviceId,
                senderId = "client_1",
                content = "Olá! Estou a caminho do local de encontro.",
                timestamp = System.currentTimeMillis() - 300000, // 5 minutes ago
                isRead = true
            ),
            ChatMessage(
                id = "msg_2",
                serviceId = serviceId,
                senderId = "provider_1",
                content = "Perfeito! Estou aguardando você aqui.",
                timestamp = System.currentTimeMillis() - 240000, // 4 minutes ago
                isRead = true
            ),
            ChatMessage(
                id = "msg_3",
                serviceId = serviceId,
                senderId = "client_1",
                content = "Cheguei! Estou na frente do prédio.",
                timestamp = System.currentTimeMillis() - 120000, // 2 minutes ago
                isRead = true
            ),
            ChatMessage(
                id = "msg_4",
                serviceId = serviceId,
                senderId = "provider_1",
                content = "Ótimo! Já estou saindo para te buscar.",
                timestamp = System.currentTimeMillis() - 60000, // 1 minute ago
                isRead = false
            )
        )
    }
    
    private fun createMockChatRooms(): List<ChatRoom> {
        return listOf(
            ChatRoom(
                id = "room_1",
                serviceId = "service_1",
                clientId = "client_1",
                providerId = "provider_1",
                lastMessage = ChatMessage(
                    id = "msg_4",
                    serviceId = "service_1",
                    senderId = "provider_1",
                    content = "Ótimo! Já estou saindo para te buscar.",
                    timestamp = System.currentTimeMillis() - 60000,
                    isRead = false
                ),
                unreadCount = 1,
                createdAt = System.currentTimeMillis() - 3600000,
                updatedAt = System.currentTimeMillis() - 60000
            )
        )
    }
    
    private fun getAuthToken(): String {
        // This should be injected from AuthRepository or PreferencesManager
        return "mock_token"
    }
}



