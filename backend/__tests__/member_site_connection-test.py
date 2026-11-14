"""Tests for reaching the member site's database from a cluster pod.

The secret vault hands out the SSH key as text, not as a file on disk, so the
tunnel has to accept key material directly. Everything here is about building
the connection; nothing in it talks to the member site.
"""

import paramiko
import pytest
from sshtunnel import SSHTunnelForwarder

from v1.member_calendar import ips_source


# A throwaway ed25519 key, generated for this test file and used nowhere.
TEST_KEY = """-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCCV5BpvxAH6tWAnlVT8xc8Uy5AZYJ1B6Bj4WB8hPUaWQAAAJgeHT2IHh09
iAAAAAtzc2gtZWQyNTUxOQAAACCCV5BpvxAH6tWAnlVT8xc8Uy5AZYJ1B6Bj4WB8hPUaWQ
AAAEAS5JRNioGb5Y1pxun1RNHSE4n97ZIXTlmyJrDqfyPoX4JXkGm/EAfq1YCeVVPzFzxT
LkBlgnUHoGPhYHyE9RpZAAAAFHN3YWdhcHAtdGVzdC1maXh0dXJlAQ==
-----END OPENSSH PRIVATE KEY-----
"""


@pytest.fixture
def configured(monkeypatch):
    for name, value in [
        ("MEDLEM_SSH_HOST", "medlem.example"),
        ("MEDLEM_SSH_PORT", "54599"),
        ("MEDLEM_SSH_USER", "sync"),
        ("MEDLEM_SSH_KEY", None),
        ("MEDLEM_SSH_PASSWORD", None),
        ("MEDLEM_DB_HOST", "localhost"),
        ("MEDLEM_DB_NAME", "ips"),
        ("MEDLEM_DB_USER", "reader"),
        ("MEDLEM_DB_PASS", "secret"),
    ]:
        monkeypatch.setattr(ips_source, name, value)
    return ips_source


def test_key_material_from_the_vault_builds_a_tunnel(configured, monkeypatch):
    """The vault holds the key's text. Nothing writes it to disk."""
    monkeypatch.setattr(configured, "MEDLEM_SSH_KEY", TEST_KEY)
    tunnel = configured._ssh_tunnel()
    assert isinstance(tunnel, SSHTunnelForwarder)


def test_key_material_is_parsed_not_treated_as_a_path(configured, monkeypatch):
    monkeypatch.setattr(configured, "MEDLEM_SSH_KEY", TEST_KEY)
    key = configured._private_key(TEST_KEY)
    assert isinstance(key, paramiko.PKey)


def test_a_key_with_escaped_newlines_is_still_a_key(configured):
    """Secret stores and env files routinely flatten a PEM to one line."""
    flattened = TEST_KEY.replace("\n", "\\n")
    assert isinstance(configured._private_key(flattened), paramiko.PKey)


def test_unreadable_key_material_is_not_a_crash(configured):
    assert configured._private_key("not a key at all") is None


def test_a_password_still_works_when_there_is_no_key(configured, monkeypatch):
    monkeypatch.setattr(configured, "MEDLEM_SSH_PASSWORD", "hunter2")
    assert isinstance(configured._ssh_tunnel(), SSHTunnelForwarder)


def test_no_credential_at_all_skips_the_sync(configured, monkeypatch):
    def no_tunnel():
        raise AssertionError("must not try to connect without a credential")

    monkeypatch.setattr(configured, "_ssh_tunnel", no_tunnel)
    assert configured.fetch_member_calendar_events() == []


def test_unparseable_key_material_skips_the_sync(configured, monkeypatch):
    monkeypatch.setattr(configured, "MEDLEM_SSH_KEY", "not a key at all")

    def no_tunnel():
        raise AssertionError("must not try to connect with a broken key")

    monkeypatch.setattr(configured, "_ssh_tunnel", no_tunnel)
    assert configured.fetch_member_calendar_events() == []


def test_missing_database_settings_skip_the_sync(configured, monkeypatch):
    monkeypatch.setattr(configured, "MEDLEM_SSH_KEY", TEST_KEY)
    monkeypatch.setattr(configured, "MEDLEM_DB_NAME", None)

    def no_tunnel():
        raise AssertionError("must not connect without a database to read")

    monkeypatch.setattr(configured, "_ssh_tunnel", no_tunnel)
    assert configured.fetch_member_calendar_events() == []
