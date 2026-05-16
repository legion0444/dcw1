import json
import os

# Настройки
folder_path = './data/heroes'  # Путь к папке с JSON
keys_to_keep_in_talents = ["id", "parent1_id", "parent2_id", "talent_id"]
arrays_to_remove = ["race_data", "alliance_data", "class_data", "blessing"]

def clean_game_data():
    if not os.path.exists(folder_path):
        print(f"Папка {folder_path} не найдена!")
        return

    files_processed = 0

    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    continue

            file_modified = False

            # 1. Удаляем массивы из корня или из libraries
            for key in arrays_to_remove:
                if key in data:
                    del data[key]
                    file_modified = True
            
            libraries = data.get("libraries", [])
            # Если данных в корне нет, но есть в libraries, работаем с ними
            if not libraries and ("talents" in data or "hatred" in data):
                libraries = [data]

            for lib in libraries:
                # Удаляем массивы внутри библиотек, если они там есть
                for key in arrays_to_remove:
                    if key in lib:
                        del lib[key]
                        file_modified = True

                # 2. Чистим таланты (оставляем только 4 ключа и id = null)
                if "talents" in lib:
                    for talent in lib["talents"]:
                        current_keys = list(talent.keys())
                        for k in current_keys:
                            if k not in keys_to_keep_in_talents:
                                del talent[k]
                                file_modified = True
                        if "id" in talent:
                            talent["id"] = None
                            file_modified = True

                # 3. Чистим hatred (удаляем ключ "data" внутри объектов)
                if "hatred" in lib:
                    for entry in lib["hatred"]:
                        if "data" in entry:
                            del entry["data"]
                            file_modified = True

            if file_modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    # Сохраняем с отступами для читаемости
                    json.dump(data, f, indent=4, ensure_ascii=False)
                print(f"Файл полностью очищен: {filename}")
            
            files_processed += 1

    print(f"\nГотово! Обработано файлов: {files_processed}")

if __name__ == "__main__":
    clean_game_data()