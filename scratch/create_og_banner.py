from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

# Dimensões Padrão OpenGraph (WhatsApp, Facebook, Twitter, LinkedIn)
WIDTH, HEIGHT = 1200, 630
banner = Image.new('RGB', (WIDTH, HEIGHT), color='#203528')
draw = ImageDraw.Draw(banner)

# Gradiente Suave de Fundo
for y in range(HEIGHT):
    r = int(32 + (y / HEIGHT) * 10)
    g = int(53 + (y / HEIGHT) * 15)
    b = int(40 + (y / HEIGHT) * 10)
    draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

# Moldura & Elementos Botânicos
draw.rectangle([20, 20, WIDTH - 20, HEIGHT - 20], outline='#8ca481', width=3)

# Tentar carregar foto oficial da Dra. Silvia
img_path = r"c:\Users\Juan Sales\OneDrive\Desktop\Nutricionista\assets\silvia-foto-oficial.jpg"
if os.path.exists(img_path):
    portrait = Image.open(img_path).convert("RGBA")
    p_width = 450
    p_height = int(portrait.height * (p_width / portrait.width))
    portrait = portrait.resize((p_width, p_height), Image.Resampling.LANCZOS)
    
    # Criar máscara redonda com borda dourada/sálvia
    mask = Image.new('L', (p_width, p_width), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0, p_width, p_width), fill=255)
    
    # Recortar foto quadrada
    crop_size = min(portrait.width, portrait.height)
    portrait_cropped = portrait.crop((0, 0, crop_size, crop_size)).resize((p_width, p_width), Image.Resampling.LANCZOS)
    
    # Desenhar círculo de fundo
    draw.ellipse([80, 90, 80 + p_width + 12, 90 + p_width + 12], fill='#8ca481')
    banner.paste(portrait_cropped, (86, 96), mask)

# Fontes padrão
try:
    font_title = ImageFont.truetype("arial.ttf", 46)
    font_sub = ImageFont.truetype("arial.ttf", 26)
    font_badge = ImageFont.truetype("arial.ttf", 24)
except:
    font_title = font_sub = font_badge = ImageFont.load_default()

# Textos do Card de Compartilhamento
text_x = 580
draw.text((text_x, 140), "Dra. Silvia Oliveira Lemos", fill="#ffffff", font=font_title)
draw.text((text_x, 210), "NUTRICIONISTA • CRN-4 24987/P", fill="#8ca481", font=font_badge)

draw.line([(text_x, 260), (text_x + 500, 260)], fill="#8ca481", width=2)

draw.text((text_x, 290), "🌿 Nutrição Clínica & Esportiva", fill="#eef4e5", font=font_sub)
draw.text((text_x, 340), "🥗 Reeducação Alimentar sem Neura", fill="#eef4e5", font=font_sub)
draw.text((text_x, 390), "📱 Atendimento Presencial & Online", fill="#eef4e5", font=font_sub)

# Botão CTA de Compartilhamento
draw.rectangle([text_x, 460, text_x + 460, 525], fill="#8ca481")
draw.text((text_x + 40, 478), "AGENDAR CONSULTA VIA WHATSAPP", fill="#0e1a12", font=font_badge)

# Salvar como WebP e JPG
out_webp = r"c:\Users\Juan Sales\OneDrive\Desktop\Nutricionista\assets\share-banner.webp"
out_jpg = r"c:\Users\Juan Sales\OneDrive\Desktop\Nutricionista\assets\share-banner.jpg"

banner.save(out_webp, "WEBP", quality=90)
banner.save(out_jpg, "JPEG", quality=90)
print(f"Social Share Banner criado com sucesso em {out_webp}!")
