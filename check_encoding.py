import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# The backup has dates up to May 1, current has dates up to May 25
# Check for the actual issue - check how many protocols each has
# and look for the double-encoded characters

with open('data.js', 'rb') as f:
    raw = f.read()

print('BOM present:', raw[:3] == b'\xef\xbb\xbf')
print('File size:', len(raw), 'bytes')

# Decode as UTF-8
text = raw.decode('utf-8', errors='replace')

# Check for Mojibake patterns - UTF-8 bytes interpreted as latin-1 then re-encoded
# ó = Ã³ (c3 b3 -> C3 B3)
# ñ = Ã± (c3 b1)  
# á = Ã¡ (c3 a1)
# é = Ã© (c3 a9)
mojibake_patterns = ['Ã³', 'Ã±', 'Ã¡', 'Ã©', 'Ã\xad', 'â€', 'â€™', 'Â©']
for p in mojibake_patterns:
    count = text.count(p)
    if count > 0:
        print(f'Found mojibake "{p}": {count} times')

# Count protocols by looking for section field
sections = re.findall(r'"section":\s*"([^"]+)"', text)
print(f'\nTotal protocols: {len(sections)}')
if sections:
    print('Sample sections:', sections[:10])

# Check for corrupted emojis - look for the replacement character pattern
# In the raw bytes, corrupted content would show as invalid sequences
# The BOM is causing the issue - Node reads it as part of the content
# Let's check what's after the BOM
after_bom = raw[3:100]
print('\nFirst bytes after BOM (hex):', after_bom.hex())
print('First bytes after BOM (text):', after_bom.decode('utf-8', errors='replace'))
