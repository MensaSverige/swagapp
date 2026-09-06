"""Tests for feedback vote and user-index DB operations (PostgreSQL migration)."""

from v1.db.feedback_votes import set_vote, get_tally, get_tallies
from v1.db.feedback_user_index import register_user, lookup


# ── Votes ─────────────────────────────────────────────────────────────────────

def test_vote_up_and_tally():
    set_vote(1, "abc", 1)
    t = get_tally(1, "abc")
    assert t["up"] == 1
    assert t["down"] == 0
    assert t["score"] == 1
    assert t["my_vote"] == 1


def test_vote_down():
    set_vote(1, "abc", -1)
    t = get_tally(1, "abc")
    assert t["up"] == 0
    assert t["down"] == 1
    assert t["score"] == -1
    assert t["my_vote"] == -1


def test_vote_zero_removes_vote():
    set_vote(1, "abc", 1)
    set_vote(1, "abc", 0)
    t = get_tally(1, "abc")
    assert t["up"] == 0
    assert t["my_vote"] == 0


def test_vote_upsert_changes_value():
    set_vote(1, "abc", 1)
    set_vote(1, "abc", -1)
    t = get_tally(1, "abc")
    assert t["up"] == 0
    assert t["down"] == 1


def test_tally_multiple_users():
    set_vote(1, "user1", 1)
    set_vote(1, "user2", 1)
    set_vote(1, "user3", -1)
    t = get_tally(1, "user1")
    assert t["up"] == 2
    assert t["down"] == 1
    assert t["score"] == 1
    assert t["my_vote"] == 1


def test_tally_empty_issue():
    t = get_tally(999, "nobody")
    assert t == {"up": 0, "down": 0, "score": 0, "my_vote": 0}


def test_get_tallies_batch():
    set_vote(10, "alice", 1)
    set_vote(10, "bob", 1)
    set_vote(11, "alice", -1)

    tallies = get_tallies([10, 11, 12], "alice")
    assert tallies[10]["up"] == 2
    assert tallies[10]["my_vote"] == 1
    assert tallies[11]["down"] == 1
    assert tallies[11]["my_vote"] == -1
    assert tallies[12]["up"] == 0
    assert tallies[12]["score"] == 0


def test_get_tallies_empty_list():
    assert get_tallies([], "x") == {}


def test_votes_isolated_between_issues():
    set_vote(1, "alice", 1)
    set_vote(2, "alice", -1)
    assert get_tally(1, "alice")["my_vote"] == 1
    assert get_tally(2, "alice")["my_vote"] == -1


# ── User index ────────────────────────────────────────────────────────────────

def test_register_and_lookup():
    user = {"userId": 42, "isMember": True}
    register_user(user, "hash123")
    row = lookup("hash123")
    assert row is not None
    assert row["user_id"] == 42
    assert row["is_member"] is True


def test_register_upserts_last_seen():
    user = {"userId": 42, "isMember": False}
    register_user(user, "hash456")
    first = lookup("hash456")["last_seen"]

    register_user({"userId": 42, "isMember": True}, "hash456")
    second = lookup("hash456")["last_seen"]

    assert second >= first
    assert lookup("hash456")["is_member"] is True


def test_lookup_unknown_hash_returns_none():
    assert lookup("no-such-hash") is None
