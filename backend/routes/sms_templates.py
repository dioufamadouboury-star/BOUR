"""
SMS Templates Routes - Extracted from server.py
"""
from fastapi import APIRouter, Request, Depends, HTTPException
import secrets
import re
from datetime import datetime, timezone

router = APIRouter(prefix="/admin/sms", tags=["SMS"])

# Import shared dependencies
from server import db, User, require_admin

# Routes
@router.get("/templates")
async def get_sms_templates(user: User = Depends(require_admin)):
    """Get custom SMS templates"""
    templates = await db.sms_templates.find({}, {"_id": 0}).to_list(50)
    
    # Default templates if none exist
    if not templates:
        defaults = [
            {"template_id": "tpl_payment", "name": "Confirmation paiement", "message": "Bonjour {{nom}}, votre paiement de {{montant}} FCFA a été reçu. Merci ! GROUPE YAMA+", "category": "paiement", "variables": ["nom", "montant"]},
            {"template_id": "tpl_reservation", "name": "Confirmation réservation", "message": "Bonjour {{nom}}, votre réservation pour {{service}} est confirmée le {{date}} à {{heure}}. GROUPE YAMA+ 78 382 75 75", "category": "reservation", "variables": ["nom", "service", "date", "heure"]},
            {"template_id": "tpl_immobilier", "name": "Visite immobilier", "message": "Bonjour {{nom}}, votre visite du bien {{bien}} est prévue le {{date}}. Adresse: {{adresse}}. GROUPE YAMA+", "category": "immobilier", "variables": ["nom", "bien", "date", "adresse"]},
            {"template_id": "tpl_promo", "name": "Promotion", "message": "YAMA+ : -{{reduction}}% sur {{produit}} ! Offre valable jusqu'au {{date}}. groupeyamaplus.com", "category": "promo", "variables": ["reduction", "produit", "date"]},
        ]
        for tpl in defaults:
            await db.sms_templates.insert_one(tpl)
        templates = defaults
    
    return {"templates": templates}

@router.post("/templates")
async def create_sms_template(request: Request, user: User = Depends(require_admin)):
    """Create a custom SMS template"""
    body = await request.json()
    
    # Extract variables from message ({{variable}})
    variables = re.findall(r'\{\{(\w+)\}\}', body.get("message", ""))
    
    template = {
        "template_id": f"tpl_{secrets.token_hex(4)}",
        "name": body.get("name"),
        "message": body.get("message"),
        "category": body.get("category", "custom"),
        "variables": variables,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sms_templates.insert_one(template)
    return {"success": True, "template": {k: v for k, v in template.items() if k != "_id"}}

@router.delete("/templates/{template_id}")
async def delete_sms_template(template_id: str, user: User = Depends(require_admin)):
    """Delete an SMS template"""
    result = await db.sms_templates.delete_one({"template_id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return {"success": True}
