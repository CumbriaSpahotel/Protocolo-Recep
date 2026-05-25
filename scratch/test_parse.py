import json
import re

file_path = 'c:/Users/comun/Documents/GitHub/Protocolo-Recep/data.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Let's extract channels_config
match = re.search(r'var channels_config\s*=\s*(.*?);\s*(const protocols_data|//|$)', text, re.DOTALL)
if match:
    json_str = match.group(1).strip()
    try:
        channels = json.loads(json_str)
        print("Successfully parsed channels_config!")
        print(f"Number of channels: {len(channels)}")
        for idx, c in enumerate(channels):
            print(f"- Index {idx}: Name: {c.get('name')}, ID: {c.get('id')}")
    except Exception as e:
        print("JSON Decode Error:", e)
        # print first 100 and last 100 chars of json_str
        print("Start:", json_str[:200])
        print("End:", json_str[-200:])
else:
    print("Could not find channels_config match!")
