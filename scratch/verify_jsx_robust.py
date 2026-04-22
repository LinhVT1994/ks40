import re

files = [
    '/Users/rin/Desktop/MyPC/ks40/src/app/(member)/profile/[id]/ProfileClient.tsx',
    '/Users/rin/Desktop/MyPC/ks40/src/app/(member)/profile/[id]/PublicProfileClient.tsx'
]

for path in files:
    print(f"\nChecking: {path}")
    try:
        with open(path, 'r') as f:
            content = f.read()

        opening_divs = re.findall(r'<div(?![^>]*/>)[^>]*>', content)
        closing_divs = re.findall(r'</div>', content)

        print(f"  Open: {len(opening_divs)}")
        print(f"  Closed: {len(closing_divs)}")

        stack = []
        tags = re.findall(r'(<div(?![^>]*/>)[^>]*>|</div>)', content)
        for i, tag in enumerate(tags):
            if tag.startswith('<div'):
                stack.append(tag)
            else:
                if not stack:
                    print(f"  Error: </div> at index {i} but stack empty")
                else:
                    stack.pop()

        print(f"  Remaining in stack: {len(stack)}")
        if stack:
            for s in stack:
                print(f"  Unclosed: {s[:50]}...")
    except Exception as e:
        print(f"  Error reading file: {e}")
