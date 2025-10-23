package com.freelas.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.data.model.UserType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBack: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState(initial = false)
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // Top bar
        TopAppBar(
            title = { 
                Text(
                    text = "Perfil",
                    color = Color.White,
                    fontWeight = FontWeight.Medium
                ) 
            },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        Icons.Default.ArrowBack,
                        contentDescription = "Voltar",
                        tint = Color.White
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        )
        
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Profile header
                ProfileHeader(
                    user = uiState.user,
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Profile options
                ProfileOptionsList(
                    userType = uiState.user?.userType ?: UserType.CLIENT,
                    onEditProfile = { /* Navigate to edit profile */ },
                    onPaymentMethods = { /* Navigate to payment methods */ },
                    onNotifications = { /* Navigate to notifications */ },
                    onHelp = { /* Navigate to help */ },
                    onAbout = { /* Navigate to about */ },
                    onLogout = onLogout,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun ProfileHeader(
    user: com.freelas.app.data.model.User?,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile picture
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(
                        MaterialTheme.colorScheme.primary,
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(40.dp)
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // User name
            Text(
                text = user?.name ?: "Usuário",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            
            // User type
            Text(
                text = if (user?.userType == UserType.CLIENT) "Cliente" else "Prestador",
                fontSize = 14.sp,
                color = Color.Gray
            )
            
            // Rating (for providers)
            if (user?.userType == UserType.PROVIDER && user.rating != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Star,
                        contentDescription = null,
                        tint = Color.Yellow,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = String.format("%.1f", user.rating),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = " (${user.totalServices} serviços)",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileOptionsList(
    userType: UserType,
    onEditProfile: () -> Unit,
    onPaymentMethods: () -> Unit,
    onNotifications: () -> Unit,
    onHelp: () -> Unit,
    onAbout: () -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
    ) {
        // Edit profile
        ProfileOptionItem(
            icon = Icons.Default.Edit,
            title = "Editar perfil",
            subtitle = "Atualizar informações pessoais",
            onClick = onEditProfile
        )
        
        // Payment methods
        ProfileOptionItem(
            icon = Icons.Default.Payment,
            title = "Formas de pagamento",
            subtitle = "Gerenciar métodos de pagamento",
            onClick = onPaymentMethods
        )
        
        // Notifications
        ProfileOptionItem(
            icon = Icons.Default.Notifications,
            title = "Notificações",
            subtitle = "Configurar notificações",
            onClick = onNotifications
        )
        
        // Help
        ProfileOptionItem(
            icon = Icons.Default.Help,
            title = "Ajuda",
            subtitle = "Central de ajuda e suporte",
            onClick = onHelp
        )
        
        // About
        ProfileOptionItem(
            icon = Icons.Default.Info,
            title = "Sobre",
            subtitle = "Informações do aplicativo",
            onClick = onAbout
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Logout
        ProfileOptionItem(
            icon = Icons.Default.Logout,
            title = "Sair",
            subtitle = "Fazer logout da conta",
            onClick = onLogout,
            textColor = Color.Red
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileOptionItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    textColor: Color = Color.Black,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = textColor,
                modifier = Modifier.size(24.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = textColor
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
            
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Color.Gray,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
