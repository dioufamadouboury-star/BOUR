"""
Commercial Management Module - YAMA+ Business Suite
Handles: Partners, Quotes, Invoices, Proforma, Contracts with Professional PDF Generation
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
import io
import secrets
import os
from pathlib import Path

# Router
commercial_router = APIRouter(prefix="/api/commercial", tags=["Commercial"])

# Logo path
ROOT_DIR = Path(__file__).parent
LOGO_PATH = ROOT_DIR / "logo_yama.png"

# Company Info
COMPANY_INFO = {
    "name": "GROUPE YAMA+",
    "address": "Fass Paillote, Dakar, Sénégal",
    "phone": "+221 78 382 75 75",
    "email": "contact@groupeyamaplus.com",
    "website": "www.groupeyamaplus.com",
    "ninea": "",  # À remplir
    "rc": "",  # Registre de commerce
}

# ============== PYDANTIC MODELS ==============

class PartnerCreate(BaseModel):
    name: str
    type: str = "client"  # client, supplier, partner
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    ninea: Optional[str] = None
    rc: Optional[str] = None
    notes: Optional[str] = None

class QuoteCreate(BaseModel):
    partner_id: str
    items: List[dict]  # [{description, quantity, unit_price, tva}]
    validity_days: int = 30
    notes: Optional[str] = None
    payment_terms: Optional[str] = None

class InvoiceCreate(BaseModel):
    partner_id: str
    quote_id: Optional[str] = None
    items: List[dict]
    due_days: int = 30
    notes: Optional[str] = None
    is_proforma: bool = False

class ContractCreate(BaseModel):
    partner_id: str
    template_id: Optional[str] = None
    title: str
    content: str
    start_date: str
    end_date: Optional[str] = None
    amount: Optional[float] = None
    payment_terms: Optional[str] = None

# ============== PDF GENERATION HELPERS ==============

def get_logo():
    """Get logo for PDF"""
    if LOGO_PATH.exists():
        return str(LOGO_PATH)
    return None

def create_pdf_header(canvas_obj, doc, title, doc_number, doc_date):
    """Create professional PDF header with logo"""
    canvas_obj.saveState()
    
    # Logo
    logo_path = get_logo()
    if logo_path:
        try:
            canvas_obj.drawImage(logo_path, 2*cm, A4[1] - 3*cm, width=4*cm, height=1.5*cm, preserveAspectRatio=True)
        except:
            pass
    
    # Company name
    canvas_obj.setFont("Helvetica-Bold", 16)
    canvas_obj.drawString(7*cm, A4[1] - 2*cm, COMPANY_INFO["name"])
    
    # Company info
    canvas_obj.setFont("Helvetica", 9)
    canvas_obj.drawString(7*cm, A4[1] - 2.5*cm, COMPANY_INFO["address"])
    canvas_obj.drawString(7*cm, A4[1] - 3*cm, f"Tél: {COMPANY_INFO['phone']} | Email: {COMPANY_INFO['email']}")
    
    # Document title and number
    canvas_obj.setFont("Helvetica-Bold", 20)
    canvas_obj.setFillColor(colors.HexColor("#1a1a1a"))
    canvas_obj.drawRightString(A4[0] - 2*cm, A4[1] - 2*cm, title)
    
    canvas_obj.setFont("Helvetica", 11)
    canvas_obj.drawRightString(A4[0] - 2*cm, A4[1] - 2.6*cm, f"N° {doc_number}")
    canvas_obj.drawRightString(A4[0] - 2*cm, A4[1] - 3.1*cm, f"Date: {doc_date}")
    
    # Line separator
    canvas_obj.setStrokeColor(colors.HexColor("#f59e0b"))
    canvas_obj.setLineWidth(2)
    canvas_obj.line(2*cm, A4[1] - 3.5*cm, A4[0] - 2*cm, A4[1] - 3.5*cm)
    
    canvas_obj.restoreState()

def create_pdf_footer(canvas_obj, doc):
    """Create PDF footer"""
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.gray)
    
    # Footer line
    canvas_obj.setStrokeColor(colors.lightgrey)
    canvas_obj.line(2*cm, 2*cm, A4[0] - 2*cm, 2*cm)
    
    # Footer text
    canvas_obj.drawCentredString(A4[0]/2, 1.5*cm, f"{COMPANY_INFO['name']} - {COMPANY_INFO['address']}")
    canvas_obj.drawCentredString(A4[0]/2, 1*cm, f"Tél: {COMPANY_INFO['phone']} | {COMPANY_INFO['website']}")
    
    # Page number
    canvas_obj.drawRightString(A4[0] - 2*cm, 1*cm, f"Page {doc.page}")
    
    canvas_obj.restoreState()

def generate_items_table(items):
    """Generate items table for quotes/invoices"""
    # Table header
    data = [["Description", "Qté", "Prix Unit.", "TVA", "Total HT"]]
    
    total_ht = 0
    total_tva = 0
    
    for item in items:
        qty = item.get("quantity", 1)
        unit_price = item.get("unit_price", 0)
        tva_rate = item.get("tva", 18)
        line_total = qty * unit_price
        line_tva = line_total * (tva_rate / 100)
        total_ht += line_total
        total_tva += line_tva
        
        data.append([
            item.get("description", ""),
            str(qty),
            f"{unit_price:,.0f} FCFA",
            f"{tva_rate}%",
            f"{line_total:,.0f} FCFA"
        ])
    
    # Totals
    data.append(["", "", "", "Total HT:", f"{total_ht:,.0f} FCFA"])
    data.append(["", "", "", "TVA:", f"{total_tva:,.0f} FCFA"])
    data.append(["", "", "", "Total TTC:", f"{total_ht + total_tva:,.0f} FCFA"])
    
    # Create table
    table = Table(data, colWidths=[8*cm, 2*cm, 3*cm, 2*cm, 3*cm])
    table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f59e0b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Body
        ('FONTNAME', (0, 1), (-1, -4), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -4), 9),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        
        # Totals
        ('FONTNAME', (3, -3), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (3, -1), (-1, -1), colors.HexColor("#fef3c7")),
        
        # Grid
        ('GRID', (0, 0), (-1, -4), 0.5, colors.lightgrey),
        ('LINEABOVE', (3, -3), (-1, -3), 1, colors.black),
    ]))
    
    return table, total_ht, total_tva

# ============== QUOTE PDF ==============

def generate_quote_pdf(quote: dict, partner: dict) -> io.BytesIO:
    """Generate professional quote PDF"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=4*cm, bottomMargin=3*cm)
    
    styles = getSampleStyleSheet()
    story = []
    
    # Client info box
    client_info = f"""
    <b>Client:</b> {partner.get('name', 'N/A')}<br/>
    {partner.get('address', '') or ''}<br/>
    {partner.get('city', '') or ''}<br/>
    Tél: {partner.get('phone', '') or 'N/A'}<br/>
    Email: {partner.get('email', '') or 'N/A'}
    """
    
    client_style = ParagraphStyle('ClientBox', parent=styles['Normal'], fontSize=10, leading=14, 
                                   backColor=colors.HexColor("#f5f5f5"), borderPadding=10)
    story.append(Paragraph(client_info, client_style))
    story.append(Spacer(1, 1*cm))
    
    # Object
    story.append(Paragraph(f"<b>Objet:</b> Devis N° {quote.get('quote_number', '')}", styles['Normal']))
    story.append(Spacer(1, 0.5*cm))
    
    # Items table
    items_table, total_ht, total_tva = generate_items_table(quote.get('items', []))
    story.append(items_table)
    story.append(Spacer(1, 1*cm))
    
    # Validity
    validity_style = ParagraphStyle('Validity', parent=styles['Normal'], fontSize=9, textColor=colors.gray)
    story.append(Paragraph(f"Ce devis est valable {quote.get('validity_days', 30)} jours à compter de sa date d'émission.", validity_style))
    
    # Notes
    if quote.get('notes'):
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph(f"<b>Notes:</b> {quote.get('notes')}", styles['Normal']))
    
    # Payment terms
    if quote.get('payment_terms'):
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph(f"<b>Conditions de paiement:</b> {quote.get('payment_terms')}", styles['Normal']))
    
    # Signature area
    story.append(Spacer(1, 2*cm))
    sig_data = [
        ["Bon pour accord", "Signature et cachet du client"],
        ["Date: _______________", ""],
    ]
    sig_table = Table(sig_data, colWidths=[9*cm, 9*cm])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    story.append(sig_table)
    
    # Build PDF with header/footer
    def add_header_footer(canvas_obj, doc):
        create_pdf_header(canvas_obj, doc, "DEVIS", quote.get('quote_number', ''), 
                         quote.get('created_at', '')[:10] if quote.get('created_at') else datetime.now().strftime('%Y-%m-%d'))
        create_pdf_footer(canvas_obj, doc)
    
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    buffer.seek(0)
    return buffer

# ============== INVOICE PDF ==============

def generate_invoice_pdf_commercial(invoice: dict, partner: dict, is_proforma: bool = False) -> io.BytesIO:
    """Generate professional invoice PDF"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=4*cm, bottomMargin=3*cm)
    
    styles = getSampleStyleSheet()
    story = []
    
    title = "FACTURE PROFORMA" if is_proforma else "FACTURE"
    
    # Client info box
    client_info = f"""
    <b>Facturé à:</b><br/>
    {partner.get('name', 'N/A')}<br/>
    {partner.get('address', '') or ''}<br/>
    {partner.get('city', '') or ''}<br/>
    Tél: {partner.get('phone', '') or 'N/A'}<br/>
    Email: {partner.get('email', '') or 'N/A'}<br/>
    {f"NINEA: {partner.get('ninea')}" if partner.get('ninea') else ''}
    """
    
    client_style = ParagraphStyle('ClientBox', parent=styles['Normal'], fontSize=10, leading=14,
                                   backColor=colors.HexColor("#f5f5f5"), borderPadding=10)
    story.append(Paragraph(client_info, client_style))
    story.append(Spacer(1, 1*cm))
    
    # Items table
    items_table, total_ht, total_tva = generate_items_table(invoice.get('items', []))
    story.append(items_table)
    story.append(Spacer(1, 1*cm))
    
    # Payment info
    if not is_proforma:
        due_date = invoice.get('due_date', '')
        status = invoice.get('status', 'pending')
        status_text = {"paid": "PAYÉE", "partial": "PARTIELLEMENT PAYÉE", "pending": "EN ATTENTE", "overdue": "EN RETARD"}.get(status, status)
        
        payment_style = ParagraphStyle('Payment', parent=styles['Normal'], fontSize=10)
        story.append(Paragraph(f"<b>Date d'échéance:</b> {due_date}", payment_style))
        story.append(Paragraph(f"<b>Statut:</b> {status_text}", payment_style))
        
        if invoice.get('amount_paid', 0) > 0:
            story.append(Paragraph(f"<b>Montant payé:</b> {invoice.get('amount_paid', 0):,.0f} FCFA", payment_style))
            remaining = (total_ht + total_tva) - invoice.get('amount_paid', 0)
            story.append(Paragraph(f"<b>Reste à payer:</b> {remaining:,.0f} FCFA", payment_style))
    
    # Notes
    if invoice.get('notes'):
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph(f"<b>Notes:</b> {invoice.get('notes')}", styles['Normal']))
    
    # Payment instructions
    story.append(Spacer(1, 1*cm))
    bank_info = """
    <b>Modalités de paiement:</b><br/>
    Virement bancaire, Wave, Orange Money, ou espèces.<br/>
    Pour tout paiement par virement, merci d'indiquer le numéro de facture en référence.
    """
    story.append(Paragraph(bank_info, styles['Normal']))
    
    # Build PDF
    def add_header_footer(canvas_obj, doc):
        create_pdf_header(canvas_obj, doc, title, invoice.get('invoice_number', ''),
                         invoice.get('created_at', '')[:10] if invoice.get('created_at') else datetime.now().strftime('%Y-%m-%d'))
        create_pdf_footer(canvas_obj, doc)
    
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    buffer.seek(0)
    return buffer

# ============== CONTRACT PDF ==============

def generate_contract_pdf(contract: dict, partner: dict) -> io.BytesIO:
    """Generate professional contract PDF"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=4*cm, bottomMargin=3*cm)
    
    styles = getSampleStyleSheet()
    story = []
    
    # Parties
    story.append(Paragraph("<b>ENTRE LES SOUSSIGNÉS:</b>", styles['Heading2']))
    story.append(Spacer(1, 0.3*cm))
    
    # Party 1 - Company
    party1 = f"""
    <b>{COMPANY_INFO['name']}</b>, société établie à {COMPANY_INFO['address']},
    représentée par son Directeur Général,<br/>
    Ci-après dénommée <b>"Le Prestataire"</b>
    """
    story.append(Paragraph(party1, styles['Normal']))
    story.append(Spacer(1, 0.5*cm))
    
    story.append(Paragraph("<b>ET</b>", ParagraphStyle('Center', parent=styles['Normal'], alignment=TA_CENTER)))
    story.append(Spacer(1, 0.5*cm))
    
    # Party 2 - Client/Partner
    party2 = f"""
    <b>{partner.get('name', 'N/A')}</b>, {partner.get('address', '') or 'domicilié à'} {partner.get('city', '')},
    {f"NINEA: {partner.get('ninea')}" if partner.get('ninea') else ''}<br/>
    Ci-après dénommé <b>"Le Client"</b>
    """
    story.append(Paragraph(party2, styles['Normal']))
    story.append(Spacer(1, 1*cm))
    
    # Contract title
    story.append(Paragraph(f"<b>OBJET: {contract.get('title', 'Contrat de prestation')}</b>", styles['Heading2']))
    story.append(Spacer(1, 0.5*cm))
    
    # Contract content
    content = contract.get('content', '')
    for paragraph in content.split('\n\n'):
        if paragraph.strip():
            story.append(Paragraph(paragraph, styles['Normal']))
            story.append(Spacer(1, 0.3*cm))
    
    # Duration
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f"<b>Durée:</b> Du {contract.get('start_date', '')} au {contract.get('end_date', 'durée indéterminée')}", styles['Normal']))
    
    # Amount
    if contract.get('amount'):
        story.append(Paragraph(f"<b>Montant:</b> {contract.get('amount'):,.0f} FCFA", styles['Normal']))
    
    # Payment terms
    if contract.get('payment_terms'):
        story.append(Paragraph(f"<b>Conditions de paiement:</b> {contract.get('payment_terms')}", styles['Normal']))
    
    # Signatures
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph("<b>Fait en deux exemplaires originaux,</b>", styles['Normal']))
    story.append(Paragraph(f"À Dakar, le {datetime.now().strftime('%d/%m/%Y')}", styles['Normal']))
    story.append(Spacer(1, 1*cm))
    
    sig_data = [
        ["Le Prestataire", "Le Client"],
        [COMPANY_INFO['name'], partner.get('name', '')],
        ["", ""],
        ["Signature et cachet", "Signature et cachet"],
        ["", ""],
        ["", ""],
        ["", ""],
    ]
    sig_table = Table(sig_data, colWidths=[9*cm, 9*cm])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(sig_table)
    
    # Build PDF
    def add_header_footer(canvas_obj, doc):
        create_pdf_header(canvas_obj, doc, "CONTRAT", contract.get('contract_number', ''),
                         contract.get('created_at', '')[:10] if contract.get('created_at') else datetime.now().strftime('%Y-%m-%d'))
        create_pdf_footer(canvas_obj, doc)
    
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    buffer.seek(0)
    return buffer


# ============== API ENDPOINTS ==============

def create_commercial_endpoints(db, require_admin):
    """Create all commercial endpoints - called from main server.py"""
    
    # Dashboard
    @commercial_router.get("/dashboard")
    async def get_commercial_dashboard(user = Depends(require_admin)):
        """Get commercial dashboard stats"""
        # Count documents
        partners_count = await db.commercial_partners.count_documents({})
        quotes_count = await db.commercial_quotes.count_documents({})
        invoices_count = await db.commercial_invoices.count_documents({})
        contracts_count = await db.commercial_contracts.count_documents({})
        
        # Revenue this month
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        paid_invoices = await db.commercial_invoices.find({
            "status": "paid",
            "paid_at": {"$gte": month_start}
        }).to_list(1000)
        
        monthly_revenue = sum(inv.get('total_ttc', 0) for inv in paid_invoices)
        
        # Pending quotes value
        pending_quotes = await db.commercial_quotes.find({"status": "pending"}).to_list(1000)
        pending_value = sum(q.get('total_ttc', 0) for q in pending_quotes)
        
        return {
            "partners": partners_count,
            "quotes": quotes_count,
            "invoices": invoices_count,
            "contracts": contracts_count,
            "monthly_revenue": monthly_revenue,
            "pending_quotes_value": pending_value,
        }
    
    # ============== PARTNERS ==============
    
    @commercial_router.get("/partners")
    async def get_partners(type: str = None, search: str = None, user = Depends(require_admin)):
        """Get all commercial partners"""
        query = {}
        if type:
            query["type"] = type
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
            ]
        
        partners = await db.commercial_partners.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
        return {"partners": partners, "total": len(partners)}
    
    @commercial_router.post("/partners")
    async def create_partner(data: PartnerCreate, user = Depends(require_admin)):
        """Create a new commercial partner"""
        partner_id = f"PRT-{secrets.token_hex(4).upper()}"
        
        partner = {
            "partner_id": partner_id,
            **data.dict(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None,
        }
        
        await db.commercial_partners.insert_one(partner)
        return {"success": True, "partner_id": partner_id}
    
    @commercial_router.put("/partners/{partner_id}")
    async def update_partner(partner_id: str, request: Request, user = Depends(require_admin)):
        """Update a partner"""
        data = await request.json()
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.commercial_partners.update_one(
            {"partner_id": partner_id},
            {"$set": data}
        )
        return {"success": True}
    
    @commercial_router.delete("/partners/{partner_id}")
    async def delete_partner(partner_id: str, user = Depends(require_admin)):
        """Delete a partner"""
        await db.commercial_partners.delete_one({"partner_id": partner_id})
        return {"success": True}
    
    # ============== QUOTES ==============
    
    @commercial_router.get("/quotes")
    async def get_quotes(status: str = None, partner_id: str = None, user = Depends(require_admin)):
        """Get all quotes"""
        query = {}
        if status:
            query["status"] = status
        if partner_id:
            query["partner_id"] = partner_id
        
        quotes = await db.commercial_quotes.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
        return {"quotes": quotes, "total": len(quotes)}
    
    @commercial_router.post("/quotes")
    async def create_quote(data: QuoteCreate, user = Depends(require_admin)):
        """Create a new quote"""
        # Get partner
        partner = await db.commercial_partners.find_one({"partner_id": data.partner_id}, {"_id": 0})
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        # Generate quote number
        count = await db.commercial_quotes.count_documents({})
        quote_number = f"DEV-{datetime.now().year}-{str(count + 1).zfill(4)}"
        
        # Calculate totals
        total_ht = sum(item.get('quantity', 1) * item.get('unit_price', 0) for item in data.items)
        total_tva = sum(item.get('quantity', 1) * item.get('unit_price', 0) * item.get('tva', 18) / 100 for item in data.items)
        
        quote = {
            "quote_id": f"QT-{secrets.token_hex(4).upper()}",
            "quote_number": quote_number,
            "partner_id": data.partner_id,
            "partner_name": partner.get("name"),
            "items": data.items,
            "total_ht": total_ht,
            "total_tva": total_tva,
            "total_ttc": total_ht + total_tva,
            "validity_days": data.validity_days,
            "notes": data.notes,
            "payment_terms": data.payment_terms,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.commercial_quotes.insert_one(quote)
        return {"success": True, "quote_id": quote["quote_id"], "quote_number": quote_number}
    
    @commercial_router.get("/quotes/{quote_id}/pdf")
    async def get_quote_pdf(quote_id: str, user = Depends(require_admin)):
        """Generate quote PDF"""
        from fastapi.responses import StreamingResponse
        
        quote = await db.commercial_quotes.find_one({"quote_id": quote_id}, {"_id": 0})
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        partner = await db.commercial_partners.find_one({"partner_id": quote["partner_id"]}, {"_id": 0})
        if not partner:
            partner = {"name": "Client inconnu"}
        
        pdf_buffer = generate_quote_pdf(quote, partner)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Devis_{quote['quote_number']}.pdf"}
        )
    
    @commercial_router.put("/quotes/{quote_id}")
    async def update_quote(quote_id: str, request: Request, user = Depends(require_admin)):
        """Update quote status"""
        data = await request.json()
        await db.commercial_quotes.update_one(
            {"quote_id": quote_id},
            {"$set": {**data, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"success": True}
    
    @commercial_router.post("/quotes/{quote_id}/convert-to-invoice")
    async def convert_quote_to_invoice(quote_id: str, user = Depends(require_admin)):
        """Convert a quote to an invoice"""
        quote = await db.commercial_quotes.find_one({"quote_id": quote_id}, {"_id": 0})
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Generate invoice number
        count = await db.commercial_invoices.count_documents({})
        invoice_number = f"FAC-{datetime.now().year}-{str(count + 1).zfill(4)}"
        
        invoice = {
            "invoice_id": f"INV-{secrets.token_hex(4).upper()}",
            "invoice_number": invoice_number,
            "partner_id": quote["partner_id"],
            "partner_name": quote.get("partner_name"),
            "quote_id": quote_id,
            "items": quote["items"],
            "total_ht": quote["total_ht"],
            "total_tva": quote["total_tva"],
            "total_ttc": quote["total_ttc"],
            "amount_paid": 0,
            "status": "pending",
            "is_proforma": False,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.commercial_invoices.insert_one(invoice)
        
        # Update quote status
        await db.commercial_quotes.update_one(
            {"quote_id": quote_id},
            {"$set": {"status": "converted", "invoice_id": invoice["invoice_id"]}}
        )
        
        return {"success": True, "invoice_id": invoice["invoice_id"], "invoice_number": invoice_number}
    
    # ============== INVOICES ==============
    
    @commercial_router.get("/invoices")
    async def get_invoices(status: str = None, is_proforma: bool = None, user = Depends(require_admin)):
        """Get all invoices"""
        query = {}
        if status:
            query["status"] = status
        if is_proforma is not None:
            query["is_proforma"] = is_proforma
        
        invoices = await db.commercial_invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
        return {"invoices": invoices, "total": len(invoices)}
    
    @commercial_router.post("/invoices")
    async def create_invoice(data: InvoiceCreate, user = Depends(require_admin)):
        """Create a new invoice or proforma"""
        partner = await db.commercial_partners.find_one({"partner_id": data.partner_id}, {"_id": 0})
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        # Generate invoice number
        prefix = "PRO" if data.is_proforma else "FAC"
        count = await db.commercial_invoices.count_documents({"is_proforma": data.is_proforma})
        invoice_number = f"{prefix}-{datetime.now().year}-{str(count + 1).zfill(4)}"
        
        total_ht = sum(item.get('quantity', 1) * item.get('unit_price', 0) for item in data.items)
        total_tva = sum(item.get('quantity', 1) * item.get('unit_price', 0) * item.get('tva', 18) / 100 for item in data.items)
        
        invoice = {
            "invoice_id": f"INV-{secrets.token_hex(4).upper()}",
            "invoice_number": invoice_number,
            "partner_id": data.partner_id,
            "partner_name": partner.get("name"),
            "quote_id": data.quote_id,
            "items": data.items,
            "total_ht": total_ht,
            "total_tva": total_tva,
            "total_ttc": total_ht + total_tva,
            "amount_paid": 0,
            "status": "pending",
            "is_proforma": data.is_proforma,
            "notes": data.notes,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=data.due_days)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.commercial_invoices.insert_one(invoice)
        return {"success": True, "invoice_id": invoice["invoice_id"], "invoice_number": invoice_number}
    
    @commercial_router.get("/invoices/{invoice_id}/pdf")
    async def get_invoice_pdf(invoice_id: str, user = Depends(require_admin)):
        """Generate invoice PDF"""
        from fastapi.responses import StreamingResponse
        
        invoice = await db.commercial_invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        partner = await db.commercial_partners.find_one({"partner_id": invoice["partner_id"]}, {"_id": 0})
        if not partner:
            partner = {"name": "Client inconnu"}
        
        pdf_buffer = generate_invoice_pdf_commercial(invoice, partner, invoice.get("is_proforma", False))
        
        filename = f"{'Proforma' if invoice.get('is_proforma') else 'Facture'}_{invoice['invoice_number']}.pdf"
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    @commercial_router.put("/invoices/{invoice_id}")
    async def update_invoice(invoice_id: str, request: Request, user = Depends(require_admin)):
        """Update invoice (payment, status)"""
        data = await request.json()
        
        update_data = {**data, "updated_at": datetime.now(timezone.utc).isoformat()}
        
        # If amount_paid is provided, check if fully paid
        if "amount_paid" in data:
            invoice = await db.commercial_invoices.find_one({"invoice_id": invoice_id})
            if invoice:
                if data["amount_paid"] >= invoice.get("total_ttc", 0):
                    update_data["status"] = "paid"
                    update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
                elif data["amount_paid"] > 0:
                    update_data["status"] = "partial"
        
        await db.commercial_invoices.update_one(
            {"invoice_id": invoice_id},
            {"$set": update_data}
        )
        return {"success": True}
    
    # ============== CONTRACTS ==============
    
    @commercial_router.get("/contracts")
    async def get_contracts(status: str = None, user = Depends(require_admin)):
        """Get all contracts"""
        query = {}
        if status:
            query["status"] = status
        
        contracts = await db.commercial_contracts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
        return {"contracts": contracts, "total": len(contracts)}
    
    @commercial_router.get("/contracts/templates")
    async def get_contract_templates(user = Depends(require_admin)):
        """Get contract templates"""
        templates = [
            {
                "template_id": "service",
                "name": "Contrat de prestation de services",
                "content": """ARTICLE 1 - OBJET
Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire fournira ses services au Client.

ARTICLE 2 - DURÉE
Le présent contrat est conclu pour une durée déterminée mentionnée ci-dessus.

ARTICLE 3 - OBLIGATIONS DU PRESTATAIRE
Le Prestataire s'engage à exécuter les prestations avec diligence et professionnalisme.

ARTICLE 4 - OBLIGATIONS DU CLIENT
Le Client s'engage à fournir toutes les informations nécessaires à la bonne exécution des prestations.

ARTICLE 5 - PRIX ET MODALITÉS DE PAIEMENT
Le prix des prestations est fixé d'un commun accord entre les parties.

ARTICLE 6 - CONFIDENTIALITÉ
Les parties s'engagent à garder confidentielles toutes les informations échangées.

ARTICLE 7 - RÉSILIATION
Chaque partie peut résilier le contrat avec un préavis de 30 jours."""
            },
            {
                "template_id": "partnership",
                "name": "Contrat de partenariat",
                "content": """ARTICLE 1 - OBJET DU PARTENARIAT
Les parties conviennent d'établir un partenariat commercial pour [préciser l'objet].

ARTICLE 2 - ENGAGEMENTS DES PARTIES
Chaque partie s'engage à promouvoir les produits/services de l'autre partie.

ARTICLE 3 - RÉMUNÉRATION
Les conditions de rémunération sont définies comme suit: [préciser].

ARTICLE 4 - DURÉE ET RENOUVELLEMENT
Le présent partenariat est conclu pour une durée de [X] mois, renouvelable par tacite reconduction.

ARTICLE 5 - EXCLUSIVITÉ
[Préciser si exclusivité ou non]

ARTICLE 6 - PROPRIÉTÉ INTELLECTUELLE
Chaque partie reste propriétaire de ses marques, logos et contenus.

ARTICLE 7 - RÉSILIATION
Le contrat peut être résilié par l'une ou l'autre des parties avec un préavis de [X] jours."""
            },
        ]
        return {"templates": templates}
    
    @commercial_router.post("/contracts")
    async def create_contract(data: ContractCreate, user = Depends(require_admin)):
        """Create a new contract"""
        partner = await db.commercial_partners.find_one({"partner_id": data.partner_id}, {"_id": 0})
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        count = await db.commercial_contracts.count_documents({})
        contract_number = f"CTR-{datetime.now().year}-{str(count + 1).zfill(4)}"
        
        contract = {
            "contract_id": f"CON-{secrets.token_hex(4).upper()}",
            "contract_number": contract_number,
            "partner_id": data.partner_id,
            "partner_name": partner.get("name"),
            "title": data.title,
            "content": data.content,
            "start_date": data.start_date,
            "end_date": data.end_date,
            "amount": data.amount,
            "payment_terms": data.payment_terms,
            "status": "draft",
            "signatures": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.commercial_contracts.insert_one(contract)
        return {"success": True, "contract_id": contract["contract_id"], "contract_number": contract_number}
    
    @commercial_router.get("/contracts/{contract_id}/pdf")
    async def get_contract_pdf(contract_id: str, user = Depends(require_admin)):
        """Generate contract PDF"""
        from fastapi.responses import StreamingResponse
        
        contract = await db.commercial_contracts.find_one({"contract_id": contract_id}, {"_id": 0})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        partner = await db.commercial_partners.find_one({"partner_id": contract["partner_id"]}, {"_id": 0})
        if not partner:
            partner = {"name": "Partenaire inconnu"}
        
        pdf_buffer = generate_contract_pdf(contract, partner)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Contrat_{contract['contract_number']}.pdf"}
        )
    
    @commercial_router.put("/contracts/{contract_id}")
    async def update_contract(contract_id: str, request: Request, user = Depends(require_admin)):
        """Update contract"""
        data = await request.json()
        await db.commercial_contracts.update_one(
            {"contract_id": contract_id},
            {"$set": {**data, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"success": True}
    
    return commercial_router
