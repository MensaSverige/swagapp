from typing import Literal
from pymongo import ASCENDING

from v1.db.mongo import db

feedback_votes_collection = db["feedback_votes"]


def initialize_indexes() -> None:
    feedback_votes_collection.create_index(
        [("issue_number", ASCENDING), ("user_hash", ASCENDING)],
        unique=True,
    )
    feedback_votes_collection.create_index([("issue_number", ASCENDING)])


def set_vote(issue_number: int, user_hash: str, value: Literal[-1, 0, 1]) -> None:
    if value == 0:
        feedback_votes_collection.delete_one(
            {"issue_number": issue_number, "user_hash": user_hash}
        )
        return
    feedback_votes_collection.update_one(
        {"issue_number": issue_number, "user_hash": user_hash},
        {"$set": {"value": value}},
        upsert=True,
    )


def get_tally(issue_number: int, user_hash: str) -> dict:
    up = feedback_votes_collection.count_documents(
        {"issue_number": issue_number, "value": 1}
    )
    down = feedback_votes_collection.count_documents(
        {"issue_number": issue_number, "value": -1}
    )
    mine_doc = feedback_votes_collection.find_one(
        {"issue_number": issue_number, "user_hash": user_hash}
    )
    return {
        "up": up,
        "down": down,
        "score": up - down,
        "my_vote": mine_doc["value"] if mine_doc else 0,
    }


def get_tallies(issue_numbers: list[int], user_hash: str) -> dict[int, dict]:
    if not issue_numbers:
        return {}
    pipeline = [
        {"$match": {"issue_number": {"$in": issue_numbers}}},
        {
            "$group": {
                "_id": "$issue_number",
                "up": {"$sum": {"$cond": [{"$eq": ["$value", 1]}, 1, 0]}},
                "down": {"$sum": {"$cond": [{"$eq": ["$value", -1]}, 1, 0]}},
            }
        },
    ]
    aggregated = {
        d["_id"]: {"up": d["up"], "down": d["down"], "score": d["up"] - d["down"]}
        for d in feedback_votes_collection.aggregate(pipeline)
    }
    my_votes = {
        d["issue_number"]: d["value"]
        for d in feedback_votes_collection.find(
            {"issue_number": {"$in": issue_numbers}, "user_hash": user_hash}
        )
    }
    result: dict[int, dict] = {}
    for n in issue_numbers:
        t = aggregated.get(n, {"up": 0, "down": 0, "score": 0})
        t["my_vote"] = my_votes.get(n, 0)
        result[n] = t
    return result
