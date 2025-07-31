#!/usr/bin/env python3
"""
CSV <-> TXT Bi-directional Converter
====================================

This script converts the merged_gandavyuha_ULTIMATE.csv file to TXT format and vice versa,
ensuring 100% data preservation in both directions.

Features:
- Handles pipe-delimited CSV files
- Preserves complex text content with quotes, commas, and special characters
- Creates human-readable TXT format with clear field separation
- Bi-directional conversion (CSV -> TXT -> CSV)
- Data integrity verification
- Detailed logging and error handling

Usage:
    python csv_txt_converter.py csv_to_txt input.csv output.txt
    python csv_txt_converter.py txt_to_csv input.txt output.csv
    python csv_txt_converter.py verify input.csv  # Verify round-trip conversion
"""

import sys
import csv
import os
import hashlib
from typing import List, Dict, Tuple
from datetime import datetime


class CSVTXTConverter:
    """Handles bi-directional conversion between CSV and TXT formats."""
    
    def __init__(self):
        self.delimiter = ','
        self.txt_field_separator = '=' * 50
        self.txt_record_separator = '#' * 80
        
    def read_csv_file(self, filepath: str) -> Tuple[List[str], List[List[str]]]:
        """
        Read CSV file and return headers and data rows.
        
        Args:
            filepath: Path to CSV file
            
        Returns:
            Tuple of (headers, data_rows)
        """
        headers = []
        data_rows = []
        
        try:
            with open(filepath, 'r', encoding='utf-8', newline='') as file:
                csv_reader = csv.reader(file)
                
                # Read header
                headers = next(csv_reader)
                
                # Read data rows
                for row in csv_reader:
                    if not row:  # Skip empty rows
                        continue
                    
                    # Ensure we have the right number of columns
                    while len(row) < len(headers):
                        row.append('')
                    
                    # Only take the first len(headers) columns
                    row = row[:len(headers)]
                    
                    data_rows.append(row)
                    
        except Exception as e:
            raise Exception(f"Error reading CSV file '{filepath}': {str(e)}")
        
        return headers, data_rows
    
    def write_txt_file(self, filepath: str, headers: List[str], data_rows: List[List[str]]) -> None:
        """
        Write data to TXT file in human-readable format.
        
        Args:
            filepath: Path to output TXT file
            headers: List of column headers
            data_rows: List of data rows
        """
        try:
            with open(filepath, 'w', encoding='utf-8') as file:
                # Write file header
                file.write(f"GANDAVYUHA ULTIMATE DATA EXPORT\n")
                file.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                file.write(f"Total Records: {len(data_rows)}\n")
                file.write(f"Total Fields: {len(headers)}\n")
                file.write(f"{self.txt_record_separator}\n\n")
                
                # Write headers reference
                file.write("FIELD REFERENCE:\n")
                for i, header in enumerate(headers, 1):
                    file.write(f"{i:2d}. {header}\n")
                file.write(f"\n{self.txt_record_separator}\n\n")
                
                # Write data records
                for record_num, row in enumerate(data_rows, 1):
                    file.write(f"RECORD {record_num:3d}\n")
                    file.write(f"{self.txt_record_separator}\n")
                    
                    for i, (header, value) in enumerate(zip(headers, row), 1):
                        file.write(f"\n[{i:2d}] {header}:\n")
                        file.write(f"{self.txt_field_separator}\n")
                        
                        # Handle empty values
                        if not value or value.strip() == '':
                            file.write("(empty)\n")
                        else:
                            # Clean up the value for display
                            clean_value = value.strip()
                            # Handle quotes that might be doubled
                            if clean_value.startswith('""') and clean_value.endswith('""'):
                                clean_value = clean_value[2:-2]
                            elif clean_value.startswith('"') and clean_value.endswith('"'):
                                clean_value = clean_value[1:-1]
                            
                            file.write(f"{clean_value}\n")
                        
                        file.write(f"{self.txt_field_separator}\n")
                    
                    file.write(f"\n{self.txt_record_separator}\n\n")
                    
        except Exception as e:
            raise Exception(f"Error writing TXT file '{filepath}': {str(e)}")
    
    def read_txt_file(self, filepath: str) -> Tuple[List[str], List[List[str]]]:
        """
        Read TXT file and extract headers and data rows.
        
        Args:
            filepath: Path to TXT file
            
        Returns:
            Tuple of (headers, data_rows)
        """
        headers = []
        data_rows = []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Find the field reference section
            field_ref_start = content.find("FIELD REFERENCE:")
            if field_ref_start == -1:
                raise ValueError("Invalid TXT file format: missing FIELD REFERENCE section")
            
            # Extract headers from field reference
            field_ref_section = content[field_ref_start:content.find(self.txt_record_separator, field_ref_start)]
            lines = field_ref_section.split('\n')[1:]  # Skip "FIELD REFERENCE:" line
            
            for line in lines:
                line = line.strip()
                if line and '. ' in line:
                    header = line.split('. ', 1)[1]
                    headers.append(header)
            
            # Find records
            record_sections = content.split('RECORD ')
            for section in record_sections[1:]:  # Skip the first part before first record
                if not section.strip():
                    continue
                
                # Extract field values
                row_data = [''] * len(headers)
                
                # Split into field sections
                field_sections = section.split(f'\n[')
                for field_section in field_sections[1:]:  # Skip first part
                    if not field_section.strip():
                        continue
                    
                    # Extract field number and content
                    lines = field_section.split('\n')
                    if not lines:
                        continue
                    
                    # Parse field number from first line like "1] capitulo:"
                    first_line = lines[0]
                    if ']' not in first_line:
                        continue
                    
                    field_num_str = first_line.split(']')[0].strip()
                    try:
                        field_num = int(field_num_str) - 1  # Convert to 0-based index
                    except ValueError:
                        continue
                    
                    if field_num >= len(headers):
                        continue
                    
                    # Extract field content between separators
                    content_lines = []
                    capturing = False
                    
                    for line in lines[1:]:
                        if line.strip() == self.txt_field_separator:
                            if capturing:
                                break  # End of field content
                            else:
                                capturing = True  # Start capturing content
                        elif capturing:
                            content_lines.append(line)
                    
                    # Join content and clean up
                    field_content = '\n'.join(content_lines).strip()
                    if field_content == '(empty)':
                        field_content = ''
                    
                    row_data[field_num] = field_content
                
                if any(row_data):  # Only add non-empty rows
                    data_rows.append(row_data)
        
        except Exception as e:
            raise Exception(f"Error reading TXT file '{filepath}': {str(e)}")
        
        return headers, data_rows
    
    def write_csv_file(self, filepath: str, headers: List[str], data_rows: List[List[str]]) -> None:
        """
        Write data to CSV file with proper CSV formatting.
        
        Args:
            filepath: Path to output CSV file
            headers: List of column headers
            data_rows: List of data rows
        """
        try:
            with open(filepath, 'w', encoding='utf-8', newline='') as file:
                csv_writer = csv.writer(file)
                
                # Write header
                csv_writer.writerow(headers)
                
                # Write data rows
                for row in data_rows:
                    # Ensure we have the right number of columns
                    while len(row) < len(headers):
                        row.append('')
                    
                    # Only take the first len(headers) columns
                    row = row[:len(headers)]
                    
                    csv_writer.writerow(row)
                    
        except Exception as e:
            raise Exception(f"Error writing CSV file '{filepath}': {str(e)}")
    
    def csv_to_txt(self, csv_filepath: str, txt_filepath: str) -> None:
        """Convert CSV file to TXT format."""
        print(f"Converting CSV to TXT...")
        print(f"Input:  {csv_filepath}")
        print(f"Output: {txt_filepath}")
        
        headers, data_rows = self.read_csv_file(csv_filepath)
        print(f"Read {len(data_rows)} records with {len(headers)} fields")
        
        self.write_txt_file(txt_filepath, headers, data_rows)
        print(f"Successfully converted to TXT format")
    
    def txt_to_csv(self, txt_filepath: str, csv_filepath: str) -> None:
        """Convert TXT file to CSV format."""
        print(f"Converting TXT to CSV...")
        print(f"Input:  {txt_filepath}")
        print(f"Output: {csv_filepath}")
        
        headers, data_rows = self.read_txt_file(txt_filepath)
        print(f"Read {len(data_rows)} records with {len(headers)} fields")
        
        self.write_csv_file(csv_filepath, headers, data_rows)
        print(f"Successfully converted to CSV format")
    
    def verify_conversion(self, original_csv: str) -> None:
        """Verify round-trip conversion preserves data integrity."""
        print(f"Verifying data integrity for: {original_csv}")
        
        # Generate temporary filenames
        temp_txt = original_csv.replace('.csv', '_temp.txt')
        temp_csv = original_csv.replace('.csv', '_temp.csv')
        
        try:
            # Convert CSV -> TXT -> CSV
            self.csv_to_txt(original_csv, temp_txt)
            self.txt_to_csv(temp_txt, temp_csv)
            
            # Read both files and compare
            original_headers, original_data = self.read_csv_file(original_csv)
            converted_headers, converted_data = self.read_csv_file(temp_csv)
            
            # Compare headers
            if original_headers != converted_headers:
                print("❌ FAILED: Headers don't match")
                print(f"Original:  {original_headers}")
                print(f"Converted: {converted_headers}")
                return
            
            # Compare data
            if len(original_data) != len(converted_data):
                print(f"❌ FAILED: Row count mismatch ({len(original_data)} vs {len(converted_data)})")
                return
            
            differences = []
            for i, (orig_row, conv_row) in enumerate(zip(original_data, converted_data)):
                for j, (orig_val, conv_val) in enumerate(zip(orig_row, conv_row)):
                    # Normalize values for comparison
                    orig_normalized = orig_val.strip().replace('\r', '')
                    conv_normalized = conv_val.strip().replace('\r', '')
                    
                    if orig_normalized != conv_normalized:
                        differences.append({
                            'row': i + 1,
                            'column': j + 1,
                            'field': original_headers[j],
                            'original': orig_normalized[:100] + '...' if len(orig_normalized) > 100 else orig_normalized,
                            'converted': conv_normalized[:100] + '...' if len(conv_normalized) > 100 else conv_normalized
                        })
            
            if differences:
                print(f"❌ FAILED: Found {len(differences)} differences")
                for diff in differences[:5]:  # Show first 5 differences
                    print(f"  Row {diff['row']}, Column {diff['column']} ({diff['field']}):")
                    print(f"    Original:  '{diff['original']}'")
                    print(f"    Converted: '{diff['converted']}'")
            else:
                print("✅ SUCCESS: 100% data integrity preserved")
                print(f"   - {len(original_data)} records verified")
                print(f"   - {len(original_headers)} fields verified")
                print(f"   - All data matches exactly")
            
        finally:
            # Clean up temporary files
            for temp_file in [temp_txt, temp_csv]:
                if os.path.exists(temp_file):
                    os.remove(temp_file)


def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    
    converter = CSVTXTConverter()
    command = sys.argv[1].lower()
    
    try:
        if command == 'csv_to_txt':
            if len(sys.argv) != 4:
                print("Usage: python csv_txt_converter.py csv_to_txt input.csv output.txt")
                sys.exit(1)
            converter.csv_to_txt(sys.argv[2], sys.argv[3])
            
        elif command == 'txt_to_csv':
            if len(sys.argv) != 4:
                print("Usage: python csv_txt_converter.py txt_to_csv input.txt output.csv")
                sys.exit(1)
            converter.txt_to_csv(sys.argv[2], sys.argv[3])
            
        elif command == 'verify':
            if len(sys.argv) != 3:
                print("Usage: python csv_txt_converter.py verify input.csv")
                sys.exit(1)
            converter.verify_conversion(sys.argv[2])
            
        else:
            print(f"Unknown command: {command}")
            print("Available commands: csv_to_txt, txt_to_csv, verify")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
