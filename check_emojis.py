import sys, re, shutil
sys.stdout.reconfigure(encoding='utf-8')

print("Reading data.js...")
with open('data.js', 'rb') as f:
    raw = f.read()

# Remove BOM if present  
if raw[:3] == b'\xef\xbb\xbf':
    raw = raw[3:]

text = raw.decode('utf-8', errors='replace')
print(f"Size: {len(text)} chars")

# Check for remaining mojibake (4-byte sequences for emojis)
# These would appear as sequences like ðŸ (U+00F0, then U+009F which is latin-1 misread)
# Emojis are 4-byte UTF-8: F0 9F XX XX  
# When read as latin-1: ð (F0) + Ÿ (9F) + XX + XX

bad_emoji_count = 0
for c in text:
    code = ord(c)
    # Characters that look like emoji mojibake
    # F0 = ð, 9F = Ÿ (latin-1)  
    if code in [0xF0, 0x9F]:
        bad_emoji_count += 1

print(f"Potential bad emoji chars: {bad_emoji_count}")
print(f"Sample bad title: {re.search(chr(0xF0), text) is not None}")

# Show sample of what we have
sample = text[text.find('protocols_data'):text.find('protocols_data')+500]
print("\nSample of protocols_data:")
print(sample[:300])
