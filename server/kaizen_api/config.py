from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration, read from the environment (and a local .env in dev)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Connection string for the shared platform Postgres, database `kaizen`.
    database_url: str

    # Shared HS256 secret used by GoTrue to sign tokens. Same value as the
    # platform's PLATFORM_JWT_SECRET. The backend only verifies; it never mints.
    jwt_secret: str
    jwt_audience: str = "authenticated"
    jwt_issuer: str = "https://auth.northernarchive.com/auth/v1"
    # If a real GoTrue token ever 401s on the issuer check, flip this off and
    # compare `iss` against an actual decoded token.
    jwt_verify_issuer: bool = True


settings = Settings()  # type: ignore[call-arg]
