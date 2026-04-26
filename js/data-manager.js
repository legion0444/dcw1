// js/data-manager.js

const heroCache = {}; // Здесь хранятся уже загруженные JSON-ы

export async function getHeroFullData(heroId) {
    // Если герой уже есть в кеше, отдаем его сразу
    if (heroCache[heroId]) {
        console.log(`[Cache] Данные героя ${heroId} взяты из памяти`);
        return heroCache[heroId];
    }

    // Если нет — грузим из файла
    try {
        const response = await fetch(`data/heroes/${heroId}.json`);
        if (!response.ok) throw new Error('Герой не найден');
        
        const data = await response.json();
        heroCache[heroId] = data; // Сохраняем в кеш
        console.log(`[Network] Герой ${heroId} загружен и кеширован`);
        return data;
    } catch (err) {
        console.error("Ошибка загрузки полного JSON:", err);
        return null;
    }
}