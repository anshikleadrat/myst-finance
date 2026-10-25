import logging
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import get_settings
from app.db import engine
from app.lenders import get_lenders
from app.routers import applications, auth, lenders, payments, support

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
# Server-to-server endpoints that are authenticated by signature, not by cookie.
CSRF_EXEMPT_PATHS = {"/api/payments/webhook"}


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("level=%(levelname)s logger=%(name)s %(message)s"))
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level)


class CrossSiteRequestGuard(BaseHTTPMiddleware):
    """Reject state-changing requests coming from other sites (CSRF defence in depth on top of
    SameSite=Lax cookies). Requests without browser headers (SSR server, curl) carry no ambient
    cookies from a victim's browser, so they are allowed."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method in UNSAFE_METHODS and request.url.path not in CSRF_EXEMPT_PATHS:
            origin = request.headers.get("origin")
            fetch_site = request.headers.get("sec-fetch-site")
            if fetch_site == "cross-site" or (origin and origin.rstrip("/") not in get_settings().allowed_origins):
                return JSONResponse({"detail": "cross_site_request_rejected"}, status_code=403)
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    log = logging.getLogger("app")
    lenders_loaded = len(get_lenders())  # fail fast on an invalid seed file
    log.info(
        "startup environment=%s lenders=%d mail_backend=%s payment_provider=%s",
        settings.environment,
        lenders_loaded,
        settings.mail_backend,
        settings.payment_provider,
    )
    yield
    await engine.dispose()
    log.info("shutdown complete")


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(
        title="MYST Finance API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None if settings.is_production else "/api/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/api/openapi.json",
    )
    app.add_middleware(CrossSiteRequestGuard)
    for router in (auth.router, applications.router, payments.router, lenders.router, support.router):
        app.include_router(router)

    @app.get("/api/health", tags=["health"])
    async def health() -> dict[str, str]:
        async with engine.connect() as connection:
            await connection.execute(text("select 1"))
        return {"status": "ok"}

    return app


app = create_app()
