/**
 * LEGION WIKI - Optimized Heroes Loader
 */
import { setupDropdown } from './ui-components.js';
import { applyUniversalFilters } from './filter-engine.js';
import { getHeroFullData } from './data-manager.js';
import { openHeroModal } from './hero-modal.js';

// Глобальные переменные модуля
let ALL_HEROES = [];
let CATEGORIES_DB = {};
let ALLIANCES_DB = []; // Для кэша иконок
let selectedFilters = { alliance: "", class: "", race: "" };

const filterMapping = {
    alliance: 'al',
    class: 'cl',
    race: 'ra'
};

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('hero-name-filter');

    try {
        // 1. Параллельная загрузка всех баз данных
        const responses = await Promise.all([
            fetch('data/category.json'),
            fetch('shortdata/heroes/heroesprev.json'),
            fetch('data/alliances.json'),
            fetch('data/classes.json'),
            fetch('data/races.json')
        ]);

        // 2. Распаковка данных
        const [catData, heroData, allianceData, classData, raceData] = await Promise.all(
            responses.map(res => res.clone().json())
        );

        CATEGORIES_DB = catData.categories;
        ALL_HEROES = heroData;
        ALLIANCES_DB = allianceData;

        // 3. МГНОВЕННАЯ ОТРИСОВКА (до настройки фильтров для скорости)
        renderAllSections();

        // 4. Инициализация UI-компонентов в фоне
        const updateFilter = (key, value) => {
            selectedFilters[key] = value;
            runFiltering();
        };

        setupDropdown('dropdown-alliance', allianceData, 'alliance', 'АЛЬЯНС', updateFilter);
        setupDropdown('dropdown-class', classData, 'class', 'КЛАСС', updateFilter);
        setupDropdown('dropdown-race', raceData, 'race', 'РАСА', updateFilter);

        if (searchInput) {
            searchInput.addEventListener('input', runFiltering);
        }

        // 5. Запуск фонового кэширования картинок
        startBackgroundPreload();

    } catch (err) {
        console.error("Критическая ошибка протокола LEGION:", err);
    }
});

/**
 * ОПТИМИЗИРОВАННАЯ ОТРИСОВКА СЕКЦИЙ
 */
function renderAllSections() {
    const container = document.querySelector('.sections-wide-wrapper');
    if (!container) return;
    
    // Используем DocumentFragment для минимизации перерисовок (Reflow)
    const fragment = document.createDocumentFragment();
    container.innerHTML = ''; 

    Object.entries(CATEGORIES_DB).forEach(([id, info]) => {
        if (parseInt(id) === 1) return; 
        
        const heroes = ALL_HEROES.filter(h => h.cat === parseInt(id));
        if (heroes.length === 0) return;

        const section = document.createElement('section');
        section.className = 'hero-group';
        
        //собираем HTML карточек один раз
        const cardsHTML = heroes.map(h => createHeroCard(h)).join('');

        section.innerHTML = `
            <h2 class="group-title">${info.ru.toUpperCase()}</h2>
            <div class="glass-panel">
                <div class="heroes-grid-mini">
                    ${cardsHTML}
                </div>
            </div>`;
        
        fragment.appendChild(section);
    });

    container.appendChild(fragment);
}

/**
 * ФУНКЦИЯ ФИЛЬТРАЦИИ
 */
function runFiltering() {
    const searchInput = document.getElementById('hero-name-filter');
    const query = searchInput ? searchInput.value : "";
    const body = document.body;
    const container = document.querySelector('.sections-wide-wrapper');

    const filtered = applyUniversalFilters(ALL_HEROES, {
        query,
        selectedFilters,
        filterMapping
    });

    const isSearchActive = query.trim() || selectedFilters.alliance || selectedFilters.class || selectedFilters.race;

    if (!isSearchActive) {
        body.classList.remove('mode-search');
        renderAllSections();
    } else {
        body.classList.add('mode-search');
        renderSearchResults(filtered);
    }
}

/**
 * РЕЗУЛЬТАТЫ ПОИСКА (через Fragment)
 */
function renderSearchResults(results) {
    const container = document.querySelector('.sections-wide-wrapper');
    container.innerHTML = `
        <div class="glass-panel search-results-active">
            <h2 class="group-title">ПРОТОКОЛ ПОИСКА: НАЙДЕНО ГЕРОЕВ (${results.length})</h2>
            <div class="heroes-grid-mini">
                ${results.map(h => createHeroCard(h)).join('')}
            </div>
        </div>`;
}

/**
 * СОЗДАНИЕ КАРТОЧКИ ГЕРОЯ
 */
function createHeroCard(hero) {
    const imgPath = hero.img ? `images/heroes/${hero.img}` : `images/heroes/${hero.id}.webp`;
    return `
        <div class="hero-mini-card" onclick="loadHeroDetails('${hero.id}')">
            <img src="${imgPath}" alt="${hero.nr}" loading="lazy" onerror="this.src='images/heroes/default.png'">
            <div class="hero-tooltip">${hero.nr.toUpperCase()}</div>
        </div>`;
}

/**
 * ФОНОВАЯ ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ (Preload)
 */
function startBackgroundPreload() {
    // Используем свободное время браузера, чтобы не мешать анимациям
    const idleCallback = window.requestIdleCallback || (cb => setTimeout(cb, 1000));
    
    idleCallback(() => {
        // 1. Предзагружаем первые 40 героев (те, что скорее всего откроют)
        const heroImgs = ALL_HEROES.slice(0, 40).map(h => 
            h.img ? `images/heroes/${h.img}` : `images/heroes/${h.id}.webp`
        );
        
        // 2. Предзагружаем все иконки альянсов (они важны для кнопок в модалке)
        const allianceImgs = ALLIANCES_DB.map(a => a.image).filter(Boolean);

        const allToCache = [...heroImgs, ...allianceImgs];

        allToCache.forEach(src => {
            const img = new Image();
            img.src = src;
        });
        
        console.log(`[Cache] Протокол предзагрузки завершен: ${allToCache.length} объектов.`);
    });
}

/**
 * ОБРАБОТЧИК КЛИКА
 */
window.loadHeroDetails = async function(heroId) {
    // Получаем полные данные (в data-manager должен быть свой кэш JSON)
    const fullData = await getHeroFullData(heroId);

    if (fullData) {
        openHeroModal(fullData);
    }
};