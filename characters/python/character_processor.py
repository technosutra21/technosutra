#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Character Processor - Final unified character data processing system
Consolidates all previous parsing logic with comprehensive error handling
"""

import json
import os
import re
import csv
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
import unicodedata

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('character_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class CharacterInfo:
    """Structured character information"""
    name: str
    title: str
    location: str
    occupation: str
    chapter: Optional[int] = None
    description: Optional[str] = None
    spiritual_characteristics: Optional[List[str]] = None
    mystical_experience: Optional[str] = None
    origin_story: Optional[str] = None
    symbolism: Optional[str] = None
    physical_description: Optional[Dict[str, str]] = None
    
    def __post_init__(self):
        """Validate and clean data after initialization"""
        self.name = self._clean_text(self.name or "Unknown")
        self.title = self._clean_text(self.title or "")
        self.location = self._clean_text(self.location or "")
        self.occupation = self._clean_text(self.occupation or "")
        
        if self.spiritual_characteristics is None:
            self.spiritual_characteristics = []
        
        if self.physical_description is None:
            self.physical_description = {}
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Normalize unicode
        text = unicodedata.normalize('NFKC', str(text))
        
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Remove problematic characters for JSON/CSV
        text = text.replace('\r', '').replace('\n', ' ')
        
        return text.strip()

class CharacterProcessor:
    """Main character processing class"""
    
    def __init__(self, base_path: Union[str, Path] = "."):
        self.base_path = Path(base_path)
        self.characters_path = self.base_path / "characters"
        self.output_path = self.characters_path / "processed"
        self.output_path.mkdir(exist_ok=True)
        
        # Statistics
        self.stats = {
            'files_processed': 0,
            'characters_extracted': 0,
            'errors': 0,
            'warnings': 0
        }
        
        logger.info(f"Initialized CharacterProcessor at {self.base_path}")
    
    def validate_input_file(self, file_path: Path) -> bool:
        """Validate input file before processing"""
        try:
            if not file_path.exists():
                logger.error(f"File does not exist: {file_path}")
                return False
                
            if file_path.stat().st_size == 0:
                logger.warning(f"Empty file: {file_path}")
                return False
                
            if file_path.stat().st_size > 50 * 1024 * 1024:  # 50MB limit
                logger.error(f"File too large: {file_path}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error validating file {file_path}: {e}")
            return False
    
    def extract_character_name(self, content: str, filename: str) -> str:
        """Extract character name with multiple fallback methods"""
        try:
            # Method 1: From filename
            name_from_file = filename.replace('_Perfil.txt', '').replace('_perfil.txt', '')
            name_from_file = re.sub(r'[^a-zA-ZÀ-ÿ\s]', '', name_from_file)
            
            if name_from_file and len(name_from_file) > 2:
                return name_from_file.strip()
            
            # Method 2: From content patterns
            patterns = [
                r'NOME[:\s]*([^\n]+)',
                r'Nome[:\s]*([^\n]+)',
                r'PERSONAGEM[:\s]*([^\n]+)',
                r'Personagem[:\s]*([^\n]+)',
                r'^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    if len(name) > 2 and not name.lower().startswith('perfil'):
                        return name
            
            # Method 3: First capitalized word
            words = content.split()
            for word in words[:20]:  # Check first 20 words
                clean_word = re.sub(r'[^a-zA-ZÀ-ÿ]', '', word)
                if clean_word and len(clean_word) > 3 and clean_word[0].isupper():
                    return clean_word
            
            return "Unknown Character"
            
        except Exception as e:
            logger.error(f"Error extracting character name: {e}")
            return "Unknown Character"
    
    def extract_field_content(self, content: str, field_name: str) -> str:
        """Extract specific field content using multiple patterns"""
        try:
            patterns = [
                rf'{field_name}[:\s]*([^\n]+)',
                rf'{field_name.upper()}[:\s]*([^\n]+)',
                rf'{field_name.lower()}[:\s]*([^\n]+)',
                rf'\*\*{field_name}\*\*[:\s]*([^\n]+)',
                rf'## {field_name}[\n\s]*([^#]+)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
                if match:
                    result = match.group(1).strip()
                    if result and not result.lower().startswith('não') and len(result) > 3:
                        return result
            
            return ""
            
        except Exception as e:
            logger.error(f"Error extracting field {field_name}: {e}")
            return ""
    
    def extract_list_content(self, content: str, field_name: str) -> List[str]:
        """Extract list-type content"""
        try:
            result = []
            
            # Pattern for bullet points
            pattern = rf'{field_name}[:\s]*\n([^\n]*(?:\n[-*•]\s*[^\n]*)*)',
            match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
            
            if match:
                lines = match.group(1).split('\n')
                for line in lines:
                    cleaned = re.sub(r'^[-*•]\s*', '', line.strip())
                    if cleaned and len(cleaned) > 3:
                        result.append(cleaned)
            
            # Fallback: comma-separated values
            if not result:
                simple_content = self.extract_field_content(content, field_name)
                if simple_content:
                    result = [item.strip() for item in simple_content.split(',') if item.strip()]
            
            return result[:10]  # Limit to 10 items
            
        except Exception as e:
            logger.error(f"Error extracting list for {field_name}: {e}")
            return []
    
    def process_file(self, file_path: Path) -> Optional[CharacterInfo]:
        """Process a single character file"""
        try:
            if not self.validate_input_file(file_path):
                return None
            
            logger.info(f"Processing file: {file_path.name}")
            
            # Read file with encoding detection
            content = ""
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue
            
            if not content:
                logger.error(f"Could not decode file: {file_path}")
                return None
            
            # Extract chapter number from filename
            chapter_match = re.search(r'(\d+)', file_path.name)
            chapter = int(chapter_match.group(1)) if chapter_match else None
            
            # Create character info
            character = CharacterInfo(
                name=self.extract_character_name(content, file_path.stem),
                title=self.extract_field_content(content, 'título') or 
                      self.extract_field_content(content, 'title'),
                location=self.extract_field_content(content, 'localização') or
                         self.extract_field_content(content, 'location'),
                occupation=self.extract_field_content(content, 'ocupação') or
                          self.extract_field_content(content, 'occupation') or
                          self.extract_field_content(content, 'tipo'),
                chapter=chapter,
                description=self.extract_field_content(content, 'descrição')[:500],  # Limit length
                spiritual_characteristics=self.extract_list_content(content, 'características'),
                mystical_experience=self.extract_field_content(content, 'experiência')[:1000],
                origin_story=self.extract_field_content(content, 'origem')[:1000],
                symbolism=self.extract_field_content(content, 'simbolismo')[:500]
            )
            
            # Extract physical description as structured data
            physical_desc = {}
            physical_fields = ['altura', 'aparência', 'vestimenta', 'accessories']
            for field in physical_fields:
                value = self.extract_field_content(content, field)
                if value:
                    physical_desc[field] = value[:200]  # Limit length
            
            character.physical_description = physical_desc
            
            self.stats['characters_extracted'] += 1
            return character
            
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            self.stats['errors'] += 1
            return None
    
    def process_all_files(self, pattern: str = "*_Perfil.txt") -> List[CharacterInfo]:
        """Process all character files matching pattern"""
        characters = []
        
        try:
            files = list(self.characters_path.glob(pattern))
            logger.info(f"Found {len(files)} files matching pattern '{pattern}'")
            
            for file_path in files:
                try:
                    character = self.process_file(file_path)
                    if character:
                        characters.append(character)
                    self.stats['files_processed'] += 1
                    
                except Exception as e:
                    logger.error(f"Error processing {file_path}: {e}")
                    self.stats['errors'] += 1
            
            logger.info(f"Successfully processed {len(characters)} characters")
            return characters
            
        except Exception as e:
            logger.error(f"Error during batch processing: {e}")
            return characters
    
    def save_to_json(self, characters: List[CharacterInfo], filename: str = "characters.json") -> bool:
        """Save characters to JSON file"""
        try:
            output_file = self.output_path / filename
            
            # Convert to dictionaries
            data = {
                'metadata': {
                    'total_characters': len(characters),
                    'processing_stats': self.stats,
                    'version': '1.0.0'
                },
                'characters': [asdict(char) for char in characters]
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Saved {len(characters)} characters to {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")
            return False
    
    def save_to_csv(self, characters: List[CharacterInfo], filename: str = "characters.csv") -> bool:
        """Save characters to CSV file"""
        try:
            output_file = self.output_path / filename
            
            if not characters:
                logger.warning("No characters to save")
                return False
            
            fieldnames = [
                'name', 'title', 'location', 'occupation', 'chapter',
                'description', 'mystical_experience', 'origin_story', 'symbolism'
            ]
            
            with open(output_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for char in characters:
                    row = {}
                    for field in fieldnames:
                        value = getattr(char, field, '')
                        if isinstance(value, list):
                            value = '; '.join(value)
                        elif isinstance(value, dict):
                            value = '; '.join(f"{k}: {v}" for k, v in value.items())
                        row[field] = str(value) if value else ''
                    writer.writerow(row)
            
            logger.info(f"Saved {len(characters)} characters to {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving to CSV: {e}")
            return False
    
    def generate_wix_export(self, characters: List[CharacterInfo]) -> bool:
        """Generate Wix-compatible export"""
        try:
            wix_data = []
            
            for char in characters:
                # Create slug from name
                slug = re.sub(r'[^a-z0-9]+', '-', char.name.lower()).strip('-')
                
                # Determine category
                category = 'Mestre Espiritual'
                if 'bodhisattva' in char.occupation.lower():
                    category = 'Bodhisattva'
                elif 'rei' in char.occupation.lower():
                    category = 'Rei'
                elif 'monja' in char.occupation.lower() or 'freira' in char.occupation.lower():
                    category = 'Monja'
                
                wix_record = {
                    'title': char.name,
                    'slug': slug,
                    'category': category,
                    'chapter': str(char.chapter) if char.chapter else '',
                    'description': char.description[:200] if char.description else '',
                    'content': char.description[:2000] if char.description else '',
                    'location': char.location,
                    'type': char.occupation,
                    'spiritual_characteristics': '; '.join(char.spiritual_characteristics) if char.spiritual_characteristics else '',
                    'mystical_experience': char.mystical_experience[:1000] if char.mystical_experience else '',
                    'origin_story': char.origin_story[:1000] if char.origin_story else '',
                    'symbolism': char.symbolism[:500] if char.symbolism else '',
                    'featured': 'false',
                    'date_created': '2024-01-01'
                }
                
                wix_data.append(wix_record)
            
            # Save CSV for Wix import
            return self.save_wix_csv(wix_data)
            
        except Exception as e:
            logger.error(f"Error generating Wix export: {e}")
            return False
    
    def save_wix_csv(self, wix_data: List[Dict]) -> bool:
        """Save Wix-compatible CSV"""
        try:
            output_file = self.output_path / "wix_characters.csv"
            
            if not wix_data:
                return False
            
            fieldnames = list(wix_data[0].keys())
            
            with open(output_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(wix_data)
            
            logger.info(f"Saved Wix-compatible CSV: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving Wix CSV: {e}")
            return False
    
    def print_statistics(self):
        """Print processing statistics"""
        print("\n" + "=" * 50)
        print("CHARACTER PROCESSING STATISTICS")
        print("=" * 50)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Characters extracted: {self.stats['characters_extracted']}")
        print(f"Errors: {self.stats['errors']}")
        print(f"Warnings: {self.stats['warnings']}")
        
        success_rate = (self.stats['characters_extracted'] / max(self.stats['files_processed'], 1)) * 100
        print(f"Success rate: {success_rate:.1f}%")
        print("=" * 50)

def main():
    """Main function for command-line usage"""
    try:
        # Initialize processor
        processor = CharacterProcessor()
        
        # Process all character files
        characters = processor.process_all_files()
        
        if not characters:
            logger.error("No characters were successfully processed")
            return
        
        # Save results
        processor.save_to_json(characters)
        processor.save_to_csv(characters)
        processor.generate_wix_export(characters)
        
        # Print statistics
        processor.print_statistics()
        
        # Log summary
        logger.info(f"Processing complete. {len(characters)} characters processed successfully.")
        
    except Exception as e:
        logger.error(f"Fatal error in main: {e}")
        raise

if __name__ == "__main__":
    main()
