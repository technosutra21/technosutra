
import pandas as pd
from googletrans import Translator, LANGUAGES
import time
import os

# Check if the required library is installed
try:
    import googletrans
except ImportError:
    print("A biblioteca 'googletrans-py' não está instalada.")
    print("Por favor, instale-a executando: pip install googletrans-py")
    exit()

# --- Configuration ---
SOURCE_LANGUAGE = 'pt'
TARGET_LANGUAGE = 'en'
# Add any columns you DON'T want to translate here
EXCLUDED_COLUMNS_CHAPTERS = ['ID', 'Created Date', 'Updated Date', 'Owner', 'capitulo', 'Cap. URL', 'QR Code URL', 'LINK MODEL', 'Cap. FILE NAME']
EXCLUDED_COLUMNS_CHARACTERS = ['ID', 'Created Date', 'Updated Date', 'Owner', 'capitulo', 'Cap. URL', 'QR Code URL', 'LINK MODEL', 'Cap. FILE NAME']
# ---------------------

def get_output_filename(input_path):
    """Generates an output filename by adding '_en' before the extension."""
    directory, filename = os.path.split(input_path)
    name, ext = os.path.splitext(filename)
    return os.path.join(directory, f"{name}_en{ext}")

def translate_csv(input_path, excluded_columns):
    """
    Reads a CSV file, translates its text columns to English, and saves it
    to a new file.

    Args:
        input_path (str): The path to the input CSV file.
        excluded_columns (list): A list of column names to skip during translation.
    """
    output_path = get_output_filename(input_path)
    print(f"Iniciando a tradução de '{input_path}'...")
    print(f"O resultado será salvo em '{output_path}'")

    try:
        df = pd.read_csv(input_path)
    except FileNotFoundError:
        print(f"Erro: O arquivo '{input_path}' não foi encontrado.")
        return
    except Exception as e:
        print(f"Erro ao ler o arquivo CSV: {e}")
        return

    translator = Translator()
    
    # Identify columns to translate
    columns_to_translate = [col for col in df.columns if col not in excluded_columns]
    print(f"Colunas para traduzir: {', '.join(columns_to_translate)}")

    # Create a new DataFrame for translated data
    translated_df = df.copy()

    total_cells = len(columns_to_translate) * len(df)
    processed_cells = 0

    for col in columns_to_translate:
        print(f"\nTraduzindo coluna: '{col}'...")
        # Translate each cell in the column, handling potential errors
        for index, text in df[col].items():
            processed_cells += 1
            progress = (processed_cells / total_cells) * 100
            
            # Print progress within the same line
            print(f"\rProgresso: {progress:.2f}% ({processed_cells}/{total_cells})", end="")

            if pd.isna(text) or text.strip() == "":
                translated_df.at[index, col] = text
                continue

            try:
                # Add a small delay to avoid hitting API rate limits
                time.sleep(0.1) 
                translated_text = translator.translate(str(text), src=SOURCE_LANGUAGE, dest=TARGET_LANGUAGE).text
                translated_df.at[index, col] = translated_text
            except Exception as e:
                print(f"\nErro ao traduzir a célula [{index}, '{col}']: {e}")
                print("Texto original:", text)
                # Keep the original text if translation fails
                translated_df.at[index, col] = text
                # Wait longer if an error occurs
                time.sleep(1)

    try:
        translated_df.to_csv(output_path, index=False, encoding='utf-8')
        print(f"\n\nTradução de '{input_path}' concluída com sucesso!")
        print(f"Arquivo traduzido salvo em: {output_path}")
    except Exception as e:
        print(f"\nErro ao salvar o arquivo traduzido: {e}")

def main():
    """Main function to translate both CSV files."""
    # Assumes the script is in the 'python' subfolder
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
    
    chapters_file = os.path.join(base_dir, 'chapters.csv')
    characters_file = os.path.join(base_dir, 'characters.csv')

    translate_csv(chapters_file, EXCLUDED_COLUMNS_CHAPTERS)
    print("-" * 30)
    translate_csv(characters_file, EXCLUDED_COLUMNS_CHARACTERS)

if __name__ == "__main__":
    main() 