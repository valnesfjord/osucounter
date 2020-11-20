function isInteger(num) {
    return (num ^ 0) === num;
}
const utils = {
    gi: (int) => {
        int = int.toString();

        let text = ``;
        for (let i = 0; i < int.length; i++)
        {
            text += `${int[i]}&#8419;`;
        }

        return text;
    },
    random: (x, y) => {
        return y ? Math.round(Math.random() * (y - x)) + x : Math.round(Math.random() * x);
    },
    isInteger: (num: number) => {
    return (num ^ 0) === num;
}
}
export default utils;
