import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="citizen", nullable=False)  # admin, operator, citizen, rescue_team, volunteer
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    rescue_team = relationship("RescueTeam", back_populates="user", uselist=False)
    volunteer = relationship("Volunteer", back_populates="user", uselist=False)


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # flood, cyclone, landslide, earthquake, fire, tsunami, storm, other
    description = Column(Text, nullable=True)
    affected_area = Column(String(150), nullable=False)
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    risk_level = Column(String(20), default="medium")  # low, medium, high, critical
    start_time = Column(DateTime, default=utcnow)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    emergencies = relationship("Emergency", back_populates="disaster")


class RescueTeam(Base):
    __tablename__ = "rescue_teams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    team_leader = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    specialty = Column(String(100), default="general")
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    base_location = Column(String(150), nullable=False)
    status = Column(String(20), default="AVAILABLE", index=True)  # AVAILABLE, ASSIGNED, EN_ROUTE, ON_SCENE, BUSY, OFFLINE
    max_capacity = Column(Integer, default=10)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("User", back_populates="rescue_team")
    emergencies = relationship("Emergency", back_populates="assigned_team")
    assignments = relationship("Assignment", back_populates="rescue_team")


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=False)
    skills = Column(Text, default="[]")  # JSON array string: ["medical", "driving", "first_aid", etc.]
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    address = Column(String(200), nullable=True)
    availability = Column(String(20), default="AVAILABLE", index=True)  # AVAILABLE, BUSY, OFFLINE
    active_tasks_count = Column(Integer, default=0)
    max_tasks = Column(Integer, default=3)
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("User", back_populates="volunteer")
    assignments = relationship("Assignment", back_populates="volunteer")


class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String(100), unique=True, index=True, nullable=True)  # For offline idempotency
    client_sos_id = Column(String(100), unique=True, index=True, nullable=True)  # Unique client-generated SOS idempotency key
    emergency_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    gps_accuracy = Column(Float, nullable=True)  # GPS accuracy in meters
    address = Column(String(255), nullable=False)
    
    # Offline Synchronization Timestamps
    client_created_at = Column(DateTime, nullable=True, index=True)  # Timestamp when created on device
    server_received_at = Column(DateTime, default=utcnow, index=True)  # Timestamp when backend received record
    sync_status = Column(String(20), default="SYNCED", index=True)  # SYNCED, OFFLINE_QUEUED
    
    # Vulnerability & Demographics
    people_affected = Column(Integer, default=1)
    children = Column(Integer, default=0)
    elderly = Column(Integer, default=0)
    pregnant_persons = Column(Integer, default=0)
    disabled_persons = Column(Integer, default=0)
    injured_persons = Column(Integer, default=0)
    medical_required = Column(Boolean, default=False)
    trapped = Column(Boolean, default=False)
    required_resources = Column(Text, default="[]")  # JSON list
    
    # Priority & Severity
    severity = Column(String(20), default="LOW", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    priority_score = Column(Float, default=0.0, index=True)
    priority_reasons = Column(Text, default="[]")  # JSON list of explanation strings
    status = Column(String(20), default="PENDING", index=True)  # PENDING, VERIFIED, ASSIGNED, EN_ROUTE, ON_SCENE, RESOLVED, CANCELLED
    
    # Foreign Keys & Linkages
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), nullable=True)
    reported_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(100), nullable=True)
    reporter_phone = Column(String(20), nullable=True)
    assigned_team_id = Column(Integer, ForeignKey("rescue_teams.id"), nullable=True)
    
    # Duplicate Management
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(Integer, ForeignKey("emergencies.id"), nullable=True)
    duplicate_status = Column(String(20), default="ORIGINAL")  # ORIGINAL, DUPLICATE, SEPARATE, MERGED
    
    # Resolution
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    disaster = relationship("DisasterEvent", back_populates="emergencies")
    assigned_team = relationship("RescueTeam", back_populates="emergencies")
    reporter = relationship("User", foreign_keys=[reported_by_user_id])
    assignments = relationship("Assignment", back_populates="emergency", cascade="all, delete-orphan")
    resource_allocations = relationship("ResourceAllocation", back_populates="emergency", cascade="all, delete-orphan")
    incident_history = relationship("IncidentHistory", back_populates="emergency", cascade="all, delete-orphan", order_by="IncidentHistory.created_at.desc()")
    evidence = relationship("Evidence", back_populates="emergency", cascade="all, delete-orphan")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # food, water, medicine, blankets, boats, life_jackets, ambulances, first_aid, rescue_equipment, clothes, other
    unit = Column(String(30), default="units")
    total_quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    allocated_quantity = Column(Integer, default=0)
    latitude = Column(Float, index=True, nullable=True)
    longitude = Column(Float, index=True, nullable=True)
    location_name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    allocations = relationship("ResourceAllocation", back_populates="resource")


class ResourceAllocation(Base):
    __tablename__ = "resource_allocations"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergencies.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    allocated_quantity = Column(Integer, nullable=False)
    status = Column(String(20), default="ALLOCATED")  # ALLOCATED, DISPATCHED, DELIVERED, RETURNED, CANCELLED
    allocated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    emergency = relationship("Emergency", back_populates="resource_allocations")
    resource = relationship("Resource", back_populates="allocations")
    allocated_by = relationship("User")


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(200), nullable=False)
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    occupied = Column(Integer, default=0)
    available_capacity = Column(Integer, nullable=False)
    has_medical_facility = Column(Boolean, default=False)
    has_food = Column(Boolean, default=True)
    has_water = Column(Boolean, default=True)
    has_electricity = Column(Boolean, default=True)
    is_accessible = Column(Boolean, default=True)
    contact_person = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    status = Column(String(20), default="OPEN")  # OPEN, FULL, CLOSED
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergencies.id"), nullable=False)
    rescue_team_id = Column(Integer, ForeignKey("rescue_teams.id"), nullable=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=True)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="PENDING", index=True)  # PENDING, ACCEPTED, EN_ROUTE, ON_SCENE, COMPLETED, CANCELLED
    role_type = Column(String(30), nullable=False)  # RESCUE_TEAM, VOLUNTEER
    instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    emergency = relationship("Emergency", back_populates="assignments")
    rescue_team = relationship("RescueTeam", back_populates="assignments")
    volunteer = relationship("Volunteer", back_populates="assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null indicates system broadcast
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="GENERAL")  # CRITICAL_EMERGENCY, SOS, TEAM_ASSIGNMENT, VOLUNTEER_ASSIGNMENT, RESOURCE_ALLOCATION, SHELTER_WARNING, WEATHER_ALERT, RESOLUTION, GENERAL
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    is_read = Column(Boolean, default=False)
    metadata_json = Column(Text, nullable=True)  # Optional JSON payload
    created_at = Column(DateTime, default=utcnow, index=True)


class EmergencyBroadcast(Base):
    __tablename__ = "emergency_broadcasts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    target_area = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius_km = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(100), nullable=False)
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    weather_condition = Column(String(100), nullable=False)
    temperature = Column(Float, default=28.0)
    rainfall_mm = Column(Float, default=0.0)
    wind_speed_kmh = Column(Float, default=15.0)
    flood_risk = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, SEVERE
    landslide_risk = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, SEVERE
    cyclone_risk = Column(String(20), default="LOW")
    alert_level = Column(String(30), default="ADVISORY")  # ADVISORY, WATCH, WARNING, EMERGENCY
    description = Column(Text, nullable=False)
    is_simulated = Column(Boolean, default=True)
    issued_at = Column(DateTime, default=utcnow)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, ASSIGN, ALLOCATE, RESOLVE, LOGIN, SOS
    entity_type = Column(String(50), nullable=False)  # Emergency, Resource, Shelter, Assignment, etc.
    entity_id = Column(String(50), nullable=True)
    previous_state = Column(Text, nullable=True)  # JSON string
    new_state = Column(Text, nullable=True)  # JSON string
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)


class IncidentHistory(Base):
    __tablename__ = "incident_histories"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergencies.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)  # CREATED, VERIFIED, PRIORITIZED, ASSIGNED, EN_ROUTE, ON_SCENE, RESOURCES_ALLOCATED, VOLUNTEERS_ASSIGNED, RESOLVED, EVIDENCE_UPLOADED, DUPLICATE_FLAGGED, STATUS_CHANGED
    description = Column(Text, nullable=False)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)

    # Relationships
    emergency = relationship("Emergency", back_populates="incident_history")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(Integer, ForeignKey("emergencies.id"), nullable=False, index=True)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)

    # Relationships
    emergency = relationship("Emergency", back_populates="evidence")


class EmergencyDuplicate(Base):
    __tablename__ = "emergency_duplicates"

    id = Column(Integer, primary_key=True, index=True)
    original_emergency_id = Column(Integer, ForeignKey("emergencies.id"), nullable=False, index=True)
    duplicate_emergency_id = Column(Integer, ForeignKey("emergencies.id"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    distance_meters = Column(Float, nullable=False)
    time_diff_minutes = Column(Float, nullable=False)
    status = Column(String(30), default="SUSPECTED")  # SUSPECTED, CONFIRMED_DUPLICATE, SEPARATE, MERGED
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
