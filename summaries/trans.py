
import csv
import json
import uuid
from typing import Dict, List, Any

def csv_to_json(csv_chapters: str, csv_characters: str, output_file: str):
    """
    Convert chapters.csv and characters.csv to the structured JSON format for the Avatamsaka Sutra.
    """
    
    # Read chapters CSV
    chapters_data = []
    with open(csv_chapters, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            chapters_data.append(row)
    
    # Read characters CSV
    characters_data = {}
    with open(csv_characters, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Use chapter number (capitulo) as key to match with chapters data
            capitulo = row['capitulo']
            characters_data[capitulo] = row
    
    # Structure the final JSON
    result = {
        "sutra": "Avatamsaka Sutra (Flower Garland Sutra)",
        "protagonist": "Sudhana",
        "chapters": []
    }
    
    # Sort chapters by chapter_number for consistent order
    chapters_data.sort(key=lambda x: int(x['capitulo']))
    
    for chapter_row in chapters_data:
        chapter_num = chapter_row['capitulo']
        character_row = characters_data.get(chapter_num, {})
        
        # Create unique ID if not present
        
        # Build character object from character.csv data
        character = {
            "name": character_row.get('Nome', ''),
            "teaching": character_row.get('Ensinamento', ''),
            "description": character_row.get('Desc. Personagem', ''),
            "occupation": character_row.get('Ocupação', ''),
            "meaning": character_row.get('Significado', ''),
            "local": character_row.get('Local', ''),
            "summary": character_row.get('Resumo do Cap. (84000.co)', ''),
            "chapter_file_name": character_row.get('Cap. FILE NAME', ''),
            "chapter_url": character_row.get('Cap. URL', ''),
            "qr_code_url": character_row.get('QR Code URL', ''),
            "link_model": character_row.get('LINK MODEL', '')
        }
        
        # Map chapter data to the required structure
        chapter = {
            "chapter_number": int(chapter_num),
            "chapter_title": chapter_row.get('Chapter_Title', ''),
            "name_translation": chapter_row.get('Name_Translation', ''),
            "location": chapter_row.get('Location', ''),
            "context": chapter_row.get('Context', ''),
            "assembly_present": chapter_row.get('Assembly_Present', ''),
            "main_dialogue": chapter_row.get('Main_Dialogue', ''),
            "main_teaching": chapter_row.get('Main_Teaching', ''),
            "miraculous_manifestations": chapter_row.get('Miraculous_Manifestations', ''),
            "spiritual_progression": chapter_row.get('Spiritual_Progression', ''),
            "transition": chapter_row.get('Transition', ''),
            "unique_elements": chapter_row.get('Unique_Elements', ''),
            "character": character
        }
        
        result["chapters"].append(chapter)
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully converted {len(chapters_data)} chapters to {output_file}")

if __name__ == "__main__":
    # Assuming the files are named exactly as uploaded
    csv_to_json("chapters_en.csv", "characters_en.csv", "avatamsaka_sutra_en.json")
