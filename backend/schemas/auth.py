"""
Pydantic schemas for authentication and user accounts.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=50, description="User friendly display name")
    email: EmailStr = Field(..., description="Valid user email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (at least 8 characters)")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="Password confirmation")


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    display_name: str
    email: EmailStr
    created_at: str
    preferred_theme: Optional[str] = "light"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
