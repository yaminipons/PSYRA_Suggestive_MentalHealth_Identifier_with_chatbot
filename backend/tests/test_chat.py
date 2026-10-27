"""
Automated unit tests for Grok service and crisis safety interceptor.
"""

from backend.services.grok_service import detect_crisis, generate_local_companion_response


def test_crisis_detection_triggers():
    # Dangerous statements should trigger immediate intervention
    assert detect_crisis("I want to kill myself") is True
    assert detect_crisis("I am feeling suicidal today") is True
    assert detect_crisis("I want to end my life") is True
    assert detect_crisis("Thinking about self-harm") is True


def test_crisis_detection_negative():
    # Everyday normal expressions should not trigger crisis
    assert detect_crisis("I had a long tiring day at work") is False
    assert detect_crisis("I feel a little overwhelmed with homework") is False
    assert detect_crisis("Can you help me relax?") is False


def test_local_companion_empathy_response():
    resp = generate_local_companion_response("I had a rough day at work", "Stressed")
    assert "reply" in resp
    assert len(resp["reply"]) > 20
    assert len(resp["suggested_followups"]) > 0
