package com.freelas.app.ui.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.freelas.app.data.model.*
import com.freelas.app.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel para gerenciar o estado da tela de pagamento
 */
@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(PaymentUiState())
    val uiState: StateFlow<PaymentUiState> = _uiState.asStateFlow()
    
    private val _paymentMethods = MutableStateFlow<List<PaymentMethod>>(emptyList())
    val paymentMethods: StateFlow<List<PaymentMethod>> = _paymentMethods.asStateFlow()
    
    init {
        loadPaymentMethods()
    }
    
    /**
     * Carrega os métodos de pagamento disponíveis
     */
    private fun loadPaymentMethods() {
        val methods = paymentRepository.getAvailablePaymentMethods()
        _paymentMethods.value = methods
        
        // Selecionar método padrão
        val defaultMethod = paymentRepository.getDefaultPaymentMethod()
        if (defaultMethod != null) {
            _uiState.value = _uiState.value.copy(selectedPaymentMethod = defaultMethod)
        }
    }
    
    /**
     * Seleciona um método de pagamento
     */
    fun selectPaymentMethod(method: PaymentMethod) {
        _uiState.value = _uiState.value.copy(
            selectedPaymentMethod = method,
            errorMessage = null
        )
    }
    
    /**
     * Inicia o processo de pagamento
     */
    fun startPayment() {
        val selectedMethod = _uiState.value.selectedPaymentMethod
        if (selectedMethod == null) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Selecione um método de pagamento"
            )
            return
        }
        
        _uiState.value = _uiState.value.copy(
            isProcessingPayment = true,
            errorMessage = null
        )
    }
    
    /**
     * Processa o pagamento do serviço
     */
    fun processPayment(service: Service) {
        val selectedMethod = _uiState.value.selectedPaymentMethod ?: return
        
        println("PaymentViewModel: Iniciando processamento do pagamento para serviço ${service.id}")
        
        viewModelScope.launch {
            try {
                val amount = service.price * 1.1 // Preço + 10% de taxa
                
                println("PaymentViewModel: Chamando repository com amount: $amount")
                
                val payment = paymentRepository.processPaymentSync(
                    serviceId = service.id,
                    amount = amount,
                    paymentMethodId = selectedMethod.id
                )
                
                println("PaymentViewModel: Recebido resultado do pagamento: ${payment.status}")
                
                when (payment.status) {
                    PaymentStatus.COMPLETED -> {
                        _uiState.value = _uiState.value.copy(
                            isProcessingPayment = false,
                            paymentResult = payment,
                            errorMessage = null
                        )
                    }
                    PaymentStatus.FAILED -> {
                        _uiState.value = _uiState.value.copy(
                            isProcessingPayment = false,
                            errorMessage = "Falha no processamento do pagamento. Tente novamente."
                        )
                    }
                    else -> {
                        // Continuar processando
                    }
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isProcessingPayment = false,
                    errorMessage = "Erro ao processar pagamento: ${e.message}"
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
     * Reseta o estado do pagamento
     */
    fun resetPaymentState() {
        _uiState.value = PaymentUiState(
            selectedPaymentMethod = _uiState.value.selectedPaymentMethod
        )
    }
}

/**
 * Estado da UI da tela de pagamento
 */
data class PaymentUiState(
    val selectedPaymentMethod: PaymentMethod? = null,
    val isProcessingPayment: Boolean = false,
    val paymentResult: Payment? = null,
    val errorMessage: String? = null
)