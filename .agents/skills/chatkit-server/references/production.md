# ChatKit Server — Production Hardening

Source: openai/chatkit-python (Context7, High reputation)

---

## Security Checklist

- [ ] Authenticate every request to `/chatkit`
- [ ] Authorize thread/item access per user (store methods filter by `user_id`)
- [ ] Protect `OPENAI_API_KEY` in environment variables / secret manager
- [ ] Never log full request bodies (may contain user messages)
- [ ] Validate tool inputs before calling downstream services
- [ ] Register your domain in OpenAI dashboard (domain allowlist)
- [ ] Enable CORS only for your frontend origin(s)
- [ ] Use HTTPS in production

---

## FastAPI Endpoint with Auth

### Pattern: JWT / Bearer Token

```python
from dataclasses import dataclass
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from chatkit.server import ChatKitServer, StreamingResult
import os, jwt   # pip install pyjwt

@dataclass
class RequestContext:
    user_id: str
    locale: str = "en"

def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth_header.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
        return payload["sub"]          # user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

app = FastAPI()

# CORS — restrict to your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

store = PostgresStore(os.environ["DATABASE_URL"])
server = MyChatKitServer(store=store)

@app.post("/chatkit")
async def chatkit_endpoint(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    context = RequestContext(user_id=user_id)
    result = await server.process(await request.body(), context)
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```

### Pattern: Better Auth JWT (project-specific)

```python
from better_auth.jwt import verify_session_token   # your project's auth

def get_current_user(request: Request) -> str:
    token = request.headers.get("x-session-token") or \
            request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    payload = verify_session_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid session")
    return payload["user_id"]
```

### Pattern: Custom Header (development only)

```python
def get_current_user(request: Request) -> str:
    user_id = request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing x-user-id header")
    return user_id
```

---

## Multi-Context (Rich RequestContext)

For multi-tenant or role-based access:

```python
@dataclass
class RequestContext:
    user_id: str
    org_id: str
    plan: str           # "free" | "pro" | "enterprise"
    locale: str = "en"

# Build from multiple headers:
context = RequestContext(
    user_id=request.headers.get("X-User-Id"),
    org_id=request.headers.get("X-Org-Id"),
    plan=request.headers.get("X-Plan", "free"),
    locale=request.headers.get("Accept-Language", "en"),
)
```

---

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-proj-...

# Database (for PostgreSQL store)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
JWT_SECRET=your-secret-key

# App
FRONTEND_URL=https://your-app.com
```

Load with python-dotenv:
```python
from dotenv import load_dotenv
load_dotenv()                    # loads .env file in development
import os
openai_key = os.environ["OPENAI_API_KEY"]
```

---

## Error Handling

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from chatkit.store import NotFoundError
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})

@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

---

## Health Check Endpoint

```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## Running in Production

```bash
# Install
pip install openai-chatkit openai-agents uvicorn gunicorn

# Run with uvicorn (single process)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run with gunicorn (multi-worker)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Note:** InMemoryStore is NOT compatible with multi-worker deployments. Use PostgreSQL store when running more than 1 worker.

---

## Domain Allowlist (OpenAI Dashboard)

The ChatKit frontend requires your domain to be registered:

1. Go to: https://platform.openai.com/settings/organization/security/domain-allowlist
2. Add your frontend domain (e.g., `https://your-app.com`)
3. Set `domainKey` in `useChatKit({ api: { domainKey: "..." } })` on the frontend

This is a **manual step** — not automatable.
