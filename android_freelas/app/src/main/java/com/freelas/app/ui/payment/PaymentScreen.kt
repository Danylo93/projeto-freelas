package com.freelas.app.ui.payment

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.freelas.app.data.model.*
import java.text.NumberFormat
import java.util.*

/**
 * Tela de pagamento para processar o pagamento do serviço
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    service: Service,
    onPaymentSuccess: (Payment) -> Unit,
    onPaymentCancelled: () -> Unit,
    viewModel: PaymentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val paymentMethods by viewModel.paymentMethods.collectAsState()
    
    // Efeito para processar pagamento quando iniciado
    LaunchedEffect(uiState.isProcessingPayment) {
        if (uiState.isProcessingPayment && uiState.selectedPaymentMethod != null) {
            viewModel.processPayment(service)
        }
    }
    
    // Efeito para lidar com resultado do pagamento
    LaunchedEffect(uiState.paymentResult) {
        uiState.paymentResult?.let { result ->
            if (result.status == PaymentStatus.COMPLETED) {
                onPaymentSuccess(result)
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        PaymentHeader(
            service = service,
            onBackClick = onPaymentCancelled
        )
        
        // Conteúdo principal
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Resumo do serviço
            item {
                ServiceSummaryCard(service = service)
            }
            
            // Métodos de pagamento
            item {
                PaymentMethodsSection(
                    paymentMethods = paymentMethods,
                    selectedMethod = uiState.selectedPaymentMethod,
                    onMethodSelected = viewModel::selectPaymentMethod
                )
            }
            
            // Detalhes do pagamento
            item {
                PaymentDetailsCard(
                    service = service,
                    selectedMethod = uiState.selectedPaymentMethod
                )
            }
            
            // Botão de pagamento
            item {
                PaymentButton(
                    isEnabled = uiState.selectedPaymentMethod != null && !uiState.isProcessingPayment,
                    isLoading = uiState.isProcessingPayment,
                    onPaymentClick = { viewModel.startPayment() }
                )
            }
        }
    }
    
    // Dialog de processamento
    if (uiState.isProcessingPayment) {
        ProcessingPaymentDialog()
    }
    
    // Dialog de erro com animação
    uiState.errorMessage?.let { error ->
        LaunchedEffect(error) {
            // Auto-dismiss após 5 segundos
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
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Erro no Pagamento",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
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
 * Header da tela de pagamento
 */
@Composable
private fun PaymentHeader(
    service: Service,
    onBackClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.primary)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBackClick) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "Voltar",
                tint = MaterialTheme.colorScheme.onPrimary
            )
        }
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Column {
            Text(
                text = "Pagamento",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Confirme o pagamento para iniciar a corrida",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
            )
        }
    }
}

/**
 * Card com resumo do serviço
 */
@Composable
private fun ServiceSummaryCard(service: Service) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Resumo do Serviço",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Origem:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Text(
                    text = service.location.address,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Destino:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Text(
                    text = service.destination?.address ?: "Não especificado",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Tipo:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Text(
                    text = service.category.displayName,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

/**
 * Seção de métodos de pagamento
 */
@Composable
private fun PaymentMethodsSection(
    paymentMethods: List<PaymentMethod>,
    selectedMethod: PaymentMethod?,
    onMethodSelected: (PaymentMethod) -> Unit
) {
    Column {
        Text(
            text = "Método de Pagamento",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        paymentMethods.forEach { method ->
            PaymentMethodCard(
                method = method,
                isSelected = selectedMethod?.id == method.id,
                onClick = { onMethodSelected(method) }
            )
            
            if (method != paymentMethods.last()) {
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

/**
 * Card de método de pagamento com animações
 */
@Composable
private fun PaymentMethodCard(
    method: PaymentMethod,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val animatedScale by animateFloatAsState(
        targetValue = if (isSelected) 1.02f else 1f,
        animationSpec = tween(200),
        label = "card_scale"
    )
    
    val animatedElevation by animateDpAsState(
        targetValue = if (isSelected) 8.dp else 2.dp,
        animationSpec = tween(200),
        label = "card_elevation"
    )
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .scale(animatedScale)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = animatedElevation),
        border = if (isSelected) {
            androidx.compose.foundation.BorderStroke(
                2.dp,
                MaterialTheme.colorScheme.primary
            )
        } else null
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = getPaymentMethodIcon(method.type),
                contentDescription = method.name,
                tint = if (isSelected) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurface
                }
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = method.name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                
                Text(
                    text = method.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            
            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Selecionado",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

/**
 * Card com detalhes do pagamento
 */
@Composable
private fun PaymentDetailsCard(
    service: Service,
    selectedMethod: PaymentMethod?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Detalhes do Pagamento",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Valor do serviço:",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
                        .format(service.price),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Taxa de serviço:",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
                        .format(service.price * 0.1), // 10% de taxa
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            Divider(modifier = Modifier.padding(vertical = 8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Total:",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
                        .format(service.price * 1.1), // Preço + 10% de taxa
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            selectedMethod?.let { method ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Método: ${method.name}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }
    }
}

/**
 * Botão de pagamento com animações
 */
@Composable
private fun PaymentButton(
    isEnabled: Boolean,
    isLoading: Boolean,
    onPaymentClick: () -> Unit
) {
    val animatedScale by animateFloatAsState(
        targetValue = if (isEnabled && !isLoading) 1f else 0.95f,
        animationSpec = tween(200),
        label = "button_scale"
    )
    
    val animatedAlpha by animateFloatAsState(
        targetValue = if (isEnabled) 1f else 0.6f,
        animationSpec = tween(200),
        label = "button_alpha"
    )
    
    Button(
        onClick = onPaymentClick,
        enabled = isEnabled,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .scale(animatedScale)
            .alpha(animatedAlpha),
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary,
            disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
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
            Text(
                text = "Processando...",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )
        } else {
            Icon(
                imageVector = Icons.Default.Payment,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Confirmar Pagamento",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Dialog de processamento de pagamento com animações
 */
@Composable
private fun ProcessingPaymentDialog() {
    val infiniteTransition = rememberInfiniteTransition(label = "payment_processing")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )
    
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    AlertDialog(
        onDismissRequest = { },
        title = {
            Text(
                text = "Processando Pagamento",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier.size(64.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .size(48.dp)
                            .scale(scale),
                        strokeWidth = 4.dp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    Icon(
                        imageVector = Icons.Default.Payment,
                        contentDescription = null,
                        modifier = Modifier
                            .size(24.dp)
                            .scale(scale),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Aguarde enquanto processamos seu pagamento...",
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Isso pode levar alguns segundos",
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
        },
        confirmButton = { },
        dismissButton = { },
        containerColor = MaterialTheme.colorScheme.surface,
        titleContentColor = MaterialTheme.colorScheme.onSurface,
        textContentColor = MaterialTheme.colorScheme.onSurface
    )
}

/**
 * Obtém o ícone do método de pagamento
 */
private fun getPaymentMethodIcon(type: PaymentMethodType): ImageVector {
    return when (type) {
        PaymentMethodType.CREDIT_CARD -> Icons.Default.CreditCard
        PaymentMethodType.DEBIT_CARD -> Icons.Default.CreditCard
        PaymentMethodType.PIX -> Icons.Default.QrCode
        PaymentMethodType.CASH -> Icons.Default.AttachMoney
        PaymentMethodType.DIGITAL_WALLET -> Icons.Default.AccountBalanceWallet
    }
}