import os
import sys
from pathlib import Path


TEST_SECRET = "test_secret_for_ci_only_do_not_use_in_production"


def setup_test_imports():
    backend_dir = str(Path(__file__).resolve().parent.parent)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    os.environ.setdefault("JWT_SECRET", TEST_SECRET)
