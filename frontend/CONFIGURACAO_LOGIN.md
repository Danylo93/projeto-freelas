# Configuração do Login - ServiçoApp

## Problemas Corrigidos

### 1. Erros 403 (Forbidden) no Login
- ✅ **Headers de autenticação centralizados**: Criada função `getAuthHeaders()` no AuthContext
- ✅ **Tratamento de erros melhorado**: Mensagens específicas para cada tipo de erro
- ✅ **Interceptor global**: Axios agora trata erros de autenticação automaticamente
- ✅ **Logout automático**: Usuário é deslogado quando token expira

### 2. Configuração da API
- ✅ **Arquivo .env criado**: Configuração das URLs da API
- ✅ **API Gateway**: Todas as requisições passam pelo gateway centralizado
- ✅ **URLs padronizadas**: `/api/auth`, `/api/providers`, `/api/requests`, etc.

## Como Testar

### 1. Verificar se o Backend está rodando
```bash
cd api-v2
docker-compose up --build
```

### 2. Verificar se o ngrok está ativo
```bash
ngrok http 8000
```
Copie a URL do ngrok (ex: `https://abc123.ngrok.io`)

### 3. Atualizar o arquivo .env
Edite o arquivo `frontend/.env` e substitua a URL:
```env
EXPO_PUBLIC_API_URL=https://sua-url-ngrok.ngrok.io
EXPO_PUBLIC_SOCKET_URL=https://sua-url-ngrok.ngrok.io
```

### 4. Reiniciar o Frontend
```bash
cd frontend
npx expo start --clear
```

## Funcionalidades Testadas

### Login do Cliente
- ✅ Login com email/senha
- ✅ Registro de novo cliente
- ✅ Redirecionamento automático baseado no tipo de usuário
- ✅ Tratamento de erros 403/401/404
- ✅ Logout automático em caso de token inválido

### Login do Prestador
- ✅ Login com email/senha
- ✅ Registro de novo prestador
- ✅ Criação automática de perfil básico
- ✅ Tratamento de erros de autenticação
- ✅ Atualização de localização

### Melhorias Implementadas

1. **Headers consistentes**: Todas as requisições usam `getAuthHeaders()`
2. **Tratamento de erros específico**: Mensagens claras para cada tipo de erro
3. **Logout automático**: Quando token expira ou acesso é negado
4. **Configuração centralizada**: URLs da API em arquivo .env
5. **Interceptor global**: Tratamento automático de erros de autenticação

## Troubleshooting

### Erro 403 ainda aparece?
1. Verifique se o backend está rodando
2. Verifique se o ngrok está ativo
3. Verifique se a URL no .env está correta
4. Limpe o cache do Expo: `npx expo start --clear`

### Erro de conexão?
1. Verifique sua internet
2. Verifique se o ngrok não expirou
3. Verifique se o backend está acessível

### Token inválido?
1. Faça logout e login novamente
2. Verifique se o backend está gerando tokens válidos
3. Verifique se o JWT_SECRET está configurado

## URLs da API

- **Gateway**: `https://sua-url.ngrok.io`
- **Autenticação**: `https://sua-url.ngrok.io/api/auth`
- **Prestadores**: `https://sua-url.ngrok.io/api/providers`
- **Solicitações**: `https://sua-url.ngrok.io/api/requests`
- **Health Check**: `https://sua-url.ngrok.io/healthz`
