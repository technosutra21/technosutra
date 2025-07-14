import csv
import re

def parse_capitulos_file(filename):
    """Parse the CAPITULOS.txt file and extract chapter information."""
    with open(filename, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Split by chapter headers
    chapters = []
    current_chapter = {}
    current_section = None
    current_content = []
    
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Remove line numbers and pipes
        if '|' in line:
            line = line.split('|', 1)[1] if '|' in line else line
        
        # Skip empty lines
        if not line:
            continue
            
        # Check for chapter header
        if line.startswith('CAPÍTULO'):
            # Save previous chapter if exists
            if current_chapter:
                if current_section and current_content:
                    current_chapter[current_section] = '; '.join(current_content)
                chapters.append(current_chapter)
            
            # Start new chapter
            current_chapter = {'Capítulo': line}
            current_section = None
            current_content = []
            continue
        
        # Check for section headers
        section_headers = [
            'PERSONAGEM CENTRAL:', 'LOCALIZAÇÃO:', 'CONTEXTO:', 
            'ENSINAMENTO PRINCIPAL:', 'MANIFESTAÇÕES MIRACULOSAS:', 
            'DIÁLOGO PRINCIPAL:', 'ASSEMBLEIA PRESENTE:', 
            'PROGRESSÃO ESPIRITUAL:', 'TRANSIÇÃO:', 'ELEMENTOS ÚNICOS:'
        ]
        
        header_found = False
        for header in section_headers:
            if line.startswith(header):
                # Save previous section content
                if current_section and current_content:
                    current_chapter[current_section] = '; '.join(current_content)
                
                # Start new section
                current_section = header.replace(':', '')
                current_content = []
                
                # If there's content after the header, add it
                remaining = line[len(header):].strip()
                if remaining:
                    current_content.append(remaining)
                
                header_found = True
                break
        
        # If not a header, add to current section content
        if not header_found and current_section:
            # Remove bullet points and clean up
            clean_line = line.replace('•', '').strip()
            if clean_line:
                current_content.append(clean_line)
    
    # Don't forget the last chapter
    if current_chapter:
        if current_section and current_content:
            current_chapter[current_section] = '; '.join(current_content)
        chapters.append(current_chapter)
    
    return chapters

def write_csv(chapters, output_filename):
    """Write chapters data to CSV file."""
    fieldnames = [
        'Capítulo', 'PERSONAGEM CENTRAL', 'LOCALIZAÇÃO', 'CONTEXTO',
        'ENSINAMENTO PRINCIPAL', 'MANIFESTAÇÕES MIRACULOSAS', 'DIÁLOGO PRINCIPAL',
        'ASSEMBLEIA PRESENTE', 'PROGRESSÃO ESPIRITUAL', 'TRANSIÇÃO', 'ELEMENTOS ÚNICOS'
    ]
    
    with open(output_filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for chapter in chapters:
            # Ensure all fields exist
            row = {}
            for field in fieldnames:
                row[field] = chapter.get(field, '')
            writer.writerow(row)

def main():
    """Main function to convert CAPITULOS.txt to caps.csv."""
    input_file = 'CAPITULOS.txt'
    output_file = 'caps.csv'
    
    try:
        print(f"Reading {input_file}...")
        chapters = parse_capitulos_file(input_file)
        
        print(f"Found {len(chapters)} chapters")
        
        print(f"Writing to {output_file}...")
        write_csv(chapters, output_file)
        
        print("Conversion completed successfully!")
        
        # Display some statistics
        print("\nChapter summary:")
        for i, chapter in enumerate(chapters, 1):
            print(f"{i}. {chapter.get('Capítulo', 'Unknown')}")
            
    except FileNotFoundError:
        print(f"Error: {input_file} not found in current directory")
    except Exception as e:
        print(f"Error during conversion: {e}")

if __name__ == "__main__":
    main()
