package com.freelas.app.ui.rating

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.data.model.*
import java.text.NumberFormat
import java.util.*

/**
 * Tela de avaliação do motorista após chegada ao destino
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RatingScreen(
    service: Service,
    onRatingCompleted: () -> Unit,
    onSkipRating: () -> Unit,
    viewModel: RatingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val categories by viewModel.categories.collectAsState()
    
    // Efeito para submeter avaliação
    LaunchedEffect(uiState.isSubmitting) {
        if (uiState.isSubmitting) {
            viewModel.submitRating(service)
        }
    }
    
    // Efeito para lidar com resultado da avaliação
    LaunchedEffect(uiState.ratingResult) {
        uiState.ratingResult?.let { result ->
            if (result.success) {
                // Pequeno delay para mostrar o sucesso
                kotlinx.coroutines.delay(1000)
                onRatingCompleted()
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        RatingHeader(
            service = service,
            onSkipClick = onSkipRating
        )
        
        // Conteúdo principal
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Informações do motorista
            item {
                DriverInfoCard(service = service)
            }
            
            // Avaliação por estrelas
            item {
                StarRatingSection(
                    rating = uiState.rating,
                    onRatingChange = viewModel::setRating
                )
            }
            
            // Categorias de avaliação (apenas se rating >= 3)
            if (uiState.rating >= 3) {
                item {
                    PositiveCategoriesSection(
                        categories = categories.filter { it.isPositive },
                        selectedCategories = uiState.selectedCategories,
                        onCategoryToggle = viewModel::toggleCategory
                    )
                }
            }
            
            // Categorias negativas (apenas se rating < 3)
            if (uiState.rating > 0 && uiState.rating < 3) {
                item {
                    NegativeCategoriesSection(
                        categories = categories.filter { !it.isPositive },
                        selectedCategories = uiState.selectedCategories,
                        onCategoryToggle = viewModel::toggleCategory
                    )
                }
            }
            
            // Comentário opcional
            if (uiState.rating > 0) {
                item {
                    CommentSection(
                        comment = uiState.comment,
                        onCommentChange = viewModel::setComment
                    )
                }
            }
            
            // Botão de envio
            item {
                SubmitRatingButton(
                    isEnabled = uiState.rating > 0 && !uiState.isSubmitting,
                    isLoading = uiState.isSubmitting,
                    onRatingClick = { viewModel.startSubmission() }
                )
            }
        }
    }
    
    // Dialog de processamento
    if (uiState.isSubmitting) {
        ProcessingRatingDialog()
    }
    
    // Dialog de sucesso
    uiState.ratingResult?.let { result ->
        if (result.success) {
            SuccessRatingDialog()
        }
    }
    
    // Dialog de erro
    uiState.errorMessage?.let { error ->
        LaunchedEffect(error) {
            kotlinx.coroutines.delay(5000)
            viewModel.clearError()
        }
        
        AnimatedVisibility(
            visible = error.isNotEmpty(),
            enter = slideInVertically() + fadeIn(),
            exit = slideOutVertically() + fadeOut()
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Error,
                        contentDescription = "Erro",
                        tint = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(
                        onClick = { viewModel.clearError() }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Fechar",
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }
    }
}

/**
 * Header da tela de avaliação
 */
@Composable
private fun RatingHeader(
    service: Service,
    onSkipClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.primary)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onSkipClick) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Pular",
                tint = MaterialTheme.colorScheme.onPrimary
            )
        }
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Column {
            Text(
                text = "Avalie sua corrida",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Como foi sua experiência?",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
            )
        }
    }
}

/**
 * Card com informações do motorista
 */
@Composable
private fun DriverInfoCard(service: Service) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar do motorista
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Motorista",
                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.size(30.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "João Silva",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Honda Civic • ABC-1234",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Text(
                    text = "Corrida finalizada",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            // Valor da corrida
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
                        .format(service.price * 1.1),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Total pago",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }
    }
}

/**
 * Seção de avaliação por estrelas
 */
@Composable
private fun StarRatingSection(
    rating: Int,
    onRatingChange: (Int) -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Como foi sua experiência?",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            for (i in 1..5) {
                StarButton(
                    starNumber = i,
                    isSelected = i <= rating,
                    onClick = { onRatingChange(i) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = when (rating) {
                1 -> "Muito ruim"
                2 -> "Ruim"
                3 -> "Regular"
                4 -> "Bom"
                5 -> "Excelente"
                else -> "Toque nas estrelas para avaliar"
            },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Botão de estrela individual
 */
@Composable
private fun StarButton(
    starNumber: Int,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val animatedScale by animateFloatAsState(
        targetValue = if (isSelected) 1.1f else 1f,
        animationSpec = tween(200),
        label = "star_scale"
    )
    
    IconButton(
        onClick = onClick,
        modifier = Modifier.scale(animatedScale)
    ) {
        Icon(
            imageVector = if (isSelected) Icons.Default.Star else Icons.Default.StarBorder,
            contentDescription = "Estrela $starNumber",
            tint = if (isSelected) {
                Color(0xFFFFD700) // Dourado
            } else {
                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
            },
            modifier = Modifier.size(48.dp)
        )
    }
}

/**
 * Seção de categorias positivas
 */
@Composable
private fun PositiveCategoriesSection(
    categories: List<RatingCategory>,
    selectedCategories: List<String>,
    onCategoryToggle: (String) -> Unit
) {
    Column {
        Text(
            text = "O que mais gostou?",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories) { category ->
                CategoryChip(
                    category = category,
                    isSelected = category.id in selectedCategories,
                    onClick = { onCategoryToggle(category.id) }
                )
            }
        }
    }
}

/**
 * Seção de categorias negativas
 */
@Composable
private fun NegativeCategoriesSection(
    categories: List<RatingCategory>,
    selectedCategories: List<String>,
    onCategoryToggle: (String) -> Unit
) {
    Column {
        Text(
            text = "O que pode melhorar?",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories) { category ->
                CategoryChip(
                    category = category,
                    isSelected = category.id in selectedCategories,
                    onClick = { onCategoryToggle(category.id) }
                )
            }
        }
    }
}

/**
 * Chip de categoria
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CategoryChip(
    category: RatingCategory,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val animatedScale by animateFloatAsState(
        targetValue = if (isSelected) 1.05f else 1f,
        animationSpec = tween(200),
        label = "chip_scale"
    )
    
    FilterChip(
        onClick = onClick,
        label = {
            Text(
                text = category.name,
                style = MaterialTheme.typography.bodySmall
            )
        },
        selected = isSelected,
        modifier = Modifier.scale(animatedScale),
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = if (category.isPositive) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.errorContainer
            },
            selectedLabelColor = if (category.isPositive) {
                MaterialTheme.colorScheme.onPrimaryContainer
            } else {
                MaterialTheme.colorScheme.onErrorContainer
            }
        )
    )
}

/**
 * Seção de comentário
 */
@Composable
private fun CommentSection(
    comment: String,
    onCommentChange: (String) -> Unit
) {
    Column {
        Text(
            text = "Comentário (opcional)",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        OutlinedTextField(
            value = comment,
            onValueChange = onCommentChange,
            placeholder = {
                Text("Conte-nos mais sobre sua experiência...")
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
            maxLines = 4,
            shape = RoundedCornerShape(12.dp)
        )
    }
}

/**
 * Botão de envio da avaliação
 */
@Composable
private fun SubmitRatingButton(
    isEnabled: Boolean,
    isLoading: Boolean,
    onRatingClick: () -> Unit
) {
    val animatedScale by animateFloatAsState(
        targetValue = if (isEnabled && !isLoading) 1f else 0.95f,
        animationSpec = tween(200),
        label = "button_scale"
    )
    
    Button(
        onClick = onRatingClick,
        enabled = isEnabled,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .scale(animatedScale),
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Enviando...")
        } else {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Enviar Avaliação",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Dialog de processamento da avaliação
 */
@Composable
private fun ProcessingRatingDialog() {
    val infiniteTransition = rememberInfiniteTransition(label = "rating_processing")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )
    
    AlertDialog(
        onDismissRequest = { },
        title = {
            Text("Enviando Avaliação")
        },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(48.dp),
                    strokeWidth = 4.dp,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Aguarde enquanto processamos sua avaliação...",
                    textAlign = TextAlign.Center
                )
            }
        },
        confirmButton = { },
        dismissButton = { }
    )
}

/**
 * Dialog de sucesso da avaliação
 */
@Composable
private fun SuccessRatingDialog() {
    val animatedScale by animateFloatAsState(
        targetValue = 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "success_scale"
    )
    
    AlertDialog(
        onDismissRequest = { },
        title = {
            Text(
                text = "Avaliação Enviada!",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier
                        .size(64.dp)
                        .scale(animatedScale),
                    tint = Color(0xFF4CAF50) // Verde
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Obrigado pela sua avaliação!",
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyLarge
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Voltando à tela inicial...",
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        },
        confirmButton = { },
        dismissButton = { }
    )
}
