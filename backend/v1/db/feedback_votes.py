from typing import Literal
from v1.db.database import get_session
from v1.db.tables import FeedbackVoteTable


def set_vote(issue_number: int, user_hash: str, value: Literal[-1, 0, 1]) -> None:
    with get_session() as session:
        row = session.query(FeedbackVoteTable).filter_by(
            issue_number=issue_number, user_hash=user_hash
        ).first()
        if value == 0:
            if row:
                session.delete(row)
        elif row:
            row.value = value
        else:
            session.add(FeedbackVoteTable(
                issue_number=issue_number, user_hash=user_hash, value=value
            ))
        session.commit()


def get_tally(issue_number: int, user_hash: str) -> dict:
    with get_session() as session:
        rows = session.query(FeedbackVoteTable).filter_by(issue_number=issue_number).all()
        up = sum(1 for r in rows if r.value == 1)
        down = sum(1 for r in rows if r.value == -1)
        mine = next((r.value for r in rows if r.user_hash == user_hash), 0)
        return {"up": up, "down": down, "score": up - down, "my_vote": mine}


def get_tallies(issue_numbers: list[int], user_hash: str) -> dict[int, dict]:
    if not issue_numbers:
        return {}
    with get_session() as session:
        rows = session.query(FeedbackVoteTable).filter(
            FeedbackVoteTable.issue_number.in_(issue_numbers)
        ).all()
        result: dict[int, dict] = {}
        for n in issue_numbers:
            group = [r for r in rows if r.issue_number == n]
            up = sum(1 for r in group if r.value == 1)
            down = sum(1 for r in group if r.value == -1)
            mine = next((r.value for r in group if r.user_hash == user_hash), 0)
            result[n] = {"up": up, "down": down, "score": up - down, "my_vote": mine}
        return result
