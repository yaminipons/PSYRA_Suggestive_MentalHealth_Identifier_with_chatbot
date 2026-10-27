"""
Authentication routes for PSYRA:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Response, Request
from backend.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse
)
from backend.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from backend.database import db_manager

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, response: Response):
    # Validation: Passwords match
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirmation do not match."
        )

    email_clean = req.email.strip().lower()

    # Check duplicate email
    if db_manager.is_connected and db_manager.db:
        existing = await db_manager.db.users.find_one({"email": email_clean})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )
    else:
        # In-memory check
        for u in db_manager._memory_users.values():
            if u["email"] == email_clean:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address already exists."
                )

    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    hashed = hash_password(req.password)

    user_doc = {
        "_id": user_id,
        "id": user_id,
        "display_name": req.display_name.strip(),
        "email": email_clean,
        "password_hash": hashed,
        "created_at": now_iso,
        "preferred_theme": "light",
        "daily_reminder_enabled": False,
        "preferred_activity": None
    }

    if db_manager.is_connected and db_manager.db:
        await db_manager.db.users.insert_one(user_doc)
    else:
        db_manager._memory_users[user_id] = user_doc

    # Create JWT
    token = create_access_token({"sub": user_id, "email": email_clean, "display_name": user_doc["display_name"]})

    # Set secure cookie
    response.set_cookie(
        key="psyra_session",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production HTTPS
        max_age=86400
    )

    user_res = UserResponse(
        id=user_id,
        display_name=user_doc["display_name"],
        email=email_clean,
        created_at=now_iso,
        preferred_theme="light"
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_res)


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest, response: Response):
    email_clean = req.email.strip().lower()
    user_doc = None

    if db_manager.is_connected and db_manager.db:
        user_doc = await db_manager.db.users.find_one({"email": email_clean})
    else:
        for u in db_manager._memory_users.values():
            if u["email"] == email_clean:
                user_doc = u
                break

    if not user_doc or not verify_password(req.password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please try again."
        )

    user_id = str(user_doc.get("id") or user_doc.get("_id"))
    token = create_access_token({"sub": user_id, "email": email_clean, "display_name": user_doc.get("display_name")})

    response.set_cookie(
        key="psyra_session",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400
    )

    user_res = UserResponse(
        id=user_id,
        display_name=user_doc.get("display_name", "Friend"),
        email=email_clean,
        created_at=user_doc.get("created_at", datetime.now(timezone.utc).isoformat()),
        preferred_theme=user_doc.get("preferred_theme", "light")
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_res)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="psyra_session")
    return {"message": "Successfully logged out of PSYRA session."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_doc = None

    if db_manager.is_connected and db_manager.db:
        user_doc = await db_manager.db.users.find_one({"_id": user_id})
    else:
        user_doc = db_manager._memory_users.get(user_id)

    if not user_doc:
        return UserResponse(
            id=user_id,
            display_name=current_user.get("display_name", "Friend"),
            email=current_user.get("email", "friend@example.com"),
            created_at=datetime.now(timezone.utc).isoformat(),
            preferred_theme="light"
        )

    return UserResponse(
        id=user_id,
        display_name=user_doc.get("display_name", "Friend"),
        email=user_doc.get("email"),
        created_at=user_doc.get("created_at", datetime.now(timezone.utc).isoformat()),
        preferred_theme=user_doc.get("preferred_theme", "light")
    )
