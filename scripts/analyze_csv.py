import csv, sys, io, collections

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

conditions = collections.Counter()
availability = collections.Counter()
status_vals = collections.Counter()
total = 0

with open('scripts/enriched_dataset.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        total += 1
        conditions[row['condition']] += 1
        availability[row['availability']] += 1
        status_vals[row['status']] += 1

print(f'Total rows: {total}')
print(f'Conditions: {dict(conditions)}')
print(f'Availability: {dict(availability)}')
print(f'Status: {dict(status_vals)}')

# Check lat/lon range
with open('scripts/enriched_dataset.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    lats, lons = [], []
    missing_coords = 0
    for row in reader:
        lat = row.get('latitude', '').strip()
        lon = row.get('longitude', '').strip()
        if lat and lon:
            try:
                lats.append(float(lat))
                lons.append(float(lon))
            except:
                missing_coords += 1
        else:
            missing_coords += 1

print(f'\nCoordinate stats:')
print(f'  Records with coords: {len(lats)}')
print(f'  Missing coords: {missing_coords}')
if lats:
    print(f'  Lat range: {min(lats):.4f} - {max(lats):.4f}')
    print(f'  Lon range: {min(lons):.4f} - {max(lons):.4f}')
