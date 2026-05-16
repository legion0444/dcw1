import json
import os

# Настройки
folder_path = './data/heroes'  # Укажи путь к папке с файлами
TARGET_ID = 15
TARGET_HP = 20
NEW_ID = 10

def update_talents():
    # Проверка существования папки
    if not os.path.exists(folder_path):
        print(f"Ошибка: Папка {folder_path} не найдена.")
        return

    files_processed = 0
    changes_made = 0

    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    print(f"Пропуск: Ошибка формата в {filename}")
                    continue

            file_modified = False

            # Логика обхода: ищем в корне или в libraries
            # Проверяем наличие ключа 'libraries'
            libraries = data.get("libraries", [])
            
            # Если libraries нет, но есть talents в корне (на всякий случай)
            if not libraries and "talents" in data:
                libraries = [data]

            for lib in libraries:
                talents = lib.get("talents", [])
                for talent in talents:
                    # Условие: talent_id == 15 И hp == 20
                    if talent.get("talent_id") == TARGET_ID and talent.get("hp") == TARGET_HP:
                        talent["talent_id"] = NEW_ID
                        file_modified = True
                        changes_made += 1

            if file_modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                print(f"Обновлен файл: {filename}")
            
            files_processed += 1

    print(f"\nГотово!")
    print(f"Обработано файлов: {files_processed}")
    print(f"Всего заменено талантов: {changes_made}")

if __name__ == "__main__":
    update_talents()