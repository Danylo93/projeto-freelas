# 🔐 Sistema de Login Mock - Funciona Offline

## ✅ **SISTEMA IMPLEMENTADO!**

O sistema de login agora funciona **100% OFFLINE** sem necessidade de API!

### 🛠️ **Como Funciona:**

**Sistema de Login Mock Baseado em Email:**
- ✅ **Qualquer email** que contenha "cliente" → Login como **CLIENTE**
- ✅ **Qualquer email** que contenha "prestador", "joao", "carlos", "maria", "pedro", "ana" → Login como **PRESTADOR**
- ✅ **Qualquer senha** é aceita (não há validação)
- ✅ **Registro** também funciona offline

### 📝 **Credenciais de Teste:**

#### 👤 **Para testar como CLIENTE:**
```
Email: cliente@teste.com
Senha: qualquer coisa
```

#### 👨‍🔧 **Para testar como PRESTADOR:**
```
Email: prestador@teste.com
Senha: qualquer coisa
```

#### 🔧 **Exemplos de emails que funcionam:**
- `cliente1@exemplo.com` → CLIENTE
- `cliente.teste@gmail.com` → CLIENTE
- `joao.encanador@exemplo.com` → PRESTADOR
- `carlos.eletricista@exemplo.com` → PRESTADOR
- `maria.pneus@exemplo.com` → PRESTADOR
- `prestador@teste.com` → PRESTADOR

### 🚀 **Como Testar:**

1. **Abra o app** no emulador
2. **Digite qualquer email** que contenha "cliente" ou "prestador"
3. **Digite qualquer senha** (ex: 123456)
4. **Clique em "Entrar"**
5. **O app irá navegar** para a tela correspondente ao tipo de usuário

### 📱 **Funcionalidades Disponíveis:**

#### **Como CLIENTE:**
- ✅ Tela de seleção de serviços
- ✅ Mapas interativos
- ✅ Solicitação de serviços
- ✅ Chat com prestadores
- ✅ Tracking de veículos
- ✅ Sistema de pagamentos

#### **Como PRESTADOR:**
- ✅ Tela do prestador
- ✅ Recebimento de solicitações
- ✅ Aceitar/recusar serviços
- ✅ Chat com clientes
- ✅ Tracking de veículos
- ✅ Sistema de ganhos

### 🔧 **Implementação Técnica:**

**AuthRepository.kt:**
```kotlin
private fun createMockUser(email: String, password: String): User? {
    return when {
        email.contains("cliente") -> {
            User(
                id = "mock_client_1",
                name = "Cliente Teste",
                email = email,
                userType = UserType.CLIENTE,
                // ... outros campos
            )
        }
        email.contains("prestador") || email.contains("joao") || 
        email.contains("carlos") || email.contains("maria") || 
        email.contains("pedro") || email.contains("ana") -> {
            User(
                id = "mock_provider_1",
                name = "Prestador Teste",
                email = email,
                userType = UserType.PRESTADOR,
                // ... outros campos
            )
        }
        else -> null
    }
}
```

### ⚠️ **Notas Importantes:**

1. **Não há validação de senha** - qualquer senha é aceita
2. **Dados são mock** - não são salvos em banco de dados real
3. **Funciona 100% offline** - não precisa de internet
4. **Tokens são mock** - gerados localmente
5. **Usuários são temporários** - resetam ao fechar o app

### 🎯 **Para Voltar ao Sistema Real:**

Quando quiser usar a API real, basta:
1. Remover o código mock do `AuthRepository`
2. Descomentar o código original da API
3. Configurar o backend corretamente

---

## 🎉 **AGORA É SÓ TESTAR!**

O app está **100% funcional** e você pode testar todas as funcionalidades sem precisar de API ou internet! 🚀

**Teste com:**
- Email: `cliente@teste.com` → Vai para tela de cliente
- Email: `prestador@teste.com` → Vai para tela de prestador
- Senha: `123456` (ou qualquer coisa)



