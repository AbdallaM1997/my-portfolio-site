# -*- coding: utf-8 -*-
"""Rebuild the resume PDF: no city lines, no unfilled placeholders."""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                HRFlowable, KeepTogether)
import sys

NAVY = colors.HexColor('#1F3864')
INK  = colors.HexColor('#111111')
OUT  = sys.argv[1]

LINKEDIN = 'https://www.linkedin.com/in/abdalla-mahmoud-8b60b8194/'
GITHUB   = 'https://github.com/AbdallaM1997'
SITE     = 'https://abdallam1997.github.io/my-portfolio-site/'
PLAY     = 'https://play.google.com/store/apps/details?id=com.ExaRollStudio.Shara71'
APPSTORE = 'https://apps.apple.com/eg/app/shara71-%D8%B4%D8%A7%D8%B1%D8%A9-71/id6746771073'
YOUTUBE  = 'https://www.youtube.com/@kuwaitar5577'
IGNITE   = 'https://ignite-virtual.com'

def L(url, text):
    return ('<link href="%s"><font color="#1F3864"><u>%s</u></font></link>'
            % (url, text))

S = dict(
  name    = ParagraphStyle('name', fontName='Times-Bold', fontSize=20, leading=24,
                           alignment=TA_CENTER, textColor=NAVY, spaceAfter=3),
  tagline = ParagraphStyle('tag', fontName='Times-Roman', fontSize=10.5, leading=13,
                           alignment=TA_CENTER, textColor=INK, spaceAfter=2.5),
  contact = ParagraphStyle('con', fontName='Times-Roman', fontSize=8.8, leading=11.4,
                           alignment=TA_CENTER, textColor=INK),
  head    = ParagraphStyle('head', fontName='Times-Bold', fontSize=11, leading=13,
                           textColor=NAVY, spaceBefore=9, spaceAfter=1.5),
  body    = ParagraphStyle('body', fontName='Times-Roman', fontSize=9.2, leading=11.5,
                           alignment=TA_JUSTIFY, textColor=INK, spaceAfter=1),
  org     = ParagraphStyle('org', fontName='Times-Roman', fontSize=9.6, leading=12,
                           textColor=INK, spaceBefore=5, spaceAfter=0),
  role    = ParagraphStyle('role', fontName='Times-Italic', fontSize=9.2, leading=11.5,
                           textColor=INK, spaceBefore=0.5, spaceAfter=1.5),
  bullet  = ParagraphStyle('bul', fontName='Times-Roman', fontSize=9.2, leading=11.5,
                           alignment=TA_JUSTIFY, textColor=INK,
                           leftIndent=11, bulletIndent=1.5, spaceAfter=1.6),
)

F = []
def head(t):
    F.append(Paragraph(t, S['head']))
    F.append(HRFlowable(width='100%', thickness=0.7, color=NAVY,
                        spaceBefore=1, spaceAfter=4))
def body(t):  F.append(Paragraph(t, S['body']))
def org(t):   F.append(Paragraph(t, S['org']))
def role(t):  F.append(Paragraph(t, S['role']))
def bul(t):   F.append(Paragraph(t, S['bullet'], bulletText='•'))

# ---------------- header ----------------
F.append(Paragraph('ABDALLAH MAHMOUD SHABAAN', S['name']))
# job title now matches the site
F.append(Paragraph('Senior Unity AR/VR Developer &nbsp;|&nbsp; Enterprise &amp; Educational Simulations',
                   S['tagline']))
# city removed, GMT offset kept so clients can judge overlap
F.append(Paragraph('Egypt (GMT+2) &nbsp;&bull;&nbsp; +20 100 963 4712 &nbsp;&bull;&nbsp; '
                   '<link href="mailto:abdalla1997@yandex.com">abdalla1997@yandex.com</link>',
                   S['contact']))
# [yoursite.com] placeholder replaced with the real portfolio URL
F.append(Paragraph('Portfolio: ' + L(SITE, 'abdallam1997.github.io/my-portfolio-site')
                   + ' &nbsp;&bull;&nbsp; ' + L(LINKEDIN, 'LinkedIn')
                   + ' &nbsp;&bull;&nbsp; ' + L(GITHUB, 'GitHub'), S['contact']))
F.append(Paragraph('English: Professional working proficiency &nbsp;&bull;&nbsp; Arabic: Native '
                   '&nbsp;&bull;&nbsp; Available for remote contract &amp; freelance work', S['contact']))
F.append(Spacer(1, 5))

head('PROFILE')
body('Unity developer with 8+ years building AR and VR applications for education, enterprise training, '
     'and brand activations. I take projects from prototype through store deployment: XR interaction systems, '
     'AR marker and plane-based experiences, multi-language RTL/LTR interfaces, and modular architectures that '
     'clients can extend after handover. Shipped work for publishing, advertising, and enterprise clients across '
     'Egypt, the UAE, Saudi Arabia, and Kuwait.')

head('WHAT I BUILD FOR CLIENTS')
bul('VR training &amp; safety simulations — branching scenarios, scoring, and performance feedback '
    '(Meta Quest, OpenXR, SteamVR).')
bul('AR product &amp; education apps — marker tracking, runtime 3D instantiation, interactive learning '
    'modules (AR Foundation, Vuforia, ARCore).')
bul('Interactive installations &amp; event activations — touch-screen games, multi-device setups, '
    'LAN-linked mobile-to-PC experiences.')
bul('Unity systems engineering — localization, AssetBundles/Addressables, DOTween UI, '
    'ScriptableObject-driven content, Photon multiplayer.')

head('EXPERIENCE')

org('<b>ExaRoll Studio</b> &nbsp;|&nbsp; Dubai, UAE (Remote)')
role('Lead Software Developer / Game Designer &nbsp;[Contract]&nbsp; | &nbsp;Nov 2024 – Present')
bul('Lead technical architecture and game design for Unity 6 projects, integrating OpenXR and AR Foundation '
    'for cross-platform deployment across headset and mobile targets.')
# "[X] minutes" clause dropped
bul('Built a modular LanguageController that swaps TextMeshPro font assets and spacing at runtime, supporting '
    'right-to-left Arabic and English from a single UI codebase.')
bul('Engineered reusable UI and spatial movement systems with DOTween, including procedural item animation '
    'and physics-based drag-and-drop.')
bul('Shipped Shara71 to both Google Play and the App Store — a cultural tile-matching game spanning all '
    'seven UAE emirates — taking it from design through store submission and post-launch updates.')
bul('Authored Game Design Documents and technical specs that let clients and stakeholders sign off on scope '
    'before production.')

org('<b>Eye Advertising</b> &nbsp;|&nbsp; Egypt')
role('Senior Game Developer &amp; AR/VR Developer &nbsp;[Full-time]&nbsp; | &nbsp;May 2025 – Present')
# "[N] shipped activations" clause dropped
bul('Own AR/VR delivery end to end — prototyping, production, QA, and store/on-site deployment — '
    'for brand and pharmaceutical clients.')
bul('Built branching patient-education VR covering chronic kidney disease treatment journeys, with scenarios '
    'authored in-Editor via ScriptableObjects so medical teams can revise content without a developer, and a '
    '5-star exit rating posting to a custom admin backend.')
bul('Developed web-based AR for medical field teams — QR-entry 3D product launches, step-by-step '
    'preparation guides, and interactive clinical-trial data — running in the mobile browser with no app '
    'install required.')
# "[N] interactive booth games" -> unnumbered
bul('Delivered interactive booth games for pharmaceutical and FMCG activations: timed clinical quizzes, '
    'two-player head-to-head challenges, lead-capture forms, and photo activations built to self-reset and run '
    'unattended for full event days.')
bul('Built virtual exhibition stands and 3D clinical data environments, plus branching 360° video playback '
    'driven by a data-driven node graph with an Editor auto-builder.')
role('Senior Game Developer &amp; AR/VR Developer &nbsp;[Part-time]&nbsp; | &nbsp;May 2021 – May 2025')
bul('Delivered AR and VR interactive experiences alongside a full-time role, managing scope and deadlines '
    'across concurrent client projects.')
bul('Architected cross-platform applications linking mobile AR input to a PC application over LAN, enabling '
    'multi-device booth experiences.')
bul('Built augmented reality mechanics including runtime character instantiation and interactive joystick controls.')

org('<b>Nahdet Misr Publishing Group</b> &nbsp;|&nbsp; Egypt')
role('Senior Software Developer &amp; R&amp;D Team Admin &nbsp;[Full-time]&nbsp; | &nbsp;Jan 2023 – May 2025')
# "[N]-person" -> unnumbered
bul('Ran R&amp;D team operations and Agile task management across a cross-functional pipeline, coordinating '
    'developers, artists, and content specialists.')
bul('Programmed 3D and AR applications for the NEOM project (Saudi Arabia) and VR Occupational Safety and '
    'Health simulations for construction site training.')
bul('Built a Unity 3D Physics Lab simulating interactive science lessons, and a gamified workplace OSH '
    'training module.')
# "delivered to [N] students/schools" clause dropped
bul('Engineered web-based 3D learning experiences for Rwandan educational initiatives.')
role('AR/VR Unity Game Developer &nbsp;|&nbsp; May 2020 – Jan 2023')
bul('Built an AR science textbook experience using Vuforia, bridging printed pages with interactive 3D '
    'augments to increase student engagement.')

org('<b>Gigaverse</b> &nbsp;|&nbsp; Remote')
role('AR/VR Developer &nbsp;[Contract]&nbsp; | &nbsp;Apr 2023 – Jun 2024')
bul('Developed “Kuwaitar,” an AR education app for the Kuwaiti market, covering AR interaction design, '
    'educational scenarios, and UX.')
bul('Implemented ScriptableObject-driven content panels, dynamic scoring, and dual-state feedback UI so '
    'non-developers could add lessons without code changes.')

org('<b>Arabtesting</b> &nbsp;|&nbsp; Egypt')
role('VR/AR Unity Game Developer &nbsp;|&nbsp; Jul 2019 – Apr 2020')
bul('Built an AR 3D coloring book with Vuforia and OpenCV — C# scripts downloaded AssetBundles at runtime '
    'and rendered live 3D models from scanned 2D drawings.')
bul('Shipped an educational VR/AR mobile game to Google Play, letting users explore 3D animal models via '
    'Cardboard VR.')

head('SELECTED PROJECTS')
bul('<b>Shara71</b> — Unity tile-matching puzzle game published on both stores under ExaRoll Studio. '
    'Players progress across all seven UAE emirates, matching illustrated Emirati cultural symbols, foods, '
    'dress, and landmarks. Shipped for iOS and Android with progressive level difficulty and an all-ages '
    'content rating. ' + L(PLAY, 'Google Play') + ' | ' + L(APPSTORE, 'App Store'))
bul('<b>Kuwaitar</b> — Augmented reality education app built to the Kuwaiti primary-school curriculum, '
    'covering Islamic education and English for Grade 1. Turns printed lessons into interactive 3D content on '
    'students’ devices, with ScriptableObject-driven lesson panels so non-developers can add material '
    'without code changes. ' + L(YOUTUBE, 'Video channel'))
# "[Specify your role...]" note-to-self dropped
bul('<b>Ignite Virtual</b> — VR and AR education platform delivering secondary-school Biology and History '
    'curriculum units, children’s soft-skills programs, and Quran modules through VR headsets, alongside '
    'turnkey VR lab installations for schools and universities. ' + L(IGNITE, 'ignite-virtual.com'))
bul('<b>Xenon Blade</b> — 2D top-down hack-and-slash shipped to Google Play, with upgradeable weapons and '
    'wave-based enemy AI.')
bul('<b>Wise Project</b> — interactive 2D physics games (Unity + Vyond) teaching electricity concepts to '
    '10th and 11th graders.')
bul('<b>ADHD VR</b> (graduation project, graded Excellent) — mobile VR room with interactive IQ tests '
    'designed to assess ADHD indicators in children.')

head('TECHNICAL SKILLS')
body('<b>Engines &amp; Languages:</b> Unity 3D (Unity 6, URP), C#, Java (Android)')
body('<b>XR Platforms:</b> OpenXR, XR Interaction Toolkit, Meta Quest, AR Foundation, Vuforia, ARCore, EasyAR, '
     'SteamVR, Google Cardboard')
body('<b>Systems &amp; Tools:</b> DOTween, TextMeshPro, AssetBundles &amp; Addressables, ScriptableObjects, '
     'Photon (multiplayer), REST API integration, OpenCV, Git, WebGL &amp; Android builds')
body('<b>Design &amp; Process:</b> Game Design Documents, UI/UX implementation, localization architecture '
     '(RTL/LTR), Agile workflows, Photoshop, After Effects')

head('EDUCATION')
# city removed
body('B.Sc. Computer Science — Higher Technological Institute, Egypt &nbsp;|&nbsp; May 2020')

doc = SimpleDocTemplate(OUT, pagesize=LETTER,
                        leftMargin=0.58*inch, rightMargin=0.58*inch,
                        topMargin=0.45*inch, bottomMargin=0.45*inch,
                        title='Abdallah Mahmoud Shabaan — Senior Unity AR/VR Developer',
                        author='Abdallah Mahmoud Shabaan',
                        subject='Senior Unity AR/VR Developer',
                        creator='')
doc.build(F)
print('wrote', OUT)
