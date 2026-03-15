
import sys

def check_file(filename):
    try:
        with open(filename, 'rb') as f:
            content = f.read()
            
        print(f"File size: {len(content)} bytes")
        
        # Check for BOM
        if content.startswith(b'\xef\xbb\xbf'):
            print("Found UTF-8 BOM at the start.")
            
        # Scan for non-ascii
        for i, b in enumerate(content):
            if b > 127:
                line_no = content[:i].count(b'\n') + 1
                char_no = i - content.rfind(b'\n', 0, i)
                print(f"Non-ASCII byte {b} (0x{b:02x}) found at index {i} (Line {line_no}, Col {char_no})")
                # Show context
                start = max(0, i - 10)
                end = min(len(content), i + 10)
                print(f"  Context: {content[start:end]}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_file(sys.argv[1])
