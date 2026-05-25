import sys, re, shutil
sys.stdout.reconfigure(encoding='utf-8')

# The definitive fix: work directly on the RAW bytes of the original corrupted file
# The corrupted file: UTF-8 bytes were stored correctly in the file originally,
# but at some point Node.js read the file as latin-1 (or the BOM caused issues),
# then re-serialized it as UTF-8, causing each UTF-8 byte to become its own character.

# Read the ORIGINAL corrupted file (before our partial fixes)
print("Reading original corrupted file...")
with open('data.js.corrupted.bak', 'rb') as f:
    raw = f.read()

print(f"Raw size: {len(raw)} bytes")
print(f"BOM: {raw[:3].hex()}")

# Remove BOM
if raw[:3] == b'\xef\xbb\xbf':
    raw = raw[3:]
    print("BOM removed")

# The file is UTF-8 encoded, but it CONTAINS mojibake text
# The mojibake happened at the DATA level (in the strings stored in data.js)
# When Node.js had the BOM issue, it read the file successfully as UTF-8 (with BOM),
# then parsed the JSON, got strings with correct values... BUT
# Looking at the evidence: the BOM caused readFileSync to include \ufeff at start,
# which broke the JSON.parse regex extraction, so existing data was NULL/empty
# and the re-save created the corruption.

# Actually, let's look at this differently.
# The data in data.js AS BYTES should be valid UTF-8.
# When we read it with 'utf-8', we should get correct text.
# The mojibake "Ã³" in the UTF-8 decoded text means:
# - The file actually contains bytes: C3 83 C2 B3 (UTF-8 for Ã and ³)
# - Which is DOUBLE-ENCODED: the original ó (C3 B3 in UTF-8) was treated 
#   as two latin-1 chars Ã (C3) and ³ (B3), then each was re-encoded as UTF-8:
#   Ã -> C3 83, ³ -> C2 B3

# So the fix at byte level: 
# Find sequences like [C3 83 C2 B3] and replace with [C3 B3]
# More generally: C3 [83-BF] C2 [80-BF] -> C3 [03-3F] (offset by 0x80)

def fix_double_encoded_utf8(data):
    """
    Fix double-encoded UTF-8 bytes.
    Pattern: bytes that represent UTF-8 encoding of latin-1 misread UTF-8.
    """
    result = bytearray()
    i = 0
    fixed = 0
    
    while i < len(data):
        # Check for double-encoded 2-byte UTF-8 sequence
        # Original byte B (0x80-0xFF) -> latin-1 char -> UTF-8 encoded
        # B in range 0xC0-0xFF -> 2-byte UTF-8: [0xC3, B-0x40] followed by [0xC2, original_next]
        # Actually more complex. Let's think:
        
        # If original UTF-8 was: [C3 B3] (ó)
        # Read as latin-1: [0xC3=Ã, 0xB3=³]  
        # Re-encoded as UTF-8: [0xC3 0x83] [0xC2 0xB3]
        # So: C3 83 C2 B3 -> C3 B3
        
        # General pattern: C3 XX C2 YY where XX in [80-BF] and YY in [80-BF]
        # means: original bytes were [(C3-0x40+XX something)... no]
        # 
        # Let me think again:
        # The latin-1 chars Ã (0xC3) and ³ (0xB3) when encoded as UTF-8:
        # Ã (0xC3): since 0xC3 > 0x7F, UTF-8 encodes it as: 0xC3 0x83 (because 0xC3 = 1100_0011, which needs 2-byte UTF-8)
        # Wait: 0xC3 in UTF-8 2-byte form: C3 = 0b11000011, so as 2-byte UTF-8: 
        #   first byte: 110_xxxxx = 0xC3 = 110_00011 -> code point high bits = 00011
        #   Hmm, 0xC3 itself as a Unicode code point is U+00C3, UTF-8 = C3 83
        # ³ (0xB3) as Unicode U+00B3 -> UTF-8 = C2 B3
        
        # So: Ã³ in latin-1 = [0xC3, 0xB3], when each char encoded as UTF-8:
        # 0xC3 -> C3 83, 0xB3 -> C2 B3
        # Full sequence: C3 83 C2 B3
        # Should be: C3 B3 (ó in UTF-8)
        
        # Pattern: For any 2-byte UTF-8 char in range U+0080 to U+00FF:
        # Original: [HI, LO] where HI in {C2, C3} and LO in [80, BF]
        # Double-encoded: [C3, HI-0x40] [C2, LO] OR [C2, HI] [C2, LO] depending
        # Actually:
        # U+00C2 (Â) -> UTF-8: C3 82
        # U+00C3 (Ã) -> UTF-8: C3 83
        # U+00B0-00BF -> UTF-8: C2 B0..BF
        # U+0080-009F -> UTF-8: C2 80..9F
        
        # So a double-encoded 2-byte sequence [C2/C3, XX] looks like:
        # C2: U+0080-00BF -> C2 80..BF -> double-encoded: [C2 80..BF] each -> [C2 82, C2 XX] 
        #   Wait, C2 is U+00C2, which encodes as C3 82. 
        #   And 80-BF are already continuation bytes, they encode as C2 80..BF
        # So C2 B3 (³): C2=Â encodes as C3 82, B3=³ encodes as C2 B3 -> [C3 82, C2 B3]? No that's wrong.
        
        # Let me just be empirical. We know:
        # Ã (0xC3) encodes as UTF-8: C3 83
        # ó (0xB3) encodes as UTF-8: C2 B3
        # So Ã³ double-encoded: [C3 83] [C2 B3]
        # Should be: [C3 B3]
        
        # The pattern is: the double-encoded bytes [C3 83 C2 B3] should become [C3 B3]
        # More generally: [C3 (80+X)] [C2 Y] where original was [C3 Y] (well, C3 only covers U+C0-FF)
        # And [C2 (80+X)] [C2 Y] where original was [C2 Y]
        
        # SIMPLEST APPROACH: for consecutive bytes where:
        # byte[i] = 0xC3, byte[i+1] = 0x83 (this decodes to Ã = 0xC3)
        # byte[i+2] = 0xC2, byte[i+3] = X where X is 0x80-0xBF (continuation byte = ³, etc.)
        # This means original was: [0xC3, X] = a 2-byte UTF-8 char
        
        # Let's also handle:
        # byte[i] = 0xC2, byte[i+1] = 0x83..0xBF (this decodes to chars in 0x83..0xBF range)  
        # followed by byte[i+2] = 0xC2, byte[i+3] in 0x80..0xBF
        
        b = data[i]
        
        # Try 4-byte double-encoded pattern (encodes a 2-byte UTF-8 char)
        if i + 3 < len(data):
            b1, b2, b3, b4 = data[i], data[i+1], data[i+2], data[i+3]
            # Pattern: [C3 83] [C2 XX] -> [C3 XX] (Ã + continuation -> 2-byte UTF8)
            if b1 == 0xC3 and b2 == 0x83 and b3 == 0xC2 and 0x80 <= b4 <= 0xBF:
                result.append(0xC3)
                result.append(b4)
                i += 4
                fixed += 1
                continue
            # Pattern: [C3 82] [C2 XX] -> [C2 XX] (Â + continuation -> 2-byte UTF8 for U+0080-00BF)
            # Wait: if original char was e.g. © (0xA9), UTF-8 = C2 A9
            # Â is 0xC2, its UTF-8 = C3 82
            # © (0xA9) -> UTF-8 continuation byte 0xA9, encoded as: C2 A9
            # Double encoded Â©: [C3 82] [C2 A9]
            if b1 == 0xC3 and b2 == 0x82 and b3 == 0xC2 and 0x80 <= b4 <= 0xBF:
                result.append(0xC2)
                result.append(b4)
                i += 4
                fixed += 1
                continue
            # Pattern: any [C3/C2 XX] [C2 YY] that decodes to a known mojibake char
            # when b1=C3, b2 in 80-9F range, b3=C2, b4 in 80-BF
            if b1 == 0xC3 and 0x80 <= b2 <= 0x9F and b3 == 0xC2 and 0x80 <= b4 <= 0xBF:
                result.append(0xC3)
                result.append(b4)
                i += 4
                fixed += 1
                continue
        
        # Try 6-byte double-encoded pattern (encodes a 3-byte UTF-8 char, e.g. CJK, emojis need 4-byte)
        # 3-byte UTF-8: [E0-EF, 80-BF, 80-BF]
        # Each byte when > 0x7F gets double-encoded
        # E.g. E2 80 99 (') -> each byte encoded:
        # E2 -> C3 A2 (â), 80 -> C2 80, 99 -> C2 99
        # Wait, 0x80-0x9F are special in UTF-8 (continuation bytes for 2-byte)
        # When read as latin-1 and re-encoded:
        # 0x80 as Unicode U+0080 -> UTF-8: C2 80
        # 0x99 as Unicode U+0099 -> UTF-8: C2 99
        # 0xE2 as Unicode U+00E2 -> UTF-8: C3 A2
        # So ' (E2 80 99) double-encoded: [C3 A2] [C2 80] [C2 99] = â€™
        # To detect: 6 bytes [C3 XX] [C2 YY] [C2 ZZ] -> [E0+something, YY, ZZ]
        
        if i + 5 < len(data):
            b1, b2, b3, b4, b5, b6 = data[i], data[i+1], data[i+2], data[i+3], data[i+4], data[i+5]
            # Pattern: [C3/C2 XX] [C2 YY] [C2 ZZ] -> 3-byte sequence
            if (b1 in (0xC3, 0xC2)) and (b3 == 0xC2) and (b5 == 0xC2):
                if 0x80 <= b2 <= 0xBF and 0x80 <= b4 <= 0xBF and 0x80 <= b6 <= 0xBF:
                    # Reconstruct the original byte
                    orig_b1 = (b2 | (0x40 if b1 == 0xC3 else 0x00))
                    # This is getting complex. Let's try: decode the 6 bytes as UTF-8 -> 3 chars
                    # then encode those 3 chars as latin-1 -> 3 bytes -> try decode as UTF-8
                    try:
                        six_bytes = bytes([b1, b2, b3, b4, b5, b6])
                        as_text = six_bytes.decode('utf-8')
                        # Try to encode back as latin-1 to get original bytes
                        orig_bytes = as_text.encode('latin-1')
                        # Try to decode those bytes as UTF-8
                        fixed_char = orig_bytes.decode('utf-8')
                        result.extend(fixed_char.encode('utf-8'))
                        i += 6
                        fixed += 1
                        continue
                    except:
                        pass
        
        # Try 8-byte double-encoded pattern (emojis: 4-byte UTF-8 -> 8 bytes when double-encoded)
        if i + 7 < len(data):
            try:
                eight_bytes = bytes(data[i:i+8])
                as_text = eight_bytes.decode('utf-8')
                if len(as_text) == 4:  # 4 latin-1 chars
                    orig_bytes = as_text.encode('latin-1')
                    if len(orig_bytes) == 4:
                        fixed_char = orig_bytes.decode('utf-8')
                        if len(fixed_char) == 1 and ord(fixed_char) > 0x7FF:  # It's a real emoji/3-4byte char
                            result.extend(fixed_char.encode('utf-8'))
                            i += 8
                            fixed += 1
                            continue
            except:
                pass
        
        # Try 6-byte -> 3-byte emoji-ish
        if i + 5 < len(data):
            try:
                six_bytes = bytes(data[i:i+6])
                as_text = six_bytes.decode('utf-8')
                if len(as_text) == 3:
                    orig_bytes = as_text.encode('latin-1')
                    if len(orig_bytes) == 3:
                        fixed_char = orig_bytes.decode('utf-8')
                        if len(fixed_char) == 1 and ord(fixed_char) > 0x7FF:
                            result.extend(fixed_char.encode('utf-8'))
                            i += 6
                            fixed += 1
                            continue
            except:
                pass

        result.append(b)
        i += 1
    
    print(f"Fixed {fixed} byte sequences")
    return bytes(result)

print("Applying byte-level fix...")
fixed_raw = fix_double_encoded_utf8(raw)

print(f"\nOriginal size: {len(raw)} bytes")
print(f"Fixed size: {len(fixed_raw)} bytes")
print(f"Reduced by: {len(raw) - len(fixed_raw)} bytes")

# Decode and check
fixed_text = fixed_raw.decode('utf-8', errors='replace')
print(f"\nVerification:")
print(f"  'Ã³' remaining: {fixed_text.count('Ã³')}")  
print(f"  'ó' count: {fixed_text.count('ó')}")
print(f"  'ñ' count: {fixed_text.count('ñ')}")

# Sample titles
titles = re.findall(r'"title":\s*"([^"]{1,60})"', fixed_text)
print(f"\nSample titles (first 10):")
for t in titles[:10]:
    print(f"  {t}")

# Save
shutil.copy2('data.js', 'data.js.partial2.bak')
print("\nWriting final fixed data.js...")
with open('data.js', 'wb') as f:
    f.write(fixed_raw)
print("DONE!")
