package com.freelas.app.ui.navigation

import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.freelas.app.data.model.UserType
import com.freelas.app.data.repository.AuthRepository
import com.freelas.app.ui.auth.AuthScreen
import com.freelas.app.ui.client.ClientHomeScreen
import com.freelas.app.ui.provider.ProviderHomeScreen
import com.freelas.app.ui.splash.SplashScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject
import androidx.lifecycle.viewModelScope

@HiltViewModel
class NavigationViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : androidx.lifecycle.ViewModel() {
    val isAuthenticated = authRepository.isAuthenticated
    val currentUser = authRepository.currentUser
    
    fun checkAuthStatus() {
        viewModelScope.launch {
            authRepository.checkAuthStatus()
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}

@Composable
fun FreelasNavigation(
    navController: NavHostController = rememberNavController(),
    permissionManager: com.freelas.app.utils.PermissionManager? = null
) {
    val viewModel: NavigationViewModel = hiltViewModel()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState(initial = false)
    val currentUser by viewModel.currentUser.collectAsState(initial = null)
    
    // Check auth status on first launch
    LaunchedEffect(Unit) {
        viewModel.checkAuthStatus()
    }
    
    NavHost(
        navController = navController,
        startDestination = when {
            isAuthenticated -> {
                when (currentUser?.userType) {
                    UserType.CLIENT -> "client_home"
                    UserType.PROVIDER -> "provider_home"
                    else -> "auth"
                }
            }
            else -> "splash"
        }
    ) {
        composable("splash") {
            SplashScreen(
                onNavigateToAuth = {
                    navController.navigate("auth") {
                        popUpTo("splash") { inclusive = true }
                    }
                },
                onNavigateToHome = { userType ->
                    when (userType) {
                        UserType.CLIENT -> {
                            navController.navigate("client_home") {
                                popUpTo("splash") { inclusive = true }
                            }
                        }
                        UserType.PROVIDER -> {
                            navController.navigate("provider_home") {
                                popUpTo("splash") { inclusive = true }
                            }
                        }
                        else -> {
                            navController.navigate("auth") {
                                popUpTo("splash") { inclusive = true }
                            }
                        }
                    }
                }
            )
        }
        
        composable("auth") {
            AuthScreen(
                navController = navController
            )
        }
        
        composable("client_home") {
            ClientHomeScreen(
                onNavigateToTracking = { service ->
                    // Pass service data to tracking screen
                    navController.navigate("client_tracking")
                },
                permissionManager = permissionManager
            )
        }
        
        composable("provider_home") {
            ProviderHomeScreen(
                onNavigateToTracking = { service ->
                    navController.navigate("provider_tracking")
                },
                permissionManager = permissionManager
            )
        }
        
        composable("profile") {
            com.freelas.app.ui.profile.ProfileScreen(
                onBack = {
                    navController.popBackStack()
                },
                onLogout = {
                    viewModel.logout()
                    navController.navigate("auth") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        composable("messages") {
            com.freelas.app.ui.chat.ChatScreen(
                serviceId = "service_1",
                otherUserId = "other_user_1",
                userType = currentUser?.userType ?: com.freelas.app.data.model.UserType.CLIENT,
                onBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("payment") {
            val mockService = com.freelas.app.data.model.Service(
                id = "service_1",
                clientId = "client_1",
                providerId = "provider_1",
                category = com.freelas.app.data.model.ServiceCategory.TRANSPORT,
                title = "FreelasPop",
                description = "Transporte",
                price = 28.80,
                status = com.freelas.app.data.model.ServiceStatus.COMPLETED,
                location = com.freelas.app.data.model.Location(
                    latitude = -23.5505,
                    longitude = -46.6333,
                    address = "São Paulo, SP"
                ),
                destination = com.freelas.app.data.model.Location(
                    latitude = -23.5615,
                    longitude = -46.6565,
                    address = "Centro, São Paulo, SP"
                ),
                estimatedTime = 15,
                distance = 5.2,
                createdAt = java.util.Date(),
                acceptedAt = java.util.Date(),
                startedAt = java.util.Date(),
                completedAt = java.util.Date()
            )
            
            com.freelas.app.ui.payment.PaymentScreen(
                service = mockService,
                onPaymentSuccess = { payment ->
                    navController.popBackStack()
                },
                onPaymentCancelled = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("client_tracking") {
            // For now, create a mock service for tracking
            val mockService = com.freelas.app.data.model.Service(
                id = "service_1",
                clientId = "client_1",
                providerId = "provider_1",
                category = com.freelas.app.data.model.ServiceCategory.TRANSPORT,
                title = "FreelasPop",
                description = "Transporte",
                price = 28.80,
                status = com.freelas.app.data.model.ServiceStatus.ACCEPTED,
                location = com.freelas.app.data.model.Location(
                    latitude = -23.5505,
                    longitude = -46.6333,
                    address = "São Paulo, SP"
                ),
                destination = com.freelas.app.data.model.Location(
                    latitude = -23.5615,
                    longitude = -46.6565,
                    address = "Centro, São Paulo, SP"
                ),
                estimatedTime = 15,
                distance = 5.2,
                createdAt = java.util.Date(),
                acceptedAt = java.util.Date(),
                startedAt = null,
                completedAt = null
            )
            
            com.freelas.app.ui.client.ClientTrackingScreen(
                service = mockService,
                onBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("provider_tracking") {
            // For now, create a mock service for tracking
            val mockService = com.freelas.app.data.model.Service(
                id = "service_1",
                clientId = "client_1",
                providerId = "provider_1",
                category = com.freelas.app.data.model.ServiceCategory.TRANSPORT,
                title = "FreelasPop",
                description = "Transporte",
                price = 28.80,
                status = com.freelas.app.data.model.ServiceStatus.IN_PROGRESS,
                location = com.freelas.app.data.model.Location(
                    latitude = -23.5505,
                    longitude = -46.6333,
                    address = "São Paulo, SP"
                ),
                destination = com.freelas.app.data.model.Location(
                    latitude = -23.5615,
                    longitude = -46.6565,
                    address = "Centro, São Paulo, SP"
                ),
                estimatedTime = 15,
                distance = 5.2,
                createdAt = java.util.Date(),
                acceptedAt = java.util.Date(),
                startedAt = java.util.Date(),
                completedAt = null
            )
            
            com.freelas.app.ui.provider.ProviderTrackingScreen(
                service = mockService,
                onBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
