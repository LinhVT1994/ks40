import re

path = '/Users/rin/Desktop/MyPC/ks40/src/app/(member)/profile/[id]/ProfileClient.tsx'
with open(path, 'r') as f:
    content = f.read()

opening_pattern = r'<div(?![^>]*/>)'
closing_pattern = r'</div>'

depth = 0
lines = content.split('\n')
for i, line in enumerate(lines):
    opens = len(re.findall(opening_pattern, line))
    closes = len(re.findall(closing_pattern, line))
    if opens > 0 or closes > 0:
        depth += opens
        depth -= closes
        print(f"Line {i+1}: {line.strip()} | Depth: {depth}")
    if depth < 0:
        print(f"ERROR: Negative depth at line {i+1}")
        depth = 0

print(f"Final depth: {depth}")
