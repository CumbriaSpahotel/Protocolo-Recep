import xml.etree.ElementTree as ET
import json
import os

def parse_atom(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    # Namespace handling
    ns = {'ns': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    for entry in root.findall('ns:entry', ns):
        title_elem = entry.find('ns:title', ns)
        content_elem = entry.find('ns:content', ns)
        published_elem = entry.find('ns:published', ns)
        updated_elem = entry.find('ns:updated', ns)
        
        categories = []
        for cat in entry.findall('ns:category', ns):
            term = cat.get('term')
            if term:
                categories.append(term)
        
        title = title_elem.text if (title_elem is not None and title_elem.text is not None) else "No Title"
        content = content_elem.text if (content_elem is not None and content_elem.text is not None) else ""
        published = published_elem.text if (published_elem is not None and published_elem.text is not None) else ""
        updated = updated_elem.text if (updated_elem is not None and updated_elem.text is not None) else ""
        
        # Simple extraction of "Section" from title if it follows the pattern X.X
        # e.g., "8.6.2. Uso SoulGuest"
        import re
        section_match = re.match(r'^(\d+(\.\d+)*)', title)
        section = section_match.group(1) if section_match else ""
        
        entries.append({
            'title': title.strip(),
            'section': section,
            'content': content,
            'published': published,
            'updated': updated,
            'categories': categories
        })
    
    return entries

if __name__ == "__main__":
    blogs_root = r"c:\Users\comun\Documents\GitHub\Operativa recepcion\Blogger\Blogs"
    all_data = []
    
    if os.path.exists(blogs_root):
        for blog_dir in os.listdir(blogs_root):
            blog_path = os.path.join(blogs_root, blog_dir)
            atom_file = os.path.join(blog_path, "feed.atom")
            
            if os.path.exists(atom_file):
                print(f"Parsing {blog_dir}...")
                blog_entries = parse_atom(atom_file)
                # Add source info
                for entry in blog_entries:
                    entry['source'] = blog_dir.replace('&amp_', '&')
                all_data.extend(blog_entries)
        
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        
        import re
        existing_nav = ''
        existing_home = ''
        
        # Try to rescue existing configs if any
        if os.path.exists('data.js'):
            with open('data.js', 'r', encoding='utf-8') as f:
                content = f.read()
                nav_match = re.search(r'(const navigation_config = \{.*?\};\n\n)', content, re.DOTALL)
                home_match = re.search(r'(const home_config = \{.*?\};\n\n)', content, re.DOTALL)
                if nav_match: existing_nav = nav_match.group(1)
                if home_match: existing_home = home_match.group(1)

        # Create data.js without destroying configs
        with open('data.js', 'w', encoding='utf-8') as f:
            f.write("const protocols_data = ")
            json.dump(all_data, f, ensure_ascii=False, indent=2)
            f.write(";\n\n")
            if existing_nav: f.write(existing_nav)
            if existing_home: f.write(existing_home)
            
        print(f"Extracted a total of {len(all_data)} entries to data.json and data.js")
    else:
        print("Blogs root not found")
