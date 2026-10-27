"""
Pydantic schemas for the personal journaling module.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class JournalCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    content: str = Field(..., min_length=1, max_length=10000)
    associated_emotion: Optional[str] = "Neutral"  # Happy, Neutral, Stressed, Low
    prompt_used: Optional[str] = None


class JournalUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    associated_emotion: Optional[str] = None


class JournalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    associated_emotion: str
    prompt_used: Optional[str] = None
    created_at: str
    updated_at: str


class JournalListResponse(BaseModel):
    total: int
    entries: List[JournalResponse]
