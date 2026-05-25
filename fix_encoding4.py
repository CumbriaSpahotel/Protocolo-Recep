import sys, re, shutil, json
sys.stdout.reconfigure(encoding='utf-8')

print("Reading current data.js (tildes already fixed, emojis still broken)...")
with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

print(f"Size: {len(text)} chars")

def try_fix_char_sequence(chars):
    """Try to fix a sequence of chars that might be mojibake via cp1252"""
    try:
        as_cp1252 = chars.encode('cp1252')
        fixed = as_cp1252.decode('utf-8')
        if fixed != chars:
            return fixed, True
        return chars, False
    except:
        return chars, False

def fix_mojibake_cp1252(text):
    """
    Fix mojibake by trying to encode segments as cp1252 and decode as UTF-8.
    Works on individual characters and small groups.
    """
    result = []
    i = 0
    fixed_count = 0
    
    while i < len(text):
        c = text[i]
        code = ord(c)
        
        # Only process chars that might be mojibake (in the latin-1 "weird" range)
        # Normal ASCII (0-127) and properly fixed Spanish chars (á,é,í,ó,ú,ñ etc.) should pass through
        # Chars that indicate mojibake: ð (F0), Ÿ (178/9F), smart quotes from 80-9F range
        
        # Try 4-char sequence first (for 4-byte emojis -> 4 latin chars)
        fixed = False
        for length in [4, 3, 2]:
            if i + length <= len(text):
                seq = text[i:i+length]
                # Check if sequence contains "suspicious" chars
                suspicious = any(ord(c2) > 0x7E and ord(c2) not in 
                               [0xE1, 0xE9, 0xED, 0xF3, 0xFA, 0xF1,  # á é í ó ú ñ
                                0xC1, 0xC9, 0xCD, 0xD3, 0xDA, 0xD1,  # Á É Í Ó Ú Ñ
                                0xFC, 0xDC, 0xBF, 0xA1]  # ü Ü ¿ ¡
                               for c2 in seq)
                if suspicious:
                    try:
                        as_cp1252 = seq.encode('cp1252')
                        try_utf8 = as_cp1252.decode('utf-8')
                        if try_utf8 != seq and len(try_utf8) < len(seq):
                            result.append(try_utf8)
                            i += length
                            fixed = True
                            fixed_count += 1
                            break
                    except:
                        pass
        
        if not fixed:
            result.append(c)
            i += 1
    
    print(f"Fixed {fixed_count} sequences")
    return ''.join(result)

print("\nApplying CP1252 mojibake fix (for emojis and remaining issues)...")
fixed_text = fix_mojibake_cp1252(text)

print(f"\nVerification:")
print(f"  'ó' count: {fixed_text.count('ó')}")
print(f"  'ñ' count: {fixed_text.count('ñ')}")
print(f"  'Ã³' remaining: {fixed_text.count('Ã³')}")

# Check titles
titles = re.findall(r'"title":\s*"([^"]{1,80})"', fixed_text)
print(f"\nFirst 15 titles:")
for t in titles[:15]:
    print(f"  {t}")

# Save
shutil.copy2('data.js', 'data.js.before_emoji_fix.bak')
print("\nWriting final fixed data.js...")
with open('data.js', 'w', encoding='utf-8', newline='') as f:
    f.write(fixed_text)
print("DONE!")
