from slowapi import Limiter, _rate_limit_exceeded_handler  # noqa: F401
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
