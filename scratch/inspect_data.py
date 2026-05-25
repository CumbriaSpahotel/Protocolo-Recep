import re

with open('c:/Users/comun/Documents/GitHub/Protocolo-Recep/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find top level variable declarations
matches = re.findall(r'^(var|const|let)\s+(\w+)\s*=', content, re.MULTILINE)
print("Top-level variables found:")
for m in matches:
    print(f"- {m[0]} {m[1]}")
