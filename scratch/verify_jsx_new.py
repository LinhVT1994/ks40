import sys

def check_jsx(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Very simple tag counter (doesn't handle fragments or closed tags accurately, but good for total balance)
    open_tags = content.count('<div') + content.count('<section') + content.count('<aside') + content.count('<nav')
    close_tags = content.count('</div') + content.count('</section') + content.count('</aside') + content.count('</nav')
    
    print(f"Checking: {filepath}")
    print(f"  Open divs/sections/asides/navs: {open_tags}")
    print(f"  Closed divs/sections/asides/navs: {close_tags}")
    if open_tags != close_tags:
        print("  WARNING: Imbalance detected!")
    else:
        print("  Balanced.")

check_jsx('src/features/member/components/FeatureCards.tsx')
check_jsx('src/features/member/components/SearchResults.tsx')
check_jsx('src/features/articles/components/ArticleListItem.tsx')
