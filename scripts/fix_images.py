import json

# Temas para imágenes de Unsplash coherentes por categoría
CATEGORIES_IMAGES = {
    "Espacio": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564",
    "Ciencia": "https://images.unsplash.com/photo-1532187875605-1fc6367b913e",
    "Animales": "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
    "Naturaleza": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "Cuerpo Humano": "https://images.unsplash.com/photo-1530210124550-912dc1381cb8",
    "Matemáticas": "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3",
    "Historia": "https://images.unsplash.com/photo-1587049352846-4a222e784d38"
}

file_path = 'c:/Users/elchi\Downloads/portal de curiosidades/data/curiosities.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

updated_count = 0
for item in data:
    img = item.get("image", "")
    # Detectar imágenes con patrones "photo-0" o "15000000" que usó el script anterior para placeholders
    # O si falta la imagen
    if not img or "photo-15000" in img or "photo-0" in img:
        cat = item.get("category", "Ciencia")
        base_url = CATEGORIES_IMAGES.get(cat, CATEGORIES_IMAGES["Ciencia"])
        # Asignar una imagen de Unsplash real basada en la categoría con un ID único para evitar repetidos
        item["image"] = f"{base_url}?auto=format&fit=crop&q=80&w=800&sig={item['id']}"
        updated_count += 1

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print(f"Miniaturas actualizadas: {updated_count}")
