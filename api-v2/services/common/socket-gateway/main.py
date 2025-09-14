from fastapi import FastAPI
from fastapi.responses import JSONResponse
import os, traceback
from dotenv import load_dotenv
import httpx

load_dotenv()

PROVIDER_URL = os.getenv("PROVIDER_URL", "http://provider-service:8011").rstrip("/")
REQUEST_URL  = os.getenv("REQUEST_URL",  "http://request-service:8012").rstrip("/")
AUTH_URL     = os.getenv("AUTH_URL",     "http://auth-service:8014").rstrip("/")

app = FastAPI(title="socket-gateway")

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"gateway","upstreams":{
        "provider": PROVIDER_URL, "request": REQUEST_URL, "auth": AUTH_URL
    }}

@app.get("/api/providers")
async def list_providers():
    url = f"{PROVIDER_URL}/providers"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()
    except Exception as e:
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_failure",
                "target": url,
                "detail": str(e),
                "trace": traceback.format_exc().splitlines()[-5:],
            },
        )
