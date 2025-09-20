# 🔥 Configuração Firebase Atualizada

## Configurações Reais do Firebase

### Frontend (app.json)
```json
{
  "extra": {
    "firebaseApiKey": "AIzaSyC7XUJDG7PXB3YUiSyh0WMbbqeiR81zNlg",
    "firebaseAuthDomain": "uber-like-freelas.firebaseapp.com",
    "firebaseDatabaseURL": "https://uber-like-freelas-default-rtdb.firebaseio.com",
    "firebaseProjectId": "uber-like-freelas",
    "firebaseStorageBucket": "uber-like-freelas.firebasestorage.app",
    "firebaseMessagingSenderId": "901683796826",
    "firebaseAppId": "1:901683796826:web:6db0585afabdf5e8383163",
    "firebaseMeasurementId": "G-04R96TSGKK"
  }
}
```

### Backend (.env)
```env
# Firebase Configuration
FIREBASE_DATABASE_URL=https://uber-like-freelas-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=uber-like-freelas
FIREBASE_CREDENTIALS_PATH=/app/credentials/firebase-service-account.json

# Alternative: Use environment variables for credentials
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

## Próximos Passos

1. **Configurar Regras de Segurança no Firebase Console**
2. **Baixar arquivo de credenciais do Firebase**
3. **Configurar variáveis de ambiente no backend**
4. **Testar conexão com Firebase**

## Regras de Segurança Firebase

```json
{
  "rules": {
    "requests": {
      "$requestId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "providerLocations": {
      "$providerId": {
        ".read": "auth != null",
        ".write": "auth != null && $providerId == auth.uid"
      }
    },
    "offers": {
      "$providerId": {
        "$requestId": {
          ".read": "auth != null",
          ".write": "auth != null && ($providerId == auth.uid || root.child('requests').child($requestId).child('clientId').val() == auth.uid)"
        }
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && $userId == auth.uid"
      }
    }
  }
}
```
