import sys, re
sys.stdout.reconfigure(encoding='utf-8')

print("Final verification of data.js...")
with open('data.js', 'rb') as f:
    raw = f.read()

print(f"File size: {len(raw)} bytes")
print(f"BOM present: {raw[:3] == b'\xef\xbb\xbf'}")
print(f"Starts with: {raw[:3].hex()}")

text = raw.decode('utf-8', errors='replace')
replacement_chars = text.count('\ufffd')
print(f"Replacement chars (encoding errors): {replacement_chars}")

# Count mojibake patterns
moji_count = text.count('Ã³') + text.count('Ã±') + text.count('Ã¡') + text.count('Ã©') + text.count('Ã\xad')
print(f"Remaining mojibake patterns: {moji_count}")

# Count broken emoji chars
broken_emojis = text.count(chr(0xF0))  # ð char
print(f"Remaining broken emoji (ð): {broken_emojis}")

# Count correct chars
print(f"\nCorrect Spanish chars:")
print(f"  á é í ó ú: {text.count('á')} {text.count('é')} {text.count('í')} {text.count('ó')} {text.count('ú')}")
print(f"  ñ Ñ: {text.count('ñ')} {text.count('Ñ')}")

# Validate JS structure
print(f"\nJS variables present:")
for var in ['channels_config', 'protocols_data', 'navigation_config', 'home_config', 'cloud_config', 'menus_data']:
    present = var in text
    count = text.count(f'"{var}"') + (1 if f'var {var}' in text or f'const {var}' in text else 0)
    print(f"  {var}: {'YES' if present else 'NO'}")

# Count protocols
sections = re.findall(r'"section":\s*"[^"]+"', text)
print(f"\nTotal protocol entries: {len(sections)}")

print("\n=== VERIFICATION COMPLETE ===")
if moji_count == 0 and broken_emojis == 0 and replacement_chars == 0:
    print("✅ ALL ENCODING ISSUES FIXED!")
else:
    print(f"⚠️ Some issues remain: {moji_count} mojibake, {broken_emojis} broken emojis, {replacement_chars} invalid chars")
