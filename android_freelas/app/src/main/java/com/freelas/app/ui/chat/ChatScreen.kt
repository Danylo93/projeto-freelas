package com.freelas.app.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.data.model.ChatMessage
import com.freelas.app.data.model.UserType
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    serviceId: String,
    otherUserId: String,
    userType: UserType,
    onBack: () -> Unit,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()
    
    LaunchedEffect(serviceId) {
        viewModel.loadChatMessages(serviceId)
    }
    
    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size - 1)
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // Top bar
        TopAppBar(
            title = { 
                Text(
                    text = if (userType == UserType.CLIENT) "Motorista" else "Cliente",
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
        
        // Messages list
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            items(uiState.messages) { message ->
                MessageBubble(
                    message = message,
                    isFromCurrentUser = message.senderId == uiState.currentUserId,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
        
        // Message input
        MessageInput(
            onSendMessage = { text ->
                viewModel.sendMessage(serviceId, text)
            },
            modifier = Modifier.padding(16.dp)
        )
    }
}

@Composable
fun MessageBubble(
    message: ChatMessage,
    isFromCurrentUser: Boolean,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = if (isFromCurrentUser) {
            Arrangement.End
        } else {
            Arrangement.Start
        }
    ) {
        if (!isFromCurrentUser) {
            // Avatar for other user
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(
                        Color.Gray,
                        RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }
        
        Column(
            horizontalAlignment = if (isFromCurrentUser) {
                Alignment.End
            } else {
                Alignment.Start
            }
        ) {
            Card(
                modifier = Modifier.widthIn(max = 280.dp),
                shape = RoundedCornerShape(
                    topStart = 16.dp,
                    topEnd = 16.dp,
                    bottomStart = if (isFromCurrentUser) 16.dp else 4.dp,
                    bottomEnd = if (isFromCurrentUser) 4.dp else 16.dp
                ),
                colors = CardDefaults.cardColors(
                    containerColor = if (isFromCurrentUser) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        Color(0xFFF5F5F5)
                    }
                )
            ) {
                Text(
                    text = message.content,
                    modifier = Modifier.padding(12.dp),
                    color = if (isFromCurrentUser) Color.White else Color.Black,
                    fontSize = 14.sp
                )
            }
            
            Text(
                text = formatMessageTime(message.timestamp),
                fontSize = 10.sp,
                color = Color.Gray,
                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
            )
        }
        
        if (isFromCurrentUser) {
            Spacer(modifier = Modifier.width(8.dp))
            // Avatar for current user
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(
                        MaterialTheme.colorScheme.primary,
                        RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun MessageInput(
    onSendMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var messageText by remember { mutableStateOf("") }
    
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.Bottom
    ) {
        OutlinedTextField(
            value = messageText,
            onValueChange = { messageText = it },
            placeholder = { Text("Digite sua mensagem...") },
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(24.dp)),
            maxLines = 3,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = Color.Gray
            )
        )
        
        Spacer(modifier = Modifier.width(8.dp))
        
        FloatingActionButton(
            onClick = {
                if (messageText.isNotBlank()) {
                    onSendMessage(messageText.trim())
                    messageText = ""
                }
            },
            modifier = Modifier.size(48.dp),
            containerColor = MaterialTheme.colorScheme.primary
        ) {
            Icon(
                Icons.Default.Send,
                contentDescription = "Enviar mensagem",
                tint = Color.White
            )
        }
    }
}

private fun formatMessageTime(timestamp: Long): String {
    val date = Date(timestamp)
    val now = Date()
    val diff = now.time - date.time
    
    return when {
        diff < 60000 -> "Agora" // Less than 1 minute
        diff < 3600000 -> "${diff / 60000}min" // Less than 1 hour
        diff < 86400000 -> SimpleDateFormat("HH:mm", Locale.getDefault()).format(date) // Same day
        else -> SimpleDateFormat("dd/MM HH:mm", Locale.getDefault()).format(date) // Different day
    }
}



