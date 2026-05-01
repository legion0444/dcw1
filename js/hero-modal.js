let dataCache = { alliances: null, races: null, classes: null, rarities: null };

async function loadReferences() {
    if (dataCache.alliances && dataCache.races && dataCache.classes && dataCache.rarities) return dataCache;
    try {
        const [alliances, races, classes, rarities] = await Promise.all([
            fetch('data/alliances.json').then(res => res.json()),
            fetch('data/races.json').then(res => res.json()),
            fetch('data/classes.json').then(res => res.json()),
            fetch('data/rarities.json').then(res => res.json())
        ]);
        dataCache = { alliances, races, classes, rarities };
        return dataCache;
    } catch (e) { 
        console.error("Ошибка справочников", e); 
        return null; 
    }
}

const createStatRow = (name, val) => `
    <div class="stat-row">
        <div class="stat-icon">
            <img src="images/misc/icons/stats/${name.toLowerCase()}.png" onerror="this.style.opacity='0'">
        </div>
        <span class="stat-value">${val}</span>
    </div>
`;

export async function openHeroModal(heroData) {
    const refs = await loadReferences();  
    
    const allianceData = refs?.alliances.find(a => a.id === heroData.alliance_id);  
    const raceName = refs?.races.find(r => r.id === heroData.race_id)?.name_ru || "НЕИЗВЕСТНО";  
    const className = refs?.classes.find(c => c.id === heroData.class_id)?.name_ru || "НЕТ"; 
    
    const currentRarity = refs?.rarities.find(r => r.id === heroData.rarity_id); 

    const oldModal = document.getElementById('hero-full-card-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'hero-full-card-modal';
    modal.className = 'hero-modal-overlay';  

    modal.innerHTML = `
        <div class="external-blur"></div>
        <div class="hero-modal-content">
            <div class="modal-background"></div>
            <div class="modal-content-wrapper" style="position: relative; z-index: 10;">
                <button class="close-modal">✕</button>
            
                <div class="hero-modal-title">${(heroData.name_ru || "ГЕРОЙ").toUpperCase()}</div>

                <div class="hero-meta-row">
                    <div class="meta-item">
                        <span class="meta-label">КЛАСС:</span>
                        <span class="meta-value">${className.toUpperCase()}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">РАСА:</span>
                        <span class="meta-value">${raceName.toUpperCase()}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">АЛЬЯНС:</span>
                        <button class="alliance-pill-button">
                            <span>${(allianceData?.name_ru || "НЕТ").toUpperCase()}</span>
                            ${allianceData?.image ? `<img src="${allianceData.image}" class="alliance-icon">` : ''}
                        </button>
                    </div>
                </div>

                <div class="hero-header-flex">
                    <!-- ЛЕВАЯ ЧАСТЬ: ИЗОБРАЖЕНИЕ -->
                    <div class="hero-visual">
                        <div class="hero-visual-container">
                            <div id="hero-rarity-bg" class="hero-visual-bg" style="background-color: ${currentRarity?.color || '#e23636'};"></div>
                            <div class="image-container">
                                <img src="${heroData.image}" class="main-hero-img">
                                <div id="frame-container">
                                    ${currentRarity?.image ? `<img src="${currentRarity.image.replace('.png', '.webp')}" class="rarity-frame-overlay">` : ''}
                                </div>
                                
                                <!-- КОНТЕЙНЕР ДЛЯ ЗВЕЗД НА КАРТОЧКЕ -->
                                <div id="hero-stars-container" class="stars-card-overlay"></div>

                                ${heroData.shards > 0 ? `
                                    <div class="shards-overlay-panel panel-glass">
                                        <span class="shards-count">${heroData.shards}</span>
                                        <img src="images/misc/icons/shards.png" class="shard-icon-img">
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- ЦЕНТРАЛЬНАЯ ЧАСТЬ: СЕЛЕКТОРЫ -->
                    <div class="selectors-column">
                        <!-- ПАНЕЛЬ РЕДКОСТЕЙ -->
                        <div class="rarity-selector-panel panel-glass vertical-selector">
                            <div id="rarity-list" class="rarity-grid">
                                ${refs?.rarities.map(r => `
                                    <div class="rarity-option ${r.id === heroData.rarity_id ? 'active' : ''}" 
                                         data-id="${r.id}" 
                                         style="background: ${r.background}; border: 1px solid ${r.border}">
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- ПАНЕЛЬ ЗВЕЗД -->
                        <div class="stars-selector-panel panel-glass">
                            <div class="stars-selector-grid">
                                ${[1, 2, 3].map(type => 
                                    [1, 2, 3, 4].map(count => `
                                        <div class="star-option" data-type="${type}" data-count="${count}">
                                            <img src="images/misc/icons/stars/${type}.webp">
                                            
                                        </div>
                                    `).join('')
                                ).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- ПРАВАЯ ЧАСТЬ: ХАРАКТЕРИСТИКИ -->
                    <div class="hero-stats-side panel-glass">
                        <div class="panel-header">
                            <label class="stats-slider-switch large-slider">
                                <input type="checkbox" id="stats-level-toggle">
                                <span class="slider-pill">
                                    <span class="slider-knob-text">x1</span>
                                </span>
                            </label>
                        </div>
                        <div class="panel-divider"></div>
                        <div class="panel-body stats-list">
                            ${createStatRow('sum', heroData.power)}
                            ${createStatRow('hp', heroData.hp)}
                            ${createStatRow('atk', heroData.atk)}
                            ${createStatRow('def', heroData.def)}
                            ${createStatRow('wis', heroData.wis)}
                            ${createStatRow('agi', heroData.agi)}
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
                                <div class="skill-description">${s.name_ru || 'Описание отсутствует'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="calculator-wrapper">
                    <button class="legion-button">ТАКТИЧЕСКИЙ КАЛЬКУЛЯТОР</button>
                </div>
            </div>
        </div>
    `;

    // Логика переключения редкости[cite: 1]
    const rarityOptions = modal.querySelectorAll('.rarity-option');
    const heroBg = modal.querySelector('#hero-rarity-bg');
    const frameContainer = modal.querySelector('#frame-container');

    rarityOptions.forEach(opt => {
        opt.onclick = () => {
            const rId = parseInt(opt.dataset.id);
            const rInfo = refs.rarities.find(r => r.id === rId);

            rarityOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');

            if (rInfo) {
                heroBg.style.backgroundColor = rInfo.color;
                if (rInfo.image) {
                    const webpFrame = rInfo.image.replace('.png', '.webp');
                    frameContainer.innerHTML = `<img src="${webpFrame}" class="rarity-frame-overlay">`;
                } else {
                    frameContainer.innerHTML = '';
                }
            }
        };
    });

    const starOptions = modal.querySelectorAll('.star-option');
    const starsContainer = modal.querySelector('#hero-stars-container');

    starOptions.forEach((opt) => {
        opt.onclick = () => {
            const currentType = parseInt(opt.dataset.type);
            const currentCount = parseInt(opt.dataset.count);
            
            // ПРОВЕРКА: Если кликнули по уже активной звезде — сбрасываем всё
            if (opt.classList.contains('active')) {
                starOptions.forEach(o => o.classList.remove('active', 'filled'));
                starsContainer.innerHTML = '';
                return; // Прекращаем выполнение функции
            }

            // Иначе — обычная логика активации
            starOptions.forEach(o => o.classList.remove('active', 'filled'));

            opt.classList.add('active');

            starOptions.forEach(o => {
                const oType = parseInt(o.dataset.type);
                const oCount = parseInt(o.dataset.count);

                if (oType < currentType) {
                    // Младшие тиры горят полностью (например, все желтые при выборе синей)[cite: 2]
                    o.classList.add('filled');
                } else if (oType === currentType && oCount <= currentCount) {
                    // В текущем ряду горят до выбранной[cite: 2]
                    o.classList.add('filled');
                }
            });

            // Отрисовка на герое[cite: 2]
            starsContainer.innerHTML = '';
            for (let i = 0; i < currentCount; i++) {
                const img = document.createElement('img');
                img.src = `images/misc/icons/stars/${currentType}.webp`;
                img.className = 'hero-star-icon';
                starsContainer.appendChild(img);
            }
        };
    });
    // Логика слайдера x1/x5[cite: 1]
    const toggle = modal.querySelector('#stats-level-toggle');
    const knobText = modal.querySelector('.slider-knob-text');
    toggle.addEventListener('change', () => {
        knobText.textContent = toggle.checked ? 'x5' : 'x1';  
    });

    modal.querySelector('.close-modal').onclick = () => modal.remove();  
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); }; 
    
    document.body.appendChild(modal);
}