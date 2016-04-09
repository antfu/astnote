# -*- coding: utf-8 -*-
import sys
import requests
import codecs

def minify(source_path):
    try:
        # Grab the file contents
        with open(source_path, 'r') as c:
            target_data = c.read()

        # Pack it, ship it
        payload = {'input': target_data}
        if source_path.endswith('.js'):
            url = 'https://javascript-minifier.com/raw'
            minified = source_path.rstrip('.js')+'.min.js'
        elif source_path.endswith('.css'):
            url = 'https://cssminifier.com/raw'
            minified = source_path.rstrip('.css')+'.min.css'
        else:
            return false
        print("Requesting mini-me of {}. . .".format(c.name))
        r = requests.post(url, payload)

        # Write out minified version
        with codecs.open(minified, 'w', encoding="utf-8") as m:
            m.write(r.text)

        print("Minification complete. See {}".format(m.name))
        return True
    except:
        return False

if __name__ == '__main__':
    try:
        source_path = sys.argv[1]
    except:
        print("Missing input file")
        sys.exit()

    minify(source_path)