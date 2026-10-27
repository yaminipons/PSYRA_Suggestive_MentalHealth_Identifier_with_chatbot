"""
Pydantic schemas for the Grok-powered PSYRA AI companion chat.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1500)
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    share_emotion_context: bool = False
    current_emotion_category: Optional[str] = None  # Happy, Neutral, Stressed, Low


class ChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str] = Field(default_factory=list)
    crisis_triggered: bool = False
    crisis_resources: Optional[str] = None
