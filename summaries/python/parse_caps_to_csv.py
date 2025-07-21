#!/usr/bin/env python3
"""
Script to parse CAPS-1-35.txt and CAPS-36-56.txt files and extract character information to CSV
"""

import csv
import re
from pathlib import Path

def parse_caps_files():
    """Parse the CAPS files and extract character information"""
    
    files = ['CAPS-1-35.txt', 'CAPS-36-56.txt']
    characters = []
    
    for file_name in files:
        file_path = Path(file_name)
        if not file_path.exists():
            print(f"Warning: {file_name} not found, skipping...")
            continue
            
        print(f"Processing {file_name}...")
        
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Split into chapters based on the "CAPÍTULO" pattern
        chapters = re.split(r'(CAPÍTULO \d+:[^\n]*)', content)
        
        for i in range(1, len(chapters), 2):  # Skip the first empty part, then process in pairs
            if i + 1 >= len(chapters):
                break
                
            chapter_header = chapters[i].strip()
            chapter_content = chapters[i + 1].strip()
            
            print(f"Processing chapter: {chapter_header}")
            
            # Extract chapter number and title
            chapter_match = re.search(r'CAPÍTULO (\d+):\s*(.+)', chapter_header)
            if not chapter_match:
                continue
                
            chapter_number = chapter_match.group(1)
            chapter_title = chapter_match.group(2).strip()
            
            # Extract all structured fields from chapter content
            fields = {
                'PERSONAGEM CENTRAL': '',
                'LOCALIZAÇÃO': '',
                'CONTEXTO': '',
                'ASSEMBLEIA PRESENTE': '',
                'DIÁLOGO PRINCIPAL': '',
                'ENSINAMENTO PRINCIPAL': '',
                'MANIFESTAÇÕES MIRACULOSAS': '',
                'PROGRESSÃO ESPIRITUAL': '',
                'TRANSIÇÃO': '',
                'ELEMENTOS ÚNICOS': ''
            }
            
            # Extract each field using regex patterns
            for field_name in fields.keys():
                # Pattern to match field and its multi-line content until next field or end
                pattern = rf'{re.escape(field_name)}:\s*([^\n].*?)(?=\n[A-ZÇÃÕÁÉÍÓÚ][A-ZÇÃÕÁÉÍÓÚ\s]*:|\n\n|$)'
                match = re.search(pattern, chapter_content, re.MULTILINE | re.DOTALL)
                if match:
                    # Clean and format the extracted content
                    content = match.group(1).strip()
                    # Remove excessive whitespace and normalize line breaks
                    content = re.sub(r'\n+', ' ', content)
                    content = re.sub(r'\s+', ' ', content)
                    fields[field_name] = content
            
            # Handle character name fallback
            character_name = fields['PERSONAGEM CENTRAL']
            if not character_name:
                # Try to get character name from chapter title
                if chapter_title:
                    character_name = chapter_title
                else:
                    character_name = f"Character from Chapter {chapter_number}"
            
            # Set default values for missing fields
            location = fields['LOCALIZAÇÃO'] if fields['LOCALIZAÇÃO'] else "Location not specified"
            teaching = fields['ENSINAMENTO PRINCIPAL'] if fields['ENSINAMENTO PRINCIPAL'] else "Teaching not specified"
            
            # Only require that we have at least a chapter title
            if chapter_title:
                print(f"  - Character: {character_name}")
                print(f"  - Location: {location}")
                print(f"  - Teaching: {teaching[:100]}...")
                
                characters.append({
                    'Chapter_Number': chapter_number,
                    'Chapter_Title': chapter_title,
                    'Character_Name': character_name,
                    'Location': location,
                    'Context': fields['CONTEXTO'],
                    'Assembly_Present': fields['ASSEMBLEIA PRESENTE'],
                    'Main_Dialogue': fields['DIÁLOGO PRINCIPAL'],
                    'Main_Teaching': teaching,
                    'Miraculous_Manifestations': fields['MANIFESTAÇÕES MIRACULOSAS'],
                    'Spiritual_Progression': fields['PROGRESSÃO ESPIRITUAL'],
                    'Transition': fields['TRANSIÇÃO'],
                    'Unique_Elements': fields['ELEMENTOS ÚNICOS'],
                    'Source_File': file_name
                })
            else:
                print(f"  - No chapter title found for chapter {chapter_number}")
    
    return characters

def write_to_csv(characters, output_file='characters.csv'):
    """Write character data to CSV file"""
    
    if not characters:
        print("No character data found to write.")
        return
    
    fieldnames = [
        'Chapter_Number', 'Chapter_Title', 'Character_Name', 'Location', 'Context',
        'Assembly_Present', 'Main_Dialogue', 'Main_Teaching', 'Miraculous_Manifestations',
        'Spiritual_Progression', 'Transition', 'Unique_Elements', 'Source_File'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(characters)
    
    print(f"Successfully wrote {len(characters)} character entries to {output_file}")

def main():
    """Main function to run the parser"""
    print("Starting CAPS files parsing...")
    
    # Parse the files
    characters = parse_caps_files()
    
    # Write to CSV
    write_to_csv(characters)
    
    print("Parsing complete!")
    
    # Display summary
    if characters:
        print(f"\nSummary:")
        print(f"Total characters extracted: {len(characters)}")
        print(f"Chapter range: {min(int(c['Chapter_Number']) for c in characters if c['Chapter_Number'])} - {max(int(c['Chapter_Number']) for c in characters if c['Chapter_Number'])}")
        
        print(f"\nFirst few entries:")
        for i, char in enumerate(characters[:5]):
            print(f"{i+1}. Chapter {char['Chapter_Number']}: {char['Character_Name']}")

if __name__ == "__main__":
    main()
