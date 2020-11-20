import vk from './src/vk';
import { HearManager } from '@vk-io/hear'
import { MongoClient } from 'mongodb';
import prequest from 'prequest';
import {Keyboard} from "vk-io";
import utils from "./src/utils";
const hearManager = new HearManager();
const client = new MongoClient('mongodb://localhost:27017/osucounter', { useUnifiedTopology: true });
const keyboardbuild = (massive) => {
    let one = [];
    let two = [];
    let three = [];
    let four = [];
    massive.map(e => {
        if(one.length < 4) {
            one.push(Keyboard.textButton({
                label: `${utils.gi(massive.indexOf(e) + 1)}`,
                payload: {
                    text: `https://osu.ppy.sh/beatmapsets/${e.bsid}#${e.mode}/${e.id}`
                },
                color: Keyboard.SECONDARY_COLOR
            }));
            return;
        }
        if(two.length < 4) {
            two.push(Keyboard.textButton({
                label: `${utils.gi(massive.indexOf(e) + 1)}`,
                payload: {
                    text: `https://osu.ppy.sh/beatmapsets/${e.bsid}#${e.mode}/${e.id}`
                },
                color: Keyboard.SECONDARY_COLOR
            }))
            return;
        }
        if(three.length < 4) {
            three.push(Keyboard.textButton({
                label: `${utils.gi(massive.indexOf(e) + 1)}`,
                payload: {
                    text: `https://osu.ppy.sh/beatmapsets/${e.bsid}#${e.mode}/${e.id}`
                },
                color: Keyboard.SECONDARY_COLOR
            }))
            return;
        }
    })
    let itog = []
    if(one.length !== 0) {
        itog.push(one);
    }
    if(two.length !== 0) {
        itog.push(two);
    }
    if(three.length !== 0) {
        itog.push(three);
    }
    return itog;
}
client.connect((err, ct) => { // Database connect callback
    if(err) {
        console.log(err);
    }
    let db = ct.db("osucounter");
    let users = db.collection("users");
vk.updates.on('message_new', async(message, next) => {
    if(message.senderId < 0) return;
    message.user = await users.findOne({id: message.senderId});
    if(!message.user) {
        await users.insertOne({
            id: message.senderId,
            osu: null
        });
        return message.send(`Вы успешно зарегистрировались!\nПривяжите Ваш osu! аккаунт через команду: Привязка`);
    };
return next();
});
    vk.updates.on('message_new', hearManager.middleware);
    hearManager.hear(/^(?:привязка|привязать)$/i, async (message) => {
        vk.api.utils.getShortLink({
            url: `https://osu.ppy.sh/oauth/authorize?client_id=3098&redirect_uri=https://defbot.design/osu&response_type=code&scope=identify%20friends.read%20public&state=${message.senderId}`,
            private: 0
        }).then(async function (response) {
            message.send(`🚀 Привет! URL для привязки твоего аккаунта OSU: \n${response.short_url}`);
        })
    });

    hearManager.hear(/(?:http|https)(:\/\/osu\.ppy\.sh\/)(beatmapsets|b)\/([0-9]*)#?(osu|taiko|catch|mania)?\/?([0-9]*)?\/?\+?([\S]*)?/ig, async (message) => {
    message.args = message.$match;
    message.args = message.args[0].match(/^(?:http|https)(:\/\/osu\.ppy\.sh\/)(beatmapsets|b)\/([0-9]*)#?(osu|taiko|catch|mania)?\/?([0-9]*)?\/?\+?([\S]*)?/i);
    if(!message.args[4] || !message.args[5]) {
        let req = await prequest(`https://osu.ppy.sh/api/get_beatmaps?k=e134658997767422c065df097a28a03362abd99f&s=${message.args[3]}`)
        if(req.length === 0) return message.send(`не найдено карт по данной ссылке!`);
        if(req.length > 1) {
            let mass = [];
            let txt = ``;

            req.map(obj => {
                let mode = obj.mode;
                mode = mode.replace(/0/ig, "osu");
                mode = mode.replace(/1/ig, "taiko");
                mode = mode.replace(/2/ig, "catch");
                mode = mode.replace(/3/ig, "maina");
                mass.push({id: obj.beatmap_id, bsid: obj.beatmapset_id, version: obj.version, mode: mode})
                txt += `${utils.gi(req.indexOf(obj) + 1)} ${obj.version}\n`
            });
            let keyboard = keyboardbuild(mass);
            return message.send(`Было найдено несколько карт:\n\n${txt}\nНажмите на кнопки для выбора.`, {keyboard: Keyboard
                    .keyboard(keyboard)
                    .inline()
            });
        }
        if(req.length === 1) {

            let map = req[0];
            if(map.approved !== "1") {
                let state = map.approved;
                state = state.replace(/-2/, "Заброшенная (Graveyard)")
                state = state.replace(/-1/, "В разработке (WIP)")
                state = state.replace(/0/, "Ожидающая (Pending)")
                state = state.replace(/1/, "Рейтинговая (Ranked)")
                state = state.replace(/2/, "Одобренная (Approved)")
                state = state.replace(/3/, "Квалифицированная (Qualified)")
                state = state.replace(/4/, "Любимая (Loved)")
                return message.send({message: `\n🏙 [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator})\n✅ CS: ${map.diff_size}\n👁‍🗨 OD: ${map.diff_overall}\n💣 AR: ${map.diff_approach}\n💭 HP: ${map.diff_drain}\n🌑 Combo: ${map.max_combo}x, Playcount: ${map.playcount}, Passcount: ${map.passcount}`})
            } else {
                let req = await prequest(`https://osu.ppy.sh/api/get_beatmaps?k=e134658997767422c065df097a28a03362abd99f&b=${message.args[5]}`);
                let score;
                if(!message.args[6]) score = await prequest(`https://api.tillerino.org/beatmapinfo?k=a86928375678416d9a99d9a4f019515a&beatmapid=${message.args[5]}`);
                let int = 0;
                let upModes = ``;
                if(message.args[6] && utils.isInteger(Number(message.args[6].length) / 2)) {
                    let mods = message.args[6].split(/(?=(?:..)*$)/);
                    mods.map((item) => {
                        if(modes[item.toUpperCase()]) {
                            int += modes[item.toUpperCase()];
                            if(!upModes.includes(item.toUpperCase())) upModes += `${item.toUpperCase()}`
                        }
                    });
                    score = await prequest(`https://api.tillerino.org/beatmapinfo?k=a86928375678416d9a99d9a4f019515a&beatmapid=${message.args[5]}&mods=${int}`);
                 } else {
                    score = await prequest(`https://api.tillerino.org/beatmapinfo?k=a86928375678416d9a99d9a4f019515a&beatmapid=${message.args[5]}`);
                }
                score = score.ppForAcc.entry;
                let acc98 = score.find(x => x.key === 0.98);
                let acc75 = score.find(x => x.key === 0.75);
                let acc85 = score.find(x => x.key === 0.85);
                let acc90 = score.find(x => x.key === 0.90);
                let acc95 = score.find(x => x.key === 0.90);
                let acc97 = score.find(x => x.key === 0.97);
                let acc100 = score.find(x => x.key === 1);
                let state = map.approved;
                state = state.replace(/-2/, "Заброшенная (Graveyard)")
                state = state.replace(/-1/, "В разработке (WIP)")
                state = state.replace(/0/, "Ожидающая (Pending)")
                state = state.replace(/1/, "Рейтинговая (Ranked)")
                state = state.replace(/2/, "Одобренная (Approved)")
                state = state.replace(/3/, "Квалифицированная (Qualified)")
                state = state.replace(/4/, "Любимая (Loved)");
                if(int > 0) return message.send({message: `\n🏙 [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator}) +${upModes}\n✅ CS: ${map.diff_size}\n👁‍🗨 OD: ${map.diff_overall}\n💣 AR: ${map.diff_approach}\n💭 HP: ${map.diff_drain}\n🌑 Combo: ${map.max_combo}x, Playcount: ${map.playcount}, Passcount: ${map.passcount}\n🐊 75%: ${Number(acc75.value).toFixed(1)} pp | 85%: ${Number(acc85.value).toFixed(1)} pp | 90%: ${Number(acc90.value).toFixed(1)} pp | 95%: ${Number(acc95.value).toFixed(1)} pp | 97%: ${Number(acc97.value).toFixed(1)} pp | 98%: ${Number(acc98.value).toFixed(1)} pp | 100%: ${Number(acc100.value).toFixed(1)} pp`})
                return message.send({message: `\n🏙 [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator}) +NoMod\n✅ CS: ${map.diff_size}\n👁‍🗨 OD: ${map.diff_overall}\n💣 AR: ${map.diff_approach}\n💭 HP: ${map.diff_drain}\n🌑 Combo: ${map.max_combo}x, Playcount: ${map.playcount}, Passcount: ${map.passcount}\n🐊 75%: ${Number(acc75.value).toFixed(1)} pp | 85%: ${Number(acc85.value).toFixed(1)} pp | 90%: ${Number(acc90.value).toFixed(1)} pp | 95%: ${Number(acc95.value).toFixed(1)} pp | 97%: ${Number(acc97.value).toFixed(1)} pp | 98%: ${Number(acc98.value).toFixed(1)} pp | 100%: ${Number(acc100.value).toFixed(1)} pp`})
            }
        }
    }
    let req = await prequest(`https://osu.ppy.sh/api/get_beatmaps?k=e134658997767422c065df097a28a03362abd99f&b=${message.args[5]}`);

    if(req.length === 0) return message.send(`не найдено карт по данной ссылке!`);
    let map = req[0];
    if(map.approved !== "1") {
        let state = map.approved;
        state = state.replace(/-2/, "Заброшенная (Graveyard)")
        state = state.replace(/-1/, "В разработке (WIP)")
        state = state.replace(/0/, "Ожидающая (Pending)")
        state = state.replace(/1/, "Рейтинговая (Ranked)")
        state = state.replace(/2/, "Одобренная (Approved)")
        state = state.replace(/3/, "Квалифицированная (Qualified)")
        state = state.replace(/4/, "Любимая (Loved)")
        return message.send({message: `\n🏙 [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator})\n✅ CS: ${map.diff_size}\n👁‍🗨 OD: ${map.diff_overall}\n💣 AR: ${map.diff_approach}\n💭 HP: ${map.diff_drain}\n🌑 Combo: ${map.max_combo}x, Playcount: ${map.playcount}, Passcount: ${map.passcount}`})
    } else {

        let score;
        let upModes = ``;
        if(!message.args[6]) score = await prequest(`https://api.tillerino.org/beatmapinfo?k=a86928375678416d9a99d9a4f019515a&beatmapid=${message.args[5]}`);
        let int = 0;
        if(message.args[6] && utils.isInteger(Number(message.args[6].length) / 2)) {
            let mods = message.args[6].split(/(?=(?:..)*$)/);
            mods.map((item) => {
                if(modes[item.toUpperCase()]) {
                    int += modes[item.toUpperCase()];
                    if(!upModes.includes(item.toUpperCase())) upModes += `${item.toUpperCase()}`
                }
            });
            score = await prequest(`https://api.tillerino.org/beatmapinfo?k=a86928375678416d9a99d9a4f019515a&beatmapid=${message.args[5]}&mods=${int}`);
        } else {
            score = await prequest(`https://api.tillerino.org/beatmapinfo?k=a86928375678416d9a99d9a4f019515a&beatmapid=${message.args[5]}`);
        }
        score = score.ppForAcc.entry;
        let acc98 = score.find(x => x.key === 0.98);
        let acc75 = score.find(x => x.key === 0.75);
        let acc85 = score.find(x => x.key === 0.85);
        let acc90 = score.find(x => x.key === 0.90);
        let acc95 = score.find(x => x.key === 0.90);
        let acc97 = score.find(x => x.key === 0.97);
        let acc100 = score.find(x => x.key === 1);
        let state = map.approved;
        state = state.replace(/-2/, "Заброшенная (Graveyard)")
        state = state.replace(/-1/, "В разработке (WIP)")
        state = state.replace(/0/, "Ожидающая (Pending)")
        state = state.replace(/1/, "Рейтинговая (Ranked)")
        state = state.replace(/2/, "Одобренная (Approved)")
        state = state.replace(/3/, "Квалифицированная (Qualified)")
        state = state.replace(/4/, "Любимая (Loved)");
        if(int > 0) return message.send({message: `\n🏙 [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator}) +${upModes}\n✅ CS: ${map.diff_size}\n👁‍🗨 OD: ${map.diff_overall}\n💣 AR: ${map.diff_approach}\n💭 HP: ${map.diff_drain}\n🌑 Combo: ${map.max_combo}x, Playcount: ${map.playcount}, Passcount: ${map.passcount}\n🐊 75%: ${Number(acc75.value).toFixed(1)} pp | 85%: ${Number(acc85.value).toFixed(1)} pp | 90%: ${Number(acc90.value).toFixed(1)} pp | 95%: ${Number(acc95.value).toFixed(1)} pp | 97%: ${Number(acc97.value).toFixed(1)} pp | 98%: ${Number(acc98.value).toFixed(1)} pp | 100%: ${Number(acc100.value).toFixed(1)} pp`})
        return message.send({message: `\n🏙 [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator}) +NoMod\n✅ CS: ${map.diff_size}\n👁‍🗨 OD: ${map.diff_overall}\n💣 AR: ${map.diff_approach}\n💭 HP: ${map.diff_drain}\n🌑 Combo: ${map.max_combo}x, Playcount: ${map.playcount}, Passcount: ${map.passcount}\n🐊 75%: ${Number(acc75.value).toFixed(1)} pp | 85%: ${Number(acc85.value).toFixed(1)} pp | 90%: ${Number(acc90.value).toFixed(1)} pp | 95%: ${Number(acc95.value).toFixed(1)} pp | 97%: ${Number(acc97.value).toFixed(1)} pp | 98%: ${Number(acc98.value).toFixed(1)} pp | 100%: ${Number(acc100.value).toFixed(1)} pp`})
    }
});
    hearManager.hear(/^(?:профиль)$/i, async (message) => {
    message.args = message.$match;
    if(!message.user.osu) return message.send(`К вашему профилю не привязан аккаунт в OSU! Привяжите с помощью команды: Привязать`)
    let req = await prequest(`https://osu.ppy.sh/api/get_user?k=e134658997767422c065df097a28a03362abd99f&u=${encodeURIComponent(message.user.osu.user.nickname)}&m=${message.user.osu.user.mode}`);
    req = req[0];
    if(!req) return message.send(`Пользователь ${message.user.osu.user.nickname} не найден! (Возможно указан другой мод)`);
    if(req.playcount && req.playcount === null) return message.send(`Пользователь ${message.user.osu.user.nickname} не найден в базе. (Возможно указан другой мод)`);
    return message.send(`✏ Ник: ${req.username}\n💻 ID: ${req.user_id}\n🌍 Страна: ${req.country}\n💡 Находится на #${req.pp_rank} по миру и на #${req.pp_country_rank} по стране\n📍 Всего PP: ${Number(req.pp_raw).toFixed(2)}\n🏹 Аккуратность: ${Number(req.accuracy).toFixed(2)}%\n📘 Всего x300: ${req.count300}\n📗 Всего x100: ${req.count100}\n📙 Всего x50: ${req.count50}\n✨ Уровень: ${Number(req.level).toFixed(2)}/100\n🎸 Количество игр: ${req.playcount}\n🐈 Играет с: ${req.join_date}\n🧭 Времени в игре: ${(Math.ceil(Number(req.total_seconds_played)/60/60) === 0) ? `` : ` ${Math.floor(Number(req.total_seconds_played)/60/60)}ч`} ${(Math.ceil(Number(req.total_seconds_played)/60/60) === 0) ? ` ${Math.floor(Number(req.total_seconds_played)/60)}м` : ``}`)
});
    const modes = {
        'NoMod': 0,
        'NF': 1,
        'EZ': 2,
        'HD': 8,
        'HR': 16,
        'SD': 32,
        'DT': 64,
        'RX': 128,
        'HT': 526,
        'NC': 576,
        'FL': 1024
    }
const modeInfo = (number) => {
    number = Number(number);
    if(number === 0) return 'NoMod';
    if(number === 88) return '+HDDTHR';
    if(number === 89) return '+NFHDDTHR';
    if(number === 72) return '+HDDT';
    if(number === 73) return '+NFHDDT';
    if(number === 584) return '+HDNC';
    if(number === 585) return '+NFHDNC';
    if(number === 24) return '+HDHR';
    if(number === 25) return '+NFHDHR';
    if(number === 1) return '+NF';
    if(number === 2) return '+EZ';
    if(number === 8) return '+HD';
    if(number === 9) return '+NFHD';
    if(number === 16) return '+HR';
    if(number === 17) return '+NFHR';
    if(number === 32) return '+SD';
    if(number === 64) return '+DT';
    if(number === 65) return '+NFDT';
    if(number === 128) return '+RX';
    if(number === 526) return '+HT';
    if(number === 576) return '+NC';
    if(number === 1024) return '+FL';
    return number;
}
    hearManager.hear(/^(?:обновления|обнови|новое)$/i, async (message) => {
    message.args = message.$match;
    if(!message.user.osu) return message.send(`К вашему профилю не привязан аккаунт в OSU! Привяжите с помощью команды: Привязать`)
    let req = await prequest(`https://ameobea.me/osutrack/api/get_changes.php?mode=${message.user.osu.user.mode}&user=${encodeURIComponent(message.user.osu.user.nickname)}`);
    if(!req) return message.send(`Пользователь ${message.user.osu.user.mode} не найден!`);
    if(req.exists && req.exists === "false") return message.send(`Пользователь ${message.user.osu.user.mode} не найден в базе. (Возможно указан другой мод)`);
    let text = ``;
    if(req.playcount === 0 && req.total_score === 0) return message.send(`На аккаунте ${message.user.osu.user.nickname} не произошло никаких изменений!`);
    if(req.newhs.length === 0) text += `Не было поставлено топ скоров...`;
    if(req.newhs.length > 0) {
        await Promise.all(req.newhs.map(async (item) => {
            let rq = await prequest(`https://osu.ppy.sh/api/get_beatmaps?k=e134658997767422c065df097a28a03362abd99f&b=${item.beatmap_id}`);
            if(rq.length === 0) text += `🎇 Карта: Не найдено\n`;
            if(rq.length > 0) {
                let map = rq[0];
                let state = map.approved;
                state = state.replace(/-2/, "Заброшенная (Graveyard)")
                state = state.replace(/-1/, "В разработке (WIP)")
                state = state.replace(/0/, "Ожидающая (Pending)")
                state = state.replace(/1/, "Рейтинговая (Ranked)")
                state = state.replace(/2/, "Одобренная (Approved)")
                state = state.replace(/3/, "Квалифицированная (Qualified)")
                state = state.replace(/4/, "Любимая (Loved)")
                text += `🎇 Карта: [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator})\n`
            }
            text += `✨ PP: ${Number(item.pp).toFixed(2)}\n`
            text += `🏹 Аккуратность: ${item.rank} ранг | x300: ${item.count300} | x100: ${item.count100} | x50: ${item.count50} | ❌ ${item.countmiss}\n`;
            text += `💡 Включенные моды: ${modeInfo(item.enabled_mods)}\n`;
            text += `🛎 Комбо: x${item.maxcombo} | Очков: ${item.score}\n`;
            text += `⏱ Дата: x${item.date}\n\n`;
        }));
    }
    req.pp_rank = Number(req.pp_rank) - (Number(req.pp_rank) * 2);
    return message.send(`На аккаунте произошли некоторые изменения: \n💽 Количество игр: +${req.playcount}\n🖥 Ранг: ${req.pp_rank}\n✨ PP: ${Number(req.pp_raw).toFixed(2)}\n📍 Аккуратность: ${Number(req.accuracy).toFixed(2)}\n\n${text}`)
});
    hearManager.hear(/^(?:отвязать|удалить)$/i, async (message) => {
    message.args = message.$match;
    if(!message.user.osu) return message.send(`К вашему профилю не привязан аккаунт в OSU! Привяжите с помощью команды: Привязать`);
    await users.updateOne({id: message.user.id}, {$set: {osu: null}});
    return message.send(`От вашего профиля был отвязан аккаунт: ${message.user.osu.user}`)
});
    hearManager.hear(/^(?:мод)\s([0-9]+)$/i, async (message) => {
        message.args = message.$match;
        if(!message.user.osu) return message.send(`К вашему профилю не привязан аккаунт в OSU! Привяжите с помощью команды: Привязать`);
        let mode = `Standart`;
        console.log(message.args)
        if(!Number(message.args[1])) return;
        if(Number(message.args[1]) > 4) return;
        if(Number(message.args[1]) < 1) return;
        message.args[1] = Number(message.args[1]) - 1;
        if(message.args[1] === 1) mode = `Taiko`
        if(message.args[1] === 2) mode = `Catch`
        if(message.args[1] === 3) mode = `Mania`
        await users.updateOne({id: message.user.id}, {$set: {[`osu.user.mode`]: message.args[1]}});

        return message.send(`Вы успешно установили мод игры на ${mode}`);
    });
    hearManager.hear(/^(?:последний|посл|rs|recent)$/i, async (message) => {
        message.args = message.$match;
        let req = await prequest(`https://osu.ppy.sh/api/get_user_recent?k=e134658997767422c065df097a28a03362abd99f&u=${encodeURIComponent(message.user.osu.user.nickname)}&m=${message.user.osu.user.mode}`);
        if(req.length === 0) return message.send(`Игр пользователя ${message.user.osu.user.nickname} за последние 24 часа не найдено`);

        let item = req[0];
        let rq = await prequest(`https://osu.ppy.sh/api/get_beatmaps?k=e134658997767422c065df097a28a03362abd99f&b=${item.beatmap_id}`);
        let text = ``;
        if(rq.length === 0) text += `🎇 Карта: Не найдено (?)\n`;
        if(rq.length > 0) {
            let map = rq[0];
            let state = map.approved;
            state = state.replace(/-2/, "Заброшенная (Graveyard)")
            state = state.replace(/-1/, "В разработке (WIP)")
            state = state.replace(/0/, "Ожидающая (Pending)")
            state = state.replace(/1/, "Рейтинговая (Ranked)")
            state = state.replace(/2/, "Одобренная (Approved)")
            state = state.replace(/3/, "Квалифицированная (Qualified)")
            state = state.replace(/4/, "Любимая (Loved)")
            text += `🎇 Карта: [${state}] ${map.artist} - ${map.title} ${Number(map.difficultyrating).toFixed(2)} star ${map.version} (by ${map.creator})\n`
        }
        text += `🏹 Аккуратность: ${item.rank} ранг | x300: ${item.count300} | x100: ${item.count100} | x50: ${item.count50} | ❌ ${item.countmiss}\n`;
        text += `💡 Включенные моды: ${modeInfo(item.enabled_mods)}\n`;
        text += `🛎 Комбо: x${item.maxcombo} | Очков: ${item.score}\n`;
        text += `⏱ Дата: x${item.date}\n\n`;
        return message.send(`Информация о самой последней игре:\n\n${text}`)
    });
    vk.updates.start().catch(console.error);
});
