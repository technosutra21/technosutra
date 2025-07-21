import csv
import re

def clean_text(text):
    """Clean and standardize text content"""
    if not text or text.strip() in ['', '!', "'", '"', '-', '—']:
        return ""
    return text.strip()

def update_technosutra_from_characters():
    # Read characters.csv data
    characters_data = {}
    with open('characters.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            chapter_num = row['Chapter_Number']
            characters_data[chapter_num] = {
                'name': clean_text(row['Character_Name']),
                'location': clean_text(row['Location']),
                'context': clean_text(row['Context']),
                'main_teaching': clean_text(row['Main_Teaching']),
                'miraculous_manifestations': clean_text(row['Miraculous_Manifestations'])
            }
    
    # Read technosutra.csv data
    technosutra_rows = []
    with open('technosutra.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            technosutra_rows.append(row)
    
    # Update technosutra data
    updated_rows = []
    updates_made = 0
    
    for row in technosutra_rows:
        if len(row) < 18:  # Skip malformed rows
            updated_rows.append(row)
            continue
            
        chapter_num = str(row[0]).strip()
        
        # Skip if chapter number not found in characters data
        if chapter_num not in characters_data:
            updated_rows.append(row)
            continue
            
        char_data = characters_data[chapter_num]
        original_row = row[:]
        
        # Update empty or placeholder fields
        
        # Desc. Personagem (index 3) - use Context from characters
        if clean_text(row[3]) == "" and char_data['context']:
            # Extract character description from context (first sentence or most relevant part)
            context = char_data['context']
            # Find the first sentence that describes the character
            sentences = re.split(r'[.!?]+', context)
            for sentence in sentences:
                if any(word in sentence.lower() for word in ['encontra', 'sudhana', 'é', 'está', 'representa']):
                    row[3] = sentence.strip() + "."
                    break
            if not row[3] or row[3] == ".":
                row[3] = context[:200] + "..." if len(context) > 200 else context
        
        # Local (index 6) - use Location from characters  
        if clean_text(row[6]) == "" and char_data['location']:
            row[6] = char_data['location']
        
        # Liberação Bodhisattvica (index 2) - extract from main_teaching if empty or placeholder
        if clean_text(row[2]) in ["", "!", "'", "-", "—"] and char_data['main_teaching']:
            teaching = char_data['main_teaching']
            # Look for liberation/samadhi names in quotes or specific patterns
            liberation_match = re.search(r'liberação.*?chamad[ao]\s*["\"]([^"\"]+)["\"]', teaching, re.IGNORECASE)
            if not liberation_match:
                liberation_match = re.search(r'samādhi.*?chamad[ao]\s*["\"]([^"\"]+)["\"]', teaching, re.IGNORECASE)
            if not liberation_match:
                liberation_match = re.search(r'portal.*?chamad[ao]\s*["\"]([^"\"]+)["\"]', teaching, re.IGNORECASE)
            if liberation_match:
                row[2] = liberation_match.group(1)
        
        # Check if any updates were made to this row
        if row != original_row:
            updates_made += 1
            print(f"Updated Chapter {chapter_num} ({row[1]})")
        
        updated_rows.append(row)
    
    # Write updated data back to technosutra.csv
    with open('technosutra_updated.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(updated_rows)
    
    print(f"\nUpdate complete! {updates_made} rows were updated.")
    print("Updated file saved as 'technosutra_updated.csv'")
    return updates_made

if __name__ == "__main__":
    update_technosutra_from_characters()
