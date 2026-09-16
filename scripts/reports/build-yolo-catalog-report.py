from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'docs/guides/vision-agent-api/existing-yolo-application/assets'
OUT = ROOT / 'output/pdf/yolo-catalog-visual-review.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
W, H = 595.28, 841.89
INK, GREEN, MUTED = map(HexColor, ['#19352C', '#216C53', '#596661'])
c = canvas.Canvas(str(OUT), pagesize=(W,H))
c.setTitle('YOLO application: visible products and catalog candidates')
c.setAuthor('AI Shop')
body = ParagraphStyle('body', fontName='Arial', fontSize=10.5, leading=15, textColor=INK)
small = ParagraphStyle('small', parent=body, fontSize=8.8, leading=12)
cell = ParagraphStyle('cell', parent=body, fontSize=9.5, leading=13)

def p(text, x, top, width, style=body):
    item = Paragraph(text, style)
    _, h = item.wrap(width, H)
    item.drawOn(c, x, top-h)
    return top-h

def header(page, title, subtitle):
    c.setFillColor(GREEN); c.setFont('ArialBold',9)
    c.drawString(36,H-36,'AI SHOP  /  VISUAL CATALOG REVIEW')
    c.setFillColor(INK); c.setFont('ArialBold',23)
    c.drawString(36,H-71,title)
    p(subtitle,36,H-89,W-72,small)
    c.setStrokeColor(HexColor('#D3DDD6')); c.line(36,38,W-36,38)
    c.setFont('Arial',8); c.setFillColor(MUTED)
    c.drawString(36,24,'15 September 2026  |  Preliminary visual review - not a verified inventory')
    c.drawRightString(W-36,24,str(page))

def photo(name,x,top,width):
    image = ImageReader(str(ASSETS/name)); iw,ih=image.getSize()
    height=width*ih/iw
    c.drawImage(image,x,top-height,width,height)
    return top-height

header(1,'Catalog products are visible',
       'Hair-care before/after photographs supplied from KSK Retail+ Backoffice.')
y=p('<b>Main finding.</b> Vitacilina hair-care packaging is visible among other brands. '
    'Nutritivo and Estimulante families can be recognized; exact shampoo/conditioner '
    'and package-size assignments need sharper originals.',36,705,W-72)
y=photo('04-hair-before-after.png',36,y-16,W-72)
y=p('Figure 1. Supplied ANTES / DESPUÉS pair, reproduced without enhancement. '
    'The photographs show different views and possibly changed shelf arrangements; '
    'the meaning of the inspection stages still needs confirmation.',36,y-8,W-72,small)
y=p('<b>Where to look:</b> the center of the middle shelf contains mint and purple '
    'Vitacilina bottles. The shelf below contains more colored bottles and white '
    'Vitacilina tubs with yellow lids.',36,y-20,W-72)
p('These are catalog-match candidates, not barcode readings. No exact unit counts '
  'are asserted, and before/after photographs must not be added together.',36,y-12,W-72)
c.showPage()

header(2,'Candidate catalog matches',
       'Shortlist from the supplied workbook; identifiers preserved exactly as supplied.')
y=p('The table links visible product families to catalog entries. A family match '
    'does not establish which SKU is present: shampoo and conditioner may look similar.',36,711,W-72)
rows=[['Visible evidence','Catalog candidates and identifier','Assessment'],
['Mint bottles marked Nutritivo',
 'VITACILINA SHAMPOO NUTRITIVO 400mL<br/>7502250342419<br/><br/>VITACILINA ACONDICIONADOR NUTRITIVO 400mL<br/>7502250342426',
 'Family recognizable.<br/>Exact SKU and size unconfirmed.'],
['Purple bottles marked Estimulante',
 'VITACILINA SHAMPOO ESTIMULANTE 400mL<br/>7502250342396<br/><br/>VITACILINA ACONDICIONADOR ESTIMULANTE 400mL<br/>7502250342402',
 'Family recognizable.<br/>Exact SKU and size unconfirmed.'],
['White Vitacilina tubs with yellow lids',
 'VITACILINA TRATAMIENTO CAPILAR 350mL<br/>7502250342464',
 'Plausible candidate.<br/>Label/size confirmation needed.']]
data=[[Paragraph(t,cell) for t in row] for row in rows]
t=Table(data,colWidths=[118,260,W-72-378])
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor('#E4EEE8')),
 ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),
 ('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),11),
 ('BOTTOMPADDING',(0,0),(-1,-1),11),('LINEBELOW',(0,0),(-1,-1),0.5,HexColor('#D3DDD6'))]))
_,th=t.wrap(W-72,H); t.drawOn(c,36,y-18-th); y-=th+40
y=p('<b>Other colored Vitacilina bottles:</b> orange, green/yellow and turquoise '
    'packaging are also visible. The catalog contains Reparador, Aclarante and '
    'Purificante variants, but color alone is not enough to assign those SKUs.',36,y,W-72)
y=p('<b>Do not treat the product table as a detection result.</b> The screenshots '
    'list nine hair-care products and four Derman foot-care products, but the numeric '
    'columns are weekly sellout and prior-day inventory. They do not establish '
    'what the photographs contain or how many facings YOLO detected.',36,y-18,W-72)
p('Source: VISTA-YOLO-APP-CATALOG.xlsx, worksheet Catálogo. Nutritivo: rows 65/26; '
  'Estimulante: rows 64/25; treatment: row 23. The workbook was inspected read-only. '
  'This shortlist is not an exhaustive recognition result.',36,y-24,W-72,small)
c.showPage()

header(3,'Keep the comparison catalog-scoped',
       'Mixed-brand evidence and the next confirmation needed.')
y=photo('02-default-before-after.png',36,715,W-72)
y=p('Figure 2. Another supplied before/after pair. Nivea, Dove, Rexona and other '
    'brands are visible. No additional exact catalog SKU is confirmed from this pair '
    'in this preliminary review.',36,y-9,W-72,small)
y=p('<b>Catalog scope.</b> The supplied file contains 70 entries: Vitacilina 34, '
    'Lactacyd 19, Derman 15 and Rocainol 2. Recognizing non-catalog products should '
    'not inflate a catalog-recognition score.',36,y-20,W-72)
y=p('<b>Derman caution.</b> Derman names appear in a business table in another '
    'screenshot. Their presence in that table is not proof that the photographed '
    'shelf contains those products.',36,y-14,W-72)
y=p('<b>Next step.</b> Obtain original-resolution photos and confirm variant, size '
    'and catalog identifier for each candidate. Use the same capture stage for both '
    'systems and a human-reviewed reference. Preserve ambiguous matches rather than '
    'forcing a catalog assignment.',36,y-14,W-72)
p('Sources: five user-supplied KSK Retail+ Backoffice screenshots and '
  'VISTA-YOLO-APP-CATALOG.xlsx. Two distinct photo pairs are reproduced here. '
  'No live YOLO output, bounding boxes, model version or detection API was inspected.',36,y-18,W-72,small)
c.save()
print(OUT)
