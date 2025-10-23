package com.freelas.app.data.repository

import com.freelas.app.data.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repositório para gerenciar pagamentos
 */
@Singleton
class PaymentRepository @Inject constructor() {
    
    /**
     * Métodos de pagamento disponíveis para o usuário
     */
    private val availablePaymentMethods = listOf(
        PaymentMethod(
            id = "pix_001",
            type = PaymentMethodType.PIX,
            name = "PIX",
            description = "Pagamento instantâneo via PIX",
            isDefault = true,
            isEnabled = true,
            icon = "pix_icon"
        ),
        PaymentMethod(
            id = "credit_001",
            type = PaymentMethodType.CREDIT_CARD,
            name = "Cartão de Crédito",
            description = "**** **** **** 1234",
            isDefault = false,
            isEnabled = true,
            icon = "credit_card_icon"
        ),
        PaymentMethod(
            id = "debit_001",
            type = PaymentMethodType.DEBIT_CARD,
            name = "Cartão de Débito",
            description = "**** **** **** 5678",
            isDefault = false,
            isEnabled = true,
            icon = "debit_card_icon"
        ),
        PaymentMethod(
            id = "cash_001",
            type = PaymentMethodType.CASH,
            name = "Dinheiro",
            description = "Pagamento em dinheiro na entrega",
            isDefault = false,
            isEnabled = true,
            icon = "cash_icon"
        )
    )
    
    /**
     * Histórico de transações
     */
    private val transactionHistory = mutableListOf<Payment>()
    
    /**
     * Obtém os métodos de pagamento disponíveis
     */
    fun getAvailablePaymentMethods(): List<PaymentMethod> {
        return availablePaymentMethods.filter { it.isEnabled }
    }
    
    /**
     * Obtém o método de pagamento padrão
     */
    fun getDefaultPaymentMethod(): PaymentMethod? {
        return availablePaymentMethods.find { it.isDefault && it.isEnabled }
    }
    
    /**
     * Processa um pagamento de forma simulada
     */
    suspend fun processPaymentSync(serviceId: String, amount: Double, paymentMethodId: String): Payment {
        println("PaymentRepository: Iniciando processamento do pagamento")
        
        // Simular delay de processamento
        delay(500)
        
        val paymentMethod = availablePaymentMethods.find { it.id == paymentMethodId }
            ?: throw IllegalArgumentException("Método de pagamento não encontrado")
        
        println("PaymentRepository: Método de pagamento encontrado: ${paymentMethod.name}")
        
        // Simular diferentes cenários de pagamento
        val successRate = when (paymentMethod.type) {
            PaymentMethodType.PIX -> 0.95 // 95% de sucesso
            PaymentMethodType.CREDIT_CARD -> 0.90 // 90% de sucesso
            PaymentMethodType.DEBIT_CARD -> 0.85 // 85% de sucesso
            PaymentMethodType.CASH -> 1.0 // 100% de sucesso (pagamento na entrega)
            PaymentMethodType.DIGITAL_WALLET -> 0.92 // 92% de sucesso
        }
        
        val isSuccess = Math.random() < successRate
        
        println("PaymentRepository: Resultado do pagamento: ${if (isSuccess) "SUCESSO" else "FALHA"}")
        
        val payment = Payment(
            id = "payment_${System.currentTimeMillis()}",
            serviceId = serviceId,
            amount = amount,
            paymentMethod = paymentMethod,
            status = if (isSuccess) PaymentStatus.COMPLETED else PaymentStatus.FAILED,
            transactionId = if (isSuccess) "txn_${System.currentTimeMillis()}" else null,
            createdAt = System.currentTimeMillis(),
            processedAt = if (isSuccess) System.currentTimeMillis() else null
        )
        
        // Adicionar à lista de transações
        transactionHistory.add(payment)
        
        println("PaymentRepository: Retornando resultado do pagamento")
        return payment
    }
    
    /**
     * Processa um pagamento de forma simulada (versão Flow para compatibilidade)
     */
    fun processPayment(serviceId: String, amount: Double, paymentMethodId: String): Flow<Payment> = flow {
        val payment = processPaymentSync(serviceId, amount, paymentMethodId)
        emit(payment)
    }
    
    /**
     * Obtém o histórico de transações
     */
    fun getTransactionHistory(): List<Payment> {
        return transactionHistory.toList()
    }
    
    /**
     * Obtém uma transação específica
     */
    fun getTransaction(transactionId: String): Payment? {
        return transactionHistory.find { it.id == transactionId }
    }
    
    /**
     * Simula validação de cartão
     */
    fun validateCard(cardNumber: String, cvv: String, expiryDate: String): Boolean {
        // Simulação simples de validação
        return cardNumber.length >= 16 && 
               cvv.length >= 3 && 
               expiryDate.matches(Regex("\\d{2}/\\d{2}"))
    }
    
    /**
     * Simula processamento PIX
     */
    fun processPixPayment(serviceId: String, amount: Double): Flow<Payment> = flow {
        delay(300) // PIX é mais rápido
        
        val isSuccess = Math.random() < 0.98 // 98% de sucesso para PIX
        
        val payment = Payment(
            id = "pix_${System.currentTimeMillis()}",
            serviceId = serviceId,
            amount = amount,
            paymentMethod = availablePaymentMethods.find { it.type == PaymentMethodType.PIX }!!,
            status = if (isSuccess) PaymentStatus.COMPLETED else PaymentStatus.FAILED,
            transactionId = if (isSuccess) "pix_txn_${System.currentTimeMillis()}" else null,
            createdAt = System.currentTimeMillis(),
            processedAt = if (isSuccess) System.currentTimeMillis() else null
        )
        
        transactionHistory.add(payment)
        
        emit(payment)
    }
}