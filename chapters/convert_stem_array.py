import os
import re
import unicodedata
from PyPDF2 import PdfReader
from fpdf import FPDF
import logging

# Configurar logging para rastrear problemas
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='conversion_log.txt'
)

# Dicionário de conversão de palavras do sânscrito para a forma verbal em português
word_conversions = {
    # Nomes próprios e termos específicos
    'Avalokiteśvara': 'Avalokiteshvara',
    'Bhagavān': 'Bhagavan',
    'Bhikṣu': 'Bikshu',
    'Bhikṣus': 'Bikshus',
    'bhikṣus': 'bikshus',
    'Bodhisattva': 'Bodhisattva',
    'Bodhisattvas': 'Bodhisattvas',
    'Buddha': 'Buda',
    'Buddhas': 'Budas',
    'Dharmapāla': 'Dharmapala',
    'Indriyeśvara': 'Indriyeshvara',
    'Jayosmayatana': 'Jayosmayatana',
    'Mañjuśrī': 'Manjushri',
    'Meghā': 'Megha',
    'Muktaka': 'Muktaka',
    'Nāga': 'Naga',
    'Nāgas': 'Nagas',
    'Pramuditā': 'Pramudita',
    'Pratibhāna': 'Pratibhana',
    'Pratyekabuddha': 'Pratyekabuddha',
    'Pratyekabuddhas': 'Pratyekabuddhas',
    'Ratnacūḍa': 'Ratnacuda',
    'Ṛṣi': 'Rishi',
    'Ṛṣis': 'Rishis',
    'Sāgara': 'Sagara',
    'Sāgaramati': 'Sagaramati',
    'Samantabhadra': 'Samantabhadra',
    'Samantabhadrā': 'Samantabhadra',
    'Samantabhadrī': 'Samantabhadri',
    'Samantabhadr': 'Samantabhadra',
    'Śāriputra': 'Shariputra',
    'Śramaṇa': 'Shramana',
    'Śramaṇas': 'Shramanas',
    'Śrāvaka': 'Shravaka',
    'Śrāvakas': 'Shravakas',
    'Tathāgata': 'Tathagata',
    'Tathāgatas': 'Tathagatas',
    'Vaidūrya': 'Vaidurya',
    'Vairocana': 'Vairocana',
    
    # Termos comuns
    'dharma': 'dharma',
    'Dharma': 'Dharma',
    'sūtra': 'sutra',
    'Sūtra': 'Sutra',
    'samādhi': 'samadhi',
    'Samādhi': 'Samadhi',
    'saṃsāra': 'samsara',
    'Saṃsāra': 'Samsara',
    'nirvāṇa': 'nirvana',
    'Nirvāṇa': 'Nirvana',
    'pāramitā': 'paramita',
    'Pāramitā': 'Paramita',
    'prajñā': 'prajna',
    'Prajñā': 'Prajna',
    'śūnyatā': 'shunyata',
    'Śūnyatā': 'Shunyata',
    'kalyāṇamitra': 'kalyanamitra',
    'Kalyāṇamitra': 'Kalyanamitra',
    'bhūmi': 'bhumi',
    'Bhūmi': 'Bhumi',
    'kṣaṇa': 'kshana',
    'Kṣaṇa': 'Kshana',
    'māyā': 'maya',
    'Māyā': 'Maya',
    'kṣānti': 'kshanti',
    'Kṣānti': 'Kshanti',
    'dhyāna': 'dhyana',
    'Dhyāna': 'Dhyana',
    'śīla': 'shila',
    'Śīla': 'Shila',
    'upāya': 'upaya',
    'Upāya': 'Upaya',
    'jñāna': 'jnana',
    'Jñāna': 'Jnana',
    'maṇḍala': 'mandala',
    'Maṇḍala': 'Mandala',
    'dhāraṇī': 'dharani',
    'Dhāraṇī': 'Dharani',
    'Mahāyāna': 'Mahayana',
    'mahāyāna': 'mahayana',
    'Hīnayāna': 'Hinayana',
    'hīnayāna': 'hinayana',
    'Vajrayāna': 'Vajrayana',
    'vajrayāna': 'vajrayana',
}

# Mapeamento de caracteres especiais para suas versões em português
diacritic_replacements = {
    'ā': 'a', 'Ā': 'A',
    'ī': 'i', 'Ī': 'I',
    'ū': 'u', 'Ū': 'U',
    'ṛ': 'ri', 'Ṛ': 'Ri',
    'ṝ': 'ri', 'Ṝ': 'Ri',
    'ḷ': 'li', 'Ḷ': 'Li',
    'ḹ': 'li', 'Ḹ': 'Li',
    'ṃ': 'm', 'Ṃ': 'M',
    'ḥ': 'h', 'Ḥ': 'H',
    'ś': 'sh', 'Ś': 'Sh',
    'ṣ': 'sh', 'Ṣ': 'Sh',
    'ñ': 'n', 'Ñ': 'N',
    'ṅ': 'n', 'Ṅ': 'N',
    'ṇ': 'n', 'Ṇ': 'N',
    'ṭ': 't', 'Ṭ': 'T',
    'ḍ': 'd', 'Ḍ': 'D',
    'ṇ': 'n', 'Ṇ': 'N',
    'ṁ': 'm', 'Ṁ': 'M',
    'ṣ': 'sh', 'Ṣ': 'Sh',
    'ṭ': 't', 'Ṭ': 'T',
    'ṭh': 'th', 'Ṭh': 'Th',
    'ḍ': 'd', 'Ḍ': 'D',
    'ḍh': 'dh', 'Ḍh': 'Dh',
    'ṇ': 'n', 'Ṇ': 'N',
    'ś': 'sh', 'Ś': 'Sh',
    'ṣ': 'sh', 'Ṣ': 'Sh',
    'ḻ': 'l', 'Ḻ': 'L',
    'ṟ': 'r', 'Ṟ': 'R',
    'ṉ': 'n', 'Ṉ': 'N',
    'ʼ': "'", '´': "'", '`': "'", ''': "'", ''': "'",
    '—': '-', '–': '-',
    '…': '...',
    '"': '"', '"': '"',
    '¸': '',  # Remover cedilha incorreta
    '·': '.',
    '•': '*',
    '°': 'o',
    '¹': '1', '²': '2', '³': '3',
    '½': '1/2',
    '¼': '1/4',
    '¾': '3/4',
    '×': 'x',
    '÷': '/',
    '≠': '!=',
    '≤': '<=',
    '≥': '>=',
    '≈': '~=',
    '∞': 'infinito',
    '∑': 'soma',
    '∏': 'produto',
    '∂': 'd',
    '∫': 'integral',
    '∈': 'pertence',
    '∉': 'nao pertence',
    '∩': 'intersecao',
    '∪': 'uniao',
    '⊂': 'contido',
    '⊃': 'contem',
    '⊆': 'contido ou igual',
    '⊇': 'contem ou igual',
    '∅': 'conjunto vazio',
    '∀': 'para todo',
    '∃': 'existe',
    '∄': 'nao existe',
    '∴': 'portanto',
    '∵': 'porque',
    '∼': '~',
    '≅': 'congruente',
    '≡': 'identico',
    '≢': 'nao identico',
    '⊕': 'soma direta',
    '⊗': 'produto tensorial',
    '⊥': 'perpendicular',
    '∥': 'paralelo',
    '∠': 'angulo',
    '∇': 'nabla',
    '√': 'raiz',
    '∛': 'raiz cubica',
    '∜': 'raiz quarta',
    '⋅': '.',
    '⋯': '...',
    '⋮': ':',
    '⋰': '...',
    '⋱': '...',
}

def extract_text_from_pdf(pdf_path):
    """
    Extrai texto de um arquivo PDF.
    """
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
            else:
                logging.warning(f"Página sem texto detectável em {pdf_path}")
        return text
    except Exception as e:
        logging.error(f"Erro ao extrair texto do PDF {pdf_path}: {str(e)}")
        raise

def normalize_diacritics(text):
    """
    Normaliza caracteres diacríticos para suas versões em português.
    """
    # Primeiro, substituir caracteres específicos
    for diacritic, replacement in diacritic_replacements.items():
        text = text.replace(diacritic, replacement)
    
    # Em seguida, normalizar qualquer outro caractere diacrítico não mapeado
    normalized_text = ''
    for char in text:
        # Verificar se o caractere é um diacrítico não mapeado
        if unicodedata.category(char).startswith('M') or ord(char) > 127:
            try:
                # Tentar normalizar para forma NFKD e remover marcas diacríticas
                normalized_char = unicodedata.normalize('NFKD', char)
                # Filtrar apenas caracteres base (não diacríticos)
                normalized_char = ''.join([c for c in normalized_char if not unicodedata.category(c).startswith('M')])
                normalized_text += normalized_char
            except:
                # Se falhar, manter o caractere original
                normalized_text += char
        else:
            normalized_text += char
    
    return normalized_text

def convert_words(text):
    """
    Converte palavras do sânscrito para a forma verbal em português.
    """
    # Primeiro, vamos corrigir algumas inconsistências óbvias
    text = text.replace('Bhik¸us', 'Bikshus')
    text = text.replace('Samantabhr', 'Samantabhadra')
    text = text.replace('Samantabhadra:', 'Samantabhadra')
    text = text.replace('Samantabhadri:', 'Samantabhadri')
    
    # Usar expressões regulares para substituições mais precisas
    for sanskrit_word, portuguese_word in word_conversions.items():
        # Criar um padrão que corresponda à palavra inteira, considerando possíveis caracteres especiais
        pattern = r'\b' + re.escape(sanskrit_word) + r'\b'
        text = re.sub(pattern, portuguese_word, text, flags=re.IGNORECASE)
    
    # Normalizar quaisquer diacríticos restantes
    text = normalize_diacritics(text)
    
    return text

def create_pdf_with_text(text, output_path):
    """
    Cria um novo PDF com o texto fornecido usando FPDF com suporte a UTF-8.
    """
    try:
        from fpdf import XPos, YPos  # Importar para usar com as novas APIs
        
        pdf = FPDF()
        pdf.add_page()
        
        # Adicionar fonte com suporte a caracteres especiais
        try:
            # Usar a nova API sem o parâmetro 'uni' (que está obsoleto)
            pdf.add_font('DejaVu', '', 'c:\\Windows\\Fonts\\DejaVuSans.ttf')
            pdf.set_font('DejaVu', '', 12)
        except Exception as font_error:
            logging.warning(f"Erro ao carregar fonte DejaVu: {str(font_error)}")
            # Usar fonte padrão que suporta UTF-8
            pdf.set_font('helvetica', '', 12)
        
        # Dividir o texto em linhas
        lines = text.split('\n')
        for line in lines:
            # Remover caracteres nulos e outros caracteres problemáticos
            line = line.replace('\x00', '').strip()
            if line:
                # Limitar o comprimento da linha para evitar erros de codificação
                if len(line) > 120:
                    chunks = [line[i:i+120] for i in range(0, len(line), 120)]
                    for chunk in chunks:
                        try:
                            # Usar a nova API para multi_cell
                            pdf.multi_cell(0, 10, chunk)
                        except Exception as chunk_error:
                            logging.warning(f"Erro ao adicionar chunk: {str(chunk_error)}")
                            # Tentar remover caracteres problemáticos
                            safe_chunk = ''.join(c for c in chunk if ord(c) < 128)
                            pdf.multi_cell(0, 10, safe_chunk)
                else:
                    try:
                        pdf.multi_cell(0, 10, line)
                    except Exception as line_error:
                        logging.warning(f"Erro ao adicionar linha: {str(line_error)}")
                        # Tentar remover caracteres problemáticos
                        safe_line = ''.join(c for c in line if ord(c) < 128)
                        pdf.multi_cell(0, 10, safe_line)
        
        pdf.output(output_path)
        logging.info(f"PDF criado com sucesso: {output_path}")
        return True
    except Exception as e:
        logging.error(f"Erro ao criar PDF {output_path}: {str(e)}")
        
        # Tentar método alternativo com codificação latin-1
        try:
            from fpdf import XPos, YPos  # Importar para usar com as novas APIs
            
            logging.info("Tentando método alternativo com codificação latin-1")
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("helvetica", size=12)  # Usar helvetica em vez de Arial (obsoleto)
            
            lines = text.split('\n')
            for line in lines:
                line = line.replace('\x00', '').strip()
                if line:
                    try:
                        # Converter para latin-1, substituindo caracteres não suportados
                        safe_line = line.encode('latin-1', 'replace').decode('latin-1')
                        # Usar a nova API para cell
                        pdf.cell(0, 10, safe_line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    except Exception as cell_error:
                        logging.warning(f"Erro ao adicionar célula: {str(cell_error)}")
                        # Se falhar, tentar remover todos os caracteres não-ASCII
                        safe_line = ''.join(c for c in line if ord(c) < 128)
                        pdf.cell(0, 10, safe_line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            
            pdf.output(output_path)
            logging.info(f"PDF criado com método alternativo: {output_path}")
            return True
        except Exception as e2:
            logging.error(f"Erro no método alternativo: {str(e2)}")
            
            # Tentar um terceiro método ainda mais simples
            try:
                logging.info("Tentando método de último recurso")
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("helvetica", size=12)
                
                # Usar apenas texto ASCII simples
                pdf.cell(0, 10, "Texto convertido - veja o arquivo de log para detalhes")
                pdf.add_page()
                
                # Adicionar algumas informações básicas
                pdf.cell(0, 10, f"Arquivo original: {os.path.basename(output_path)}")
                pdf.cell(0, 10, "Caracteres especiais foram removidos devido a limitações de codificação.", 
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                
                # Adicionar algumas linhas do texto original (apenas ASCII)
                pdf.cell(0, 10, "Primeiras linhas do texto convertido:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                
                # Pegar as primeiras 20 linhas do texto
                preview_lines = text.split('\n')[:20]
                for line in preview_lines:
                    # Remover todos os caracteres não-ASCII
                    safe_line = ''.join(c for c in line if ord(c) < 128)
                    if safe_line.strip():
                        pdf.cell(0, 10, safe_line[:80], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                
                pdf.output(output_path)
                logging.info(f"PDF criado com método de último recurso: {output_path}")
                return True
            except Exception as e3:
                logging.error(f"Todos os métodos falharam: {str(e3)}")
                return False

def download_dejavu_font():
    """
    Baixa a fonte DejaVu Sans se não estiver disponível no sistema.
    Retorna o caminho para a fonte.
    """
    # Verificar se a fonte DejaVu está disponível no Windows
    windows_font_path = 'c:\\Windows\\Fonts\\DejaVuSans.ttf'
    if os.path.exists(windows_font_path):
        logging.info("Fonte DejaVuSans.ttf encontrada no diretório de fontes do Windows.")
        return windows_font_path
    
    # Verificar se já baixamos a fonte anteriormente
    local_font_dir = os.path.join(os.getcwd(), "temp_fonts")
    local_font_path = os.path.join(local_font_dir, "DejaVuSans.ttf")
    
    if os.path.exists(local_font_path):
        logging.info(f"Fonte DejaVuSans.ttf encontrada localmente em {local_font_path}")
        return local_font_path
    
    # Baixar a fonte se não estiver disponível
    logging.warning("Fonte DejaVuSans.ttf não encontrada. Tentando baixar...")
    try:
        import urllib.request
        
        # URL para download da fonte DejaVu
        url = "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf"
        
        # Criar diretório temporário se não existir
        os.makedirs(local_font_dir, exist_ok=True)
        
        # Baixar a fonte
        urllib.request.urlretrieve(url, local_font_path)
        
        logging.info(f"Fonte baixada para {local_font_path}")
        return local_font_path
    except Exception as e:
        logging.error(f"Erro ao baixar fonte: {str(e)}")
        logging.info("Continuando com fontes padrão...")
        return None

def process_all_pdfs():
    """
    Processa todos os arquivos PDF no diretório atual.
    """
    # Tentar baixar a fonte DejaVu (se necessário)
    dejavu_font_path = download_dejavu_font()
    if dejavu_font_path:
        logging.info(f"Usando fonte DejaVu de: {dejavu_font_path}")
    else:
        logging.warning("Usando fontes padrão para a conversão.")
    
    # Obter todos os arquivos PDF no diretório
    pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf') and 'Converted' not in f]
    
    if not pdf_files:
        logging.warning("Nenhum arquivo PDF encontrado no diretório atual.")
        print("Nenhum arquivo PDF encontrado no diretório atual.")
        return
    
    print(f"Encontrados {len(pdf_files)} arquivos PDF para processar.")
    logging.info(f"Encontrados {len(pdf_files)} arquivos PDF para processar.")
    
    # Ordenar arquivos por número de capítulo para processamento sequencial
    try:
        pdf_files.sort(key=lambda x: int(x.split()[0]) if x.split()[0].isdigit() else float('inf'))
    except:
        # Se a ordenação falhar, manter a ordem original
        logging.warning("Não foi possível ordenar os arquivos por número de capítulo.")
    
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    for pdf_file in pdf_files:
        print(f"Processando {pdf_file}...")
        logging.info(f"Processando {pdf_file}...")
        
        # Criar nome para o arquivo de saída
        name, ext = os.path.splitext(pdf_file)
        output_pdf_path = f"{name} - Converted{ext}"
        
        # Verificar se o arquivo já foi convertido
        if os.path.exists(output_pdf_path):
            print(f"Arquivo {output_pdf_path} já existe. Pulando...")
            logging.info(f"Arquivo {output_pdf_path} já existe. Pulando...")
            skipped_count += 1
            continue
        
        try:
            # Extrair texto do PDF
            text = extract_text_from_pdf(pdf_file)
            
            if not text.strip():
                print(f"Aviso: O arquivo {pdf_file} não contém texto extraível.")
                logging.warning(f"O arquivo {pdf_file} não contém texto extraível.")
                error_count += 1
                continue
            
            # Converter palavras
            converted_text = convert_words(text)
            
            # Salvar uma cópia do texto convertido em formato .txt para referência
            txt_output_path = f"{name} - Converted.txt"
            try:
                with open(txt_output_path, 'w', encoding='utf-8') as txt_file:
                    txt_file.write(converted_text)
                logging.info(f"Texto convertido salvo como: {txt_output_path}")
            except Exception as txt_error:
                logging.warning(f"Não foi possível salvar o arquivo de texto: {str(txt_error)}")
            
            # Criar novo PDF com o texto convertido
            if create_pdf_with_text(converted_text, output_pdf_path):
                print(f"Arquivo convertido salvo como: {output_pdf_path}")
                success_count += 1
            else:
                print(f"Falha ao criar o arquivo PDF: {output_pdf_path}")
                error_count += 1
                
        except Exception as e:
            print(f"Erro ao processar {pdf_file}: {str(e)}")
            logging.error(f"Erro ao processar {pdf_file}: {str(e)}")
            error_count += 1
    
    print(f"\nProcessamento concluído:")
    print(f"- {success_count} arquivos convertidos com sucesso")
    print(f"- {error_count} erros")
    print(f"- {skipped_count} arquivos pulados (já existentes)")
    
    logging.info(f"Processamento concluído: {success_count} arquivos convertidos com sucesso, {error_count} erros, {skipped_count} pulados.")

def main():
    print("Iniciando conversão de arquivos PDF...")
    logging.info("Iniciando conversão de arquivos PDF...")
    
    # Verificar se estamos no diretório correto
    current_dir = os.path.basename(os.getcwd())
    if current_dir != "chapters":
        print("Aviso: Este script deve ser executado no diretório 'chapters'.")
        logging.warning("Script executado fora do diretório 'chapters'.")
    
    process_all_pdfs()

if __name__ == "__main__":
    main()