import sys, re, shutil
sys.stdout.reconfigure(encoding='utf-8')

print("Reading data.js...")
with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

print(f"Size: {len(text)} chars")

def fix_all_mojibake(text):
    """
    More aggressive fix: try every possible sequence length from 4 down to 2.
    A sequence is suspicious if it can be encoded as cp1252 AND the resulting bytes
    decode as valid UTF-8 to a SHORTER string.
    """
    result = []
    i = 0
    fixed_count = 0
    
    while i < len(text):
        fixed = False
        
        # Try longer sequences first (4, 3, 2 chars)
        for length in [4, 3, 2]:
            if i + length > len(text):
                continue
            seq = text[i:i+length]
            
            # Skip if any char in sequence can't be in cp1252
            try:
                as_cp1252 = seq.encode('cp1252')
            except:
                continue
            
            # Try to decode as UTF-8
            try:
                as_utf8 = as_cp1252.decode('utf-8')
                # Only accept if: result is shorter AND result contains non-ASCII
                if len(as_utf8) < len(seq) and any(ord(c) > 127 for c in as_utf8):
                    result.append(as_utf8)
                    i += length
                    fixed = True
                    fixed_count += 1
                    break
            except:
                continue
        
        if not fixed:
            result.append(text[i])
            i += 1
    
    print(f"Fixed {fixed_count} sequences")
    return ''.join(result)

# Run multiple passes until stable
prev_text = None
passes = 0
while prev_text != text and passes < 5:
    prev_text = text
    print(f"\nPass {passes + 1}...")
    text = fix_all_mojibake(text)
    passes += 1

print(f"\nDone after {passes} passes")
print(f"\nVerification:")
print(f"  'ó' count: {text.count('ó')}")
print(f"  'ñ' count: {text.count('ñ')}")

# Check titles  
titles = re.findall(r'"title":\s*"([^"]{1,80})"', text)
print(f"\nAll titles:")
for t in titles:
    print(f"  {t}")

# Save
print("\nWriting fixed data.js...")
with open('data.js', 'w', encoding='utf-8', newline='') as f:
    f.write(text)
print("DONE!")
