"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = {
    gi: (int) => {
        int = int.toString();
        let text = ``;
        for (let i = 0; i < int.length; i++) {
            text += `${int[i]}&#8419;`;
        }
        return text;
    },
    isInteger: (num) => {
        return (num ^ 0) === num;
    }
};
exports.default = utils;
//# sourceMappingURL=utils.js.map