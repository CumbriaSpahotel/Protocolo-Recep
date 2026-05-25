import sys, re, shutil
sys.stdout.reconfigure(encoding='utf-8')

# Analyze the remaining broken emojis
with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all instances of ð (U+00F0) which indicates broken emojis
broken_seqs = []
i = 0
while i < len(text):
    c = text[i]
    if ord(c) == 0x00F0:  # ð - indicates broken emoji start
        seq = text[i:i+8]
        broken_seqs.append((i, seq[:6]))
    i += 1

print(f"Found {len(broken_seqs)} broken emoji instances")
print("\nSample broken sequences:")
seen = set()
for pos, seq in broken_seqs[:20]:
    if seq not in seen:
        seen.add(seq)
        chars = [(c, hex(ord(c))) for c in seq]
        print(f"  Seq: {repr(seq)}")
        print(f"  Chars: {chars}")
        # Try cp1252 encode on just the ð + next char
        for length in [2, 3, 4, 5, 6]:
            try_seq = seq[:length]
            try:
                as_cp1252 = try_seq.encode('cp1252')
                as_utf8 = as_cp1252.decode('utf-8')
                print(f"  {length} chars via cp1252: {as_utf8} (chars: {[hex(ord(c)) for c in as_utf8]})")
            except Exception as e:
                print(f"  {length} chars via cp1252: ERROR {e}")
        print()
