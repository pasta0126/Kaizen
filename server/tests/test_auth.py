import time

import jwt
import pytest

from kaizen_api.auth import AuthError, verify_token
from kaizen_api.config import settings


def make_token(**overrides) -> str:
    claims = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "aud": settings.jwt_audience,
        "iss": settings.jwt_issuer,
        "exp": int(time.time()) + 3600,
    }
    claims.update(overrides)
    return jwt.encode(claims, settings.jwt_secret, algorithm="HS256")


def test_valid_token_returns_sub():
    assert verify_token(make_token()) == "11111111-1111-1111-1111-111111111111"


def test_expired_token_rejected():
    with pytest.raises(AuthError):
        verify_token(make_token(exp=int(time.time()) - 10))


def test_bad_signature_rejected():
    token = jwt.encode(
        {
            "sub": "x",
            "aud": settings.jwt_audience,
            "iss": settings.jwt_issuer,
            "exp": int(time.time()) + 3600,
        },
        "the-wrong-secret",
        algorithm="HS256",
    )
    with pytest.raises(AuthError):
        verify_token(token)


def test_wrong_audience_rejected():
    with pytest.raises(AuthError):
        verify_token(make_token(aud="somethingelse"))


def test_missing_sub_rejected():
    with pytest.raises(AuthError):
        verify_token(make_token(sub=""))


def test_malformed_token_rejected():
    with pytest.raises(AuthError):
        verify_token("not-a-jwt")
