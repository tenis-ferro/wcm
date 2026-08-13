import json
import os

def main():
    print("Starting data merge...")
    
    # Load newly fetched 2026 data
    with open("scratch/ingresos_2026_fetched.json", "r", encoding="utf-8") as f:
        new_2026_items = json.load(f)
        
    print(f"Loaded {len(new_2026_items)} new 2026 items.")
    
    # 1. Update ingresos-2026.json
    ingresos_2026_path = "backoffice/dashboard/data/ingresos-2026.json"
    ingresos_2026_data = {
        "Ingresos": new_2026_items
    }
    with open(ingresos_2026_path, "w", encoding="utf-8") as f:
        json.dump(ingresos_2026_data, f, indent=4, ensure_ascii=False)
    print(f"Updated {ingresos_2026_path}")
    
    # 2. Update ingresos-all.json
    ingresos_all_path = "backoffice/dashboard/data/ingresos-all.json"
    with open(ingresos_all_path, "r", encoding="utf-8") as f:
        ingresos_all_data = json.load(f)
        
    old_items = ingresos_all_data.get("Ingresos", [])
    # Filter out 2026 items
    non_2026_items = [x for x in old_items if x.get("anno") != 2026]
    
    # Combine (new 2026 items at the beginning since it's desc order)
    combined_items = new_2026_items + non_2026_items
    ingresos_all_data["Ingresos"] = combined_items
    
    with open(ingresos_all_path, "w", encoding="utf-8") as f:
        json.dump(ingresos_all_data, f, indent=4, ensure_ascii=False)
    print(f"Updated {ingresos_all_path} with {len(combined_items)} total items (removed {len(old_items) - len(non_2026_items)} old 2026 items, added {len(new_2026_items)} new 2026 items).")
    
    # 3. Update ingresos-all-02.json
    ingresos_all_02_path = "backoffice/dashboard/data/ingresos-all-02.json"
    with open(ingresos_all_02_path, "r", encoding="utf-8") as f:
        ingresos_all_02_items = json.load(f)
        
    non_2026_items_02 = [x for x in ingresos_all_02_items if x.get("anno") != 2026]
    combined_items_02 = new_2026_items + non_2026_items_02
    
    with open(ingresos_all_02_path, "w", encoding="utf-8") as f:
        json.dump(combined_items_02, f, indent=4, ensure_ascii=False)
    print(f"Updated {ingresos_all_02_path} with {len(combined_items_02)} total items (removed {len(ingresos_all_02_items) - len(non_2026_items_02)} old 2026 items, added {len(new_2026_items)} new 2026 items).")

if __name__ == "__main__":
    main()
