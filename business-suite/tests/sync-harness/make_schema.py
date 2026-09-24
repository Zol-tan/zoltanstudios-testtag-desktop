import re,sys
api=sys.argv[1]; out_path=sys.argv[2]
src=open(api+'/install.sql').read()+open(api+'/migration-03.sql').read()
out=[]
for m in re.finditer(r'CREATE TABLE IF NOT EXISTS (\w+) \((.*?)\n\)\s*ENGINE[^;]*;',src,re.S):
    name,body=m.group(1),m.group(2)
    cols=[];extra=[]
    lines=[l.strip().rstrip(',') for l in body.split('\n') if l.strip()]
    skip=False
    for l in lines:
        l=re.sub(r'--.*$','',l).strip().rstrip(',')
        if not l: continue
        if l.startswith('CONSTRAINT') or l.startswith('REFERENCES'): continue
        if re.match(r'(KEY|INDEX)\s',l): continue
        mu=re.match(r'UNIQUE KEY \w+ \((.*)\)',l)
        if mu: extra.append(f'UNIQUE({mu.group(1)})'); continue
        mp=re.match(r'PRIMARY KEY \((.*)\)',l)
        if mp:
            if name=='message_thread': continue
            extra.append(f'PRIMARY KEY({mp.group(1)})'); continue
        if 'AUTO_INCREMENT' in l:
            l=re.sub(r'\s.*','',l)+' INTEGER PRIMARY KEY AUTOINCREMENT'
        l=l.replace('UNSIGNED','')
        cols.append(l)
    out.append(f'CREATE TABLE {name} (\n  '+',\n  '.join(cols+extra)+'\n);')
out.append('''CREATE TABLE print_quotes (
  id TEXT PRIMARY KEY, quote_number TEXT NOT NULL UNIQUE, client_id TEXT, customer_name TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '', item_name TEXT NOT NULL, material TEXT NOT NULL DEFAULT 'PLA',
  weight_grams REAL NOT NULL DEFAULT 0, print_hours REAL NOT NULL DEFAULT 0, infill_percent INT NOT NULL DEFAULT 20,
  quantity INT NOT NULL DEFAULT 1, material_cost REAL NOT NULL DEFAULT 0, time_cost REAL NOT NULL DEFAULT 0,
  setup_fee REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT, created_at TEXT NOT NULL, last_updated TEXT NOT NULL);''')
open(out_path,'w').write('\n'.join(out))
