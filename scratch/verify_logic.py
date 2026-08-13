import json

def verify():
    print("Verifying offline classification logic using ingresos-2026.json...")
    
    with open("backoffice/dashboard/data/ingresos-2026.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    ingresos = data.get("Ingresos", [])
    print(f"Total ingresos loaded: {len(ingresos)}")
    
    cuota_items = [x for x in ingresos if x.get("categoria") == "CUOTA MENSUAL"]
    print(f"Total CUOTA MENSUAL items: {len(cuota_items)}")
    
    regular = {"cantidad": 0, "total": 0}
    dama_estudiante = {"cantidad": 0, "total": 0}
    pasivo = {"cantidad": 0, "total": 0}
    otros = {"cantidad": 0, "total": 0}
    
    # We will log the counts by exact importe
    importes = {}
    
    for item in cuota_items:
        monto = item.get("importe")
        importes[monto] = importes.get(monto, 0) + 1
        
        if monto == 43500 or monto == 50000:
            regular["cantidad"] += 1
            regular["total"] += monto
        elif monto == 21750 or monto == 25000:
            dama_estudiante["cantidad"] += 1
            dama_estudiante["total"] += monto
        elif monto == 13050:
            pasivo["cantidad"] += 1
            pasivo["total"] += monto
        else:
            otros["cantidad"] += 1
            otros["total"] += monto
            
    print("\nBreakdown by exact amount:")
    for amt, cnt in sorted(importes.items(), key=lambda x: x[0]):
        print(f"  ${amt}: {cnt} items")
        
    print("\nGrouped categories results:")
    print(f"  REGULAR: {regular['cantidad']} items, total ${regular['total']}")
    print(f"  DAMA / ESTUDIANTE: {dama_estudiante['cantidad']} items, total ${dama_estudiante['total']}")
    print(f"  PASIVO: {pasivo['cantidad']} items, total ${pasivo['total']}")
    print(f"  OTROS: {otros['cantidad']} items, total ${otros['total']}")
    
    # Assertion check: July/August payments of 50000 and 25000 should be in regular and dama_estudiante
    # and NOT in otros.
    if otros["cantidad"] > 0:
        print("\nWARNING: Some CUOTA MENSUAL items fell into OTROS! Details:")
        for item in cuota_items:
            monto = item.get("importe")
            if monto not in [43500, 50000, 21750, 25000, 13050]:
                print(f"  ID: {item.get('iding')}, Date: {item.get('fecha')}, Socio: {item.get('nomsocio')}, Amount: {monto}")
    else:
        print("\nSUCCESS: All CUOTA MENSUAL items classified correctly! No items in OTROS.")

if __name__ == "__main__":
    verify()
