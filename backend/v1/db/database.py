import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://swag:swag@postgres:5432/swag")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_session():
    """Return a new database session. Always call this instead of SessionLocal() directly."""
    return SessionLocal()


def get_db():
    """Yield a database session, closing it when done."""
    db = get_session()
    try:
        yield db
    finally:
        db.close()


def initialize_db():
    """Create all tables and seed review users."""
    from v1.db.tables import UserTable  # noqa: F401 — ensure all models are imported
    from v1.db.tables import TokenStorageTable  # noqa: F401
    from v1.db.tables import UserEventTable, EventHostTable, EventSuggestedHostTable, EventAttendeeTable, EventReportTable  # noqa: F401
    from v1.db.tables import ExternalEventDetailsTable, ExternalEventCategoryTable, ExternalEventAdminTable  # noqa: F401
    from v1.db.tables import ExternalRootTable, ExternalRootDateTable  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logging.info("All database tables created.")

    _seed_review_users()


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
