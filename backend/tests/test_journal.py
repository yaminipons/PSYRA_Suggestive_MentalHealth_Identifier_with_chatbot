"""
Automated unit tests for journal schemas and models.
"""

from backend.schemas.journal import JournalCreateRequest, JournalUpdateRequest


def test_journal_create_request_validation():
    req = JournalCreateRequest(
        title="My Evening Reflections",
        content="Today I took a 10-minute walk in the afternoon sun and noticed the autumn leaves.",
        associated_emotion="Neutral",
        prompt_used="What brought you peace today?"
    )
    assert req.title == "My Evening Reflections"
    assert req.associated_emotion == "Neutral"


def test_journal_update_request_partial():
    req = JournalUpdateRequest(title="Updated Title")
    assert req.title == "Updated Title"
    assert req.content is None
