// Универсальная функция форматирования: пробелы для тысяч и чистые целые числа
function formatDisplay(num) {
    const floorNum = Math.floor(num);
    // Если число огромное, используем экспоненту (как в игре), если нет - просто пробелы
    if (floorNum >= 100000000) {
        return floorNum.toExponential(2).replace(/\.00/, "");
    }
    return floorNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function calculateHeroStats(hero, config, curves, rarities) {
    const { rarityId, ranks, valor, stars, blessing, isX5 } = config;

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

    // 3. Расчет коэффициента благословения k (Тот самый множитель)
    // В игре база 100%, к которой прибавляются значения из кривой
    let S = 100;
    for (let i = 0; i <= blessing; i++) {
        S += blessingProgression[i] || 0;
    }
    const k = blessing > 0 ? (S / 100) : 1;

    const statKeys = ['power', 'hp', 'atk', 'def', 'wis', 'agi'];
    const results = {};

    // 4. Расчет промежуточного cPower для определения E (множитель порога 15к)
    const basePower = isX5 ? (hero.power * 5) : hero.power;
    const cPower = (basePower / baseFactor) * rarityFactor * (1 + 0.001 * ranks) * (1 + 0.2 * valor) * starTotalFactor;
    
    // Множитель E: округление (Math.round) по коду игры
    const E = cPower >= 15000 ? Math.round(cPower / 10000) : 1;

    statKeys.forEach(key => {
        const base = hero[key] || (hero.stats ? hero.stats[key] : 0);
        let currentStat = isX5 ? base * 5 : base;

        // По коду игры для HP используется Math.round
        if (key === 'hp') currentStat = Math.round(currentStat);

        // cstat (промежуточный)
        const cstat = (currentStat / baseFactor) * rarityFactor * (1 + 0.001 * ranks) * (1 + 0.2 * valor) * starTotalFactor;

        // mstat (финальный) - здесь используется Math.floor
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
        // Выводим множитель в формате x4.2
        blessingMultiplier: `x${k.toFixed(1).replace('.0', '')}`
    };
}