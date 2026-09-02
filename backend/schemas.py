import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# -------------------------------------------------------------
# Base Configuration
# -------------------------------------------------------------
class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Authentication & Users
# -------------------------------------------------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = "citizen"  # admin, operator, citizen, rescue_team, volunteer
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None

class UserOut(UserBase, ORMBase):
    id: int
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


# -------------------------------------------------------------
# Disaster Events
# -------------------------------------------------------------
class DisasterEventBase(BaseModel):
    name: str
    type: str  # flood, cyclone, landslide, earthquake, fire, tsunami, storm, other
    description: Optional[str] = None
    affected_area: str
    latitude: float
    longitude: float
    risk_level: str = "medium"  # low, medium, high, critical
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    is_active: bool = True

class DisasterEventCreate(DisasterEventBase):
    pass

class DisasterEventUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    affected_area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_level: Optional[str] = None
    end_time: Optional[datetime.datetime] = None
    is_active: Optional[bool] = None

class DisasterEventOut(DisasterEventBase, ORMBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


# -------------------------------------------------------------
# Rescue Teams
# -------------------------------------------------------------
class RescueTeamBase(BaseModel):
    name: str
    team_leader: str
    contact_phone: str
    specialty: str = "general"
    latitude: float
    longitude: float
    base_location: str
    status: str = "AVAILABLE"  # AVAILABLE, ASSIGNED, EN_ROUTE, ON_SCENE, BUSY, OFFLINE
    max_capacity: int = 10

class RescueTeamCreate(RescueTeamBase):
    user_id: Optional[int] = None

class RescueTeamUpdate(BaseModel):
    name: Optional[str] = None
    team_leader: Optional[str] = None
    contact_phone: Optional[str] = None
    specialty: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_location: Optional[str] = None
    status: Optional[str] = None
    max_capacity: Optional[int] = None

class RescueTeamLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    status: Optional[str] = None

class RescueTeamOut(RescueTeamBase, ORMBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


# -------------------------------------------------------------
# Volunteers
# -------------------------------------------------------------
class VolunteerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str
    skills: List[str] = []
    latitude: float
    longitude: float
    address: Optional[str] = None
    availability: str = "AVAILABLE"  # AVAILABLE, BUSY, OFFLINE
    max_tasks: int = 3

class VolunteerCreate(VolunteerBase):
    user_id: Optional[int] = None

class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    availability: Optional[str] = None
    max_tasks: Optional[int] = None

class VolunteerOut(VolunteerBase, ORMBase):
    id: int
    user_id: Optional[int] = None
    active_tasks_count: int
    rating: float
    created_at: datetime.datetime
    updated_at: datetime.datetime


# -------------------------------------------------------------
# Emergencies
# -------------------------------------------------------------
class EmergencyBase(BaseModel):
    emergency_type: str
    description: str
    latitude: float
    longitude: float
    address: str
    people_affected: int = 1
    children: int = 0
    elderly: int = 0
    pregnant_persons: int = 0
    disabled_persons: int = 0
    injured_persons: int = 0
    medical_required: bool = False
    trapped: bool = False
    required_resources: List[str] = []
    disaster_id: Optional[int] = None
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None

class EmergencyCreate(EmergencyBase):
    client_id: Optional[str] = None  # Idempotency token for offline sync

class EmergencyUpdate(BaseModel):
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    people_affected: Optional[int] = None
    children: Optional[int] = None
    elderly: Optional[int] = None
    pregnant_persons: Optional[int] = None
    disabled_persons: Optional[int] = None
    injured_persons: Optional[int] = None
    medical_required: Optional[bool] = None
    trapped: Optional[bool] = None
    required_resources: Optional[List[str]] = None
    disaster_id: Optional[int] = None
    status: Optional[str] = None
    assigned_team_id: Optional[int] = None

class EmergencyStatusUpdate(BaseModel):
    status: str  # PENDING, VERIFIED, ASSIGNED, EN_ROUTE, ON_SCENE, RESOLVED, CANCELLED
    notes: Optional[str] = None

class EmergencyVoiceReport(BaseModel):
    transcript: str
    structured_data: EmergencyCreate

class OfflineSyncRequest(BaseModel):
    emergencies: List[EmergencyCreate]

class OfflineSyncResponse(BaseModel):
    synced: int
    duplicates_skipped: int
    results: List[Dict[str, Any]]

class EmergencyOut(EmergencyBase, ORMBase):
    id: int
    client_id: Optional[str] = None
    severity: str
    priority_score: float
    priority_reasons: List[str] = []
    status: str
    reported_by_user_id: Optional[int] = None
    assigned_team_id: Optional[int] = None
    is_duplicate: bool
    duplicate_of_id: Optional[int] = None
    duplicate_status: str
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    assigned_team: Optional[RescueTeamOut] = None
    disaster: Optional[DisasterEventOut] = None


# -------------------------------------------------------------
# -------------------------------------------------------------
# SOS Rapid Reporting & Offline Synchronization
# -------------------------------------------------------------
class SOSCreate(BaseModel):
    name: str
    phone: str
    latitude: float
    longitude: float
    gps_accuracy: Optional[float] = None
    people: int = 1
    message: Optional[str] = "EMERGENCY SOS: Immediate rescue needed"
    medical_needed: bool = False
    trapped: bool = False
    children: Optional[int] = 0
    elderly: Optional[int] = 0
    pregnant_persons: Optional[int] = 0
    disabled_persons: Optional[int] = 0
    client_sos_id: Optional[str] = None
    client_id: Optional[str] = None
    created_at: Optional[datetime.datetime] = None
    client_created_at: Optional[datetime.datetime] = None

class SOSOut(BaseModel):
    success: bool = True
    duplicate: bool = False
    message: str
    emergency_id: int
    client_sos_id: Optional[str] = None
    priority_score: float
    severity: str
    status: str
    timestamp: datetime.datetime
    client_created_at: Optional[datetime.datetime] = None
    server_received_at: Optional[datetime.datetime] = None

class SOSBatchSyncItemResult(BaseModel):
    client_sos_id: Optional[str] = None
    client_id: Optional[str] = None
    emergency_id: Optional[int] = None
    status: str  # synced, already_synced, failed
    duplicate: bool = False
    message: str
    priority_score: Optional[float] = None
    severity: Optional[str] = None
    error: Optional[str] = None

class SOSBatchSyncRequest(BaseModel):
    items: List[SOSCreate]

class SOSBatchSyncResponse(BaseModel):
    success: bool = True
    total: int
    synced_count: int
    already_synced_count: int
    failed_count: int
    results: List[SOSBatchSyncItemResult]


# -------------------------------------------------------------
# Resources & Inventory
# -------------------------------------------------------------
class ResourceBase(BaseModel):
    name: str
    category: str  # food, water, medicine, blankets, boats, life_jackets, ambulances, first_aid, rescue_equipment, clothes, other
    unit: str = "units"
    total_quantity: int
    available_quantity: int
    reserved_quantity: int = 0
    allocated_quantity: int = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: str

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    total_quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    reserved_quantity: Optional[int] = None
    allocated_quantity: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None

class ResourceOut(ResourceBase, ORMBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

class ResourceAllocationCreate(BaseModel):
    emergency_id: int
    resource_id: int
    allocated_quantity: int
    notes: Optional[str] = None

class ResourceAllocationOut(ORMBase):
    id: int
    emergency_id: int
    resource_id: int
    allocated_quantity: int
    status: str
    allocated_by_user_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    resource: Optional[ResourceOut] = None


# -------------------------------------------------------------
# Shelters
# -------------------------------------------------------------
class ShelterBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    capacity: int
    occupied: int = 0
    has_medical_facility: bool = False
    has_food: bool = True
    has_water: bool = True
    has_electricity: bool = True
    is_accessible: bool = True
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str = "OPEN"  # OPEN, FULL, CLOSED

class ShelterCreate(ShelterBase):
    pass

class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: Optional[int] = None
    occupied: Optional[int] = None
    has_medical_facility: Optional[bool] = None
    has_food: Optional[bool] = None
    has_water: Optional[bool] = None
    has_electricity: Optional[bool] = None
    is_accessible: Optional[bool] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None

class ShelterOccupancyUpdate(BaseModel):
    change_count: int  # Positive to add occupants, negative to remove
    notes: Optional[str] = None

class ShelterOut(ShelterBase, ORMBase):
    id: int
    available_capacity: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


# -------------------------------------------------------------
# Assignments (Workflow)
# -------------------------------------------------------------
class AssignmentCreate(BaseModel):
    emergency_id: int
    rescue_team_id: Optional[int] = None
    volunteer_id: Optional[int] = None
    role_type: str  # RESCUE_TEAM, VOLUNTEER
    instructions: Optional[str] = None
    notes: Optional[str] = None

class AssignmentUpdate(BaseModel):
    status: Optional[str] = None  # PENDING, ACCEPTED, EN_ROUTE, ON_SCENE, COMPLETED, CANCELLED
    notes: Optional[str] = None

class AssignmentOut(ORMBase):
    id: int
    emergency_id: int
    rescue_team_id: Optional[int] = None
    volunteer_id: Optional[int] = None
    assigned_by_user_id: Optional[int] = None
    status: str
    role_type: str
    instructions: Optional[str] = None
    notes: Optional[str] = None
    assigned_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    rescue_team: Optional[RescueTeamOut] = None
    volunteer: Optional[VolunteerOut] = None


# -------------------------------------------------------------
# Notifications & Broadcasts
# -------------------------------------------------------------
class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    title: str
    message: str
    type: str = "GENERAL"
    severity: str = "MEDIUM"
    metadata: Optional[Dict[str, Any]] = None

class NotificationOut(ORMBase):
    id: int
    user_id: Optional[int] = None
    title: str
    message: str
    type: str
    severity: str
    is_read: bool
    metadata_json: Optional[str] = None
    created_at: datetime.datetime

class NotificationSummary(BaseModel):
    unread_count: int
    notifications: List[NotificationOut]

class EmergencyBroadcastCreate(BaseModel):
    title: str
    message: str
    severity: str = "HIGH"
    target_area: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    expires_at: Optional[datetime.datetime] = None

class EmergencyBroadcastOut(EmergencyBroadcastCreate, ORMBase):
    id: int
    is_active: bool
    created_by_user_id: Optional[int] = None
    created_at: datetime.datetime


# -------------------------------------------------------------
# Weather & Hazard Alerts
# -------------------------------------------------------------
class WeatherAlertCreate(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    weather_condition: str
    temperature: float = 28.0
    rainfall_mm: float = 0.0
    wind_speed_kmh: float = 15.0
    flood_risk: str = "LOW"
    landslide_risk: str = "LOW"
    cyclone_risk: str = "LOW"
    alert_level: str = "ADVISORY"
    description: str
    is_simulated: bool = True
    expires_at: Optional[datetime.datetime] = None

class WeatherAlertOut(WeatherAlertCreate, ORMBase):
    id: int
    issued_at: datetime.datetime
    created_at: datetime.datetime


# -------------------------------------------------------------
# Proof of Resolution / Evidence
# -------------------------------------------------------------
class EvidenceOut(ORMBase):
    id: int
    emergency_id: int
    file_path: str
    file_name: str
    file_type: str
    file_size: int
    description: Optional[str] = None
    resolution_notes: Optional[str] = None
    uploaded_by_user_id: Optional[int] = None
    created_at: datetime.datetime


# -------------------------------------------------------------
# Incident History & Audit Logs
# -------------------------------------------------------------
class IncidentHistoryOut(ORMBase):
    id: int
    emergency_id: int
    event_type: str
    description: str
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime.datetime

class AuditLogOut(ORMBase):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime.datetime


# -------------------------------------------------------------
# Duplicate Emergency Management
# -------------------------------------------------------------
class EmergencyDuplicateOut(ORMBase):
    id: int
    original_emergency_id: int
    duplicate_emergency_id: int
    similarity_score: float
    distance_meters: float
    time_diff_minutes: float
    status: str
    reviewed_by_user_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

class DuplicateResolution(BaseModel):
    status: str  # CONFIRMED_DUPLICATE, SEPARATE, MERGED
    notes: Optional[str] = None


# -------------------------------------------------------------
# AI Engine Schemas
# -------------------------------------------------------------
class PriorityScoreResult(BaseModel):
    priority_score: float
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    reasons: List[str]

class ResourceRecommendationItem(BaseModel):
    resource_name: str
    category: str
    recommended_quantity: int
    unit: str
    available_quantity: int
    shortage: int
    reason: str

class ResourceRecommendationResponse(BaseModel):
    emergency_id: Optional[int] = None
    emergency_type: str
    people_affected: int
    severity: str
    recommendations: List[ResourceRecommendationItem]

class VolunteerMatchItem(BaseModel):
    volunteer_id: int
    name: str
    phone: str
    distance_km: float
    eta_minutes: float
    matching_skills: List[str]
    all_skills: List[str]
    match_score: float
    availability: str
    active_tasks: int
    reason: str

class VolunteerMatchResponse(BaseModel):
    emergency_id: Optional[int] = None
    required_skills: List[str]
    matched_volunteers: List[VolunteerMatchItem]


# -------------------------------------------------------------
# Operational Map & Analytics Schemas
# -------------------------------------------------------------
class MapMarker(BaseModel):
    id: str
    entity_type: str  # emergency, team, shelter, resource, disaster
    name: str
    latitude: float
    longitude: float
    status: str
    severity: Optional[str] = None
    details: Dict[str, Any]

class MapOverviewOut(BaseModel):
    emergencies: List[MapMarker]
    rescue_teams: List[MapMarker]
    shelters: List[MapMarker]
    resources: List[MapMarker]
    disasters: List[MapMarker]
    weather_alerts: List[WeatherAlertOut]

class AnalyticsOverview(BaseModel):
    total_emergencies: int
    pending_emergencies: int
    in_progress_emergencies: int
    resolved_emergencies: int
    emergencies_by_severity: Dict[str, int]
    emergencies_by_status: Dict[str, int]
    emergencies_by_type: Dict[str, int]
    total_rescue_teams: int
    available_rescue_teams: int
    total_volunteers: int
    available_volunteers: int
    total_shelters: int
    total_shelter_capacity: int
    total_shelter_occupied: int
    shelter_occupancy_rate_pct: float
    resource_shortages_count: int
    active_disasters_count: int
    avg_response_time_minutes: float
    avg_resolution_time_minutes: float


# -------------------------------------------------------------
# Nearby Assistance & Location Intelligence Schemas
# -------------------------------------------------------------
class NearbyResource(BaseModel):
    id: int
    name: str
    type: str  # category
    available_quantity: int
    total_quantity: int
    unit: str = "units"
    latitude: float
    longitude: float
    distance_km: float
    availability_status: str  # AVAILABLE, DEPLETED
    location_name: Optional[str] = None
    last_updated: Optional[datetime.datetime] = None
    eta_minutes: Optional[float] = None

class NearbyShelter(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    distance_km: float
    total_capacity: int
    occupied_capacity: int
    available_capacity: int
    status: str  # OPEN, FULL, CLOSED
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    has_medical: Optional[bool] = False
    has_food: Optional[bool] = True
    last_updated: Optional[datetime.datetime] = None
    eta_minutes: Optional[float] = None

class NearbyRescueTeam(BaseModel):
    id: int
    name: str
    team_leader: Optional[str] = None
    contact_phone: Optional[str] = None
    specialty: Optional[str] = None
    status: str  # AVAILABLE, BUSY, OFFLINE
    members_count: int = 6
    skills: List[str] = []
    equipment: List[str] = []
    latitude: float
    longitude: float
    distance_km: float
    last_updated: Optional[datetime.datetime] = None
    eta_minutes: Optional[float] = None

class NearbyEmergency(BaseModel):
    id: int
    emergency_type: str
    severity: str
    status: str
    address: str
    people_affected: int = 1
    distance_km: float
    latitude: float
    longitude: float
    created_at: datetime.datetime
    eta_minutes: Optional[float] = None

class AIRecommendedTeam(BaseModel):
    id: int
    name: str
    distance_km: float
    availability: str
    reasons: List[str]

class AIRecommendedShelter(BaseModel):
    id: int
    name: str
    distance_km: float
    available_capacity: int
    has_medical: bool
    reasons: List[str]

class AIRecommendedResource(BaseModel):
    id: int
    name: str
    type: str
    available_quantity: int
    distance_km: float
    reasons: List[str]

class NearbyAIRecommendations(BaseModel):
    recommended_team: Optional[AIRecommendedTeam] = None
    recommended_shelter: Optional[AIRecommendedShelter] = None
    recommended_resource: Optional[AIRecommendedResource] = None

class NearbyLocationResponse(BaseModel):
    user_location: Dict[str, float]
    radius_km: float
    resources: List[NearbyResource]
    shelters: List[NearbyShelter]
    rescue_teams: List[NearbyRescueTeam]
    emergencies: Optional[List[NearbyEmergency]] = []
    ai_recommendations: Optional[NearbyAIRecommendations] = None
    timestamp: datetime.datetime
    last_updated: Optional[datetime.datetime] = None

# Backward compatibility aliases
NearbyResourceItem = NearbyResource
NearbyShelterItem = NearbyShelter
NearbyTeamItem = NearbyRescueTeam
NearbyEmergencyItem = NearbyEmergency
NearbyAssistanceOut = NearbyLocationResponse


