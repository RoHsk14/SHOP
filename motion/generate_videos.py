#!/usr/bin/env python3
"""
ShopEazy Motion Design Video Generator — Version Épurée
Génère deux vidéos de motion design au style très épuré, minimaliste et haut de gamme :
1. shopeazy-presentation.mp4 (Teaser & Proposition de Valeur)
2. shopeazy-fonctionnalites.mp4 (Visite Guidée des Fonctionnalités)

Utilise EXCLUSIVEMENT les captures d'écran récentes prises directement sur la plateforme
dans le dossier `motion/screenshots/`.
"""

import os
import sys
import time
import math
import wave
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(SCRIPT_DIR, 'screenshots')

# Fichiers de sortie
VIDEO1_PATH = os.path.join(SCRIPT_DIR, 'shopeazy-presentation.mp4')
VIDEO2_PATH = os.path.join(SCRIPT_DIR, 'shopeazy-fonctionnalites.mp4')

# Configuration canevas
WIDTH, HEIGHT = 1920, 1080
FPS = 30

# Palette Épurée & Minimaliste
C_BG = (8, 12, 20)                 # Fond graphite très sombre
C_BG_CARD = (13, 19, 32)           # Carte légèrement surélevée
C_BORDER = (35, 45, 65)            # Bordure subtile et élégante
C_BORDER_LIGHT = (55, 70, 95)
C_EMERALD = (16, 185, 129)         # Vert émeraude ShopEazy
C_EMERALD_MUTED = (16, 185, 129, 40)
C_EMERALD_LIGHT = (52, 211, 153)
C_CYAN = (6, 182, 212)
C_WHITE = (255, 255, 255)          # Titres purs
C_GRAY_LIGHT = (226, 232, 240)     # Texte courant
C_GRAY_MUTED = (148, 163, 184)     # Sous-titres & détails
C_GRAY_DARK = (71, 85, 105)        # Éléments discrets

# Polices système macOS
FONT_BOLD_PATH = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
FONT_REGULAR_PATH = '/System/Library/Fonts/Supplemental/Arial.ttf'

fonts = {
    'title_hero': ImageFont.truetype(FONT_BOLD_PATH, 50),
    'title_section': ImageFont.truetype(FONT_BOLD_PATH, 38),
    'title_card': ImageFont.truetype(FONT_BOLD_PATH, 22),
    'eyebrow': ImageFont.truetype(FONT_BOLD_PATH, 13),
    'body_lg': ImageFont.truetype(FONT_REGULAR_PATH, 20),
    'body_md': ImageFont.truetype(FONT_REGULAR_PATH, 16),
    'body_sm': ImageFont.truetype(FONT_REGULAR_PATH, 14),
    'nav': ImageFont.truetype(FONT_BOLD_PATH, 14),
    'url': ImageFont.truetype(FONT_REGULAR_PATH, 13),
    'btn': ImageFont.truetype(FONT_BOLD_PATH, 18),
}

# Chargement exclusif des captures fraîches prises sur la plateforme
def load_fresh_screenshots():
    files = {
        'hero': 'landing_hero.png',
        'features': 'landing_features.png',
        'dashboard': 'admin_dashboard.png',
        'products': 'admin_products.png',
        'orders': 'admin_orders.png',
        'mobile': 'mobile_hero.png',
        'signup': 'signup.png',
    }
    loaded = {}
    for key, fname in files.items():
        p = os.path.join(SCREENSHOTS_DIR, fname)
        if os.path.exists(p):
            loaded[key] = Image.open(p).convert('RGB')
        else:
            raise FileNotFoundError(f"Capture fraîche manquante : {p}")
    return loaded

SCREENSHOTS = load_fresh_screenshots()

# Fonctions d'interpolation douces
def ease_out_cubic(t):
    t = max(0.0, min(1.0, t))
    return 1.0 - math.pow(1.0 - t, 3)

def ease_in_out_sine(t):
    t = max(0.0, min(1.0, t))
    return 0.5 * (1.0 - math.cos(math.pi * t))

# Synthèse sonore épurée & minimaliste (Chill-Tech ambient)
def generate_minimal_soundtrack(bpm, duration):
    sr = 44100
    total_samples = int(sr * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    
    beat_len = 60.0 / bpm
    bar_len = beat_len * 4
    
    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)
    
    # Progression harmonique élégante & feutrée (Fmaj9 -> Dm9 -> Bbmaj9 -> C9sus)
    chords = [
        [174.61, 220.00, 261.63, 329.63, 392.00], # Fmaj9
        [146.83, 174.61, 220.00, 261.63, 329.63], # Dm9
        [116.54, 146.83, 174.61, 220.00, 293.66], # Bbmaj9
        [130.81, 164.81, 196.00, 261.63, 293.66]  # C9sus
    ]
    roots = [43.65, 36.71, 29.14, 32.70] # F1, D1, Bb0, C1 (Basse profonde)
    
    # 1. Pads analogiques feutrés
    for b_idx in range(int(np.ceil(duration / bar_len))):
        t_bar = b_idx * bar_len
        chord = chords[b_idx % len(chords)]
        idx = (t >= t_bar) & (t < t_bar + bar_len + 0.3)
        if not np.any(idx):
            continue
        dt = t[idx] - t_bar
        # Attaque soyeuse et relâchement progressif
        env = np.clip(dt / 0.5, 0, 1) * np.clip((bar_len + 0.3 - dt) / 0.5, 0, 1)
        for f in chord:
            left[idx] += 0.025 * np.sin(2 * np.pi * f * dt) * env
            right[idx] += 0.025 * np.sin(2 * np.pi * (f * 1.002) * dt) * env
            
    # 2. Sub-Bass ronde et propre
    for b_idx in range(int(np.ceil(duration / bar_len))):
        t_bar = b_idx * bar_len
        root = roots[b_idx % len(roots)] * 2.0
        for hit_beat in [0, 2.5]:
            t_hit = t_bar + hit_beat * beat_len
            idx = (t >= t_hit) & (t < t_hit + beat_len * 1.6)
            if not np.any(idx):
                continue
            dt = t[idx] - t_hit
            env = np.exp(-dt * 1.8)
            sub = np.sin(2 * np.pi * root * dt)
            left[idx] += 0.16 * sub * env
            right[idx] += 0.16 * sub * env

    # 3. Pluck mélodique délicat
    for step in range(int(duration / beat_len)):
        t_step = step * beat_len
        chord = chords[(step // 4) % len(chords)]
        note = chord[step % len(chord)] * 2.0
        idx = (t >= t_step) & (t < t_step + 0.3)
        if not np.any(idx):
            continue
        dt = t[idx] - t_step
        env = np.exp(-dt * 10.0)
        pluck = 0.05 * np.sin(2 * np.pi * note * dt) * env
        pan = 0.5 + 0.25 * math.sin(step * 0.9)
        left[idx] += pluck * pan
        right[idx] += pluck * (1.0 - pan)

    # 4. Percussions minimalistes feutrées (Kick doux, rimshot discret, shaker)
    for b in range(int(duration / beat_len)):
        t_b = b * beat_len
        # Kick doux sur temps 0 et 2
        if b % 4 in [0, 2]:
            idx = (t >= t_b) & (t < t_b + 0.15)
            if np.any(idx):
                dt = t[idx] - t_b
                fk = 110 * np.exp(-dt * 35) + 42
                phase = 2 * np.pi * np.cumsum(fk) / sr
                k = 0.35 * np.sin(phase) * np.exp(-dt * 18)
                left[idx] += k
                right[idx] += k
        # Rimshot / Snap doux sur temps 1 et 3
        if b % 4 in [1, 3]:
            idx = (t >= t_b) & (t < t_b + 0.08)
            if np.any(idx):
                dt = t[idx] - t_b
                noise = np.random.uniform(-0.5, 0.5, size=len(dt))
                tone = np.sin(2 * np.pi * 320 * dt)
                s = (0.12 * noise + 0.12 * tone) * np.exp(-dt * 40)
                left[idx] += s
                right[idx] += s
        # Shaker discret
        for sub in [0.5]:
            t_s = t_b + sub * beat_len
            idx = (t >= t_s) & (t < t_s + 0.04)
            if np.any(idx):
                dt = t[idx] - t_s
                noise = np.random.uniform(-0.5, 0.5, size=len(dt))
                sh = 0.04 * noise * np.exp(-dt * 65)
                left[idx] += sh
                right[idx] += sh

    # 5. Transitions subtiles (balayage d'air très doux)
    scenes = [4.5, 9.0, 13.5, 17.5] if duration < 24 else [4.0, 8.5, 13.0, 17.5, 22.0]
    for st in scenes:
        idx_c = (t >= st) & (t < st + 0.8)
        if np.any(idx_c):
            dt = t[idx_c] - st
            chime = 0.08 * np.sin(2 * np.pi * 1760.0 * dt) * np.exp(-dt * 4.5)
            left[idx_c] += chime
            right[idx_c] += chime

    # Normalisation et fade out doux
    left = np.tanh(left * 1.2) * 0.80
    right = np.tanh(right * 1.2) * 0.80
    
    fade_len = int(sr * 1.2)
    fade = np.linspace(1.0, 0.0, fade_len)
    left[-fade_len:] *= fade
    right[-fade_len:] *= fade
    
    stereo = np.column_stack((left, right))
    return sr, (stereo * 32767).astype(np.int16)

# Moteur Graphique Épuré
def create_base_canvas(t, total_dur):
    im = Image.new('RGB', (WIDTH, HEIGHT), C_BG)
    
    # Halo d'ambiance émeraude très doux au centre (sans fioriture)
    glow = Image.new('RGBA', (WIDTH // 4, HEIGHT // 4), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    
    gx = WIDTH // 8 + 30 * math.sin(t * 0.4)
    gy = HEIGHT // 8 + 20 * math.cos(t * 0.3)
    gdraw.ellipse([gx - 120, gy - 70, gx + 120, gy + 70], fill=(16, 185, 129, 28))
    glow_blurred = glow.filter(ImageFilter.GaussianBlur(35)).resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
    im.paste(glow_blurred, (0, 0), glow_blurred)
    
    draw = ImageDraw.Draw(im)
    
    # En-tête minimaliste
    draw.line([(60, 68), (WIDTH - 60, 68)], fill=(255, 255, 255, 15), width=1)
    # Point vert émeraude discret
    draw.ellipse([64, 42, 72, 50], fill=C_EMERALD)
    draw.text((82, 38), "ShopEazy", font=fonts['nav'], fill=C_WHITE)
    draw.text((160, 39), "—   Plateforme E-commerce pour l'Afrique", font=fonts['body_sm'], fill=C_GRAY_MUTED)
    draw.text((WIDTH - 170, 38), "shopeazy.com", font=fonts['nav'], fill=C_EMERALD)
    
    # Ligne de progression discrète en bas (1px)
    prog_w = int(WIDTH * min(1.0, t / total_dur))
    draw.line([(0, HEIGHT - 2), (prog_w, HEIGHT - 2)], fill=C_EMERALD, width=2)
    
    return im

def draw_header_texts(draw, eyebrow, title, subtitle=None):
    # Eyebrow tag
    draw.text((WIDTH // 2 - 100, 105), eyebrow.upper(), font=fonts['eyebrow'], fill=C_EMERALD)
    
    # Titre principal centré
    tb = draw.textbbox((0, 0), title, font=fonts['title_hero'])
    tw = tb[2] - tb[0]
    draw.text(((WIDTH - tw) // 2, 130), title, font=fonts['title_hero'], fill=C_WHITE)
    
    # Sous-titre
    if subtitle:
        sb = draw.textbbox((0, 0), subtitle, font=fonts['body_lg'])
        sw = sb[2] - sb[0]
        draw.text(((WIDTH - sw) // 2, 195), subtitle, font=fonts['body_lg'], fill=C_GRAY_MUTED)

def draw_minimal_browser(canvas, x, y, w, h, screenshot_img, url_text, pan_progress=0.0):
    # Ombre douce ultra-diffuse
    pad = 30
    shadow = Image.new('RGBA', (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([pad, pad, w + pad, h + pad], radius=14, fill=(0, 0, 0, 160))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    canvas.paste(shadow, (x - pad, y - pad + 6), shadow)
    
    win = Image.new('RGB', (w, h), (12, 17, 28))
    wdraw = ImageDraw.Draw(win)
    
    # Barre de titre épurée
    bar_h = 34
    wdraw.rectangle([0, 0, w, bar_h], fill=(16, 23, 37))
    # 3 points sobres
    wdraw.ellipse([16, 12, 24, 20], fill=(239, 68, 68))
    wdraw.ellipse([30, 12, 38, 20], fill=(245, 158, 11))
    wdraw.ellipse([44, 12, 52, 20], fill=(34, 197, 94))
    
    # Barre URL minimaliste
    url_w = min(380, w - 200)
    url_x = (w - url_w) // 2
    wdraw.rounded_rectangle([url_x, 6, url_x + url_w, 28], radius=5, fill=(10, 14, 24))
    wdraw.text((url_x + 18, 9), url_text, font=fonts['url'], fill=C_GRAY_MUTED)
    
    # Contenu : Capture réelle
    body_h = h - bar_h
    sw, sh = screenshot_img.size
    target_ratio = w / body_h
    
    crop_w = sw
    crop_h = int(sw / target_ratio)
    if crop_h > sh:
        crop_h = sh
        crop_w = int(sh * target_ratio)
        
    pan_max = max(0, sh - crop_h)
    pan_y = int(pan_max * pan_progress)
    pan_x = (sw - crop_w) // 2
    
    cropped = screenshot_img.crop((pan_x, pan_y, pan_x + crop_w, pan_y + crop_h))
    resized = cropped.resize((w, body_h), Image.Resampling.LANCZOS)
    win.paste(resized, (0, bar_h))
    
    # Bordure fine 1px
    wdraw.rounded_rectangle([0, 0, w - 1, h - 1], radius=10, outline=C_BORDER, width=1)
    
    canvas.paste(win, (x, y))

def draw_minimal_card(canvas, x, y, w, h, title, desc, tag_text=None):
    # Carte épurée avec fond sombre et bordure 1px
    card = Image.new('RGBA', (w, h), (13, 19, 32, 240))
    cdraw = ImageDraw.Draw(card)
    cdraw.rounded_rectangle([0, 0, w - 1, h - 1], radius=14, fill=(13, 19, 32, 240), outline=C_BORDER, width=1)
    
    # Titre
    cdraw.text((28, 26), title, font=fonts['title_card'], fill=C_WHITE)
    
    # Tag discret
    if tag_text:
        tb = cdraw.textbbox((0, 0), tag_text, font=fonts['eyebrow'])
        tw = tb[2] - tb[0]
        cdraw.rounded_rectangle([w - 28 - tw - 16, 24, w - 28, 48], radius=12, fill=(20, 30, 48), outline=C_BORDER_LIGHT, width=1)
        cdraw.text((w - 28 - tw - 8, 29), tag_text, font=fonts['eyebrow'], fill=C_EMERALD_LIGHT)
        
    # Ligne de séparation très fine
    cdraw.line([(28, 64), (w - 28, 64)], fill=(255, 255, 255, 12), width=1)
    
    # Description découpée
    words = desc.split(' ')
    lines, cur = [], ""
    for wrd in words:
        test = cur + (" " if cur else "") + wrd
        bbox = cdraw.textbbox((0, 0), test, font=fonts['body_md'])
        if bbox[2] - bbox[0] < w - 56:
            cur = test
        else:
            lines.append(cur)
            cur = wrd
    if cur:
        lines.append(cur)
        
    ly = 82
    for l in lines:
        cdraw.text((28, ly), l, font=fonts['body_md'], fill=C_GRAY_MUTED)
        ly += 24
        
    canvas.paste(card, (x, y), card)

def draw_minimal_pill(draw, x, y, text):
    tb = draw.textbbox((0, 0), text, font=fonts['body_sm'])
    pw = tb[2] - tb[0] + 32
    ph = 36
    draw.rounded_rectangle([x, y, x + pw, y + ph], radius=18, fill=C_BG_CARD, outline=C_BORDER, width=1)
    draw.text((x + 16, y + 9), text, font=fonts['body_sm'], fill=C_GRAY_LIGHT)
    return x + pw + 16

# ==============================================================
# VIDÉO 1 : PRÉSENTATION DE LA PLATEFORME (STYLE ÉPURÉ - 22s)
# ==============================================================
def render_video_1_frame(t):
    total_dur = 22.0
    im = create_base_canvas(t, total_dur)
    draw = ImageDraw.Draw(im)
    
    # SCÈNE 1 (0.0s – 4.5s) : Hook & Boutique en Ligne
    if t < 4.5:
        p = t / 4.5
        t_enter = ease_out_cubic(min(1.0, t / 0.8))
        
        draw_header_texts(
            draw,
            eyebrow="NOUVELLE GÉNÉRATION",
            title="Vendez en ligne en Afrique.",
            subtitle="Créez votre boutique professionnelle en 5 minutes — sans carte bancaire, sans codage."
        )
        
        # Mockup central épuré de la landing page réelle
        win_w, win_h = 1380, 680
        win_x = (WIDTH - win_w) // 2
        win_y = 260 + int((1.0 - t_enter) * 30)
        pan = min(1.0, p * 0.7)
        draw_minimal_browser(im, win_x, win_y, win_w, win_h, SCREENSHOTS['hero'], "shopeazy.com", pan_progress=pan)
        
        # 3 Puces épurées en bas
        p_x = (WIDTH - 580) // 2
        p_y = win_y + win_h + 20
        p_x = draw_minimal_pill(draw, p_x, p_y, "0€ d'abonnement")
        p_x = draw_minimal_pill(draw, p_x, p_y, "Zéro codage")
        p_x = draw_minimal_pill(draw, p_x, p_y, "Prêt en 5 minutes")

    # SCÈNE 2 (4.5s – 9.0s) : Écosystème & Paiements Locaux
    elif t < 9.0:
        st = t - 4.5
        draw_header_texts(
            draw,
            eyebrow="PAIEMENTS LOCAUX",
            title="Des moyens de paiement pensés pour vos clients.",
            subtitle="Supprimez les barrières à l'achat avec les méthodes les plus utilisées en Afrique."
        )
        
        # 3 Cartes horizontales très soignées
        cw, ch = 520, 240
        total_w = 3 * cw + 2 * 30
        start_x = (WIDTH - total_w) // 2
        card_y = 360
        
        cards = [
            ("Paiement à la livraison", "Vos clients commandent en toute confiance et règlent en espèces lors de la réception.", "Actif & Inclus"),
            ("Mobile Money intégré", "Intégration transparente avec Wave, Orange Money, MTN Moov et Airtel.", "Multi-opérateurs"),
            ("Devises locales (FCFA)", "Affichage natif des prix en XOF / XAF et gestion multi-boutiques isolée.", "Sur-mesure")
        ]
        
        for idx, (tit, des, tag) in enumerate(cards):
            t_c = min(1.0, max(0.0, (st - idx * 0.15) / 0.6))
            if t_c > 0:
                e_c = ease_out_cubic(t_c)
                cx = start_x + idx * (cw + 30)
                cy = card_y + int((1.0 - e_c) * 40)
                draw_minimal_card(im, cx, cy, cw, ch, tit, des, tag)
                
        # Badge épuré en bas
        info_t = "Aucun compte bancaire international requis  •  Formulaire optimisé sans abandon de panier"
        tb = draw.textbbox((0, 0), info_t, font=fonts['body_md'])
        draw.text(((WIDTH - (tb[2]-tb[0])) // 2, card_y + ch + 80), info_t, font=fonts['body_md'], fill=C_EMERALD_LIGHT)

    # SCÈNE 3 (9.0s – 13.5s) : Tableau de Bord & Pilotage Réel
    elif t < 13.5:
        st = t - 9.0
        draw_header_texts(
            draw,
            eyebrow="ESPACE VENDEUR",
            title="Pilotez votre activité en temps réel.",
            subtitle="Visualisez vos ventes, vos visiteurs et l'état de vos commandes en un clin d'œil."
        )
        
        win_w, win_h = 1380, 700
        win_x = (WIDTH - win_w) // 2
        win_y = 250
        pan = min(1.0, (st / 4.5) * 0.6)
        draw_minimal_browser(im, win_x, win_y, win_w, win_h, SCREENSHOTS['dashboard'], "shopeazy.com/admin/dashboard", pan_progress=pan)
        
        # 2 Badges métriques épurés au-dessus de la fenêtre
        t_b = min(1.0, max(0.0, (st - 0.6) / 0.6))
        if t_b > 0:
            badge_y = win_y + win_h + 20
            draw.text((win_x + 20, badge_y), "● Chiffre d'affaires & commandes actualisés en direct", font=fonts['body_sm'], fill=C_EMERALD_LIGHT)
            draw.text((win_x + win_w - 380, badge_y), "● Synchronisation automatique Google Sheets", font=fonts['body_sm'], fill=C_GRAY_MUTED)

    # SCÈNE 4 (13.5s – 17.5s) : Gestion Mobile en Déplacement
    elif t < 17.5:
        st = t - 13.5
        draw_header_texts(
            draw,
            eyebrow="APPLICATION MOBILE",
            title="Votre boutique dans votre poche.",
            subtitle="Gérez vos commandes, mettez à jour vos stocks et partagez vos produits depuis votre téléphone."
        )
        
        # Mockup mobile propre (340x700)
        mw, mh = 340, 680
        mx = (WIDTH // 2) - mw - 60
        my = 260
        
        # Bezel téléphone épuré
        phone = Image.new('RGB', (mw, mh), (15, 20, 30))
        pdraw = ImageDraw.Draw(phone)
        
        # Image mobile réelle
        mob_crop = SCREENSHOTS['mobile'].resize((mw, mh), Image.Resampling.LANCZOS)
        phone.paste(mob_crop, (0, 0))
        # Contour fin
        pdraw.rounded_rectangle([0, 0, mw - 1, mh - 1], radius=32, outline=(60, 75, 100), width=2)
        # Dynamic Island minimal
        pdraw.rounded_rectangle([mw // 2 - 40, 10, mw // 2 + 40, 26], radius=8, fill=(8, 12, 20))
        im.paste(phone, (mx, my))
        
        # Colonne droite : 3 Points épurés
        rx = (WIDTH // 2) + 40
        ry = 320
        features = [
            ("Notifications push instantanées", "Soyez alerté dès qu'un client passe commande, de jour comme de nuit."),
            ("Validation rapide des expéditions", "Modifiez le statut de commande en un geste pour informer le client."),
            ("Partage direct sur WhatsApp", "Diffusez vos liens produits en 1 clic dans vos discussions et groupes."),
        ]
        for idx, (tit, des) in enumerate(features):
            t_f = min(1.0, max(0.0, (st - idx * 0.15) / 0.6))
            if t_f > 0:
                e_f = ease_out_cubic(t_f)
                fy = ry + idx * 130 + int((1.0 - e_f) * 20)
                # Point vert épuré
                draw.ellipse([rx, fy + 6, rx + 10, fy + 16], fill=C_EMERALD)
                draw.text((rx + 24, fy), tit, font=fonts['title_card'], fill=C_WHITE)
                draw.text((rx + 24, fy + 32), des, font=fonts['body_md'], fill=C_GRAY_MUTED)

    # SCÈNE 5 (17.5s – 22.0s) : Clôture & Appel à l'Action Épuré
    else:
        st = t - 17.5
        t_enter = ease_out_cubic(min(1.0, st / 0.8))
        
        draw.text((WIDTH // 2 - 80, 240), "LANCEMENT IMMÉDIAT", font=fonts['eyebrow'], fill=C_EMERALD)
        
        tit = "Votre succès e-commerce commence ici."
        tb = draw.textbbox((0, 0), tit, font=fonts['title_hero'])
        draw.text(((WIDTH - (tb[2]-tb[0])) // 2, 275), tit, font=fonts['title_hero'], fill=C_WHITE)
        
        sub = "Rejoignez des centaines de commerçants qui développent leurs ventes en toute liberté."
        sb = draw.textbbox((0, 0), sub, font=fonts['body_lg'])
        draw.text(((WIDTH - (sb[2]-sb[0])) // 2, 350), sub, font=fonts['body_lg'], fill=C_GRAY_MUTED)
        
        # Bouton minimaliste émeraude
        t_btn = ease_out_cubic(min(1.0, max(0.0, (st - 0.4) / 0.6)))
        if t_btn > 0:
            bw, bh = 420, 64
            bx = (WIDTH - bw) // 2
            by = 450
            draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=32, fill=C_EMERALD)
            btn_t = "Créer ma boutique gratuitement →"
            bb = draw.textbbox((0, 0), btn_t, font=fonts['btn'])
            draw.text(((WIDTH - (bb[2]-bb[0])) // 2, by + 22), btn_t, font=fonts['btn'], fill=C_WHITE)
            
        # 3 Mentions sobres
        mentions = "100% Gratuit   •   Sans Carte Bancaire   •   Prêt en 5 Minutes"
        mb = draw.textbbox((0, 0), mentions, font=fonts['body_md'])
        draw.text(((WIDTH - (mb[2]-mb[0])) // 2, 560), mentions, font=fonts['body_md'], fill=C_EMERALD_LIGHT)
        
        # Lien épuré
        url_t = "www.shopeazy.com"
        ub = draw.textbbox((0, 0), url_t, font=fonts['title_card'])
        draw.text(((WIDTH - (ub[2]-ub[0])) // 2, 630), url_t, font=fonts['title_card'], fill=C_WHITE)

    return im

# ==============================================================
# VIDÉO 2 : VISITE DES FONCTIONNALITÉS (STYLE ÉPURÉ - 26s)
# ==============================================================
def render_video_2_frame(t):
    total_dur = 26.0
    im = create_base_canvas(t, total_dur)
    draw = ImageDraw.Draw(im)
    
    # SCÈNE 1 (0.0s – 4.0s) : Introduction des Modules
    if t < 4.0:
        p = t / 4.0
        t_enter = ease_out_cubic(min(1.0, t / 0.8))
        
        draw_header_texts(
            draw,
            eyebrow="VISITE DE LA PLATEFORME",
            title="Une suite d'outils pensée pour vendre.",
            subtitle="Découvrez les modules clés conçus pour simplifier la gestion de votre activité."
        )
        
        # 4 Piliers minimalistes en ligne
        pw, ph = 310, 220
        total_w = 4 * pw + 3 * 24
        start_x = (WIDTH - total_w) // 2
        py = 400
        
        pillars = [
            ("01. Dashboard", "Suivi des ventes et visiteurs en temps réel."),
            ("02. Produits", "Gestion des variantes, stock et import en 1 clic."),
            ("03. Commandes", "Workflow complet, alertes sonores et export."),
            ("04. Vitrine", "Expérience d'achat fluide et optimisée mobile.")
        ]
        
        for idx, (tit, des) in enumerate(pillars):
            t_p = min(1.0, max(0.0, (t - 0.2 - idx * 0.1) / 0.6))
            if t_p > 0:
                e_p = ease_out_cubic(t_p)
                px = start_x + idx * (pw + 24)
                draw.rounded_rectangle([px, py, px + pw, py + ph], radius=16, fill=C_BG_CARD, outline=C_BORDER, width=1)
                draw.text((px + 24, py + 30), tit, font=fonts['title_card'], fill=C_WHITE)
                draw.line([(px + 24, py + 68), (px + pw - 24, py + 68)], fill=(255, 255, 255, 12), width=1)
                
                # Desc
                words = des.split(' ')
                l1 = " ".join(words[:4])
                l2 = " ".join(words[4:])
                draw.text((px + 24, py + 90), l1, font=fonts['body_md'], fill=C_GRAY_MUTED)
                draw.text((px + 24, py + 118), l2, font=fonts['body_md'], fill=C_GRAY_MUTED)

    # SCÈNE 2 (4.0s – 8.5s) : 01. Dashboard Analytique
    elif t < 8.5:
        st = t - 4.0
        draw_header_texts(
            draw,
            eyebrow="MODULE 01  •  TABLEAU DE BORD",
            title="Indicateurs de performance en direct.",
            subtitle="Analysez votre chiffre d'affaires, vos conversions et le volume de commandes."
        )
        
        win_w, win_h = 1380, 700
        win_x = (WIDTH - win_w) // 2
        win_y = 250
        pan = min(1.0, (st / 4.5) * 0.5)
        draw_minimal_browser(im, win_x, win_y, win_w, win_h, SCREENSHOTS['dashboard'], "shopeazy.com/admin", pan_progress=pan)
        
        # Mention épurée en bas
        draw.text((win_x + 20, win_y + win_h + 20), "● Vue d'ensemble journalière, hebdomadaire et mensuelle", font=fonts['body_sm'], fill=C_EMERALD_LIGHT)
        draw.text((win_x + win_w - 320, win_y + win_h + 20), "● Données actualisées en direct", font=fonts['body_sm'], fill=C_GRAY_MUTED)

    # SCÈNE 3 (8.5s – 13.0s) : 02. Catalogue Produits & Variantes
    elif t < 13.0:
        st = t - 8.5
        draw_header_texts(
            draw,
            eyebrow="MODULE 02  •  CATALOGUE PRODUITS",
            title="Gestion intelligente des stocks & variantes.",
            subtitle="Ajoutez vos articles manuellement ou importez votre catalogue en quelques secondes."
        )
        
        win_w, win_h = 1380, 700
        win_x = (WIDTH - win_w) // 2
        win_y = 250
        pan = min(1.0, (st / 4.5) * 0.5)
        draw_minimal_browser(im, win_x, win_y, win_w, win_h, SCREENSHOTS['products'], "shopeazy.com/admin/products", pan_progress=pan)
        
        draw.text((win_x + 20, win_y + win_h + 20), "● Tailles, couleurs, SKU, prix de comparaison et gestion de stock", font=fonts['body_sm'], fill=C_EMERALD_LIGHT)
        draw.text((win_x + win_w - 340, win_y + win_h + 20), "● Import CSV & Shopify compatible", font=fonts['body_sm'], fill=C_GRAY_MUTED)

    # SCÈNE 4 (13.0s – 17.5s) : 03. Workflow de Traitement des Commandes
    elif t < 17.5:
        st = t - 13.0
        draw_header_texts(
            draw,
            eyebrow="MODULE 03  •  GESTION DES COMMANDES",
            title="Suivi rigoureux de chaque expédition.",
            subtitle="Gérez le cycle complet de commande avec alertes instantanées et mise à jour des statuts."
        )
        
        win_w, win_h = 1380, 700
        win_x = (WIDTH - win_w) // 2
        win_y = 250
        pan = min(1.0, (st / 4.5) * 0.5)
        draw_minimal_browser(im, win_x, win_y, win_w, win_h, SCREENSHOTS['orders'], "shopeazy.com/admin/orders", pan_progress=pan)
        
        draw.text((win_x + 20, win_y + win_h + 20), "● Workflow : En attente ➔ Confirmé ➔ Expédié ➔ Livré", font=fonts['body_sm'], fill=C_EMERALD_LIGHT)
        draw.text((win_x + win_w - 360, win_y + win_h + 20), "● Export automatique vers Google Sheets", font=fonts['body_sm'], fill=C_GRAY_MUTED)

    # SCÈNE 5 (17.5s – 22.0s) : 04. Vitrine & Expérience Client
    elif t < 22.0:
        st = t - 17.5
        draw_header_texts(
            draw,
            eyebrow="MODULE 04  •  VITRINE COMMERCIALE",
            title="Une expérience d'achat ultra-fluide.",
            subtitle="Des pages modernes, rapides et optimisées pour maximiser votre taux de conversion."
        )
        
        win_w, win_h = 1380, 700
        win_x = (WIDTH - win_w) // 2
        win_y = 250
        pan = min(1.0, (st / 4.5) * 0.5)
        draw_minimal_browser(im, win_x, win_y, win_w, win_h, SCREENSHOTS['features'], "shopeazy.com/#fonctionnalites", pan_progress=pan)
        
        draw.text((win_x + 20, win_y + win_h + 20), "● Formulaire de commande express sans création de compte obligatoire", font=fonts['body_sm'], fill=C_EMERALD_LIGHT)
        draw.text((win_x + win_w - 320, win_y + win_h + 20), "● Chargement ultra-rapide sur mobile", font=fonts['body_sm'], fill=C_GRAY_MUTED)

    # SCÈNE 6 (22.0s – 26.0s) : Clôture & Démarrage Immédiat
    else:
        st = t - 22.0
        draw.text((WIDTH // 2 - 80, 230), "COMMENCEZ MAINTENANT", font=fonts['eyebrow'], fill=C_EMERALD)
        
        tit = "Votre boutique en ligne en 5 minutes."
        tb = draw.textbbox((0, 0), tit, font=fonts['title_hero'])
        draw.text(((WIDTH - (tb[2]-tb[0])) // 2, 265), tit, font=fonts['title_hero'], fill=C_WHITE)
        
        sub = "Rejoignez la nouvelle référence du commerce digital en Afrique."
        sb = draw.textbbox((0, 0), sub, font=fonts['body_lg'])
        draw.text(((WIDTH - (sb[2]-sb[0])) // 2, 340), sub, font=fonts['body_lg'], fill=C_GRAY_MUTED)
        
        # Bouton
        bw, bh = 420, 64
        bx = (WIDTH - bw) // 2
        by = 440
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=32, fill=C_EMERALD)
        btn_t = "Démarrer sur ShopEazy →"
        bb = draw.textbbox((0, 0), btn_t, font=fonts['btn'])
        draw.text(((WIDTH - (bb[2]-bb[0])) // 2, by + 22), btn_t, font=fonts['btn'], fill=C_WHITE)
        
        mentions = "Zéro Abonnement   •   Paiement à la Livraison   •   App Mobile Gratuite"
        mb = draw.textbbox((0, 0), mentions, font=fonts['body_md'])
        draw.text(((WIDTH - (mb[2]-mb[0])) // 2, 550), mentions, font=fonts['body_md'], fill=C_EMERALD_LIGHT)
        
        url_t = "www.shopeazy.com"
        ub = draw.textbbox((0, 0), url_t, font=fonts['title_card'])
        draw.text(((WIDTH - (ub[2]-ub[0])) // 2, 620), url_t, font=fonts['title_card'], fill=C_WHITE)

    return im

# ==============================================================
# ENCODAGE FFMPEG SÉCURISÉ & STABLE
# ==============================================================
def render_and_encode_video(render_func, duration, output_mp4, bpm=118):
    print(f"\n==========================================")
    print(f"🎬 Encodage : {os.path.basename(output_mp4)}")
    print(f"⏱️  Durée : {duration}s | Résolution : {WIDTH}x{HEIGHT} | 30 FPS")
    print(f"==========================================")
    
    # 1. Piste audio
    print("🎵 Génération de la piste audio épurée...")
    sr, audio_int16 = generate_minimal_soundtrack(bpm, duration)
    temp_wav = output_mp4.replace('.mp4', '_temp.wav')
    with wave.open(temp_wav, 'w') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio_int16.tobytes())
        
    # 2. Pipe FFmpeg
    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{WIDTH}x{HEIGHT}',
        '-pix_fmt', 'rgb24',
        '-r', str(FPS),
        '-i', '-',
        '-i', temp_wav,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',          # Qualité visuelle optimale
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        output_mp4
    ]
    
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    
    total_frames = int(duration * FPS)
    start_time = time.time()
    
    for frame_idx in range(total_frames):
        t = frame_idx / float(FPS)
        frame_img = render_func(t)
        proc.stdin.write(frame_img.tobytes())
        
        if frame_idx % 60 == 0 or frame_idx == total_frames - 1:
            elapsed = time.time() - start_time
            fps_speed = (frame_idx + 1) / (elapsed + 1e-6)
            percent = (frame_idx + 1) / total_frames * 100.0
            print(f"  Frame {frame_idx + 1}/{total_frames} ({percent:.1f}%) | {fps_speed:.1f} fps", end='\r', flush=True)
            
    proc.stdin.close()
    stderr_err = proc.stderr.read()
    proc.wait()
    
    if os.path.exists(temp_wav):
        os.remove(temp_wav)
        
    if proc.returncode != 0:
        print(f"\n❌ Erreur d'encodage :\n{stderr_err.decode('utf-8', errors='ignore')}")
        sys.exit(1)
        
    total_time = time.time() - start_time
    file_size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print(f"\n✅ Terminé avec succès : {output_mp4} ({file_size_mb:.2f} Mo en {total_time:.1f}s)")

def main():
    os.makedirs(SCRIPT_DIR, exist_ok=True)
    target = sys.argv[1] if len(sys.argv) > 1 else 'all'
    
    print("🚀 Démarrage de la génération des motions design épurés...")
    
    # Vidéo 1
    if target in ('all', '1'):
        render_and_encode_video(
            render_func=render_video_1_frame,
            duration=22.0,
            output_mp4=VIDEO1_PATH,
            bpm=118
        )
        
    # Vidéo 2
    if target in ('all', '2'):
        render_and_encode_video(
            render_func=render_video_2_frame,
            duration=26.0,
            output_mp4=VIDEO2_PATH,
            bpm=114
        )
        
    print("\n🎉 Les deux vidéos motion design épurées ont été générées avec succès !")

if __name__ == '__main__':
    main()
