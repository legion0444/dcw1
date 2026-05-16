/**
 * Инициализация кастомного выпадающего списка (Dropdown)
 * Полностью совместим с сигнатурой: (dropdownId, items, filterKey, defaultText, onSelect)
 */
export function setupDropdown(dropdownId, items, filterKey, defaultText, onSelect) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const selectedSpan = dropdown.querySelector('.dropdown-selected span');
    const listContainer = dropdown.querySelector('.dropdown-list');
    if (!listContainer) return;

    // Очищаем контейнер перед рендером
    listContainer.innerHTML = '';

    // Проверяем, передан ли массив данных
    if (!Array.isArray(items)) {
        console.warn(`[Dropdown] Данные для ${dropdownId} не являются массивом или не загрузились.`);
        return;
    }

    // 1. Добавляем опцию сброса фильтра ("ВСЕ")
    const resetDiv = document.createElement('div');
    resetDiv.className = 'dropdown-item reset-option';
    resetDiv.dataset.id = "";
    resetDiv.innerHTML = `<span>ВСЕ ${defaultText ? defaultText.toUpperCase() : ''}</span>`;
    
    resetDiv.onclick = (e) => {
        e.stopPropagation();
        if (selectedSpan) selectedSpan.textContent = defaultText || "ВЫБРАТЬ";
        
        const mainIcon = dropdown.querySelector('.dropdown-selected img');
        if (mainIcon) mainIcon.style.display = 'none';

        dropdown.classList.remove('open');
        if (typeof onSelect === 'function') {
            onSelect(filterKey, ""); // Передаем пустую строку для сброса
        }
    };
    listContainer.appendChild(resetDiv);

    // 2. Рендерим остальные элементы справочника
    items.forEach(item => {
        if (!item) return;

        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.dataset.id = item.id;

        // Защита от отсутствия name_ru в базе данных
        const displayName = item.name_ru 
            ? item.name_ru.toUpperCase() 
            : `БЕЗ ИМЕНИ (ID: ${item.id || '?'})`;

        div.innerHTML = `
            <span>${displayName}</span>
            ${item.image ? `<img src="${item.image}" class="dropdown-item-icon" onerror="this.style.display='none'">` : ''}
        `;

        div.onclick = (e) => {
            e.stopPropagation();
            if (selectedSpan) selectedSpan.textContent = displayName;
            
            // Если у элемента есть иконка (например, у Альянсов) — обновляем её в шапке
            const mainIcon = dropdown.querySelector('.dropdown-selected img');
            if (mainIcon) {
                if (item.image) {
                    mainIcon.src = item.image;
                    mainIcon.style.display = 'block';
                } else {
                    mainIcon.style.display = 'none';
                }
            }

            dropdown.classList.remove('open');
            if (typeof onSelect === 'function') {
                onSelect(filterKey, item.id); // Вызываем runFiltering через updateFilter(key, value)
            }
        };

        listContainer.appendChild(div);
    });

    // 3. Логика открытия и закрытия шторки дропдауна
    const selectedArea = dropdown.querySelector('.dropdown-selected');
    if (selectedArea) {
        selectedArea.onclick = (e) => {
            e.stopPropagation();
            // Закрываем другие дропдауны, чтобы не перекрывали друг друга
            document.querySelectorAll('.custom-dropdown').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        };
    }
}

// Клик по экрану вне списков закрывает их все
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
});