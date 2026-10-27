"""
Journal router for PSYRA:
- GET /api/journal (list user entries)
- POST /api/journal (create entry)
- PUT /api/journal/{entry_id} (update entry with ownership check)
- DELETE /api/journal/{entry_id} (delete entry with ownership check)
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.schemas.journal import (
    JournalCreateRequest,
    JournalUpdateRequest,
    JournalResponse,
    JournalListResponse
)
from backend.services.auth_service import get_current_user
from backend.database import db_manager

router = APIRouter(prefix="/api/journal", tags=["Journal"])


@router.get("", response_model=JournalListResponse)
async def list_journal_entries(
    date_filter: Optional[str] = Query(None, description="Filter by YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    entries = []

    if db_manager.is_connected and db_manager.db:
        query = {"user_id": user_id}
        cursor = db_manager.db.journals.find(query).sort("created_at", -1)
        async for item in cursor:
            item["id"] = str(item.get("_id", item.get("id")))
            # Apply date filter if provided
            if date_filter and not item.get("created_at", "").startswith(date_filter):
                continue
            entries.append(item)
    else:
        entries = [
            j for j in reversed(db_manager._memory_journals)
            if j.get("user_id") == user_id and (not date_filter or j.get("created_at", "").startswith(date_filter))
        ]

    formatted = [
        JournalResponse(
            id=e["id"],
            user_id=e["user_id"],
            title=e["title"],
            content=e["content"],
            associated_emotion=e.get("associated_emotion", "Neutral"),
            prompt_used=e.get("prompt_used"),
            created_at=e["created_at"],
            updated_at=e.get("updated_at", e["created_at"])
        )
        for e in entries
    ]

    return JournalListResponse(total=len(formatted), entries=formatted)


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    req: JournalCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    entry_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "_id": entry_id,
        "id": entry_id,
        "user_id": user_id,
        "title": req.title.strip(),
        "content": req.content.strip(),
        "associated_emotion": req.associated_emotion or "Neutral",
        "prompt_used": req.prompt_used,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    if db_manager.is_connected and db_manager.db:
        await db_manager.db.journals.insert_one(doc)
    else:
        db_manager._memory_journals.append(doc)

    return JournalResponse(
        id=entry_id,
        user_id=user_id,
        title=doc["title"],
        content=doc["content"],
        associated_emotion=doc["associated_emotion"],
        prompt_used=doc["prompt_used"],
        created_at=now_iso,
        updated_at=now_iso
    )


@router.put("/{entry_id}", response_model=JournalResponse)
async def update_journal_entry(
    entry_id: str,
    req: JournalUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    existing = None
    if db_manager.is_connected and db_manager.db:
        existing = await db_manager.db.journals.find_one({"_id": entry_id, "user_id": user_id})
    else:
        for j in db_manager._memory_journals:
            if j.get("id") == entry_id and j.get("user_id") == user_id:
                existing = j
                break

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found or you do not have permission to modify it."
        )

    updates = {"updated_at": now_iso}
    if req.title is not None:
        updates["title"] = req.title.strip()
    if req.content is not None:
        updates["content"] = req.content.strip()
    if req.associated_emotion is not None:
        updates["associated_emotion"] = req.associated_emotion

    if db_manager.is_connected and db_manager.db:
        await db_manager.db.journals.update_one({"_id": entry_id}, {"$set": updates})
        updated_doc = await db_manager.db.journals.find_one({"_id": entry_id})
    else:
        existing.update(updates)
        updated_doc = existing

    return JournalResponse(
        id=entry_id,
        user_id=user_id,
        title=updated_doc["title"],
        content=updated_doc["content"],
        associated_emotion=updated_doc.get("associated_emotion", "Neutral"),
        prompt_used=updated_doc.get("prompt_used"),
        created_at=updated_doc["created_at"],
        updated_at=updated_doc["updated_at"]
    )


@router.delete("/{entry_id}", status_code=status.HTTP_200_OK)
async def delete_journal_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    deleted = False

    if db_manager.is_connected and db_manager.db:
        res = await db_manager.db.journals.delete_one({"_id": entry_id, "user_id": user_id})
        deleted = (res.deleted_count > 0)
    else:
        for idx, j in enumerate(db_manager._memory_journals):
            if j.get("id") == entry_id and j.get("user_id") == user_id:
                db_manager._memory_journals.pop(idx)
                deleted = True
                break

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found or you do not have permission to delete it."
        )

    return {"message": "Journal entry successfully removed."}
