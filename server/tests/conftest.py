import os

# Config is read at import time; set required env before kaizen_api is imported.
os.environ.setdefault("DATABASE_URL", "postgres://unused:unused@localhost/unused")
os.environ.setdefault("JWT_SECRET", "test-secret-please-ignore-0123456789")
os.environ.setdefault("JWT_ISSUER", "https://auth.northernarchive.com/auth/v1")
