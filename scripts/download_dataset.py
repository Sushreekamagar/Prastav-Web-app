import urllib.request, http.cookiejar, re, os, sys

file_id = '13Bj407uTN1vL37iHLXzC46pa_zPUzZAK'
output = r'C:\Users\HIKMAT THAPA\Desktop\prastav-backend\scripts\enriched_dataset.csv'

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')]

url1 = 'https://drive.google.com/uc?export=download&id=' + file_id
print('Fetching URL:', url1)
resp = opener.open(url1)
content = resp.read().decode('utf-8', errors='ignore')
print('Response length:', len(content))

# Look for confirm token
token_match = re.search(r'confirm=([^&"]+)', content)
if token_match:
    token = token_match.group(1)
    print('Found confirm token:', token)
    url2 = 'https://drive.google.com/uc?export=download&id=' + file_id + '&confirm=' + token
else:
    print('No confirm token found, trying direct download...')
    # Try alternate URL
    url2 = 'https://drive.usercontent.google.com/download?id=' + file_id + '&export=download&authuser=0&confirm=t'

print('Downloading from:', url2)
resp2 = opener.open(url2)
data = resp2.read()
print('Downloaded bytes:', len(data))

# Check if it's HTML
if data[:5] == b'<!DOC' or data[:6] == b'<html>' or b'<html' in data[:100]:
    print('Got HTML page, not CSV. First 500 chars:')
    print(data[:500].decode('utf-8', errors='ignore'))
else:
    with open(output, 'wb') as f:
        f.write(data)
    print('File saved. First 300 bytes:')
    print(data[:300].decode('utf-8', errors='ignore'))
