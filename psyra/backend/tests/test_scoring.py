"""
Automated unit tests for the 5-question assessment scoring algorithm.
"""

import pytest
from backend.schemas.assessment import AssessmentAnswer
from backend.services.scoring_service import calculate_assessment_result


def test_happy_assessment_scoring():
    # User selects energetic, calm, connected, happy, fun
    answers = [
        AssessmentAnswer(question_index=1, option_index=0, selected_option="Very energetic."),
        AssessmentAnswer(question_index=2, option_index=0, selected_option="Very calm."),
        AssessmentAnswer(question_index=3, option_index=0, selected_option="Very connected."),
        AssessmentAnswer(question_index=4, option_index=0, selected_option="Happy and positive."),
        AssessmentAnswer(question_index=5, option_index=0, selected_option="Something fun and uplifting."),
    ]
    result = calculate_assessment_result(answers)
    assert result.category == "Happy"
    assert result.confidence_label in ["Strong Alignment", "Balanced Alignment"]
    assert len(result.recommendations) > 0
    assert any("Gratitude" in r.title for r in result.recommendations)


def test_stressed_assessment_scoring():
    # User selects tired/drained, overwhelmed, stressed, release stress
    answers = [
        AssessmentAnswer(question_index=1, option_index=3, selected_option="A little tired."),
        AssessmentAnswer(question_index=2, option_index=4, selected_option="Very overwhelmed."),
        AssessmentAnswer(question_index=3, option_index=3, selected_option="A little disconnected."),
        AssessmentAnswer(question_index=4, option_index=3, selected_option="Worried or stressed."),
        AssessmentAnswer(question_index=5, option_index=3, selected_option="A way to release stress."),
    ]
    result = calculate_assessment_result(answers)
    assert result.category == "Stressed"
    assert len(result.recommendations) > 0
    assert any("Breathing" in r.title for r in result.recommendations)


def test_low_assessment_scoring():
    # User selects completely drained, disconnected, sad/low, someone to talk to
    answers = [
        AssessmentAnswer(question_index=1, option_index=4, selected_option="Completely drained."),
        AssessmentAnswer(question_index=2, option_index=2, selected_option="Neither calm nor stressed."),
        AssessmentAnswer(question_index=3, option_index=4, selected_option="Very disconnected."),
        AssessmentAnswer(question_index=4, option_index=4, selected_option="Sad or low."),
        AssessmentAnswer(question_index=5, option_index=4, selected_option="Someone supportive to talk to."),
    ]
    result = calculate_assessment_result(answers)
    assert result.category == "Low"
    assert len(result.recommendations) > 0
    assert any("Talk with Psyra" in r.title or "Rest" in r.title for r in result.recommendations)


def test_neutral_assessment_scoring():
    # User selects normal, mostly relaxed, neutral, mostly okay, quiet moment
    answers = [
        AssessmentAnswer(question_index=1, option_index=2, selected_option="Normal."),
        AssessmentAnswer(question_index=2, option_index=1, selected_option="Mostly relaxed."),
        AssessmentAnswer(question_index=3, option_index=2, selected_option="Neutral."),
        AssessmentAnswer(question_index=4, option_index=1, selected_option="Mostly okay."),
        AssessmentAnswer(question_index=5, option_index=1, selected_option="A quiet moment to relax."),
    ]
    result = calculate_assessment_result(answers)
    assert result.category == "Neutral"
    assert "wellness reflection tool" in result.disclaimer.lower()
