import sys, re, shutil
sys.stdout.reconfigure(encoding='utf-8')

# This script fixes the double-encoded UTF-8 (mojibake) in data.js
# The problem: the entire text was UTF-8, but was decoded as latin-1,
# so UTF-8 multi-byte sequences became pairs of latin-1 characters.
# 
# Example: ó (U+00F3) = UTF-8 bytes C3 B3
# When read as latin-1: Ã (C3) + ³ (B3) => "Ã³"
# 
# Fix: find these sequences in the text and reverse-decode them

# Common mojibake replacements for Spanish + emojis
# These are the exact patterns that appear when UTF-8 is read as latin-1

MOJIBAKE_MAP = {
    # Spanish vowels with accents
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã\x81': 'Á', 'Ã\x89': 'É', 'Ã\x8d': 'Í', 'Ã\x93': 'Ó', 'Ã\x9a': 'Ú',
    # ñ and Ñ
    'Ã±': 'ñ', 'Ã\x91': 'Ñ',
    # ü and Ü
    'Ã¼': 'ü', 'Ã\x9c': 'Ü',
    # Common punctuation
    'â€"': '—', 'â€"': '–', 'â€™': "'", 'â€˜': "'", 
    'â€œ': '"', 'â€\x9d': '"',
    'â€¦': '…', 'â€¢': '•',
    'Â©': '©', 'Â®': '®', 'Â°': '°', 'Â·': '·',
    'Â¿': '¿', 'Â¡': '¡',
    'Â«': '«', 'Â»': '»',
    'Â½': '½', 'Â¼': '¼', 'Â¾': '¾',
    'Ã\xa0': 'à', 'Ã\xe0': 'à',
    'Ã§': 'ç', 'Ã\x87': 'Ç',
    'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã¯': 'ï', 'Ã®': 'î',
    'Ã´': 'ô', 'Ã¶': 'ö',
    'Ã¹': 'ù', 'Ã»': 'û',
}

def fix_mojibake_map(text):
    """Replace all known mojibake patterns"""
    for mojibake, correct in MOJIBAKE_MAP.items():
        text = text.replace(mojibake, correct)
    return text

def fix_mojibake_general(text):
    """
    General approach: try to fix any remaining mojibake by encoding as latin-1
    and decoding as UTF-8 on chunks.
    This works for multi-byte UTF-8 sequences misread as latin-1.
    """
    # We'll process byte by byte looking for C3/C4/C5/Cx patterns
    # that indicate latin-1 misread UTF-8
    
    result = []
    i = 0
    fixed = 0
    
    while i < len(text):
        # Look for the pattern: Ã followed by a char with code 0x80-0xBF
        # This is a 2-byte UTF-8 sequence (U+0080 to U+07FF) misread as latin-1
        c = text[i]
        
        # Try to fix: if we have a char in range \xc0-\xdf (latin-1 for Ã..Ã)
        # followed by a char in range \x80-\xbf
        try:
            b1 = ord(c)
            if 0xC0 <= b1 <= 0xDF and i + 1 < len(text):
                b2 = ord(text[i+1])
                if 0x80 <= b2 <= 0xBF:
                    # This looks like a 2-byte UTF-8 sequence misread as latin-1
                    try:
                        fixed_char = bytes([b1, b2]).decode('utf-8')
                        result.append(fixed_char)
                        i += 2
                        fixed += 1
                        continue
                    except:
                        pass
            # 3-byte sequences
            elif 0xE0 <= b1 <= 0xEF and i + 2 < len(text):
                b2 = ord(text[i+1])
                b3 = ord(text[i+2])
                if 0x80 <= b2 <= 0xBF and 0x80 <= b3 <= 0xBF:
                    try:
                        fixed_char = bytes([b1, b2, b3]).decode('utf-8')
                        result.append(fixed_char)
                        i += 3
                        fixed += 1
                        continue
                    except:
                        pass
            # 4-byte sequences (emojis)
            elif 0xF0 <= b1 <= 0xF7 and i + 3 < len(text):
                b2 = ord(text[i+1])
                b3 = ord(text[i+2])
                b4 = ord(text[i+3])
                if 0x80 <= b2 <= 0xBF and 0x80 <= b3 <= 0xBF and 0x80 <= b4 <= 0xBF:
                    try:
                        fixed_char = bytes([b1, b2, b3, b4]).decode('utf-8')
                        result.append(fixed_char)
                        i += 4
                        fixed += 1
                        continue
                    except:
                        pass
        except (TypeError, ValueError):
            pass
        
        result.append(c)
        i += 1
    
    print(f"  General fix: repaired {fixed} sequences")
    return ''.join(result)

print("Reading data.js...")
with open('data.js', 'rb') as f:
    raw = f.read()

# Remove BOM if present
if raw[:3] == b'\xef\xbb\xbf':
    print("BOM found and removed")
    raw = raw[3:]

# Decode as UTF-8
text = raw.decode('utf-8', errors='replace')
print(f"Size: {len(text)} chars")
print(f"'Ã³' before: {text.count('Ã³')}")
print(f"Emojis check (ó should be ó): checking...")

# Step 1: Apply the general byte-level fix
print("\nStep 1: Applying general byte-level mojibake fix...")
text = fix_mojibake_general(text)
print(f"'Ã³' after general fix: {text.count('Ã³')}")

# Step 2: Apply known patterns
print("Step 2: Applying known pattern replacements...")
text = fix_mojibake_map(text)
print(f"'Ã³' after map fix: {text.count('Ã³')}")

# Verify
print(f"\nFinal counts:")
print(f"  'ó': {text.count('ó')}")
print(f"  'ñ': {text.count('ñ')}")
print(f"  'á': {text.count('á')}")
print(f"  'é': {text.count('é')}")
print(f"  'í': {text.count('í')}")
print(f"  Remaining 'Ã³': {text.count('Ã³')}")

# Show a sample of fixed protocol title
sample_match = re.search(r'"title":\s*"([^"]+)"', text)
if sample_match:
    print(f"\nSample title: {sample_match.group(1)}")

# Backup the partially-fixed file
print("\nBacking up current file...")
shutil.copy2('data.js', 'data.js.partial_fix.bak')

# Write the fixed file
print("Writing fully fixed data.js...")
with open('data.js', 'w', encoding='utf-8', newline='') as f:
    f.write(text)

# Verify the written file
with open('data.js', 'rb') as f:
    v_raw = f.read(4)
print(f"Written file BOM: {v_raw[:3] == b'\xef\xbb\xbf'}")
print(f"Written file starts with: {v_raw[:3].hex()}")
print("\nDONE!")
