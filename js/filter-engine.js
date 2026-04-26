// js/filter-engine.js

export function applyUniversalFilters(dataArray, searchConfig) {
    const { query, selectedFilters, filterMapping } = searchConfig;

    return dataArray.filter(item => {
        // Поиск по тексту (имя)
        const matchName = !query || item.nr.toLowerCase().includes(query.toLowerCase());

        // Проверка всех активных фильтров (альянс, класс и т.д.)
        const matchFilters = Object.keys(selectedFilters).every(key => {
            const val = selectedFilters[key];
            if (!val) return true; // Если фильтр не выбран, пропускаем проверку
            
            // filterMapping связывает ключ фильтра (например 'alliance') 
            // с ключом в JSON (например 'al')
            const jsonKey = filterMapping[key];
            return item[jsonKey] == val;
        });

        return matchName && matchFilters;
    });
}