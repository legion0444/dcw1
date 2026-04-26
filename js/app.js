import { runBattle } from './battlesim.js';

let currentTarget = ''; 
let selected = { player: null, enemy: null };

// Явное прикрепление к window для HTML
window.openHeroList = (target) => {
    currentTarget = target;
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.style.display = 'flex';
        renderGrid();
    }
};

window.closeAll = () => {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('details-overlay').style.display = 'none';
};

document.getElementById('close-modal').onclick = window.closeAll;
document.getElementById('close-details').onclick = window.closeAll;

async function renderGrid() {
    const grid = document.getElementById('hero-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">ЗАГРУЗКА...</div>';
    
    try {
        const resp = await fetch('./heroes_index.json');
        const list = await resp.json();
        grid.innerHTML = '';

        list.forEach(id => {
            const card = document.createElement('div');
            card.className = 'hero-card';
            card.innerHTML = `<img src="./heroes/${id}/${id}.png" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'">`;
            card.onclick = () => showHeroDetails(id);
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = 'ОШИБКА ИНДЕКСА';
    }
}

async function showHeroDetails(id) {
    try {
        const resp = await fetch(`./heroes/${id}/${id}.json`);
        const hero = await resp.json();

        // Безопасное заполнение текста
        const setUI = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setUI('hero-name', hero.name);
        setUI('hero-class', hero.class);
        setUI('hero-race', hero.race);
        setUI('hero-power', hero.baseStats.power);
        setUI('stat-hp', hero.baseStats.hp);
        setUI('stat-atk', hero.baseStats.atk);
        setUI('stat-def', hero.baseStats.def);
        setUI('stat-agi', hero.baseStats.agi);
        setUI('stat-vis', hero.baseStats.vis);

        document.getElementById('detail-img').src = `./heroes/${id}/${id}.png`;
        
        const skill = hero.abilities.active;
        const skillImg = document.getElementById('ability-img');
        if (skillImg) {
            skillImg.src = `./heroes/${id}/${skill.icon}`;
            skillImg.onerror = () => { skillImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; };
        }

        setUI('ability-type', skill.type);
        setUI('ability-chance', `${(skill.chance * 100).toFixed(0)}%`);
        setUI('ability-desc', skill.description);

        // --- ИСПРАВЛЕНИЕ ОШИБКИ ТУТ ---
        // Ищем кнопку по ID, который указан в твоем HTML
        const confirmBtn = document.getElementById('confirm-selection');
        if (confirmBtn) {
            confirmBtn.onclick = () => confirmSelection(hero, id);
        } else {
            console.error("Кнопка 'confirm-selection' не найдена в HTML!");
        }

        document.getElementById('details-overlay').style.display = 'flex';
    } catch (e) {
        console.error("Ошибка загрузки данных героя:", e);
    }
}

function confirmSelection(hero, id) {
    selected[currentTarget] = { ...hero, id };
    const slot = document.getElementById(`${currentTarget}-slot`);
    if (slot) {
        slot.innerHTML = `<img src="./heroes/${id}/${id}.png" class="slot-portrait">`;
    }
    window.closeAll();
}

document.getElementById('sim-btn').onclick = () => {
    if (!selected.player || !selected.enemy) return alert("ВЫБЕРИТЕ ОБОИХ ГЕРОЕВ!");

    console.clear();
    // Первый бой — демонстрационный с логами
    runBattle(selected.player, selected.enemy, true);

    // Массовая симуляция
    let wins = 0;
    for (let i = 0; i < 1000; i++) {
        if (runBattle(selected.player, selected.enemy, false)) wins++;
    }

    const winRate = (wins / 10).toFixed(1);
    document.getElementById('result-text').innerHTML = 
        `ШАНС ПОБЕДЫ ${selected.player.name.toUpperCase()}: <span style="color: #e23636;">${winRate}%</span>`;
};