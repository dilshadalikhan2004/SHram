import os
import re

src_dir = r"C:\Users\LENOVO\SHram\frontend\src"

count = 0
for root, dirs, files in os.walk(src_dir):
    for fname in files:
        if fname.endswith(('.js', '.jsx')):
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            
            # Fix: const API_URL = "https://api.shramsetu.in";
            new_content = new_content.replace(
                'const API_URL = "https://api.shramsetu.in";',
                'const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";'
            )
            
            # Fix inline fetch URLs like: fetch(`https://api.shramsetu.in/api/...
            new_content = re.sub(
                r'fetch\(`https://api\.shramsetu\.in/',
                'fetch(`${process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in"}/',
                new_content
            )
            
            # Fix inline axios: axios.get(`https://api.shramsetu.in/api/...
            new_content = re.sub(
                r'axios\.get\(`https://api\.shramsetu\.in/',
                'axios.get(`${process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in"}/',
                new_content
            )
            
            if new_content != content:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Fixed: {fpath}")

print(f"\nTotal files fixed: {count}")
