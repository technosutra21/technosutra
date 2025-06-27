#!/usr/bin/env python3
"""
Comprehensive CSV Merger and Cleaner for Technosutra Project
Merges personagens_wix.csv and sutra.csv files with proper data cleaning and standardization
"""

import pandas as pd
import re
import unicodedata
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TechnosutraCSVMerger:
    def __init__(self, base_dir="C:/Users/rouxy/TECHNOSUTRA1/technosutra"):
        self.base_dir = Path(base_dir)
        self.characters_dir = self.base_dir / "characters"
        
        # File paths
        self.personagens_file = self.characters_dir / "personagens_wix.csv"
        self.sutra_file = self.base_dir / "sutra.csv"
        self.output_file = self.characters_dir / "characters_merged_clean.csv"
        
        # Standard columns for final output
        self.standard_columns = [
            'title', 'slug', 'category', 'chapter', 'description', 'content',
            'location', 'type', 'spiritual_characteristics', 'mystical_experience',
            'origin_story', 'special_analysis', 'symbolism', 'treasure',
            'generative_description', 'physical_description', 'status',
            'featured', 'date_created'
        ]
        
    def clean_text(self, text):
        """Clean and normalize text content"""
        if pd.isna(text) or text == "":
            return ""
        
        # Convert to string if not already
        text = str(text)
        
        # Normalize unicode characters
        text = unicodedata.normalize('NFKC', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Clean up quotes and special characters
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        # Remove excessive newlines but preserve paragraph breaks
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def create_slug(self, title):
        """Create a URL-friendly slug from title"""
        if pd.isna(title) or title == "":
            return ""
        
        # Convert to lowercase and remove accents
        slug = unicodedata.normalize('NFD', str(title).lower())
        slug = ''.join(c for c in slug if unicodedata.category(c) != 'Mn')
        
        # Replace spaces and special characters with hyphens
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        
        # Remove leading/trailing hyphens and multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug).strip('-')
        
        return slug
    
    def determine_category(self, row):
        """Determine category based on type and other characteristics"""
        type_str = str(row.get('type', '')).lower()
        occupation = str(row.get('occupation', '')).lower()
        
        if any(word in type_str for word in ['bodhisattva', 'bodhisatva']):
            return 'Bodhisattva'
        elif any(word in type_str for word in ['rei', 'king', 'rainha', 'queen']):
            return 'Realeza'
        elif any(word in type_str for word in ['monge', 'monk', 'bhikṣu', 'bhiksu']):
            return 'Monástico'
        elif any(word in type_str for word in ['deusa', 'goddess', 'deva', 'divindade']):
            return 'Divindade'
        elif any(word in type_str for word in ['leiga', 'leigo', 'upāsikā', 'upasika']):
            return 'Praticante Leigo'
        elif any(word in type_str for word in ['chefe', 'mercador', 'comerciante']):
            return 'Chefe de Família'
        elif any(word in type_str for word in ['mestre', 'teacher', 'professor']):
            return 'Mestre Espiritual'
        else:
            return 'Mestre Espiritual'  # Default category
    
    def load_and_parse_personagens(self):
        """Load and parse the personagens_wix.csv file"""
        logger.info(f"Loading personagens file: {self.personagens_file}")
        
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    df = pd.read_csv(self.personagens_file, encoding=encoding, sep='|')
                    logger.info(f"Successfully loaded personagens with encoding: {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise Exception("Could not read file with any encoding")
            
            logger.info(f"Personagens data shape: {df.shape}")
            logger.info(f"Columns: {df.columns.tolist()}")
            
            # Clean column names
            df.columns = [col.strip() for col in df.columns]
            
            # Remove empty rows
            df = df.dropna(how='all')
            
            return df
            
        except Exception as e:
            logger.error(f"Error loading personagens file: {e}")
            return pd.DataFrame()
    
    def load_and_parse_sutra(self):
        """Load and parse the sutra.csv file"""
        logger.info(f"Loading sutra file: {self.sutra_file}")
        
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    df = pd.read_csv(self.sutra_file, encoding=encoding, sep='|')
                    logger.info(f"Successfully loaded sutra with encoding: {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise Exception("Could not read file with any encoding")
            
            logger.info(f"Sutra data shape: {df.shape}")
            logger.info(f"Columns: {df.columns.tolist()}")
            
            # Clean column names
            df.columns = [col.strip() for col in df.columns]
            
            # Remove empty rows
            df = df.dropna(how='all')
            
            return df
            
        except Exception as e:
            logger.error(f"Error loading sutra file: {e}")
            return pd.DataFrame()
    
    def normalize_character_names(self, name):
        """Normalize character names for matching"""
        if pd.isna(name) or name == "":
            return ""
        
        name = str(name).strip()
        
        # Remove common prefixes/suffixes
        name = re.sub(r'^(Buddha |Buda |Rei |King |Queen |Rainha )', '', name, flags=re.IGNORECASE)
        
        # Normalize diacritics for matching
        normalized = unicodedata.normalize('NFD', name.lower())
        normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
        
        return normalized
    
    def find_chapter_match(self, character_name, sutra_df):
        """Find chapter information for a character from sutra data"""
        if pd.isna(character_name) or character_name == "":
            return None
        
        normalized_target = self.normalize_character_names(character_name)
        
        for _, row in sutra_df.iterrows():
            sutra_name = str(row.get('Nome', ''))
            normalized_sutra = self.normalize_character_names(sutra_name)
            
            # Try exact match first
            if normalized_target == normalized_sutra:
                return row
            
            # Try partial matches
            if normalized_target in normalized_sutra or normalized_sutra in normalized_target:
                if len(normalized_target) > 3 and len(normalized_sutra) > 3:  # Avoid very short matches
                    return row
        
        return None
    
    def merge_and_clean_data(self):
        """Main method to merge and clean the data"""
        logger.info("Starting data merge and cleaning process")
        
        # Load both datasets
        personagens_df = self.load_and_parse_personagens()
        sutra_df = self.load_and_parse_sutra()
        
        if personagens_df.empty:
            logger.error("Personagens dataframe is empty")
            return False
        
        if sutra_df.empty:
            logger.warning("Sutra dataframe is empty, proceeding with personagens data only")
        
        # Initialize results list
        merged_data = []
        
        logger.info(f"Processing {len(personagens_df)} characters from personagens_wix.csv")
        
        for idx, row in personagens_df.iterrows():
            try:
                # Extract basic information
                title = self.clean_text(row.get('title', ''))
                if not title:
                    logger.warning(f"Row {idx}: No title found, skipping")
                    continue
                
                # Create slug
                slug = self.create_slug(title)
                
                # Find chapter information from sutra data
                chapter = ""
                sutra_match = None
                if not sutra_df.empty:
                    sutra_match = self.find_chapter_match(title, sutra_df)
                    if sutra_match is not None:
                        chapter = str(sutra_match.get('Cap.', '')).strip()
                        logger.info(f"Found chapter {chapter} for character: {title}")
                
                # If no chapter found, try to extract from existing chapter field
                if not chapter:
                    existing_chapter = str(row.get('chapter', '')).strip()
                    if existing_chapter and existing_chapter != 'nan':
                        chapter = existing_chapter
                
                # Determine category
                category = self.determine_category(row)
                
                # Prepare merged record
                merged_record = {
                    'title': title,
                    'slug': slug,
                    'category': category,
                    'chapter': chapter,
                    'description': self.clean_text(row.get('description', '')),
                    'content': self.clean_text(row.get('content', '')),
                    'location': self.clean_text(row.get('location', '')),
                    'type': self.clean_text(row.get('type', '')),
                    'spiritual_characteristics': self.clean_text(row.get('spiritual_characteristics', '')),
                    'mystical_experience': self.clean_text(row.get('mystical_experience', '')),
                    'origin_story': self.clean_text(row.get('origin_story', '')),
                    'special_analysis': self.clean_text(row.get('special_analysis', '')),
                    'symbolism': self.clean_text(row.get('symbolism', '')),
                    'treasure': self.clean_text(row.get('treasure', '')),
                    'generative_description': self.clean_text(row.get('generative_description', '')),
                    'physical_description': self.clean_text(row.get('physical_description', '')),
                    'status': self.clean_text(row.get('status', '')),
                    'featured': str(row.get('featured', 'false')).lower() == 'true',
                    'date_created': self.clean_text(row.get('date_created', ''))
                }
                
                # Enhance with sutra data if available
                if sutra_match is not None:
                    # Add additional information from sutra
                    sutra_desc = self.clean_text(sutra_match.get('Desc. Personagem', ''))
                    sutra_location = self.clean_text(sutra_match.get('Local', ''))
                    sutra_occupation = self.clean_text(sutra_match.get('Ocupação', ''))
                    liberation = self.clean_text(sutra_match.get('Liberação Bodhisattvica', ''))
                    
                    # Enhance description if sutra has more info
                    if sutra_desc and len(sutra_desc) > len(merged_record['description']):
                        merged_record['description'] = sutra_desc
                    
                    # Enhance location if sutra has more info
                    if sutra_location and len(sutra_location) > len(merged_record['location']):
                        merged_record['location'] = sutra_location
                    
                    # Add liberation info to spiritual characteristics
                    if liberation:
                        existing_chars = merged_record['spiritual_characteristics']
                        if existing_chars:
                            merged_record['spiritual_characteristics'] = f"{existing_chars}\n\nLiberação Bodhisattvica: {liberation}"
                        else:
                            merged_record['spiritual_characteristics'] = f"Liberação Bodhisattvica: {liberation}"
                    
                    # Add occupation to type if missing
                    if not merged_record['type'] and sutra_occupation:
                        merged_record['type'] = sutra_occupation
                
                merged_data.append(merged_record)
                
            except Exception as e:
                logger.error(f"Error processing row {idx}: {e}")
                continue
        
        # Create final DataFrame
        final_df = pd.DataFrame(merged_data)
        
        # Ensure all standard columns are present
        for col in self.standard_columns:
            if col not in final_df.columns:
                final_df[col] = ""
        
        # Reorder columns
        final_df = final_df[self.standard_columns]
        
        # Sort by chapter (numerical) and then by title
        final_df['chapter_num'] = pd.to_numeric(final_df['chapter'], errors='coerce')
        final_df = final_df.sort_values(['chapter_num', 'title'], na_position='last')
        final_df = final_df.drop('chapter_num', axis=1)
        
        logger.info(f"Final merged dataset has {len(final_df)} records")
        
        # Save the merged and cleaned data
        try:
            final_df.to_csv(self.output_file, index=False, encoding='utf-8', sep='|')
            logger.info(f"Successfully saved merged data to: {self.output_file}")
            
            # Also save as regular CSV for compatibility
            csv_output = self.output_file.with_suffix('.csv')
            final_df.to_csv(csv_output, index=False, encoding='utf-8')
            logger.info(f"Also saved as regular CSV: {csv_output}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving merged data: {e}")
            return False
    
    def generate_report(self):
        """Generate a summary report of the merge process"""
        if not self.output_file.exists():
            logger.error("No output file found to generate report")
            return
        
        try:
            df = pd.read_csv(self.output_file, sep='|', encoding='utf-8')
            
            print("\n" + "="*60)
            print("TECHNOSUTRA CSV MERGE REPORT")
            print("="*60)
            print(f"Total characters processed: {len(df)}")
            print(f"Characters with chapters: {len(df[df['chapter'] != ''])}")
            print(f"Characters without chapters: {len(df[df['chapter'] == ''])}")
            
            print("\nCharacters by Category:")
            category_counts = df['category'].value_counts()
            for category, count in category_counts.items():
                print(f"  {category}: {count}")
            
            print("\nCharacters with Chapters:")
            chapters_df = df[df['chapter'] != ''].sort_values('chapter')
            for _, row in chapters_df.iterrows():
                print(f"  Chapter {row['chapter']}: {row['title']}")
            
            print("\nCharacters without Chapters:")
            no_chapters_df = df[df['chapter'] == '']
            for _, row in no_chapters_df.iterrows():
                print(f"  {row['title']} ({row['category']})")
            
            print("\n" + "="*60)
            print("MERGE COMPLETED SUCCESSFULLY")
            print("="*60)
            
        except Exception as e:
            logger.error(f"Error generating report: {e}")

def main():
    """Main execution function"""
    merger = TechnosutraCSVMerger()
    
    print("Starting Technosutra CSV Merge and Clean Process...")
    print(f"Working directory: {merger.base_dir}")
    print(f"Characters directory: {merger.characters_dir}")
    
    # Check if input files exist
    if not merger.personagens_file.exists():
        print(f"ERROR: Personagens file not found: {merger.personagens_file}")
        return
    
    if not merger.sutra_file.exists():
        print(f"WARNING: Sutra file not found: {merger.sutra_file}")
        print("Proceeding with personagens data only...")
    
    # Perform the merge
    success = merger.merge_and_clean_data()
    
    if success:
        print("\nMerge completed successfully!")
        merger.generate_report()
    else:
        print("\nMerge failed. Check the logs for details.")

if __name__ == "__main__":
    main()
