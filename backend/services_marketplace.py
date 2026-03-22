"""
Services Marketplace Models and Routes for YAMA+
Professional services marketplace (like Expat-Dakar)
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ============== MODELS ==============

class ServiceCategory(BaseModel):
    category_id: str
    name: str
    name_fr: str
    icon: str
    description: str
    subcategories: List[str] = []

class ProviderBase(BaseModel):
    name: str
    profession: str
    category: str
    subcategory: Optional[str] = None
    description: str
    city: str
    zone: Optional[str] = None
    phone: str
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    price_from: Optional[int] = None
    price_description: Optional[str] = None
    availability: str = "available"  # available, busy, unavailable
    experience_years: Optional[int] = None
    photos: List[str] = []
    # New document fields for verification
    profile_photo: Optional[str] = None
    id_document: Optional[str] = None
    address_proof: Optional[str] = None
    
class ProviderCreate(ProviderBase):
    password: str
    invitation_code: Optional[str] = None

class Provider(ProviderBase):
    provider_id: str
    user_id: Optional[str] = None
    is_verified: bool = False
    is_premium: bool = False
    is_active: bool = False  # Requires admin approval
    rating: float = 0.0
    review_count: int = 0
    completed_jobs: int = 0
    created_at: str
    updated_at: Optional[str] = None

class ProviderReview(BaseModel):
    review_id: str
    provider_id: str
    client_name: str
    client_phone: Optional[str] = None
    rating: int  # 1-5
    comment: str
    photos: List[str] = []
    created_at: str
    is_verified: bool = False

class ServiceRequestCreate(BaseModel):
    category: str
    profession: str
    city: str
    zone: Optional[str] = None
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    client_name: str
    client_phone: str
    client_whatsapp: Optional[str] = None
    client_email: Optional[EmailStr] = None
    address: Optional[str] = None
    photos: List[str] = []
    budget: Optional[str] = None

class ServiceRequest(ServiceRequestCreate):
    request_id: str
    status: str = "new"  # new, in_progress, assigned, confirmed, completed, cancelled
    assigned_provider_id: Optional[str] = None
    assigned_provider_name: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# ============== CATEGORIES DATA ==============

SERVICE_CATEGORIES = [
    {
        "category_id": "construction",
        "name": "Construction & Home",
        "name_fr": "Maison & Construction",
        "icon": "🏠",
        "description": "Travaux de construction, rénovation et aménagement",
        "subcategories": ["Peintre", "Maçon", "Carreleur", "Menuisier", "Tapissier", "Plâtrier", "Ferrailleur"]
    },
    {
        "category_id": "electricity_plumbing",
        "name": "Electricity & Plumbing",
        "name_fr": "Électricité & Plomberie",
        "icon": "⚡",
        "description": "Installations et réparations électriques et plomberie",
        "subcategories": ["Électricien", "Plombier", "Climatisation", "Chauffagiste"]
    },
    {
        "category_id": "auto",
        "name": "Auto & Mechanics",
        "name_fr": "Auto & Mécanique",
        "icon": "🚗",
        "description": "Réparation et entretien automobile",
        "subcategories": ["Mécanicien", "Soudeur", "Électricien auto", "Carrossier", "Vitrier auto"]
    },
    {
        "category_id": "beauty",
        "name": "Beauty & Wellness",
        "name_fr": "Beauté & Bien-être",
        "icon": "💅",
        "description": "Services de beauté et bien-être",
        "subcategories": ["Coiffeur", "Coiffeuse", "Esthéticienne", "Maquilleur", "Manucure", "Massage"]
    },
    {
        "category_id": "tech",
        "name": "Tech & Repair",
        "name_fr": "Tech & Réparation",
        "icon": "💻",
        "description": "Réparation et services informatiques",
        "subcategories": ["Informaticien", "Réparateur téléphone", "Réparateur TV", "Réparateur électroménager", "Installateur antenne"]
    },
    {
        "category_id": "cleaning",
        "name": "Cleaning & Household",
        "name_fr": "Nettoyage & Maison",
        "icon": "🧹",
        "description": "Services de nettoyage et entretien maison",
        "subcategories": ["Femme de ménage", "Agent de nettoyage", "Jardinier", "Gardien", "Cuisinier"]
    },
    {
        "category_id": "transport",
        "name": "Transport & Moving",
        "name_fr": "Transport & Déménagement",
        "icon": "🚚",
        "description": "Services de transport et déménagement",
        "subcategories": ["Déménageur", "Transporteur", "Coursier", "Chauffeur"]
    },
    {
        "category_id": "events",
        "name": "Events & Entertainment",
        "name_fr": "Événements & Animation",
        "icon": "🎉",
        "description": "Organisation et animation d'événements",
        "subcategories": ["DJ", "Photographe", "Vidéaste", "Décorateur", "Traiteur", "Animateur"]
    },
    {
        "category_id": "education",
        "name": "Education & Tutoring",
        "name_fr": "Éducation & Cours",
        "icon": "📚",
        "description": "Cours particuliers et formation",
        "subcategories": ["Professeur", "Répétiteur", "Coach", "Formateur", "Traducteur"]
    },
    {
        "category_id": "other",
        "name": "Other Services",
        "name_fr": "Autres Services",
        "icon": "🔧",
        "description": "Autres services professionnels",
        "subcategories": ["Couturier", "Cordonnier", "Serrurier", "Forgeron", "Autre"]
    }
]

# Cities in Senegal
SENEGAL_CITIES = [
    "Dakar", "Pikine", "Guédiawaye", "Rufisque", "Bargny", "Diamniadio",
    "Thiès", "Mbour", "Saly", "Somone",
    "Saint-Louis", "Richard-Toll",
    "Kaolack", "Fatick",
    "Ziguinchor", "Cap Skirring",
    "Tambacounda", "Kédougou",
    "Louga", "Diourbel", "Touba",
    "Kolda", "Sédhiou", "Matam"
]

# Dakar zones
DAKAR_ZONES = [
    "Plateau", "Médina", "Fass", "Colobane", "Grand Dakar",
    "Parcelles Assainies", "Grand Yoff", "Patte d'Oie", "Ouakam",
    "Ngor", "Almadies", "Yoff", "Mermoz", "Sacré-Cœur",
    "Point E", "Fann", "Liberté", "Dieuppeul", "Derklé",
    "HLM", "Sicap", "Karack", "Biscuiterie", "Hann",
    "Thiaroye", "Pikine", "Guédiawaye", "Keur Massar",
    "Rufisque", "Bargny", "Diamniadio", "Sébikotane"
]
