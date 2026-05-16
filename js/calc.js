// Универсальная функция форматирования: пробелы для тысяч и чистые целые числа
function formatDisplay(num) {
    const floorNum = Math.floor(num);
    if (floorNum >= 100000000) {
        return floorNum.toExponential(2).replace(/\.00/, "");
    }
    return floorNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * @param {Object} hero - данные героя
 * @param {Object} config - { rarityId, ranks, valor, stars, blessing, isX5, activeTalentIds }
 * @param {Object} curves - кривые из JSON
 * @param {Array} rarities - справочник редкостей
 * @param {Array} talentReference - справочник всех талантов (dataCache.talents)
 */
export function calculateHeroStats(hero, config, curves, rarities, talentReference = []) {
    const { rarityId, ranks, valor, stars, blessing, isX5, activeTalentIds = [] } = config;

    // 1. Получаем данные из внешних JSON
    const currentRarity = rarities.find(r => r.id === parseInt(rarityId));
    const rarityFactor = currentRarity ? currentRarity.factor : 1;
    const baseFactor = rarities[0] ? rarities[0].factor : 1;

    const starCurve = curves.star_curve; 
    const blessingProgression = curves.blessing_curve;

    // 2. Расчет множителя звезд
    const countStar = parseInt(stars);
    const starBonusMult = starCurve[countStar] || 0;
    const starTotalFactor = 1 + (starBonusMult * countStar);

    // 3. Расчет коэффициента благословения k
    let S = 100;
    for (let i = 0; i <= blessing; i++) {
        S += blessingProgression[i] || 0;
    }
    const k = blessing > 0 ? (S / 100) : 1;

    // --- НОВОЕ: Сбор бонусов от активных талантов ---
    const talentBonuses = { power: 0, hp: 0, atk: 0, def: 0, wis: 0, agi: 0 };
    
    activeTalentIds.forEach(tId => {
        const talentData = talentReference.find(t => t.id === parseInt(tId));
        if (talentData && talentData.bonuses) {
            for (const [stat, value] of Object.entries(talentData.bonuses)) {
                if (talentBonuses.hasOwnProperty(stat)) {
                    talentBonuses[stat] += value; // Суммируем проценты (15 + 15 = 30)
                }
            }
        }
    });

    const statKeys = ['power', 'hp', 'atk', 'def', 'wis', 'agi'];
    const results = {};

    // 4. Расчет промежуточного cPower (с учетом талантов на силу, если есть)
    const basePower = isX5 ? (hero.power * 5) : hero.power;
    const talentPowerMult = 1 + (talentBonuses.power / 100);
    const cPower = (basePower / baseFactor) * rarityFactor * (1 + 0.001 * ranks) * (1 + 0.2 * valor) * starTotalFactor * talentPowerMult;
    
    const E = cPower >= 15000 ? Math.round(cPower / 10000) : 1;

    statKeys.forEach(key => {
        const base = hero[key] || (hero.stats ? hero.stats[key] : 0);
        let currentStat = isX5 ? base * 5 : base;

        if (key === 'hp') currentStat = Math.round(currentStat);

        // --- ПРИМЕНЕНИЕ ТАЛАНТОВ ---
        // Создаем множитель: 1 + (15 / 100) = 1.15
        const talentStatMult = 1 + (talentBonuses[key] / 100);

        // cstat теперь включает множитель таланта
        const cstat = (currentStat / baseFactor) * rarityFactor * (1 + 0.001 * ranks) * (1 + 0.2 * valor) * starTotalFactor * talentStatMult;

        // mstat (финальный)
        let mstat;
        if (cPower < 15000) {
            mstat = Math.floor(cstat) * 100 * k;
        } else {
            mstat = Math.floor(cstat) * E * 100 * k;
        }

        results[key] = {
            current: formatDisplay(cstat),
            final: formatDisplay(mstat)
        };
    });

    return {
        stats: results,
        blessingMultiplier: `x${k.toFixed(1).replace('.0', '')}`
    };
}