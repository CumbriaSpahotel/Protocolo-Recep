import sys, re, json, shutil
sys.stdout.reconfigure(encoding='utf-8')

# This script fixes the double-encoded UTF-8 (mojibake) in data.js
# The issue: UTF-8 bytes were interpreted as latin-1, creating mojibake like Ã³ instead of ó

def fix_mojibake(text):
    """
    Fixes text that has been double-encoded.
    The text was UTF-8, read as latin-1, then re-encoded as UTF-8.
    We reverse: encode as latin-1 bytes, then decode as UTF-8.
    """
    try:
        # Encode back to bytes as latin-1 (reversing the wrong read)
        # Then decode those bytes as UTF-8 (the original encoding)
        fixed = text.encode('latin-1').decode('utf-8')
        return fixed
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text

# Read the current (corrupted) data.js
print("Reading corrupted data.js...")
with open('data.js', 'rb') as f:
    raw = f.read()

# Remove BOM if present
if raw[:3] == b'\xef\xbb\xbf':
    print("Removing BOM...")
    raw = raw[3:]

# Decode as UTF-8 (the BOM-less file)
text = raw.decode('utf-8', errors='replace')

print(f"Original size: {len(text)} chars")
print(f"Mojibake 'Ã³' count before fix: {text.count('Ã³')}")

# The data.js contains JS variable assignments + JSON values
# We need to fix the mojibake in the JSON string values
# Strategy: extract each variable, fix the JSON strings, rebuild

# Extract variables using regex
def extract_json_block(text, varname):
    """Extract a JSON array or object from a JS variable assignment"""
    # Match: var/const/let varname = [JSON];
    pattern = r'(?:var|const|let)\s+' + re.escape(varname) + r'\s*=\s*'
    match = re.search(pattern, text)
    if not match:
        print(f"  WARNING: {varname} not found!")
        return None, None, None
    
    start_pos = match.end()
    # Find the start of the JSON ([ or {)
    json_start = start_pos
    while json_start < len(text) and text[json_start] in ' \t\n\r':
        json_start += 1
    
    if json_start >= len(text):
        return None, None, None
    
    open_char = text[json_start]
    close_char = ']' if open_char == '[' else '}'
    
    # Find matching closing bracket
    depth = 0
    in_string = False
    escape_next = False
    pos = json_start
    
    while pos < len(text):
        c = text[pos]
        if escape_next:
            escape_next = False
        elif c == '\\' and in_string:
            escape_next = True
        elif c == '"' and not escape_next:
            in_string = not in_string
        elif not in_string:
            if c == open_char:
                depth += 1
            elif c == close_char:
                depth -= 1
                if depth == 0:
                    json_end = pos + 1
                    return text[json_start:json_end], json_start, json_end
        pos += 1
    
    return None, None, None

variables = ['channels_config', 'protocols_data', 'navigation_config', 'home_config', 'cloud_config', 'menus_data']

# Fix approach: fix the entire text content by treating mojibake strings
# The content between JSON string quotes has mojibake

def fix_json_strings(text):
    """Fix mojibake within JSON string values"""
    result = []
    i = 0
    fixed_count = 0
    
    while i < len(text):
        if text[i] == '"':
            # Start of a JSON string - collect until unescaped closing quote
            result.append('"')
            i += 1
            string_chars = []
            while i < len(text):
                c = text[i]
                if c == '\\':
                    # Escaped character - keep as-is
                    string_chars.append(c)
                    i += 1
                    if i < len(text):
                        string_chars.append(text[i])
                        i += 1
                elif c == '"':
                    # End of string
                    break
                else:
                    string_chars.append(c)
                    i += 1
            
            # Now fix the string content
            string_content = ''.join(string_chars)
            try:
                fixed = string_content.encode('latin-1').decode('utf-8')
                if fixed != string_content:
                    fixed_count += 1
                result.append(fixed)
            except (UnicodeDecodeError, UnicodeEncodeError):
                result.append(string_content)
            
            result.append('"')
            i += 1  # skip closing quote
        else:
            result.append(text[i])
            i += 1
    
    print(f"  Fixed {fixed_count} string values")
    return ''.join(result)

print("\nFixing mojibake in JSON string values...")
fixed_text = fix_json_strings(text)

print(f"Fixed size: {len(fixed_text)} chars")
print(f"Mojibake 'Ã³' count after fix: {fixed_text.count('Ã³')}")
print(f"Sample of fixed text:")
# Find a sample with a previously broken character
sample_idx = fixed_text.find('protocols_data')
if sample_idx > -1:
    print(fixed_text[sample_idx:sample_idx+200])

# Backup current data.js before overwriting
print("\nCreating backup of current corrupted file as data.js.corrupted.bak...")
shutil.copy2('data.js', 'data.js.corrupted.bak')

# Write fixed content without BOM, as UTF-8
print("Writing fixed data.js (UTF-8 without BOM)...")
with open('data.js', 'w', encoding='utf-8', newline='') as f:
    f.write(fixed_text)

print("\nDone! Verifying...")
with open('data.js', 'rb') as f:
    verify_raw = f.read(10)
print(f"BOM in fixed file: {verify_raw[:3] == b'\xef\xbb\xbf'}")
print(f"First bytes: {verify_raw[:3].hex()}")

with open('data.js', 'r', encoding='utf-8') as f:
    verify_text = f.read()
print(f"'Ã³' remaining: {verify_text.count('Ã³')}")
print(f"Sample 'ó' count: {verify_text.count('ó')}")
print(f"Sample 'ñ' count: {verify_text.count('ñ')}")

print("\nFIX COMPLETE!")
