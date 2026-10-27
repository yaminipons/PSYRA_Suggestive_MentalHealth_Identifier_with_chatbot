"""
Pydantic schemas for 5-question emotional assessment and scoring.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AssessmentAnswer(BaseModel):
    question_index: int = Field(..., ge=1, le=5)
    selected_option: str
    option_index: int = Field(..., ge=0, le=4)


class AssessmentSubmission(BaseModel):
    answers: List[AssessmentAnswer] = Field(..., min_length=5, max_length=5)


class ActivityRecommendation(BaseModel):
    id: str
    title: str
    category: str
    description: str
    duration: str
    action_type: str
    action_url: Optional[str] = None


class AssessmentResultResponse(BaseModel):
    id: Optional[str] = None
    category: str  # Happy, Neutral, Stressed, Low
    confidence_label: str  # e.g., "Strong Alignment", "Moderate Match"
    summary: str
    supportive_message: str
    disclaimer: str = "PSYRA is a wellness reflection tool, not a clinical diagnostic assessment."
    recommendations: List[ActivityRecommendation]
    created_at: str
    answers_summary: Optional[Dict[str, Any]] = None


class AssessmentHistoryResponse(BaseModel):
    total_assessments: int
    history: List[AssessmentResultResponse]
