from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

SOURCE = Path('presentation_script.md')
OUTPUT = Path('public/SkillTrack_Presentation_Script.pdf')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='ScriptTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=colors.HexColor('#10243E'), spaceAfter=12))
styles.add(ParagraphStyle(name='Section', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=15, leading=18, textColor=colors.HexColor('#0B806D'), spaceBefore=12, spaceAfter=7))
styles.add(ParagraphStyle(name='BodyScript', parent=styles['BodyText'], fontName='Helvetica', fontSize=10.5, leading=15, textColor=colors.HexColor('#18324F'), spaceAfter=8))
styles.add(ParagraphStyle(name='Note', parent=styles['BodyText'], fontName='Helvetica-Oblique', fontSize=9.5, leading=13, textColor=colors.HexColor('#526779'), spaceAfter=7))


def escape(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def inline(text):
    text = escape(text)
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)

story = []
for raw in SOURCE.read_text(encoding='utf-8').splitlines():
    line = raw.strip()
    if not line:
        story.append(Spacer(1, 3))
    elif line.startswith('# '):
        story.append(Paragraph(escape(line[2:]), styles['ScriptTitle']))
    elif line.startswith('## '):
        story.append(Paragraph(escape(line[3:]), styles['Section']))
    elif line.startswith('**Say:**') or line.startswith('**Possible question') or line.startswith('**Transition:**') or line.startswith('**Closing**'):
        story.append(Paragraph(inline(line), styles['Note']))
    elif line.startswith('- '):
        story.append(Paragraph('&bull; ' + inline(line[2:]), styles['BodyScript']))
    elif line.startswith('---'):
        story.append(Spacer(1, 4))
    else:
        story.append(Paragraph(inline(line), styles['BodyScript']))

def decorate(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#10243E'))
    canvas.rect(0, 0, A4[0], 7*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor('#19B89A'))
    canvas.rect(0, A4[1]-4*mm, A4[0], 4*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor('#6E8292'))
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(A4[0]-16*mm, 11*mm, f'SKILLTRACK PRESENTATION SCRIPT  |  {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=18*mm)
doc.build(story, onFirstPage=decorate, onLaterPages=decorate)
print(OUTPUT)
