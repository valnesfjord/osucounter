import vk from './src/vk';
import { HearManager } from '@vk-io/hear'
import { MongoClient } from 'mongodb';
const hearManager = new HearManager();
const client = new MongoClient('mongodb://localhost:27017/osucounter', { useUnifiedTopology: true });
client.connect((err, ct) => { // Database connect callback
    if(err) {
        console.log(err);
    }
    let db = ct.db("osucounter");
    let users = db.collection("users");
vk.updates.on('message_new', async(message, next) => {
    message.user = await users.findOne({id: message.senderId});
    if(!message.user) {
        await users.insertOne({
            id: message.senderId,
            displayName: '',
            osu: null,
        });
        return message.send(`Вы успешно зарегистрировались!\nПривяжите Ваш osu! аккаунт через команду: Привязка`);
    };
    message.answer = (text, params) => (
        message.send(`${message.user.displayName}, ${text}`, params)
    );
return next();
});
    vk.updates.on('message_new', hearManager.middleware);
    hearManager.hear(/^(?:привязка)$/i, async (message) => {
        vk.api.utils.getShortLink({
            url: `https://osu.ppy.sh/oauth/authorize?client_id=3098&redirect_uri=https://defbot.design/osu&response_type=code&scope=identify%20friends.read%20public&state=${message.senderId}`,
            private: 0
        }).then(async function (response) {
            message.send(`🚀 Привет! URL для привязки твоего аккаунта OSU: \n${response.short_url}`);
        })
    });
vk.updates.start().catch(console.error);
});
