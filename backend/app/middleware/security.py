from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
import re
from collections import defaultdict


class RateLimitMiddleware(BaseHTTPMiddleware):
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

        if len(self.requests[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
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
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store, max-age=0"
        return response


class SQLInjectionProtectionMiddleware(BaseHTTPMiddleware):
    SQL_PATTERNS = [
        r"'.*\sOR\s.*'", r"'.*\sAND\s.*'", r"--", r"\;", r"'\s*OR\s*'1'='1",
        r"'\s*OR\s*'1'='1'--", r"'\s*OR\s*'1'='1'#", r"'\s*OR\s*'1'='1'\s*--",
        r"'\s*OR\s*'1'='1'\s*#", r"'\s*OR\s*'1'='1'\s*;", r"'\s*OR\s*'1'='1'\s*",
        r"'\s*OR\s*''='", r"'\s*OR\s*'x'='x", r"'\s*OR\s*'x'='x'--",
        r"'\s*OR\s*'x'='x'#", r"'\s*OR\s*'x'='x'\s*--", r"'\s*OR\s*'x'='x'\s*#",
        r"\bUNION\b.*\bSELECT\b", r"\bSELECT\b.*\bFROM\b", r"\bDROP\b.*\bTABLE\b",
        r"\bDELETE\b.*\bFROM\b", r"\bINSERT\b.*\bINTO\b", r"\bUPDATE\b.*\bSET\b",
        r"\bALTER\b.*\bTABLE\b", r"\bCREATE\b.*\bTABLE\b", r"\bEXEC\b", r"\bEXECUTE\b",
    ]

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            body = await request.body()
            if body:
                body_str = body.decode("utf-8", errors="ignore")
                for pattern in self.SQL_PATTERNS:
                    if re.search(pattern, body_str, re.IGNORECASE):
                        return JSONResponse(
                            status_code=400,
                            content={"detail": "Invalid input detected"},
                        )
        response = await call_next(request)
        return response
