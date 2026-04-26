// js/ui-components.js

// Функция инициализации любого кастомного списка
export function setupDropdown(id, dataArray, filterKey, labelPrefix, onSelectCallback) {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;

    const trigger = wrapper.querySelector('.select-trigger span');
    const optionsContainer = wrapper.querySelector('.custom-options');

    // 1. Очистка и создание пункта "ВСЕ"
    optionsContainer.innerHTML = '';
    const defaultOption = document.createElement('div');
    defaultOption.className = 'option selected';
    defaultOption.dataset.value = "";
    defaultOption.textContent = `${labelPrefix}: ВСЕ`;
    
    defaultOption.addEventListener('click', () => handleOptionClick(defaultOption));
    optionsContainer.appendChild(defaultOption);

    // Внутренняя функция обработки клика
    function handleOptionClick(div) {
        trigger.textContent = div.textContent;
        const selectedValue = div.dataset.value;
        
        optionsContainer.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        div.classList.add('selected');
        
        wrapper.classList.remove('open');
        
        // Передаем выбранное значение наружу в основной скрипт
        onSelectCallback(filterKey, selectedValue);
    }

    // 2. Наполнение данными
    dataArray.forEach(item => {
        const div = document.createElement('div');
        div.className = 'option';
        div.dataset.value = item.id;
        div.textContent = (item.name_ru || item.ru || item.name).toUpperCase();
        div.addEventListener('click', () => handleOptionClick(div));
        optionsContainer.appendChild(div);
    });

    // 3. Логика открытия (скролл всегда в 0)
    wrapper.querySelector('.select-trigger').onclick = (e) => {
        e.stopPropagation();
        const isOpen = wrapper.classList.toggle('open');
        if (isOpen) optionsContainer.scrollTop = 0;
        
        // Закрываем другие списки
        document.querySelectorAll('.custom-select-wrapper').forEach(w => {
            if (w !== wrapper) w.classList.remove('open');
        });
    };
}