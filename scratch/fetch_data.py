import urllib.request
import json
import os

SUPABASE_URL = "https://fwnoluzrshhtmypwevnt.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_f1VuE7CRyuLNxxwMAS19WA_F_1lWIoD"

def fetch_all_2026():
    all_data = []
    page = 0
    page_size = 1000
    done = False
    
    while not done:
        url = f"{SUPABASE_URL}/rest/v1/ingresos-anno?select=*&anno=eq.2026&order=iding.desc"
        # Supabase uses Range header or range query parameters. Range header is 'Range: 0-999', 'Range: 1000-1999', etc.
        # But we can also use offset and limit query params:
        # &limit=1000&offset=0
        offset = page * page_size
        paginated_url = f"{url}&limit={page_size}&offset={offset}"
        
        req = urllib.request.Request(
            paginated_url,
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            }
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                if not data:
                    done = True
                else:
                    all_data.extend(data)
                    print(f"Fetched page {page}, got {len(data)} items (total: {len(all_data)})")
                    if len(data) < page_size:
                        done = True
                    else:
                        page += 1
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
            
    return all_data

def format_item(item):
    # Strip timezone suffix +00:00 or Z from fecha
    fecha = item.get("fecha", "")
    if "+" in fecha:
        fecha = fecha.split("+")[0]
    elif fecha.endswith("Z"):
        fecha = fecha[:-1]
        
    formatted = {
        "iding": item.get("iding"),
        "fecha": fecha,
        "tiping": item.get("tiping"),
        "socio": item.get("socio"),
        "nomsocio": item.get("nomsocio"),
        "referencia": item.get("referencia", ""),
        "importe": item.get("importe"),
        "anno": item.get("anno"),
        "mes": item.get("mes"),
        "dia": item.get("dia"),
        "categoria": item.get("categoria"),
        "subcategoria": item.get("subcategoria", "SIN SUBCATEGORIA"),
        "semana": item.get("semana"),
        "cuarto": item.get("cuarto"),
        "semestre": item.get("semestre")
    }
    
    # Only add ticket and observaciones if they exist and are not null/None/empty (or if they are relevant)
    if "ticket" in item and item["ticket"] is not None:
        formatted["ticket"] = item["ticket"]
    if "observaciones" in item and item["observaciones"] is not None and item["observaciones"] != "S/I":
        formatted["observaciones"] = item["observaciones"]
        
    return formatted

def main():
    print("Starting data fetch for 2026...")
    raw_data = fetch_all_2026()
    print(f"Finished fetch. Total items: {len(raw_data)}")
    
    formatted_data = [format_item(x) for x in raw_data]
    
    # Save to a temporary file
    os.makedirs("scratch", exist_ok=True)
    with open("scratch/ingresos_2026_fetched.json", "w", encoding="utf-8") as f:
        json.dump(formatted_data, f, indent=4, ensure_ascii=False)
    print("Saved formatted data to scratch/ingresos_2026_fetched.json")

if __name__ == "__main__":
    main()
