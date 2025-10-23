package com.freelas.app.ui.rating

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.model.*
import com.freelas.app.data.repository.RatingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel para gerenciar o estado da tela de avaliação
 */
@HiltViewModel
class RatingViewModel @Inject constructor(
    private val ratingRepository: RatingRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(RatingUiState())
    val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()
    
    private val _categories = MutableStateFlow<List<RatingCategory>>(emptyList())
    val categories: StateFlow<List<RatingCategory>> = _categories.asStateFlow()
    
    init {
        loadCategories()
    }
    
    /**
     * Carrega as categorias de avaliação
     */
    private fun loadCategories() {
        val categories = ratingRepository.getRatingCategories()
        _categories.value = categories
    }
    
    /**
     * Define a avaliação por estrelas
     */
    fun setRating(rating: Int) {
        _uiState.value = _uiState.value.copy(
            rating = rating,
            errorMessage = null
        )
    }
    
    /**
     * Define o comentário
     */
    fun setComment(comment: String) {
        _uiState.value = _uiState.value.copy(
            comment = comment,
            errorMessage = null
        )
    }
    
    /**
     * Alterna uma categoria selecionada
     */
    fun toggleCategory(categoryId: String) {
        val currentSelected = _uiState.value.selectedCategories.toMutableList()
        
        if (categoryId in currentSelected) {
            currentSelected.remove(categoryId)
        } else {
            currentSelected.add(categoryId)
        }
        
        _uiState.value = _uiState.value.copy(
            selectedCategories = currentSelected,
            errorMessage = null
        )
    }
    
    /**
     * Inicia o processo de envio da avaliação
     */
    fun startSubmission() {
        val currentState = _uiState.value
        
        if (currentState.rating == 0) {
            _uiState.value = currentState.copy(
                errorMessage = "Selecione uma avaliação antes de enviar"
            )
            return
        }
        
        _uiState.value = currentState.copy(
            isSubmitting = true,
            errorMessage = null
        )
    }
    
    /**
     * Submete a avaliação
     */
    fun submitRating(service: Service) {
        val currentState = _uiState.value
        
        viewModelScope.launch {
            try {
                val request = RatingRequest(
                    serviceId = service.id,
                    rating = currentState.rating,
                    comment = currentState.comment.takeIf { it.isNotBlank() },
                    categoryIds = currentState.selectedCategories
                )
                
                val response = ratingRepository.submitRating(request)
                
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    ratingResult = response,
                    errorMessage = if (!response.success) response.message else null
                )
                
                // Limpar estado após sucesso
                if (response.success) {
                    // Pequeno delay para mostrar o sucesso
                    kotlinx.coroutines.delay(500)
                }
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    errorMessage = "Erro ao enviar avaliação: ${e.message}"
                )
            }
        }
    }
    
    /**
     * Limpa a mensagem de erro
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
    
    /**
     * Reseta o estado da avaliação
     */
    fun resetRating() {
        _uiState.value = RatingUiState()
    }
}

/**
 * Estado da UI da tela de avaliação
 */
data class RatingUiState(
    val rating: Int = 0,
    val comment: String = "",
    val selectedCategories: List<String> = emptyList(),
    val isSubmitting: Boolean = false,
    val ratingResult: RatingResponse? = null,
    val errorMessage: String? = null
)
