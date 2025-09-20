import os
from dotenv import load_dotenv

load_dotenv()

# Firebase Configuration
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "https://uber-like-freelas-default-rtdb.firebaseio.com")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")

# Alternative: Use environment variables for credentials
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
FIREBASE_PRIVATE_KEY_ID = os.getenv("FIREBASE_PRIVATE_KEY_ID")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL")
FIREBASE_CLIENT_ID = os.getenv("FIREBASE_CLIENT_ID")
FIREBASE_AUTH_URI = os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth")
FIREBASE_TOKEN_URI = os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token")

def get_firebase_credentials():
    """Retorna as credenciais do Firebase baseado na configuração disponível"""
    if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
        # Usar arquivo de credenciais
        return FIREBASE_CREDENTIALS_PATH
    elif all([FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL]):
        # Usar variáveis de ambiente
        return {
            "type": "service_account",
            "project_id": FIREBASE_PROJECT_ID,
            "private_key_id": FIREBASE_PRIVATE_KEY_ID,
            "private_key": FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
            "client_email": FIREBASE_CLIENT_EMAIL,
            "client_id": FIREBASE_CLIENT_ID,
            "auth_uri": FIREBASE_AUTH_URI,
            "token_uri": FIREBASE_TOKEN_URI,
        }
    else:
        # Usar credenciais padrão (Application Default Credentials)
        return None
