// battlesim.js

export function runBattle(p1, p2, verbose = false) {
    // 1. Инициализация бойцов из baseStats
    let h1 = {
        name: p1.name,
        hp: p1.baseStats.hp,
        atk: p1.baseStats[p1.mainStat],
        agi: p1.baseStats.agi,
        ability: p1.abilities.active,
        isPlayer: true // Флаг, чтобы потом понять, кто выиграл
    };

    let h2 = {
        name: p2.name,
        hp: p2.baseStats.hp,
        atk: p2.baseStats[p2.mainStat],
        agi: p2.baseStats.agi,
        ability: p2.abilities.active,
        isPlayer: false
    };

    if (verbose) {
        console.log(`%c ИНИЦИАТИВА: `, 'background: #000; color: #fff; font-weight: bold;');
        console.log(`${h1.name} (AGI: ${h1.agi}) vs ${h2.name} (AGI: ${h2.agi})`);
    }

    // 2. ОПРЕДЕЛЕНИЕ ОЧЕРЕДНОСТИ (Строго по AGI)
    // Тот, у кого AGI выше, будет первым в массиве units
    let units = [h1, h2].sort((a, b) => b.agi - a.agi);

    if (verbose) {
        console.log(`%c Первым ходит: ${units[0].name} `, 'color: #bada55; font-weight: bold;');
    }

    // 3. ЦИКЛ БОЯ (10 раундов)
    for (let round = 1; round <= 10; round++) {
        if (verbose) console.log(`%c --- РАУНД ${round} --- `, 'color: #888');

        for (let attacker of units) {
            // Определяем цель (тот, кто не атакующий)
            let target = units.find(u => u !== attacker);

            // Если кто-то уже умер, бой заканчивается немедленно
            if (attacker.hp <= 0 || target.hp <= 0) break;

            // Логика атаки
            let isSkill = Math.random() < attacker.ability.chance;
            let damage = 0;

            if (isSkill) {
                // Шанс промаха скилла
                if (Math.random() < (attacker.ability.missChance || 0)) {
                    if (verbose) console.log(`${attacker.name}: %cПРОМАХНУЛСЯ СКИЛЛОМ!`, 'color: orange');
                } else {
                    damage = Math.floor(attacker.atk * attacker.ability.multiplier);
                    target.hp -= damage;
                    if (verbose) console.log(`${attacker.name} [СКИЛЛ]: %c${attacker.ability.type}%c на %c${damage} урона!`, 'color: #e23636', 'color: #fff', 'font-weight: bold');
                }
            } else {
                // Обычная атака
                damage = attacker.atk;
                target.hp -= damage;
                if (verbose) console.log(`${attacker.name} атакует: %c${damage} урона.`, 'color: #ccc');
            }

            // Проверка на смерть после каждого удара
            if (target.hp <= 0) {
                if (verbose) console.log(`%c ${target.name} ПОВЕРЖЕН! `, 'background: #e23636; color: #fff');
                return attacker.isPlayer || (attacker === h1 && h1.isPlayer); 
            }
        }

        // Если после всех ходов в раунде кто-то умер — выходим
        if (h1.hp <= 0 || h2.hp <= 0) break;
    }

    // 4. ИТОГ ПО HP (если 10 раундов прошли)
    if (verbose) console.log("%c Время вышло! Сравнение по остатку HP. ", 'color: #aaa');
    return h1.hp > h2.hp;
}