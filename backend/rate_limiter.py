import os
from slowapi import Limiter, _rate_limit_exceeded_handler  # noqa: F401
from slowapi.util import get_remote_address

# Storage URI for Redis
redis_url = os.environ.get("REDIS_URL")
storage_uri = redis_url if redis_url else "memory://"

limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)
