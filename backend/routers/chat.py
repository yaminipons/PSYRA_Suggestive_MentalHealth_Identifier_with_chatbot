"""
Chat router for PSYRA AI Companion:
- POST /api/chat (interact with Grok xAI companion)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.services.grok_service import call_grok_api
from backend.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/api/chat", tags=["AI Companion"])


@router.post("", response_model=ChatResponse)
async def chat_with_psyra(
    req: ChatRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    if not req.message or not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message cannot be empty."
        )

    response = await call_grok_api(
        message=req.message.strip(),
        history=req.history or [],
        share_emotion_context=req.share_emotion_context,
        current_emotion_category=req.current_emotion_category
    )

    return response
