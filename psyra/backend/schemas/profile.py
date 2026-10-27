"""
Pydantic schemas for user profile and preferences.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=50)
    preferred_theme: Optional[str] = Field("light", pattern="^(light|dark)$")
    daily_reminder_enabled: Optional[bool] = False
    preferred_activity: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    display_name: str
    email: EmailStr
    preferred_theme: str
    daily_reminder_enabled: bool
    preferred_activity: Optional[str] = None
    created_at: str
    assessment_count: int
    journal_count: int
