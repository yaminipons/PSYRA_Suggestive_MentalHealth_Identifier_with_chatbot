"""
Automated unit tests for authentication logic and token security.
"""

from backend.services.auth_service import hash_password, verify_password, create_access_token, decode_token


def test_password_hashing_and_verification():
    plain = "SuperSecretPassword123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_generation_and_decoding():
    payload = {"sub": "user_12345", "email": "test@example.com", "display_name": "Sunny"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_12345"
    assert decoded["email"] == "test@example.com"
