"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vk_1 = __importDefault(require("./src/vk"));
const hear_1 = require("@vk-io/hear");
const mongodb_1 = require("mongodb");
const hearManager = new hear_1.HearManager();
const client = new mongodb_1.MongoClient('mongodb://localhost:27017/osucounter', { useUnifiedTopology: true });
client.connect((err, ct) => {
    if (err) {
        console.log(err);
    }
    let db = ct.db("osucounter");
    let users = db.collection("users");
    vk_1.default.updates.on('message_new', async (message, next) => {
        message.user = await users.findOne({ id: message.senderId });
        if (!message.user) {
            await users.insertOne({
                id: message.senderId,
                displayName: '',
                osu: null,
            });
            return message.send(`Вы успешно зарегистрировались!\nПривяжите Ваш osu! аккаунт через команду: Привязка`);
        }
        ;
        message.answer = (text, params) => (message.send(`${message.user.displayName}, ${text}`, params));
        return next();
    });
    vk_1.default.updates.on('message_new', hearManager.middleware);
    hearManager.hear(/^(?:привязка)$/i, async (message) => {
        vk_1.default.api.utils.getShortLink({
            url: `https://osu.ppy.sh/oauth/authorize?client_id=3098&redirect_uri=https://defbot.design/osu&response_type=code&scope=identify%20friends.read%20public&state=${message.senderId}`,
            private: 0
        }).then(async function (response) {
            message.send(`🚀 Привет! URL для привязки твоего аккаунта OSU: \n${response.short_url}`);
        });
    });
    vk_1.default.updates.start().catch(console.error);
});
//# sourceMappingURL=index.js.map