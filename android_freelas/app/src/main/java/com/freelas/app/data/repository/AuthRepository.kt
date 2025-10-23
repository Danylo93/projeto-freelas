package com.freelas.app.data.repository

import com.freelas.app.data.local.PreferencesManager
import com.freelas.app.data.model.AuthRequest
import com.freelas.app.data.model.AuthResponse
import com.freelas.app.data.model.User
import com.freelas.app.data.network.ApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val preferencesManager: PreferencesManager
) {
    
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: Flow<User?> = _currentUser.asStateFlow()
    
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: Flow<Boolean> = _isAuthenticated.asStateFlow()
    
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            // Sistema de login mock - funciona offline
            val mockUser = createMockUser(email, password)
            if (mockUser != null) {
                val authResponse = AuthResponse(
                    accessToken = "mock_token_${System.currentTimeMillis()}",
                    tokenType = "Bearer",
                    userType = mockUser.userType,
                    userData = mockUser
                )
                saveAuthData(authResponse)
                _currentUser.value = mockUser
                _isAuthenticated.value = true
                Result.success(authResponse)
            } else {
                Result.failure(Exception("Credenciais inválidas"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun createMockUser(email: String, password: String): User? {
        // Sistema de login mock baseado no email
        return when {
            email.contains("cliente") -> {
                User(
                    id = "mock_client_1",
                    name = "Cliente Teste",
                    email = email,
                    phone = "11987654321",
                    userType = com.freelas.app.data.model.UserType.CLIENT,
                    isActive = true,
                    createdAt = java.util.Date(),
                    profileImage = null,
                    rating = null,
                    totalServices = 0
                )
            }
            email.contains("prestador") || email.contains("joao") || email.contains("carlos") || 
            email.contains("maria") || email.contains("pedro") || email.contains("ana") -> {
                User(
                    id = "mock_provider_1",
                    name = "Prestador Teste",
                    email = email,
                    phone = "11999887766",
                    userType = com.freelas.app.data.model.UserType.PROVIDER,
                    isActive = true,
                    createdAt = java.util.Date(),
                    profileImage = null,
                    rating = 4.5,
                    totalServices = 10
                )
            }
            else -> null
        }
    }
    
    suspend fun register(
        name: String,
        email: String,
        phone: String,
        password: String,
        userType: com.freelas.app.data.model.UserType
    ): Result<AuthResponse> {
        return try {
            // Sistema de registro mock - funciona offline
            val mockUser = User(
                id = "mock_user_${System.currentTimeMillis()}",
                name = name,
                email = email,
                phone = phone,
                userType = userType,
                isActive = true,
                createdAt = java.util.Date(),
                profileImage = null,
                rating = if (userType == com.freelas.app.data.model.UserType.PROVIDER) 4.5 else null,
                totalServices = if (userType == com.freelas.app.data.model.UserType.PROVIDER) 10 else 0
            )
            
            val authResponse = AuthResponse(
                accessToken = "mock_token_${System.currentTimeMillis()}",
                tokenType = "Bearer",
                userType = mockUser.userType,
                userData = mockUser
            )
            saveAuthData(authResponse)
            _currentUser.value = mockUser
            _isAuthenticated.value = true
            Result.success(authResponse)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout() {
        preferencesManager.clearAuthData()
        _currentUser.value = null
        _isAuthenticated.value = false
    }
    
    suspend fun getCurrentUser(): Result<User> {
        return try {
            val token = preferencesManager.getAuthToken()
            if (token != null) {
                val response = apiService.getCurrentUser("Bearer $token")
                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!
                    _currentUser.value = user
                    Result.success(user)
                } else {
                    logout()
                    Result.failure(Exception("Invalid token"))
                }
            } else {
                Result.failure(Exception("No token found"))
            }
        } catch (e: Exception) {
            logout()
            Result.failure(e)
        }
    }
    
    fun getAuthToken(): String? {
        return preferencesManager.getAuthToken()
    }
    
    fun isUserLoggedIn(): Boolean {
        return preferencesManager.getAuthToken() != null && _isAuthenticated.value
    }
    
    private suspend fun saveAuthData(authResponse: AuthResponse) {
        preferencesManager.saveAuthToken(authResponse.accessToken)
        preferencesManager.saveUserType(authResponse.userType.value)
    }
    
    suspend fun checkAuthStatus() {
        val token = preferencesManager.getAuthToken()
        if (token != null) {
            getCurrentUser()
        } else {
            _isAuthenticated.value = false
        }
    }
}
