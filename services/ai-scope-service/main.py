# services/ai-scope-service/main.py
# FastAPI entry point for the AI job-scoping microservice

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from estimator import estimate_scope
from models import HealthResponse, ScopeEstimate, ScopeRequest

logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Scope Service starting — model: %s", settings.model)
    yield
    logger.info("AI Scope Service shutting down")


app = FastAPI(
    title="Shram Sangam — AI Scope Service",
    description=(
        "Multimodal job-scoping microservice. "
        "Takes a text description (and optional photo) of a household issue "
        "and returns a fair, transparent pricing estimate."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s: %s", request.url, exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["ops"])
async def health():
    """Liveness probe — also reports whether vision model is configured."""
    return HealthResponse(
        status="ok",
        model=settings.model,
        vision_enabled=bool(settings.openai_api_key),
    )


@app.post(
    "/scope",
    response_model=ScopeEstimate,
    summary="Estimate job scope and fair price",
    tags=["scope"],
)
async def scope_job(body: ScopeRequest) -> ScopeEstimate:
    """
    Analyse a household repair request and return:
    - Estimated hours
    - Difficulty tier (Standard / Complex / Emergency)
    - Parts estimate in INR
    - Recommended base price (labour + parts, with cooperative price floor)
    - Confidence score

    Accepts an optional base64-encoded photo for vision-based analysis.
    """
    logger.info(
        "Scope request — category=%s, has_image=%s, desc_len=%d",
        body.service_category,
        bool(body.image_base64),
        len(body.description),
    )

    try:
        estimate = await estimate_scope(
            description=body.description,
            image_base64=body.image_base64,
            service_category=body.service_category,
        )
    except Exception as exc:
        logger.error("Estimator raised: %s", exc)
        raise HTTPException(status_code=500, detail="Estimation failed") from exc

    logger.info(
        "Scope result — tier=%s, hours=%.1f, price=%.0f INR, confidence=%.2f",
        estimate.difficulty_tier,
        estimate.standard_hours,
        estimate.recommended_base_price,
        estimate.confidence_score,
    )
    return estimate


@app.post(
    "/scope/batch",
    response_model=list[ScopeEstimate],
    summary="Batch scope multiple requests (no images)",
    tags=["scope"],
)
async def scope_batch(requests: list[ScopeRequest]) -> list[ScopeEstimate]:
    """Batch endpoint — useful for seeding demo data. Max 10 requests."""
    if len(requests) > 10:
        raise HTTPException(status_code=422, detail="Max 10 requests per batch")

    import asyncio
    results = await asyncio.gather(
        *[
            estimate_scope(
                description=r.description,
                image_base64=r.image_base64,
                service_category=r.service_category,
            )
            for r in requests
        ]
    )
    return list(results)
