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

    const shardsHtml = (heroData.shards && heroData.shards > 0) ? `
        <div class="shards-overlay-panel">
            <span class="shards-count">${heroData.shards}</span>
            <img src="images/misc/icons/shards.webp" class="shard-icon-img">
        </div>
    ` : '';

    const hasTalents = heroData.talents && heroData.talents.length > 0;
    const talentsHtml = hasTalents ? `
        <div class="talents-panel panel-glass">
            <div class="talents-header-container">
                <button id="talents-all-btn" class="rank-max-button talent-all-button">ALL</button>
            </div>
            <div class="talents-grid">
                ${heroData.talents.map(tObj => {
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
    ` : '';

    const hatredCount = heroData.hatred ? heroData.hatred.length : 0;
    const hatredHtml = (heroData.hatred && hatredCount > 0) ? `
        <div class="hero-hatred-container">
            <div class="hatred-header-floating hatred-tooltip-trigger" data-hatred-bonus="30">
                <img src="images/misc/icons/hatred_icon.webp" class="hatred-icon-img">
            </div>
            <div class="hero-hatred-panel panel-glass">
                <div class="hatred-races-text">
                    ${heroData.hatred.map(h => {
                        const race = refs.races.find(r => r.id === h.race_id);
                        const name = race ? race.name_ru : "???";
                        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    }).join(', ')}
                </div>
            </div>
        </div>
    ` : '';

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
                                ${shardsHtml}
                                <img src="${heroData.image}" class="main-hero-img">
                                <div id="valor-overlay-container"></div>
                                <div id="frame-container">
                                    <img src="${baseRarity.image?.replace('.png', '.webp')}" class="rarity-frame-overlay">
                                </div>
                                <div id="hero-stars-container" class="stars-card-overlay"></div>
                            </div>
                        </div>
                        ${hatredHtml}
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
                        ${talentsHtml}
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

    let activeTooltip = null;
    const hideTooltip = () => { if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; } };

    function syncUI() {
        const maxRank = currentRarity.ranks || 5500;
        let rVal = parseInt(rankInput.value) || 0;
        let vVal = parseInt(valorInput.value) || 0;
        let bVal = parseInt(blessingInput.value) || 0;

        if (rVal > maxRank) { rVal = maxRank; rankInput.value = maxRank; }
        if (vVal > 35) { vVal = 35; valorInput.value = 35; }
        if (bVal > 50) { bVal = 50; blessingInput.value = 50; }

        const activeTalentIds = Array.from(modal.querySelectorAll('.talent-slot.active')).map(slot => slot.dataset.talentId);

        const config = { 
            rarityId: currentRarity.id, 
            ranks: rVal, 
            valor: vVal, 
            stars: activeStarCount, 
            blessing: bVal, 
            isX5: x5Toggle.checked,
            activeTalentIds: activeTalentIds 
        };

        const res = calculateHeroStats(heroData, config, refs.curves, refs.rarities, refs.talents);
        const keys = ['power', 'hp', 'atk', 'def', 'wis', 'agi'];

        modal.querySelector('#current-stats-list').innerHTML = keys.map(k => createStatRow(k, res.stats[k].current)).join('');
        modal.querySelector('#max-stats-list').innerHTML = keys.map(k => createStatRow(k, res.stats[k].final)).join('');
        modal.querySelector('#blessing-bonus-value').textContent = res.blessingMultiplier;  
        modal.querySelector('#hero-valor-roman').textContent = vVal > 0 ? romanize(vVal) : "";
        modal.querySelector('#valor-overlay-container').innerHTML = vVal > 0 ? `<img src="images/rarities/val.webp" class="valor-frame-overlay">` : "";
    }

    const setupTooltips = (selector, isTalent = true) => {
        let longPressTimer = null;
        let isLongPress = false;
        let isTouchMode = false;

        const showTooltip = (el) => {
            hideTooltip();
            activeTooltip = document.createElement('div');
            activeTooltip.className = 'talent-tooltip';
            activeTooltip.style.position = 'fixed';
            activeTooltip.style.zIndex = '10000';
            activeTooltip.style.pointerEvents = 'none';
            
            let content = '';
            if (isTalent) {
                const tData = refs.talents.find(t => t.id === parseInt(el.dataset.talentId));
                if (!tData || !tData.bonuses) return;
                for (const [stat, val] of Object.entries(tData.bonuses)) {
                    content += `<div class="tooltip-stat-row"><img src="images/misc/icons/stats/${stat.toLowerCase()}.webp" class="tooltip-stat-icon"><span class="tooltip-stat-text"><span class="stat-plus">+</span>${val}%</span></div>`;
                }
            } else {
                content = `<div class="tooltip-description-text">Наносит на <span class="stat-plus">${el.dataset.hatredBonus}%</span> урона больше по расам ниже</div>`;
            }

            activeTooltip.innerHTML = content;
            document.body.appendChild(activeTooltip);
            const r = el.getBoundingClientRect();
            const tr = activeTooltip.getBoundingClientRect();
            activeTooltip.style.left = `${r.left + (r.width / 2) - (tr.width / 2)}px`;
            activeTooltip.style.top = `${r.top - tr.height - 15}px`;
        };

        modal.querySelectorAll(selector).forEach(el => {
            el.onmouseenter = function() { if (isTouchMode) return; showTooltip(this); };
            el.onmouseleave = function() { if (isTouchMode) return; hideTooltip(); };
            el.addEventListener('touchstart', function(e) {
                isTouchMode = true; isLongPress = false; clearTimeout(longPressTimer);
                longPressTimer = setTimeout(() => { 
                    isLongPress = true; 
                    showTooltip(this); 
                }, 400); 
            }, { passive: true });
            el.addEventListener('touchend', function(e) {
                clearTimeout(longPressTimer);
                if (isLongPress) { 
                    hideTooltip(); 
                    setTimeout(() => { isLongPress = false; }, 50); 
                }
            });
            if (isTalent) {
                el.onclick = function() { if (isLongPress) return; this.classList.toggle('active'); syncUI(); };
            }
        });
    };

    modal.querySelectorAll('.rarity-option').forEach(opt => {
        opt.onclick = () => {
            currentRarity = refs.rarities.find(r => r.id === parseInt(opt.dataset.id));
            modal.querySelectorAll('.rarity-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            modal.querySelector('#hero-rarity-bg').style.backgroundColor = currentRarity.color;
            modal.querySelector('#frame-container').innerHTML = `<img src="${currentRarity.image?.replace('.png', '.webp')}" class="rarity-frame-overlay">`;
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

    [rankInput, valorInput, blessingInput].forEach(inp => {
        inp.onblur = function() { if (this.value === "") { this.value = 0; syncUI(); } };
        inp.oninput = syncUI;
    });

    x5Toggle.onchange = () => { modal.querySelector('.slider-knob-text').textContent = x5Toggle.checked ? 'x5' : 'x1'; syncUI(); };
    modal.querySelector('#rank-max-btn').onclick = () => { rankInput.value = currentRarity.ranks || 5500; syncUI(); };
    modal.querySelector('#valor-max-btn').onclick = () => { valorInput.value = 35; syncUI(); };
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    // Сначала пушим в DOM
    document.body.appendChild(modal);

    // Строго после добавления в DOM инициализируем тултипы, чтобы getBoundingClientRect сработал верно
    if (hasTalents) setupTooltips('.talent-slot', true);
    if (heroData.hatred) setupTooltips('.hatred-tooltip-trigger', false);

    syncUI();
}