package com.freelas.app.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.model.ChatMessage
import com.freelas.app.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    fun loadChatMessages(serviceId: String) {
        _isLoading.value = true
        
        viewModelScope.launch {
            chatRepository.getChatMessages(serviceId).collect { result ->
                result.fold(
                    onSuccess = { messages ->
                        _isLoading.value = false
                        _uiState.value = _uiState.value.copy(
                            messages = messages,
                            currentUserId = chatRepository.getCurrentUserId()
                        )
                    },
                    onFailure = { exception ->
                        _isLoading.value = false
                        _errorMessage.value = "Erro ao carregar mensagens: ${exception.message}"
                    }
                )
            }
        }
    }
    
    fun sendMessage(serviceId: String, content: String) {
        if (content.isBlank()) return
        
        viewModelScope.launch {
            val message = ChatMessage(
                id = "",
                serviceId = serviceId,
                senderId = _uiState.value.currentUserId ?: "",
                content = content,
                timestamp = System.currentTimeMillis(),
                isRead = false
            )
            
            chatRepository.sendMessage(message).fold(
                onSuccess = { sentMessage ->
                    _uiState.value = _uiState.value.copy(
                        messages = _uiState.value.messages + sentMessage
                    )
                },
                onFailure = { exception ->
                    _errorMessage.value = "Erro ao enviar mensagem: ${exception.message}"
                }
            )
        }
    }
    
    fun markMessageAsRead(messageId: String) {
        viewModelScope.launch {
            chatRepository.markMessageAsRead(messageId).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        messages = _uiState.value.messages.map { message ->
                            if (message.id == messageId) {
                                message.copy(isRead = true)
                            } else {
                                message
                            }
                        }
                    )
                },
                onFailure = { exception ->
                    _errorMessage.value = "Erro ao marcar mensagem como lida: ${exception.message}"
                }
            )
        }
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
}

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val currentUserId: String? = null,
    val isConnected: Boolean = false
)
