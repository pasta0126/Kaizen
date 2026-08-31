import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

_bearer = HTTPBearer(auto_error=False)


class AuthError(HTTPException):
    def __init__(self, detail: str = "invalid or missing token") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_token(token: str) -> str:
    """Verify a GoTrue HS256 token and return its subject. Raises AuthError."""
    kwargs: dict = {
        "algorithms": ["HS256"],
        "audience": settings.jwt_audience,
        "options": {"require": ["exp", "sub"]},
    }
    if settings.jwt_verify_issuer:
        kwargs["issuer"] = settings.jwt_issuer
    try:
        claims = jwt.decode(token, settings.jwt_secret, **kwargs)
    except jwt.PyJWTError as exc:
        raise AuthError(f"token rejected: {exc}") from exc

    sub = claims.get("sub")
    if not sub:
        raise AuthError("token missing sub")
    return str(sub)


async def current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    if credentials is None or not credentials.credentials:
        raise AuthError("missing bearer token")
    return verify_token(credentials.credentials)
