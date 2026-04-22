import re

path = '/Users/rin/Desktop/MyPC/ks40/src/app/(member)/profile/[id]/ProfileClient.tsx'
with open(path, 'r') as f:
    content = f.read()

# Pattern for opening divs not self-closing
# This is a bit naive but should work for finding unclosed tags
opening_pattern = r'<div(?![^>]*/>)'
closing_pattern = r'</div>'

depth = 0
lines = content.split('\n')
for i, line in enumerate(lines):
    opens = len(re.findall(opening_pattern, line))
    closes = len(re.findall(closing_pattern, line))
    depth += opens
    depth -= closes
    if depth < 0:
        print(f"Negative depth at line {i+1}: {depth}")
        depth = 0

print(f"Final depth: {depth}")
