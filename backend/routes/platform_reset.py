"""
Platform Reset Routes - Extracted from server.py
"""
from fastapi import APIRouter, Request, Depends, HTTPException
from datetime import datetime, timezone

router = APIRouter(prefix="/admin/platform", tags=["Platform"])

# Import shared dependencies
from server import db, logger, User, require_admin

# Routes
@router.post("/reset")
async def reset_platform(request: Request, user: User = Depends(require_admin)):
    """Reset platform data with backup"""
    body = await request.json()
    confirm_code = body.get("confirm_code")
    reset_options = body.get("options", {})
    
    # Require confirmation code
    if confirm_code != "RESET-YAMA-2026":
        raise HTTPException(status_code=400, detail="Code de confirmation invalide")
    
    backup_id = f"BACKUP-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    backup_data = {}
    
    collections_to_reset = []
    
    if reset_options.get("orders", False):
        collections_to_reset.append("orders")
        backup_data["orders"] = await db.orders.find({}, {"_id": 0}).to_list(10000)
    
    if reset_options.get("users", False):
        collections_to_reset.append("users")
        backup_data["users"] = await db.users.find({}, {"_id": 0}).to_list(10000)
    
    if reset_options.get("analytics", False):
        collections_to_reset.extend(["analytics_events", "page_views"])
        backup_data["analytics_events"] = await db.analytics_events.find({}, {"_id": 0}).to_list(10000)
    
    if reset_options.get("carts", False):
        collections_to_reset.append("carts")
        backup_data["carts"] = await db.carts.find({}, {"_id": 0}).to_list(10000)
    
    if reset_options.get("reservations", False):
        collections_to_reset.append("reservations")
        backup_data["reservations"] = await db.reservations.find({}, {"_id": 0}).to_list(10000)
    
    if reset_options.get("marketing", False):
        collections_to_reset.append("marketing_contacts")
        backup_data["marketing_contacts"] = await db.marketing_contacts.find({}, {"_id": 0}).to_list(10000)
    
    if reset_options.get("sms_history", False):
        collections_to_reset.append("sms_history")
        backup_data["sms_history"] = await db.sms_history.find({}, {"_id": 0}).to_list(10000)
    
    # Save backup
    await db.platform_backups.insert_one({
        "backup_id": backup_id,
        "data": backup_data,
        "collections": collections_to_reset,
        "created_by": user.email,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Reset collections
    for collection in collections_to_reset:
        await db[collection].delete_many({})
    
    logger.info(f"Platform reset by {user.email}: {collections_to_reset}")
    
    return {
        "success": True,
        "backup_id": backup_id,
        "reset_collections": collections_to_reset,
        "message": f"Réinitialisation effectuée. Backup: {backup_id}"
    }

@router.get("/backups")
async def get_platform_backups(user: User = Depends(require_admin)):
    """Get list of platform backups"""
    backups = await db.platform_backups.find({}, {"_id": 0, "data": 0}).sort("created_at", -1).to_list(20)
    return {"backups": backups}

@router.post("/restore/{backup_id}")
async def restore_platform_backup(backup_id: str, user: User = Depends(require_admin)):
    """Restore from a backup"""
    backup = await db.platform_backups.find_one({"backup_id": backup_id})
    if not backup:
        raise HTTPException(status_code=404, detail="Backup non trouvé")
    
    restored = []
    for collection, data in backup.get("data", {}).items():
        if data:
            await db[collection].delete_many({})
            await db[collection].insert_many(data)
            restored.append(collection)
    
    return {"success": True, "restored_collections": restored}
