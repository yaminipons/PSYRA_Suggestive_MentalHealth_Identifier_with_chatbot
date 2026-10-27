"""
Main Application Entry Point for PSYRA (Psychological Relief Assistant)
Built with FastAPI, Pydantic, MongoDB Motor, and Grok (xAI) conversational integration.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from backend.config import settings
from backend.database import db_manager
from backend.routers import auth, assessment, chat, journal, profile, music

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("psyra.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} in {settings.ENVIRONMENT} mode...")
    await db_manager.connect()
    yield
    logger.info("Shutting down database connections...")
    await db_manager.disconnect()


app = FastAPI(
    title=settings.APP_NAME,
    description="The supportive mental-wellness chatbot and reflection suite that holds space for every emotion.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handler to ensure safe error responses without stack trace leaks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred while processing your request. Please try again in a moment.",
            "error_type": "InternalServerError"
        }
    )


# Mount API routers
app.include_router(auth.router)
app.include_router(assessment.router)
app.include_router(chat.router)
app.include_router(journal.router)
app.include_router(profile.router)
app.include_router(music.router)


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database_connected": db_manager.is_connected,
        "grok_configured": bool(settings.XAI_API_KEY)
    }


# Mount frontend static directory if exists
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
