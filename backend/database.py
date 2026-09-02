from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

# SQLite connection args to allow multi-threaded access in FastAPI
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency that yields a database session for requests and closes it cleanly."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_db_schema():
    """Initializes tables and dynamically ensures all required offline sync columns exist."""
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(emergencies)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "client_sos_id" not in cols:
                    conn.execute(text("ALTER TABLE emergencies ADD COLUMN client_sos_id VARCHAR(100)"))
                    try:
                        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_emergencies_client_sos_id ON emergencies (client_sos_id)"))
                    except Exception:
                        pass
                if "client_created_at" not in cols:
                    conn.execute(text("ALTER TABLE emergencies ADD COLUMN client_created_at DATETIME"))
                if "server_received_at" not in cols:
                    conn.execute(text("ALTER TABLE emergencies ADD COLUMN server_received_at DATETIME"))
                if "gps_accuracy" not in cols:
                    conn.execute(text("ALTER TABLE emergencies ADD COLUMN gps_accuracy FLOAT"))
                if "sync_status" not in cols:
                    conn.execute(text("ALTER TABLE emergencies ADD COLUMN sync_status VARCHAR(20) DEFAULT 'SYNCED'"))
                conn.commit()
        except Exception as e:
            print("Database schema migration notice:", e)

