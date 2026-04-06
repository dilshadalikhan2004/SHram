"""
Shared pytest fixtures for the ShramSetu backend test suite.
"""
import os
import pytest


@pytest.fixture(autouse=True)
def require_jwt_secret(monkeypatch):
    """Ensure JWT_SECRET is set for every test that needs it."""
    if not os.environ.get("JWT_SECRET"):
        monkeypatch.setenv("JWT_SECRET", "test_secret_for_ci_only_do_not_use_in_production")
