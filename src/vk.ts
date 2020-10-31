import { VK } from 'vk-io';
import config from "./hideconfig.json";


const vk = new VK({
    token: '.',
    pollingGroupId: 199518682,
});

export default vk;
