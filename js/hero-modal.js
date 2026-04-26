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
    
    // Получение данных по ID
    const allianceData = refs?.alliances.find(a => a.id === heroData.alliance_id);
    const raceName = refs?.races.find(r => r.id === heroData.race_id)?.name_ru || "НЕИЗВЕСТНО";
    const className = refs?.classes.find(c => c.id === heroData.class_id)?.name_ru || "БОЕЦ";
    const rarityInfo = refs?.rarities.find(r => r.id === heroData.rarity_id);

    const rarityColor = rarityInfo?.color || "#e23636";
    
    // Принудительно меняем .png на .webp для рамок редкости
    let rarityFrame = rarityInfo?.image || "";
    if (rarityFrame.endsWith('.png')) {
        rarityFrame = rarityFrame.replace('.png', '.webp');
    }

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
                
                <div class="hero-modal-title" style="border-left: 4px solid #e23636; padding-left: 15px;">
                    ${(heroData.name_ru || "ГЕРОЙ").toUpperCase()}
                </div>

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
                    <div class="hero-visual">
                        <div class="hero-visual-container">
                            <div class="hero-visual-bg" style="background-color: ${rarityColor}; opacity: 0.15;"></div>
                            
                            <div class="image-container">
                                <img src="${heroData.image}" class="main-hero-img">
                                ${rarityFrame ? `
                                    <img src="${rarityFrame}" 
                                         class="rarity-frame-overlay" 
                                         onerror="this.src='${rarityFrame.replace('.webp', '.png')}'">
                                ` : ''}
                                
                                ${heroData.shards > 0 ? `
                                    <div class="shards-overlay-panel panel-glass">
                                        <span class="shards-count">${heroData.shards}</span>
                                        <img src="images/misc/icons/shards.png" class="shard-icon-img">
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="hero-stats-side panel-glass">
                        <div class="panel-header">ХАРАКТЕРИСТИКИ</div>
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

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    // Закрытие по клику на оверлей (вне контента)
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    document.body.appendChild(modal);
}