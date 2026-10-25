"""PDF documents: payment invoices and the downloadable lender list.

The built-in PDF fonts are Latin-1 only, so amounts use "Rs." and text is sanitised.
"""

from collections.abc import Iterable

from fpdf import FPDF

from app.config import get_settings
from app.lenders import Lender
from app.models import Payment, User

NAVY = (15, 45, 107)
BLUE = (13, 71, 199)
GREY = (90, 99, 120)


def _latin1(text: str) -> str:
    return text.replace("₹", "Rs. ").replace("–", "-").encode("latin-1", "replace").decode("latin-1")


def inr(amount_rupees: float) -> str:
    """Indian digit grouping: 1000000 -> 10,00,000."""
    whole, _, fraction = f"{amount_rupees:.2f}".partition(".")
    head, tail = whole[:-3], whole[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    grouped = ",".join([*groups, tail]) if groups else tail
    return f"Rs. {grouped}" if fraction == "00" else f"Rs. {grouped}.{fraction}"


class _Doc(FPDF):
    def header(self) -> None:
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*NAVY)
        self.cell(0, 8, "MYST FINANCE", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*BLUE)
        self.set_line_width(0.6)
        self.line(self.l_margin, self.get_y() + 1, self.w - self.r_margin, self.get_y() + 1)
        self.ln(6)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GREY)
        self.cell(
            0,
            5,
            "MYST Finance is not a lender and does not guarantee loan approval. "
            "Lender terms are indicative; confirm them on the lender's official website.",
            align="C",
        )


def invoice_pdf(payment: Payment, user: User) -> bytes:
    settings = get_settings()
    total = payment.amount_paise / 100
    gst_registered = bool(settings.business_gstin)

    pdf = _Doc()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 8, "Tax Invoice" if gst_registered else "Payment Receipt", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 10)
    seller = [settings.business_name]
    if settings.business_address:
        seller.append(settings.business_address)
    if gst_registered:
        seller.append(f"GSTIN: {settings.business_gstin}")
    for line in seller:
        pdf.cell(0, 5, _latin1(line), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    paid_on = (payment.paid_at or payment.created_at).strftime("%d %b %Y")
    details = [
        ("Invoice number", payment.invoice_number or "-"),
        ("Date", paid_on),
        ("Billed to", f"{user.full_name or ''} <{user.email}>".strip()),
        ("Order ID", payment.order_id),
        ("Payment ID", payment.provider_payment_id or "-"),
        ("Payment method", (payment.method or "-").upper()),
    ]
    for label, value in details:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(40, 6, label)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, _latin1(value), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    rows = [("Lender directory access (one-time, lifetime)", total)]
    if gst_registered:
        taxable = round(total / (1 + settings.gst_rate_percent / 100), 2)
        rows = [
            ("Lender directory access (one-time, lifetime) - SAC 998599", taxable),
            (f"GST @ {settings.gst_rate_percent:g}%", round(total - taxable, 2)),
        ]

    pdf.set_fill_color(240, 244, 252)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(140, 8, "Description", border=1, fill=True)
    pdf.cell(0, 8, "Amount", border=1, fill=True, align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    for description, amount in rows:
        pdf.cell(140, 8, description, border=1)
        pdf.cell(0, 8, inr(amount), border=1, align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(140, 8, "Total paid", border=1)
    pdf.cell(0, 8, inr(total), border=1, align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*GREY)
    pdf.multi_cell(
        0,
        5,
        "This fee is for access to MYST Finance's curated lender directory. It is not a loan "
        "processing fee and is not paid to any lender. Refunds are governed by our Refund Policy.",
    )
    return bytes(pdf.output())


def lender_list_pdf(lenders: Iterable[Lender], user: User) -> bytes:
    pdf = _Doc(orientation="L")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Your Lender List", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*GREY)
    pdf.cell(0, 5, _latin1(f"Prepared for {user.email}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    columns = [
        ("#", 10),
        ("Lender", 50),
        ("Loan type", 28),
        ("Amount", 62),
        ("Interest (p.a.)", 34),
        ("Tenure", 30),
        ("Official website", 0),
    ]
    pdf.set_text_color(0, 0, 0)
    pdf.set_fill_color(240, 244, 252)
    pdf.set_font("Helvetica", "B", 9)
    for title, width in columns:
        pdf.cell(width, 7, title, border=1, fill=True, new_x="RIGHT", new_y="TOP")
    pdf.ln()
    pdf.set_font("Helvetica", "", 9)
    for index, lender in enumerate(lenders, start=1):
        values = [
            str(index),
            lender.name,
            lender.loan_type.capitalize(),
            f"{inr(lender.min_amount)} - {inr(lender.max_amount)}",
            f"{lender.rate_min_pa:g}% - {lender.rate_max_pa:g}%",
            f"{lender.tenure_min_months}-{lender.tenure_max_months} months",
            str(lender.website_url),
        ]
        for (_, width), value in zip(columns, values, strict=True):
            pdf.cell(width, 7, _latin1(value), border=1, new_x="RIGHT", new_y="TOP")
        pdf.ln()
    return bytes(pdf.output())
