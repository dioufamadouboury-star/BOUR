"""
Appointments Routes Module
Handles appointment booking, management, and reminders
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
import uuid
import asyncio

router = APIRouter(prefix="/api", tags=["appointments"])

# Dependencies injected from main server
db = None
require_admin = None
send_email_async = None
get_email_template = None
send_sms_notification = None
ADMIN_NOTIFICATION_EMAIL = ""
STORE_ADDRESS = ""

def init_appointments_routes(
    database, 
    admin_dep, 
    email_fn=None, 
    template_fn=None, 
    sms_fn=None,
    admin_email="",
    store_address=""
):
    """Initialize module with dependencies"""
    global db, require_admin, send_email_async, get_email_template
    global send_sms_notification, ADMIN_NOTIFICATION_EMAIL, STORE_ADDRESS
    db = database
    require_admin = admin_dep
    send_email_async = email_fn
    get_email_template = template_fn
    send_sms_notification = sms_fn
    ADMIN_NOTIFICATION_EMAIL = admin_email
    STORE_ADDRESS = store_address


class AppointmentRequest(BaseModel):
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    category: Optional[str] = None
    appointment_type: str = "general"  # general, immobilier, automobile
    name: str
    email: EmailStr
    phone: str
    preferred_date: str
    preferred_time: str
    message: Optional[str] = None
    contact_method: str = "whatsapp"


@router.post("/appointments")
async def create_appointment(data: AppointmentRequest):
    """Create a visit appointment request"""
    appointment_id = f"rdv_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    
    subject_name = data.product_name or data.property_title or "Non spécifié"
    type_labels = {
        "immobilier": "Visite immobilier", 
        "automobile": "Rendez-vous automobile", 
        "general": "Rendez-vous"
    }

    appointment_doc = {
        "appointment_id": appointment_id,
        "appointment_type": data.appointment_type,
        "product_id": data.product_id,
        "product_name": data.product_name,
        "property_id": data.property_id,
        "property_title": data.property_title,
        "category": data.category,
        "customer": {
            "name": data.name,
            "email": data.email,
            "phone": data.phone
        },
        "preferred_date": data.preferred_date,
        "preferred_time": data.preferred_time,
        "message": data.message,
        "contact_method": data.contact_method,
        "status": "pending",
        "confirmed_date": None,
        "confirmed_time": None,
        "meeting_address": None,
        "meeting_contact": None,
        "reminder_sent": False,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.appointments.insert_one(appointment_doc)
    
    type_label = type_labels.get(data.appointment_type, "Rendez-vous")
    
    # Admin notification
    if send_email_async and ADMIN_NOTIFICATION_EMAIL:
        admin_html = f"""
        <h2>🗓️ {type_label}</h2>
        <p><strong>Client:</strong> {data.name}</p>
        <p><strong>Téléphone:</strong> {data.phone}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Date souhaitée:</strong> {data.preferred_date} à {data.preferred_time}</p>
        <p><strong>Bien/Produit:</strong> {subject_name}</p>
        <p><strong>Contact préféré:</strong> {data.contact_method}</p>
        <p><strong>Message:</strong> {data.message or 'Aucun'}</p>
        """
        asyncio.create_task(send_email_async(
            to=ADMIN_NOTIFICATION_EMAIL,
            subject=f"🗓️ {type_label} - {data.name} - {data.preferred_date}",
            html=get_email_template(admin_html, type_label) if get_email_template else admin_html
        ))

    # Customer confirmation
    if send_email_async:
        customer_html = f"""
        <h2>Demande de {type_label.lower()} reçue !</h2>
        <p>Bonjour {data.name},</p>
        <p>Nous avons bien reçu votre demande de visite pour le <strong>{data.preferred_date}</strong> à <strong>{data.preferred_time}</strong>.</p>
        <p><strong>Bien/Produit:</strong> {subject_name}</p>
        <p>Notre équipe vous contactera très bientôt.</p>
        <p><strong>Numéro de demande:</strong> {appointment_id}</p>
        """
        asyncio.create_task(send_email_async(
            to=data.email,
            subject=f"📅 {type_label} reçue - GROUPE YAMA+",
            html=get_email_template(customer_html, "Confirmation") if get_email_template else customer_html
        ))
    
    return {"message": "Demande de rendez-vous envoyée", "appointment_id": appointment_id}


@router.get("/admin/appointments")
async def get_appointments(
    status: Optional[str] = None,
    appointment_type: Optional[str] = None,
    limit: int = 50,
    user = Depends(lambda: require_admin)
):
    """Get all appointments for admin"""
    query = {}
    if status:
        query["status"] = status
    if appointment_type:
        query["appointment_type"] = appointment_type
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return appointments


@router.get("/admin/appointments/stats")
async def get_appointments_stats(user = Depends(lambda: require_admin)):
    """Get appointment statistics"""
    total = await db.appointments.count_documents({})
    pending = await db.appointments.count_documents({"status": "pending"})
    confirmed = await db.appointments.count_documents({"status": "confirmed"})
    completed = await db.appointments.count_documents({"status": "completed"})
    cancelled = await db.appointments.count_documents({"status": "cancelled"})
    
    recent_pending = await db.appointments.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "cancelled": cancelled,
        "recent_pending": recent_pending
    }


@router.put("/admin/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    request: Request,
    user = Depends(lambda: require_admin)
):
    """Update appointment status"""
    body = await request.json()
    status = body.get("status")
    confirmed_date = body.get("confirmed_date")
    confirmed_time = body.get("confirmed_time")
    meeting_address = body.get("meeting_address") or body.get("location")
    meeting_contact = body.get("meeting_contact")
    admin_note = body.get("admin_note")
    send_whatsapp = body.get("send_whatsapp", False)
    send_email = body.get("send_email", True)
    send_sms = body.get("send_sms", False)
    
    appointment = await db.appointments.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if confirmed_date:
        update_data["confirmed_date"] = confirmed_date
    if confirmed_time:
        update_data["confirmed_time"] = confirmed_time
    if meeting_address:
        update_data["meeting_address"] = meeting_address
    if meeting_contact:
        update_data["meeting_contact"] = meeting_contact
    if admin_note:
        update_data["admin_note"] = admin_note
    
    await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": update_data}
    )
    
    customer = appointment.get("customer", {})
    customer_phone = customer.get('phone', '')
    customer_email = customer.get('email', '')
    customer_name = customer.get('name', '')
    subject_name = appointment.get('product_name') or appointment.get('property_title') or 'votre bien/produit'
    apt_type = appointment.get('appointment_type', 'general')
    type_labels = {"immobilier": "Visite immobilier", "automobile": "Rendez-vous automobile", "general": "Rendez-vous"}
    type_label = type_labels.get(apt_type, "Rendez-vous")
    address_display = meeting_address or appointment.get("meeting_address") or STORE_ADDRESS
    contact_display = meeting_contact or appointment.get("meeting_contact") or ""
    
    whatsapp_link = None
    if send_whatsapp and customer_phone and status == "confirmed":
        phone_clean = customer_phone.replace(" ", "").replace("-", "").replace("+", "")
        if not phone_clean.startswith("221"):
            phone_clean = "221" + phone_clean.lstrip("0")
        
        contact_line = f"\n👤 Contact sur place: {contact_display}" if contact_display else ""
        message = f"""Bonjour {customer_name} ! 🎉

Votre {type_label.lower()} chez GROUPE YAMA+ est confirmé !

📅 Date: {confirmed_date or 'À confirmer'}
🕐 Heure: {confirmed_time or 'À confirmer'}
📍 Adresse: {address_display}{contact_line}

Bien/Produit: {subject_name}

À très bientôt !
L'équipe YAMA+"""
        
        whatsapp_link = f"https://wa.me/{phone_clean}?text={message.replace(chr(10), '%0A').replace(' ', '%20')}"
    
    # Email notification
    if status == "confirmed" and confirmed_date and send_email and send_email_async:
        contact_html = f'<p><strong>👤 Contact:</strong> {contact_display}</p>' if contact_display else ""
        html = f"""
        <h2>✅ {type_label} confirmé !</h2>
        <p>Bonjour {customer_name},</p>
        <p>Votre {type_label.lower()} a été confirmé !</p>
        <p><strong>📅 Date:</strong> {confirmed_date}</p>
        <p><strong>🕐 Heure:</strong> {confirmed_time}</p>
        <p><strong>📍 Adresse:</strong> {address_display}</p>
        {contact_html}
        <p>Bien/Produit: <strong>{subject_name}</strong></p>
        """
        asyncio.create_task(send_email_async(
            to=customer_email,
            subject=f"✅ {type_label} confirmé - GROUPE YAMA+",
            html=get_email_template(html, f"{type_label} confirmé") if get_email_template else html
        ))
    
    # SMS notification
    if status == "confirmed" and send_sms and customer_phone and send_sms_notification:
        sms_text = f"YAMA+ - {type_label} confirmé ! {confirmed_date or ''} {confirmed_time or ''}. Adresse: {address_display}."
        asyncio.create_task(send_sms_notification(customer_phone, sms_text))
    
    # Cancellation email
    if status == "cancelled" and send_email_async:
        html = f"""
        <h2>Rendez-vous annulé</h2>
        <p>Bonjour {customer_name},</p>
        <p>Nous sommes désolés, votre rendez-vous a été annulé.</p>
        <p>N'hésitez pas à en programmer un nouveau sur notre site.</p>
        """
        asyncio.create_task(send_email_async(
            to=customer_email,
            subject="Rendez-vous annulé - GROUPE YAMA+",
            html=get_email_template(html, "Rendez-vous annulé") if get_email_template else html
        ))
    
    return {
        "message": "Rendez-vous mis à jour",
        "whatsapp_link": whatsapp_link
    }


@router.delete("/admin/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, user = Depends(lambda: require_admin)):
    """Delete an appointment"""
    result = await db.appointments.delete_one({"appointment_id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    return {"message": "Rendez-vous supprimé"}
