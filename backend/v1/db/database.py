import os
import time
import logging
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://swag:swag@postgres:5432/swag")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


@contextmanager
def get_session():
    """Context manager yielding a session with auto-rollback on exception."""
    session = SessionLocal()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db():
    """Yield a database session, closing it when done."""
    with get_session() as db:
        yield db


def initialize_db(max_retries: int = 5, retry_delay: float = 2.0):
    """Create all tables, retrying on connection failure."""
    from v1.db.tables import UserTable  # noqa: F401
    from v1.db.tables import TokenStorageTable  # noqa: F401
    from v1.db.tables import UserEventTable, EventHostTable, EventSuggestedHostTable, EventAttendeeTable, EventReportTable  # noqa: F401
    from v1.db.tables import ExternalEventDetailsTable, ExternalEventCategoryTable, ExternalEventAdminTable  # noqa: F401
    from v1.db.tables import ExternalRootTable, ExternalRootDateTable  # noqa: F401
    from v1.db.tables import ExternalEventBookingTable  # noqa: F401
    from v1.db.tables import FeedbackVoteTable, FeedbackUserIndexTable  # noqa: F401

    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            logging.info("All database tables created.")
            _seed_review_users()
            return
        except Exception as e:
            if attempt == max_retries:
                logging.error(f"initialize_db failed after {max_retries} attempts: {e}")
                raise
            wait = retry_delay * (2 ** (attempt - 1))
            logging.warning(f"initialize_db attempt {attempt} failed ({e}), retrying in {wait:.1f}s…")
            time.sleep(wait)


def _seed_review_users():
    """Ensure review users exist in the database."""
    from v1.db.review_users import review_users
    from v1.db.tables import UserTable

    if not review_users:
        logging.info("No review users configured.")
        return

    logging.info("Ensuring review users exist.")
    with get_session() as session:
        for review_user in review_users:
            existing = session.query(UserTable).filter_by(userId=review_user.userId).first()
            user_data = review_user.model_dump()
            if existing:
                for key, value in user_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                row = UserTable.from_pydantic(review_user)
                session.add(row)
        session.commit()
