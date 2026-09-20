from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase.pdfmetrics import stringWidth

OUT = 'public/SkillTrack_6_Slide_Deck.pdf'
PAGE = landscape(A4)
W, H = PAGE
NAVY = colors.HexColor('#10243E')
INK = colors.HexColor('#18324F')
MINT = colors.HexColor('#19B89A')
GOLD = colors.HexColor('#F2B544')
PALE = colors.HexColor('#F3F7F6')
MIST = colors.HexColor('#DCEBE8')
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Kicker', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=MINT, spaceAfter=5))
styles.add(ParagraphStyle(name='Title2', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=25, leading=28, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name='Sub', parent=styles['Normal'], fontName='Helvetica', fontSize=10.5, leading=14, textColor=INK, spaceAfter=8))
styles.add(ParagraphStyle(name='CardTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=13, textColor=NAVY, spaceAfter=4))
styles.add(ParagraphStyle(name='Body2', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=12, textColor=INK))
styles.add(ParagraphStyle(name='Big', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=29, leading=31, textColor=MINT))
styles.add(ParagraphStyle(name='Small', parent=styles['Normal'], fontName='Helvetica', fontSize=7.6, leading=10, textColor=INK))


def P(text, style='Body2'):
    return Paragraph(text, styles[style])


def card(title, body, width):
    t = Table([[P(title, 'CardTitle')], [P(body, 'Body2')]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PALE), ('BOX', (0,0), (-1,-1), 0.6, MIST),
        ('LEFTPADDING', (0,0), (-1,-1), 10), ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 9), ('BOTTOMPADDING', (0,0), (-1,-1), 9),
    ]))
    return t


def header(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setFillColor(MINT)
    canvas.rect(0, H-5*mm, W, 5*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor('#8AA2B5'))
    canvas.setFont('Helvetica-Bold', 7)
    canvas.drawRightString(W-16*mm, 9*mm, f'SKILLTRACK  |  SIH PROTOTYPE  |  {doc.page:02d}')
    canvas.restoreState()


def page(story, kicker, title, subtitle, content):
    story.append(Spacer(1, 9*mm))
    story.append(P(kicker.upper(), 'Kicker'))
    story.append(P(title, 'Title2'))
    story.append(P(subtitle, 'Sub'))
    story.extend(content)
    story.append(PageBreak())

story = []
page(story, '01 / THE PROBLEM', 'The broken career pipeline', 'Learning is growing. The path from learning to meaningful employment is still fragmented.', [
    Table([[card('01  Skills are invisible', 'Certificates and courses do not automatically show which capabilities employers value for a specific role.', 82*mm), card('02  Jobs are noisy', 'Job descriptions use inconsistent language. Candidates cannot tell whether they are close, ready or wasting time.', 82*mm), card('03  Progress is unmeasured', 'Applications, interviews and feedback live in separate tools, so there is no learning loop.', 82*mm)]], colWidths=[88*mm,88*mm,88*mm], style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),5)])),
    Spacer(1, 12), P('<b>Core insight:</b> the gap is not only skill. It is signal. Learners need evidence, context and a clear next action.', 'Body2')
])
page(story, '02 / THE SOLUTION', 'One connected career loop', 'SkillTrack connects evidence, intelligence and action in one visible journey.', [
    Table([[P('<b>PROFILE</b><br/>Skills, projects, preferences', 'Body2'), P('<b>GAP SCAN</b><br/>Compare against target roles', 'Body2'), P('<b>MATCH</b><br/>Rank real-fit opportunities', 'Body2'), P('<b>TRACK</b><br/>Learn from outcomes', 'Body2')]], colWidths=[66*mm]*4, style=TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.6,MIST),('INNERGRID',(0,0),(-1,-1),0.6,MIST),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14)])),
    Spacer(1, 14), P('<b>Closed loop:</b> every application, interview and feedback event improves the next decision. The output is not another list; it is a ranked next best action.', 'Body2')
])
page(story, '03 / HOW IT WORKS', 'From profile to placement in four moves', 'The experience is organized around the next best action.', [
    Table([[card('01  Capture', 'Skills, resume evidence, projects, preferences and target roles.', 62*mm), card('02  Diagnose', 'Normalize requirements and compare current evidence with role expectations.', 62*mm), card('03  Act', 'Practice the highest-value gap with a concrete task and evidence.', 62*mm), card('04  Learn', 'Track movement, feedback and outcomes; recalibrate the next recommendation.', 62*mm)]], colWidths=[67*mm]*4, style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4)])),
    Spacer(1, 15), P('<b>Product promise:</b> make the next career move easier to see, easier to do and easier to measure.', 'Body2')
])
page(story, '04 / PRODUCT VIEW', 'A dashboard built for decisions', 'Every number answers a student question: Am I ready? What should I improve? Where should I apply?', [
    Table([[P('<font size="8">CAREER READINESS</font><br/><font size="25" color="#19B89A"><b>72%</b></font>', 'Body2'), P('<font size="8">TARGET ROLES MAPPED</font><br/><font size="25" color="#19B89A"><b>08</b></font>', 'Body2'), P('<font size="8">APPLICATIONS IN MOTION</font><br/><font size="25" color="#19B89A"><b>04</b></font>', 'Body2')]], colWidths=[88*mm]*3, style=TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.6,MIST),('INNERGRID',(0,0),(-1,-1),0.6,MIST),('LEFTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),11),('BOTTOMPADDING',(0,0),(-1,-1),11)])),
    Spacer(1, 12), Table([[card('Readiness by skill cluster', 'Product sense: strong  |  Analytics: priority  |  Communication: improving', 132*mm), card('Next best action', '<b>Build one analytics case study.</b><br/>It closes the largest gap across three target roles.', 132*mm)]], colWidths=[137*mm,137*mm], style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),5)]))
])
page(story, '05 / INTELLIGENCE LAYER', 'Turn a vague gap into a focused plan', 'Slide 5 is the decision engine: explain the score, prioritize the gap and measure the improvement.', [
    Table([[P('<font size="8">TARGET ROLE</font><br/><b>Product Analyst</b>', 'Body2'), P('<font size="8">READINESS SCORE</font><br/><font size="24" color="#19B89A"><b>72%</b></font>', 'Body2'), P('<font size="8">MAPPED EVIDENCE</font><br/><b>8 skills  |  3 priority actions</b>', 'Body2')]], colWidths=[88*mm]*3, style=TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.6,MIST),('INNERGRID',(0,0),(-1,-1),0.6,MIST),('LEFTPADDING',(0,0),(-1,-1),11),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)])),
    Spacer(1, 12), Table([[P('<b>SQL / analytics</b><br/><font color="#C47C11">HIGH IMPACT</font><br/>DO NEXT: build a case study', 'Body2'), P('<b>Experiment design</b><br/><font color="#C47C11">MEDIUM</font><br/>VIEW action plan', 'Body2'), P('<b>Stakeholder storytelling</b><br/><font color="#198B70">ON TRACK</font><br/>VIEW evidence', 'Body2'), P('<b>Product sense</b><br/><font color="#198B70">STRONG</font><br/>Maintain', 'Body2')]], colWidths=[66*mm]*4, style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#EAF4F1')),('BOX',(0,0),(-1,-1),0.6,MIST),('INNERGRID',(0,0),(-1,-1),0.6,MIST),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)])),
    Spacer(1, 12), P('<b>Why it matters:</b> a gap is a prioritization problem before it is a learning problem. The plan is measurable: task, evidence, deadline, completion and reassessment.', 'Body2')
])
page(story, '06 / IMPACT + ROLLOUT', 'Close the loop with employment tracking', 'Slide 6 proves whether skilling activity becomes employment movement, while controlling risk before scale.', [
    Table([[P('<b>WISHLIST</b><br/><font size="20" color="#19B89A">12</font><br/>exploring', 'Body2'), P('<b>APPLIED</b><br/><font size="20" color="#19B89A">8</font><br/>active applications', 'Body2'), P('<b>INTERVIEW</b><br/><font size="20" color="#19B89A">4</font><br/>feedback needed', 'Body2'), P('<b>OFFER</b><br/><font size="20" color="#19B89A">1</font><br/>outcome recorded', 'Body2')]], colWidths=[66*mm]*4, style=TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.6,MIST),('INNERGRID',(0,0),(-1,-1),0.6,MIST),('LEFTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)])),
    Spacer(1, 10), P('<b>Impact measures:</b> more relevant applications, less search time, faster feedback loops and better placement movement. These are pilot hypotheses to validate, not guaranteed claims.', 'Body2'), Spacer(1, 8),
    P('<b>Release gates:</b> 01 prototype journey  ->  02 security and access control  ->  03 score and failure tests  ->  04 campus pilot  ->  05 scale with live jobs and institutions.', 'Body2'), Spacer(1, 8),
    P('<b>Final ask:</b> test SkillTrack with real learners, validate the scoring and outcome signals, then scale only where evidence supports it.', 'Body2')
])
story.pop()

doc = SimpleDocTemplate(OUT, pagesize=PAGE, rightMargin=16*mm, leftMargin=16*mm, topMargin=12*mm, bottomMargin=15*mm)
doc.build(story, onFirstPage=header, onLaterPages=header)
print(OUT)
