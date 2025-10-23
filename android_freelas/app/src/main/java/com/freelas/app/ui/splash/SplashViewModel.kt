package com.freelas.app.ui.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()
    
    private val _currentUser = MutableStateFlow<com.freelas.app.data.model.User?>(null)
    val currentUser: StateFlow<com.freelas.app.data.model.User?> = _currentUser.asStateFlow()
    
    init {
        checkAuthStatus()
    }
    
    private fun checkAuthStatus() {
        viewModelScope.launch {
            // Primeiro verifica o status de autenticação
            authRepository.checkAuthStatus()
            
            // Depois observa os flows do repositório
            authRepository.isAuthenticated.collect { isAuth ->
                _isAuthenticated.value = isAuth
            }
        }
        
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                _currentUser.value = user
            }
        }
    }
}
