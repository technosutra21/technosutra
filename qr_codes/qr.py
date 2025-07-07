import qrcode
import os

# Criar pasta para salvar os QR Codes
if not os.path.exists('qr_codes'):
    os.makedirs('qr_codes')

# Gerar QR Codes de 1 a 56
for i in range(1, 57):
    # Criar a URL
    url = f"https://technosutra21.github.io/technosutra/?model={i}"
    
    # Criar o QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    # Criar a imagem
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Salvar o arquivo
    filename = f"qr_codes/QR_Model_{i:02d}.png"
    img.save(filename)
    print(f"QR Code criado: {filename}")

print("Todos os 56 QR Codes foram criados com sucesso!")