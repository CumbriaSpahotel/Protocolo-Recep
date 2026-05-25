import sys, re, shutil
sys.stdout.reconfigure(encoding='utf-8')

# These emojis have bytes in the 0x80-0x9F range that are UNDEFINED in CP1252
# but are perfectly valid UTF-8 continuation bytes.
# The chars 0x8D, 0x90, 0x9D, 0x8F, 0x81 are undefined in CP1252
# but when they appear as the 4th byte of a 4-byte UTF-8 emoji sequence,
# they come from the original emoji bytes.

# The issue: when the emoji bytes F0 9F XX YY are misread as CP1252,
# F0 -> ð (U+00F0), 9F -> Ÿ (U+0178 in CP1252)
# But if XX is 0x8D (undefined in CP1252), it stays as U+008D (a control char)
# And that's what we see in the text: \x8d

# Fix: when we see ð (U+00F0) followed by chars, we need to reconstruct
# the original bytes using CP1252 for defined chars and the raw byte value for undefined ones.

# CP1252 undefined positions (use raw byte value):
CP1252_UNDEFINED = {
    0x81: 0x81, 0x8D: 0x8D, 0x8F: 0x8F, 0x90: 0x90, 0x9D: 0x9D
}

def char_to_byte_cp1252_or_raw(c):
    """Convert a character to its byte in CP1252, using raw byte for undefined positions"""
    code = ord(c)
    if code < 0x100 and code in CP1252_UNDEFINED:
        return bytes([code])
    try:
        return c.encode('cp1252')
    except:
        # For chars > 0xFF that came from CP1252 decoding:
        # reverse-map from cp1252 decode
        for byte_val in range(0x80, 0xA0):
            if byte_val in CP1252_UNDEFINED:
                continue
            try:
                if bytes([byte_val]).decode('cp1252') == c:
                    return bytes([byte_val])
            except:
                pass
        return None

def fix_broken_emoji(text):
    """Fix emojis that contain undefined CP1252 bytes"""
    result = []
    i = 0
    fixed = 0
    
    while i < len(text):
        c = text[i]
        
        # Check for ð (U+00F0) which is the start of broken 4-byte emoji
        if ord(c) == 0x00F0 and i + 3 < len(text):
            # Try to reconstruct 4 bytes using cp1252 or raw
            seq_bytes = bytearray()
            success = True
            for j in range(4):
                if i + j >= len(text):
                    success = False
                    break
                char = text[i + j]
                b = char_to_byte_cp1252_or_raw(char)
                if b is None:
                    success = False
                    break
                seq_bytes.extend(b)
            
            if success and len(seq_bytes) == 4:
                try:
                    emoji = seq_bytes.decode('utf-8')
                    if len(emoji) == 1 and ord(emoji[0]) > 0xFFFF:  # Proper emoji (>= U+10000)
                        result.append(emoji)
                        i += 4
                        fixed += 1
                        continue
                except:
                    pass
        
        # Check for â (U+00E2) which starts broken 3-byte sequences  
        if ord(c) == 0x00E2 and i + 2 < len(text):
            seq_bytes = bytearray()
            success = True
            for j in range(3):
                if i + j >= len(text):
                    success = False
                    break
                char = text[i + j]
                b = char_to_byte_cp1252_or_raw(char)
                if b is None:
                    success = False
                    break
                seq_bytes.extend(b)
            
            if success and len(seq_bytes) == 3:
                try:
                    char_result = seq_bytes.decode('utf-8')
                    if len(char_result) == 1 and ord(char_result[0]) > 0x7FF:
                        result.append(char_result)
                        i += 3
                        fixed += 1
                        continue
                except:
                    pass

        result.append(c)
        i += 1
    
    print(f"Fixed {fixed} broken emojis")
    return ''.join(result)

print("Reading data.js...")
with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

print(f"Size: {len(text)} chars")
print(f"Broken emoji count (ð chars): {text.count(chr(0xF0))}")

print("\nApplying emoji fix...")
text = fix_broken_emoji(text)
print(f"Broken emoji count after fix: {text.count(chr(0xF0))}")

# Show titles
titles = re.findall(r'"title":\s*"([^"]{1,80})"', text)
print(f"\nAll protocol titles:")
for t in titles[:60]:
    print(f"  {t}")

# Save
shutil.copy2('data.js', 'data.js.pre_emoji_fix2.bak')
with open('data.js', 'w', encoding='utf-8', newline='') as f:
    f.write(text)
print("\nSaved!")
