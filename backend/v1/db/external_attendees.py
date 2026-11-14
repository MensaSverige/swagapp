"""The cached list of people registered to the riksträff, from the booking site."""
from datetime import datetime, timezone
from datetime import datetime, timezone
from typing import List, Optional, Set

from v1.db.database import get_session
from v1.db.models.external_events import ExternalAttendee, ExternalAttendeeList
from v1.db.tables import ExternalAttendeeCountTable, ExternalAttendeeTable


def store_external_attendees(listing: ExternalAttendeeList) -> None:
    """Replace the cached list and count with a fresh one, in one transaction."""
    with get_session() as session:
        session.query(ExternalAttendeeTable).delete()
        for position, a in enumerate(listing.attendees):
            session.add(ExternalAttendeeTable(
                member_id=str(a.memberId).strip(),
                first_name=a.firstName,
                last_name=a.lastName,
                city=a.city,
                registered=a.registered,
                position=position,
            ))
        row = session.get(ExternalAttendeeCountTable, 1)
        if row is None:
            session.add(ExternalAttendeeCountTable(id=1, count=listing.count))
        else:
            row.count = listing.count
            row.fetched_at = datetime.now(timezone.utc)
        session.commit()


def get_external_attendees() -> List[ExternalAttendee]:
    """The cached list in the site's order. Check get_external_attendee_count first:
    None there means nothing has been fetched yet."""
    with get_session() as session:
        rows = session.query(ExternalAttendeeTable).order_by(ExternalAttendeeTable.position).all()
        return [
            ExternalAttendee(memberId=r.member_id, firstName=r.first_name, lastName=r.last_name,
                             city=r.city, registered=r.registered)
            for r in rows
        ]


def get_external_attendee_count() -> Optional[int]:
    with get_session() as session:
        row = session.get(ExternalAttendeeCountTable, 1)
        return row.count if row else None


def get_listed_member_ids() -> Set[int]:
    """Membership numbers of everyone listed, as the app's user ids."""
    with get_session() as session:
        ids = {r.member_id for r in session.query(ExternalAttendeeTable.member_id).all()}
    return {int(m) for m in ids if m.isdigit()}


def is_listed(user_id: int) -> bool:
    with get_session() as session:
        return session.query(ExternalAttendeeTable.id).filter_by(member_id=str(user_id)).first() is not None
