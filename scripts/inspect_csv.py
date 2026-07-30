import csv, sys, io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('scripts/enriched_dataset.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    print('HEADERS:', headers)
    print()
    for i, row in enumerate(reader):
        if i >= 3:
            break
        print(f'--- Row {i+1} ---')
        for k, v in row.items():
            print(f'  {k}: {repr(v)}')
        print()
