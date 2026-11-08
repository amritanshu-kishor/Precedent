import os
import sys
from pathlib import Path

# Force an in-memory SQLite database so the test suite never writes into (and
# pollutes between runs) the file-based precedent.db. Must be set before any
# app module imports app.core.database / app.main, which build the engine from
# settings.database_url.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
