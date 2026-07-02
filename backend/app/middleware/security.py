from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
import re
from collections import defaultdict


AUTOMATION_AGENTS = [
    r"curl",
    r"wget",
    r"python-requests",
    r"python-httpx",
    r"aiohttp",
    r"scrapy",
    r"bot",
    r"spider",
    r"crawler",
    r"scanner",
    r"nikto",
    r"sqlmap",
    r"nmap",
    r"gobuster",
    r"dirbuster",
    r"burp",
    r"postman",
    r"insomnia",
    r"httpie",
    r"java",
    r"libwww",
    r"perl",
    r"ruby",
]

SQL_PATTERNS = [
    r"'.*\sOR\s.*'", r"'.*\sAND\s.*'", r"'\s*OR\s*'1'='1",
    r"'\s*OR\s*''='", r"'\s*OR\s*'x'='x",
    r"\bUNION\b.*\bSELECT\b", r"\bSELECT\b.*\bFROM\b",
    r"\bDROP\b.*\bTABLE\b", r"\bDELETE\b.*\bFROM\b",
    r"\bINSERT\b.*\bINTO\b", r"\bUPDATE\b.*\bSET\b",
    r"\bALTER\b.*\bTABLE\b", r"\bCREATE\b.*\bTABLE\b",
    r"\bEXEC\b", r"\bEXECUTE\b", r"\bLOAD_FILE\b",
    r"\bINTO\s+OUTFILE\b", r"\bINTO\s+DUMPFILE\b",
    r"\bCHAR\s*\(", r"\bCONCAT\s*\(", r"\bWAITFOR\s+DELAY\b",
    r"\bSLEEP\s*\(", r"\bBENCHMARK\s*\(", r"--", r"#",
    r"\bPG_SLEEP\b",
]

XSS_PATTERNS = [
    r"<script[^>]*>", r"javascript\s*:", r"onerror\s*=",
    r"onload\s*=", r"onclick\s*=", r"onmouseover\s*=",
    r"<iframe", r"<embed", r"<object", r"<svg[^>]*>",
    r"alert\s*\(", r"prompt\s*\(", r"confirm\s*\(",
    r"document\.cookie", r"document\.location",
    r"<img[^>]+onerror", r"<body[^>]+onload",
    r"eval\s*\(", r"expression\s*\(",
]

MAX_BODY_SIZE = 1024 * 1024  # 1MB


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP rate limiting with stricter limits for auth endpoints."""

    def __init__(self, app: ASGIApp, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - self.window_seconds

        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > window_start
        ]

        limit = self.max_requests
        if request.url.path.startswith("/auth/"):
            limit = 10
        elif request.url.path.startswith("/admin/"):
            limit = 30

        if len(self.requests[client_ip]) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Try again later."},
            )

        self.requests[client_ip].append(now)
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cache-Control"] = "no-store, max-age=0"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https: wss:; "
            "frame-ancestors 'none'; "
            "form-action 'self'; "
            "base-uri 'self'; "
            "object-src 'none'"
        )
        return response


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Validates all input (body, query params, path params) for SQLi and XSS."""

    def _check_value(self, value: str) -> bool:
        for pattern in SQL_PATTERNS + XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    async def dispatch(self, request: Request, call_next):
        # Check body
        try:
            body = await request.body()
            if body and len(body) > MAX_BODY_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request too large"},
                )
            if body:
                body_str = body.decode("utf-8", errors="ignore")
                if self._check_value(body_str):
                    return JSONResponse(
                        status_code=400,
                        content={"detail": "Invalid input detected"},
                    )
        except Exception:
            pass

        # Check query params
        for key, values in request.query_params.multi_items():
            for val in [key] + [values]:
                if self._check_value(str(val)):
                    return JSONResponse(
                        status_code=400,
                        content={"detail": "Invalid input detected"},
                    )

        # Check path params
        for segment in request.url.path.split("/"):
            if self._check_value(segment):
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid input detected"},
                )

        response = await call_next(request)
        return response


class AutomationBlockerMiddleware(BaseHTTPMiddleware):
    """Blocks automated tools (curl, wget, sqlmap, etc.) from non-API routes."""

    async def dispatch(self, request: Request, call_next):
        user_agent = request.headers.get("user-agent", "").lower()

        # Allow API routes for any client
        if request.url.path.startswith(("/api/", "/auth/", "/ws/", "/docs", "/redoc", "/openapi")):
            return await call_next(request)

        # Check for automation tools
        for pattern in AUTOMATION_AGENTS:
            if re.search(pattern, user_agent, re.IGNORECASE):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access denied"},
                )

        response = await call_next(request)
        return response


class PathTraversalMiddleware(BaseHTTPMiddleware):
    """Blocks path traversal attempts."""

    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./", r"\.\.\\", r"\.\.%2f", r"\.\.%5c",
        r"%2e%2e%2f", r"%2e%2e%5c", r"\.\.%252f",
        r"\.\.%255c", r"~", r"\.\.",
    ]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        for pattern in self.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid path"},
                )
        response = await call_next(request)
        return response
