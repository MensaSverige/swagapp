"""The embedded migration run must not reconfigure application logging.

server.py calls initialize_app() at import, which runs Alembic inside the API
process. alembic/env.py calls logging.config.fileConfig(alembic.ini), and that
ini sets [logger_root] level = WARN — so running migrations silently switched
the whole backend's root logger to WARNING and every logging.info() call
stopped emitting, including the "Review user logged in" audit line that exists
so app-store review activity is visible.

Nothing failed and nothing was logged about it, which is exactly why it went
unnoticed: the symptom of broken logging is missing logs.
"""

import logging

from v1.db import database


def test_embedded_migrations_do_not_change_the_root_log_level(monkeypatch):
    """The invariant that actually matters."""
    captured = {}

    import alembic.command as command

    def fake_upgrade(cfg, rev):
        captured["cfg"] = cfg

    monkeypatch.setattr(command, "upgrade", fake_upgrade)
    monkeypatch.setattr(command, "stamp", lambda cfg, rev: None)

    root = logging.getLogger()
    original = root.level
    try:
        root.setLevel(logging.INFO)
        database.run_alembic_migrations()
        assert root.level == logging.INFO, "migrations clobbered the app's log level"
        assert root.isEnabledFor(logging.INFO)
    finally:
        root.setLevel(original)


def test_embedded_migrations_opt_out_of_alembic_logging_config(monkeypatch):
    """The mechanism: env.py skips fileConfig when this attribute is False."""
    captured = {}

    import alembic.command as command

    monkeypatch.setattr(command, "upgrade", lambda cfg, rev: captured.setdefault("cfg", cfg))
    monkeypatch.setattr(command, "stamp", lambda cfg, rev: captured.setdefault("cfg", cfg))

    database.run_alembic_migrations()

    assert captured["cfg"].attributes.get("configure_logger") is False


def test_alembic_ini_would_clobber_the_root_logger(monkeypatch):
    """Documents why the guard is needed — remove it and this is the result.

    If alembic.ini ever stops setting the root logger to WARN this test fails,
    which is the signal to reconsider the guard rather than a regression.
    """
    from logging.config import fileConfig
    from pathlib import Path

    ini = Path(database.__file__).resolve().parent.parent.parent / "alembic.ini"
    root = logging.getLogger()
    original, handlers = root.level, list(root.handlers)
    try:
        root.setLevel(logging.INFO)
        fileConfig(str(ini))
        assert root.level == logging.WARNING
    finally:
        root.setLevel(original)
        root.handlers[:] = handlers
