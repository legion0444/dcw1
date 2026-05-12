import { calculateHeroStats } from './calc.js';

let dataCache = { alliances: null, races: null, classes: null, rarities: null, curves: null, talents: null };

async function loadReferences() {
    if (dataCache.talents) return dataCache;
    try {
        const [alliances, races, classes, rarities, curves, talents] = await Promise.all([
            fetch('data/alliances.json').then(res => res.json()),
            fetch('data/races.json').then(res => res.json()),
            fetch('data/classes.json').then(res => res.json()),
            fetch('data/rarities.json').then(res => res.json()),
            fetch('data/curve.json').then(res => res.json()),
            fetch('data/talents.json').then(res => res.json())
        ]);
        dataCache = { alliances, races, classes, rarities, curves, talents };
        return dataCache;
    } catch (e) { 
        console.error("Ошибка загрузки данных:", e); 
        return null; 
    }
}

function romanize(num) {
    if (isNaN(num) || num <= 0) return "";
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) { roman += i; num -= lookup[i]; }
    }
    return roman;
}

const createStatRow = (name, val) => `
    <div class="stat-row">
        <div class="stat-icon"><img src="images/misc/icons/stats/${name.toLowerCase()}.png" onerror="this.style.opacity='0'"></div>
        <span class="stat-value">${val.toLocaleString()}</span>
    </div>
`;

export async function openHeroModal(heroData) {
    const refs = await loadReferences();
    if (!refs) return;

    const baseRarity = refs.rarities.find(r => r.id === heroData.rarity_id) || refs.rarities[0];
    const allianceData = refs.alliances.find(a => a.id === heroData.alliance_id);
    const raceName = refs.races.find(r => r.id === heroData.race_id)?.name_ru || "НЕИЗВЕСТНО";
    const className = refs.classes.find(c => c.id === heroData.class_id)?.name_ru || "НЕТ";

    let currentRarity = baseRarity;
    let activeStarCount = 0;
    let activeStarType = 1;

    const modal = document.createElement('div');
    modal.id = 'hero-full-card-modal';
    modal.className = 'hero-modal-overlay';  

    modal.innerHTML = `
        <div class="hero-modal-content">
            <div class="modal-background"></div>
            <div class="modal-content-wrapper" style="position: relative; z-index: 10;">
                <button class="close-modal">✕</button>
                
                <div class="hero-modal-title">
                    <span>${(heroData.name_ru || "ГЕРОЙ").toUpperCase()}</span>
                    <span id="hero-valor-roman" class="roman-rank"></span>
                </div>

                <div class="hero-meta-row">
                    <div class="meta-item"><span class="meta-label">КЛАСС:</span> <span class="meta-value">${className.toUpperCase()}</span></div>
                    <div class="meta-item"><span class="meta-label">РАСА:</span> <span class="meta-value">${raceName.toUpperCase()}</span></div>
                    <div class="meta-item">
                        <span class="meta-label">АЛЬЯНС:</span>
                        <button class="alliance-pill-button">
                            <span>${(allianceData?.name_ru || "НЕТ").toUpperCase()}</span>
                            ${allianceData?.image ? `<img src="${allianceData.image}" class="alliance-icon">` : ''}
                        </button>
                    </div>
                </div>

                <div class="hero-header-flex">
                    <div class="hero-visual">
                        <div class="hero-visual-container">
                            <div id="hero-rarity-bg" class="hero-visual-bg" style="background-color: ${baseRarity.color};"></div>
                            <div class="image-container">
                                <img src="${heroData.image}" class="main-hero-img">
                                <div id="valor-overlay-container"></div>
                                <div id="frame-container">
                                    <img src="${baseRarity.image?.replace('.png', '.webp')}" class="rarity-frame-overlay">
                                </div>
                                <div id="hero-stars-container" class="stars-card-overlay"></div>
                            </div>
                        </div>
                    </div>

                    <div class="selectors-column">
                        <div class="rarity-selector-panel panel-glass vertical-selector">
                            <div id="rarity-list" class="rarity-grid">
                                ${refs.rarities.map(r => `
                                    <div class="rarity-option ${r.id === heroData.rarity_id ? 'active' : ''}" 
                                         data-id="${r.id}" style="background: ${r.background}; border: 1px solid ${r.border}">
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="stars-selector-panel panel-glass">
                            <div class="stars-selector-grid">
                                ${[1, 2, 3].map(type => [1, 2, 3, 4].map(count => `
                                    <div class="star-option" data-type="${type}" data-count="${count}">
                                        <img src="images/misc/icons/stars/${type}.webp">
                                    </div>
                                `).join('')).join('')}
                            </div>
                        </div>

                        <div class="controls-row-container">
                            <div class="rank-control-panel panel-glass compact-panel">
                                <div class="rank-info"><img src="images/misc/icons/rank.webp" class="rank-icon"> РАНГИ:</div>
                                <div class="rank-input-wrapper"><input type="number" id="hero-rank-input" value="0" min="0" class="rank-input"></div>
                                <button id="rank-max-btn" class="rank-max-button">MAX</button>
                            </div>
                            <div class="rank-control-panel panel-glass compact-panel">
                                <div class="rank-info"><img src="images/misc/icons/val_e.webp" class="rank-icon"> ДОБЛЕСТИ:</div>
                                <div class="rank-input-wrapper"><input type="number" id="hero-valor-input" value="0" min="0" max="35" class="rank-input"></div>
                                <button id="valor-max-btn" class="rank-max-button">MAX</button>
                            </div>
                        </div>

                        <div class="talents-panel panel-glass">
                            <div class="talents-header-container">
                                <button id="talents-all-btn" class="rank-max-button talent-all-button">ALL</button>
                            </div>
                            <div class="talents-grid">
                                ${(heroData.talents || []).map(tObj => {
                                    const tData = refs.talents.find(t => t.id === tObj.talent_id);
                                    return `
                                        <div class="talent-slot pointer" data-talent-id="${tObj.talent_id}">
                                            <div class="talent-wrapper">
                                                <img src="images/misc/icons/frame.webp" class="talent-frame">
                                                ${tData ? `<img src="${tData.image}" class="talent-icon">` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="hero-stats-side panel-glass">
                        <div class="panel-header">
                            <label class="stats-slider-switch large-slider">
                                <input type="checkbox" id="stats-level-toggle"><span class="slider-pill"><span class="slider-knob-text">x1</span></span>
                            </label>
                        </div>
                        <div class="panel-divider"></div>
                        <div class="stats-comparison-container">
                            <div class="stats-column"><div class="column-title">ТЕКУЩИЕ</div><div id="current-stats-list"></div></div>
                            <div class="vertical-divider"></div>
                            <div class="stats-column"><div class="column-title">MAX</div><div id="max-stats-list"></div></div>
                        </div>
                        <div class="panel-divider"></div>

                        <div class="blessing-section-new">
                            <div class="blessing-left-group">
                                <span class="column-title">БЛАГОСЛОВЕНИЕ</span>
                                <div class="rank-input-wrapper"><input type="number" id="hero-blessing-input" value="0" min="0" max="50" class="rank-input"></div>
                            </div>
                            <div class="bonus-wrapper"><div class="blessing-bonus-info">БОНУС: <span id="blessing-bonus-value">x1</span></div></div>
                        </div>
                    </div>
                </div>
                
                <div class="hero-skills-section">
                    ${(heroData.skills || []).map(s => `
                        <div class="skill-row">
                            <div class="skill-img-wrapper"><img src="${s.image}"></div>
                            <div class="skill-info-wrapper">
                                <div class="skill-meta">
                                    <span class="meta-label">ТИП:</span> <span class="meta-value">${s.type === 'active' ? 'АКТИВНАЯ' : 'ПАССИВНАЯ'}</span>
                                    <span class="meta-separator">|</span>
                                    <span class="meta-label">ШАНС:</span> <span class="meta-value">${s.chance}%</span>
                                </div>
                                <div class="skill-description">${s.name_ru || '---'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    const rankInput = modal.querySelector('#hero-rank-input');
    const valorInput = modal.querySelector('#hero-valor-input');
    const blessingInput = modal.querySelector('#hero-blessing-input');
    const x5Toggle = modal.querySelector('#stats-level-toggle');

    function syncUI() {
        const maxRank = currentRarity.ranks || 5500;
        let rVal = parseInt(rankInput.value) || 0;
        let vVal = parseInt(valorInput.value) || 0;
        let bVal = parseInt(blessingInput.value) || 0;

        if (rVal > maxRank) { rVal = maxRank; rankInput.value = maxRank; }
        if (vVal > 35) { vVal = 35; valorInput.value = 35; }
        if (bVal > 50) { bVal = 50; blessingInput.value = 50; }
        if (rVal < 0) { rVal = 0; rankInput.value = 0; }
        if (vVal < 0) { vVal = 0; valorInput.value = 0; }
        if (bVal < 0) { bVal = 0; blessingInput.value = 0; }

        const config = { rarityId: currentRarity.id, ranks: rVal, valor: vVal, stars: activeStarCount, blessing: bVal, isX5: x5Toggle.checked };
        const res = calculateHeroStats(heroData, config, refs.curves, refs.rarities);
        const keys = ['power', 'hp', 'atk', 'def', 'wis', 'agi'];

        modal.querySelector('#current-stats-list').innerHTML = keys.map(k => createStatRow(k, res.stats[k].current)).join('');
        modal.querySelector('#max-stats-list').innerHTML = keys.map(k => createStatRow(k, res.stats[k].final)).join('');
        modal.querySelector('#blessing-bonus-value').textContent = res.blessingMultiplier;  
        modal.querySelector('#hero-valor-roman').textContent = vVal > 0 ? romanize(vVal) : "";
        modal.querySelector('#valor-overlay-container').innerHTML = vVal > 0 ? `<img src="images/rarities/val.webp" class="valor-frame-overlay">` : "";
    }

    [rankInput, valorInput, blessingInput].forEach(inp => {
        inp.onblur = function() { if (this.value === "") { this.value = 0; syncUI(); } };
    });

    // Управление талантами
    modal.querySelectorAll('.talent-slot').forEach(slot => {
        slot.onclick = function() { this.classList.toggle('active'); };
    });

    // Логика кнопки ALL
    modal.querySelector('#talents-all-btn').onclick = function() {
        const slots = modal.querySelectorAll('.talent-slot');
        const anyInactive = Array.from(slots).some(s => !s.classList.contains('active'));
        slots.forEach(s => anyInactive ? s.classList.add('active') : s.classList.remove('active'));
    };

    modal.querySelectorAll('.rarity-option').forEach(opt => {
        opt.onclick = () => {
            currentRarity = refs.rarities.find(r => r.id === parseInt(opt.dataset.id));
            modal.querySelectorAll('.rarity-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            modal.querySelector('#hero-rarity-bg').style.backgroundColor = currentRarity.color;
            modal.querySelector('#frame-container').innerHTML = `<img src="${currentRarity.image?.replace('.png', '.webp')}" class="rarity-frame-overlay">`;
            rankInput.max = currentRarity.ranks || 5500;
            syncUI();
        };
    });

    modal.querySelectorAll('.star-option').forEach(opt => {
        opt.onclick = () => {
            const type = parseInt(opt.dataset.type);
            const count = parseInt(opt.dataset.count);
            const abs = ((type - 1) * 4) + count;
            activeStarCount = (activeStarCount === abs) ? 0 : abs;
            if (activeStarCount > 0) activeStarType = type;
            modal.querySelectorAll('.star-option').forEach(o => {
                const oIdx = ((parseInt(o.dataset.type) - 1) * 4) + parseInt(o.dataset.count);
                o.classList.toggle('filled', activeStarCount >= oIdx);
            });
            const cont = modal.querySelector('#hero-stars-container');
            cont.innerHTML = '';
            const dC = activeStarCount > 0 ? (activeStarCount % 4 === 0 ? 4 : activeStarCount % 4) : 0;
            for(let i = 0; i < dC; i++) cont.innerHTML += `<img src="images/misc/icons/stars/${activeStarType}.webp" class="hero-star-icon">`;
            syncUI();
        };
    });

    rankInput.oninput = syncUI;
    valorInput.oninput = syncUI;
    blessingInput.oninput = syncUI;
    x5Toggle.onchange = () => { modal.querySelector('.slider-knob-text').textContent = x5Toggle.checked ? 'x5' : 'x1'; syncUI(); };
    modal.querySelector('#rank-max-btn').onclick = () => { rankInput.value = currentRarity.ranks || 5500; syncUI(); };
    modal.querySelector('#valor-max-btn').onclick = () => { valorInput.value = 35; syncUI(); };
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    document.body.appendChild(modal);
    syncUI();
}