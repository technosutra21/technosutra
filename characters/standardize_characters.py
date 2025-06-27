#!/usr/bin/env python3
"""
Character Data Standardization Script
=====================================

This script merges and standardizes character data from:
- personagens_wix.csv (detailed character profiles)
- ../sutra.csv (chapter reference data)

Output: A clean, standardized CSV ready for Wix CMS import
"""

import pandas as pd
import re
import sys
from pathlib import Path

def clean_text(text):
    """Clean and standardize text content"""
    if pd.isna(text) or text == '':
        return ''
    
    # Convert to string and strip whitespace
    text = str(text).strip()
    
    # Remove excessive whitespace and normalize line breaks
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n+', '\n', text)
    
    # Fix common formatting issues
    text = text.replace('  ', ' ')
    text = text.replace(' ,', ',')
    text = text.replace(' .', '.')
    
    return text

def extract_chapter_from_name(name):
    """Extract chapter number from character name if present"""
    if pd.isna(name):
        return None
    
    # Look for patterns like "Ch. 39", "Chapter 39", "39-"
    match = re.search(r'(?:ch\.?\s*|chapter\s*|^)(\d+)', str(name), re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def normalize_name(name):
    """Normalize character names for better matching"""
    if pd.isna(name):
        return ''
    
    name = str(name).strip()
    # Remove chapter prefixes for matching
    name = re.sub(r'^(?:ch\.?\s*\d+\s*[-:]?\s*|chapter\s*\d+\s*[-:]?\s*)', '', name, flags=re.IGNORECASE)
    # Remove extra whitespace and punctuation
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name.lower()

def create_chapter_mapping(sutra_df):
    """Create mapping from character names to chapter numbers from sutra.csv"""
    chapter_map = {}
    
    for _, row in sutra_df.iterrows():
        if pd.notna(row.get('character_name')) and pd.notna(row.get('chapter')):
            normalized_name = normalize_name(row['character_name'])
            if normalized_name:
                chapter_map[normalized_name] = int(row['chapter'])
    
    return chapter_map

def merge_character_data(wix_df, sutra_df):
    """Merge data from both DataFrames"""
    
    # Create chapter mapping from sutra data
    chapter_map = create_chapter_mapping(sutra_df)
    
    # Create a copy of wix_df to work with
    merged_df = wix_df.copy()
    
    # Fill missing chapter numbers
    for idx, row in merged_df.iterrows():
        if pd.isna(row.get('chapter')) or row.get('chapter') == '':
            # Try to extract from name first
            chapter_from_name = extract_chapter_from_name(row.get('name'))
            if chapter_from_name:
                merged_df.at[idx, 'chapter'] = chapter_from_name
            else:
                # Try to match with sutra data
                normalized_name = normalize_name(row.get('name'))
                if normalized_name in chapter_map:
                    merged_df.at[idx, 'chapter'] = chapter_map[normalized_name]
    
    # Enhance with sutra data where available
    for idx, row in merged_df.iterrows():
        normalized_name = normalize_name(row.get('name'))
        
        # Find matching sutra record
        sutra_match = None
        for _, sutra_row in sutra_df.iterrows():
            if normalize_name(sutra_row.get('character_name')) == normalized_name:
                sutra_match = sutra_row
                break
        
        if sutra_match is not None:
            # Fill missing data with sutra information
            if pd.isna(row.get('chapter')) or row.get('chapter') == '':
                if pd.notna(sutra_match.get('chapter')):
                    merged_df.at[idx, 'chapter'] = sutra_match['chapter']
            
            if pd.isna(row.get('location')) or row.get('location') == '':
                if pd.notna(sutra_match.get('location')):
                    merged_df.at[idx, 'location'] = clean_text(sutra_match['location'])
            
            # Enhance descriptions with sutra content if available
            if pd.notna(sutra_match.get('character_description')):
                sutra_desc = clean_text(sutra_match['character_description'])
                current_desc = clean_text(row.get('description', ''))
                
                # If current description is very short, enhance with sutra description
                if len(current_desc) < 100 and len(sutra_desc) > len(current_desc):
                    if current_desc:
                        merged_df.at[idx, 'description'] = f"{current_desc}\n\n{sutra_desc}"
                    else:
                        merged_df.at[idx, 'description'] = sutra_desc
    
    return merged_df

def standardize_columns(df):
    """Standardize and clean all text columns"""
    
    text_columns = ['name', 'description', 'appearance', 'personality', 'abilities', 
                   'symbolism', 'location', 'status', 'cultural_context', 'spiritual_significance']
    
    for col in text_columns:
        if col in df.columns:
            df[col] = df[col].apply(clean_text)
    
    # Ensure chapter is numeric where possible
    if 'chapter' in df.columns:
        df['chapter'] = pd.to_numeric(df['chapter'], errors='coerce')
    
    # Sort by chapter number
    df = df.sort_values('chapter', na_position='last')
    
    return df

def main():
    """Main execution function"""
    
    print("🔄 Starting character data standardization...")
    
    # File paths
    wix_file = Path("personagens_wix.csv")
    sutra_file = Path("../sutra.csv")
    output_file = Path("characters_standardized.csv")
    
    # Check if files exist
    if not wix_file.exists():
        print(f"❌ Error: {wix_file} not found!")
        return 1
    
    if not sutra_file.exists():
        print(f"❌ Error: {sutra_file} not found!")
        return 1
    
    try:
        # Read CSV files
        print(f"📖 Reading {wix_file}...")
        wix_df = pd.read_csv(wix_file)
        print(f"   Found {len(wix_df)} character records")
        
        print(f"📖 Reading {sutra_file}...")
        sutra_df = pd.read_csv(sutra_file)
        print(f"   Found {len(sutra_df)} chapter records")
        
        # Merge and standardize data
        print("🔀 Merging character data...")
        merged_df = merge_character_data(wix_df, sutra_df)
        
        print("🧹 Standardizing formatting...")
        standardized_df = standardize_columns(merged_df)
        
        # Generate statistics
        chapters_filled = standardized_df['chapter'].notna().sum()
        total_records = len(standardized_df)
        
        print(f"📊 Processing complete:")
        print(f"   Total records: {total_records}")
        print(f"   Records with chapters: {chapters_filled}")
        print(f"   Chapter coverage: {(chapters_filled/total_records)*100:.1f}%")
        
        # Save standardized file
        print(f"💾 Saving to {output_file}...")
        standardized_df.to_csv(output_file, index=False, encoding='utf-8')
        
        print("✅ Standardization complete!")
        print(f"   Output file: {output_file}")
        
        # Show preview of results
        print("\n📋 Preview of standardized data:")
        print("=" * 60)
        
        # Show records with chapters
        with_chapters = standardized_df[standardized_df['chapter'].notna()].head(5)
        for _, row in with_chapters.iterrows():
            chapter = int(row['chapter']) if pd.notna(row['chapter']) else 'N/A'
            name = row.get('name', 'Unknown')[:40]
            print(f"Ch. {chapter:2d}: {name}")
        
        if len(standardized_df) > 5:
            print("   ...")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
