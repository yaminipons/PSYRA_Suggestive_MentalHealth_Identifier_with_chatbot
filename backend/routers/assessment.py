"""
Assessment router for PSYRA:
- POST /api/assessment (submit 5-question wellness check-in)
- GET /api/assessment/history (fetch user reflection history)
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from backend.schemas.assessment import (
    AssessmentSubmission,
    AssessmentResultResponse,
    AssessmentHistoryResponse
)
from backend.services.scoring_service import calculate_assessment_result
from backend.services.auth_service import get_current_user_optional, get_current_user
from backend.database import db_manager

router = APIRouter(prefix="/api/assessment", tags=["Assessment"])


@router.post("", response_model=AssessmentResultResponse)
async def submit_assessment(
    req: AssessmentSubmission,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    # Validate questions 1 to 5 are covered
    q_indices = {ans.question_index for ans in req.answers}
    if q_indices != {1, 2, 3, 4, 5}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment must include answers for all five emotional wellness questions (1 through 5)."
        )

    # Compute result
    result = calculate_assessment_result(req.answers)
    result_id = str(uuid.uuid4())
    result.id = result_id

    # Persist if user is logged in
    user_id = current_user["id"] if current_user else None
    doc = {
        "_id": result_id,
        "id": result_id,
        "user_id": user_id,
        "category": result.category,
        "confidence_label": result.confidence_label,
        "summary": result.summary,
        "supportive_message": result.supportive_message,
        "created_at": result.created_at,
        "answers_summary": result.answers_summary,
        "recommendations": [r.model_dump() for r in result.recommendations]
    }

    if user_id:
        if db_manager.is_connected and db_manager.db:
            await db_manager.db.assessments.insert_one(doc)
        else:
            db_manager._memory_assessments.append(doc)

    return result


@router.get("/history", response_model=AssessmentHistoryResponse)
async def get_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    results = []

    if db_manager.is_connected and db_manager.db:
        cursor = db_manager.db.assessments.find({"user_id": user_id}).sort("created_at", -1)
        async for item in cursor:
            item["id"] = str(item.get("_id", item.get("id")))
            results.append(item)
    else:
        results = [
            a for a in reversed(db_manager._memory_assessments)
            if a.get("user_id") == user_id
        ]

    # Convert to response schema
    history_items = []
    for r in results:
        history_items.append(AssessmentResultResponse(
            id=r["id"],
            category=r["category"],
            confidence_label=r["confidence_label"],
            summary=r["summary"],
            supportive_message=r["supportive_message"],
            disclaimer="PSYRA is a wellness reflection tool, not a clinical diagnostic assessment.",
            recommendations=r.get("recommendations", []),
            created_at=r["created_at"],
            answers_summary=r.get("answers_summary")
        ))

    return AssessmentHistoryResponse(
        total_assessments=len(history_items),
        history=history_items
    )
