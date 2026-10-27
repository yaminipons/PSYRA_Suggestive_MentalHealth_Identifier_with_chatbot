"""
Profile and settings router for PSYRA:
- GET /api/profile
- PUT /api/profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from backend.schemas.profile import ProfileUpdateRequest, ProfileResponse
from backend.services.auth_service import get_current_user
from backend.database import db_manager

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_doc = None

    if db_manager.is_connected and db_manager.db:
        user_doc = await db_manager.db.users.find_one({"_id": user_id})
        assess_count = await db_manager.db.assessments.count_documents({"user_id": user_id})
        journal_count = await db_manager.db.journals.count_documents({"user_id": user_id})
    else:
        user_doc = db_manager._memory_users.get(user_id, {})
        assess_count = len([a for a in db_manager._memory_assessments if a.get("user_id") == user_id])
        journal_count = len([j for j in db_manager._memory_journals if j.get("user_id") == user_id])

    return ProfileResponse(
        id=user_id,
        display_name=user_doc.get("display_name", current_user.get("display_name", "Friend")),
        email=user_doc.get("email", current_user.get("email")),
        preferred_theme=user_doc.get("preferred_theme", "light"),
        daily_reminder_enabled=user_doc.get("daily_reminder_enabled", False),
        preferred_activity=user_doc.get("preferred_activity"),
        created_at=user_doc.get("created_at", "Recently"),
        assessment_count=assess_count,
        journal_count=journal_count
    )


@router.put("", response_model=ProfileResponse)
async def update_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    updates = {}
    if req.display_name:
        updates["display_name"] = req.display_name.strip()
    if req.preferred_theme:
        updates["preferred_theme"] = req.preferred_theme
    if req.daily_reminder_enabled is not None:
        updates["daily_reminder_enabled"] = req.daily_reminder_enabled
    if req.preferred_activity is not None:
        updates["preferred_activity"] = req.preferred_activity

    if db_manager.is_connected and db_manager.db:
        await db_manager.db.users.update_one({"_id": user_id}, {"$set": updates})
    else:
        if user_id in db_manager._memory_users:
            db_manager._memory_users[user_id].update(updates)

    return await get_profile(current_user)
