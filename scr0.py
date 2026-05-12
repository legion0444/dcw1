import os
import json

# Укажите путь к папке с JSON файлами
folder_path = './data/heroes'

def find_ids_with_low_rarity(path):
    # Проверяем, существует ли папка
    if not os.path.exists(path):
        print(f"Ошибка: Путь '{path}' не найден.")
        return

    for filename in os.listdir(path):
        # Работаем только с файлами .json
        if filename.endswith('.json'):
            file_path = os.path.join(path, filename)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
 
                    if isinstance(data, dict):
                        if data.get('rarity_id') == 0:
                            print(f"Файл: {filename} | ID: {data.get('id')}")
                            
            except (json.JSONDecodeError, IOError) as e:
                print(f"Не удалось прочитать файл {filename}: {e}")

if __name__ == "__main__":
    find_ids_with_low_rarity(folder_path)