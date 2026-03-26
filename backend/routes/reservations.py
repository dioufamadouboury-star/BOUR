"""
Reservation Routes - Extracted from server.py
"""
from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import secrets
from datetime import datetime, timezone
import asyncio

router = APIRouter(tags=["Reservations"])

# Import shared dependencies
from server import (
    db, logger, User, require_admin,
    send_email_async, get_email_template,
    collect_marketing_contact, send_sms_notification,
    ADMIN_NOTIFICATION_EMAIL, SITE_URL
)

# Models
class ReservationCreate(BaseModel):
    type: str  # "transport", "service", "immobilier"
    item_id: Optional[str] = None
    item_name: str
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None
    seats: Optional[int] = 1

# Public Routes
@router.post("/reservations")
async def create_reservation(data: ReservationCreate):
    """Create a reservation for transport or service"""
    reservation_id = f"RES-{secrets.token_hex(4).upper()}"
    
    reservation = {
        "reservation_id": reservation_id,
        **data.dict(),
        "status": "pending",
        "admin_notes": None,
        "confirmed_date": None,
        "confirmed_time": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.reservations.insert_one(reservation)
    
    # Notify admin
    asyncio.create_task(send_email_async(
        to=ADMIN_NOTIFICATION_EMAIL,
        subject=f"🔔 Nouvelle réservation #{reservation_id}",
        html=get_email_template(f"""
            <h2>Nouvelle réservation</h2>
            <p><strong>ID:</strong> {reservation_id}</p>
            <p><strong>Type:</strong> {data.type}</p>
            <p><strong>Service:</strong> {data.item_name}</p>
            <p><strong>Client:</strong> {data.client_name}</p>
            <p><strong>Téléphone:</strong> {data.client_phone}</p>
            <a href="{SITE_URL}/admin" style="display: inline-block; padding: 12px 24px; background: #1B4332; color: #fff; text-decoration: none; border-radius: 8px;">Gérer la réservation</a>
        """, "Nouvelle réservation")
    ))
    
    # Collect marketing contact
    if data.client_email or data.client_phone:
        await collect_marketing_contact(data.client_name, data.client_email, data.client_phone, "reservation")
    
    return {"success": True, "reservation_id": reservation_id, "message": "Votre réservation a été envoyée."}

# Admin Routes
@router.get("/admin/reservations")
async def get_admin_reservations(
    status: Optional[str] = None,
    type: Optional[str] = None,
    user: User = Depends(require_admin)
):
    """Get all reservations for admin"""
    query = {}
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    total = await db.reservations.count_documents(query)
    
    return {"reservations": reservations, "total": total}

@router.put("/admin/reservations/{reservation_id}/confirm")
async def confirm_reservation(reservation_id: str, request: Request, user: User = Depends(require_admin)):
    """Admin confirms a reservation"""
    body = await request.json()
    confirmed_date = body.get("confirmed_date")
    confirmed_time = body.get("confirmed_time")
    admin_notes = body.get("admin_notes")
    send_sms = body.get("send_sms", False)
    send_email = body.get("send_email", True)
    
    reservation = await db.reservations.find_one({"reservation_id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    await db.reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {
            "status": "confirmed",
            "confirmed_date": confirmed_date,
            "confirmed_time": confirmed_time,
            "admin_notes": admin_notes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if send_email and reservation.get("client_email"):
        asyncio.create_task(send_email_async(
            to=reservation["client_email"],
            subject="✅ Votre réservation est confirmée - GROUPE YAMA+",
            html=get_email_template(f"""
                <h2>Réservation confirmée !</h2>
                <p>Bonjour {reservation['client_name']},</p>
                <p>Votre réservation <strong>#{reservation_id}</strong> a été confirmée.</p>
                <p><strong>Date:</strong> {confirmed_date or reservation.get('date')}</p>
                <p><strong>Heure:</strong> {confirmed_time or reservation.get('time')}</p>
            """, "Réservation confirmée")
        ))
    
    if send_sms and reservation.get("client_phone"):
        msg = f"YAMA+ : Votre réservation #{reservation_id} est confirmée pour le {confirmed_date}. Tel: 78 382 75 75"
        asyncio.create_task(send_sms_notification(reservation["client_phone"], msg))
    
    return {"message": "Réservation confirmée"}

@router.put("/admin/reservations/{reservation_id}/reject")
async def reject_reservation(reservation_id: str, request: Request, user: User = Depends(require_admin)):
    """Admin rejects a reservation"""
    body = await request.json()
    reason = body.get("reason", "")
    
    reservation = await db.reservations.find_one({"reservation_id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    await db.reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {
            "status": "rejected",
            "admin_notes": reason,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Réservation refusée"}
