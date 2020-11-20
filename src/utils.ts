
const utils = {
    gi: (int: any) => {
        int = int.toString();

        let text = ``;
        for (let i = 0; i < int.length; i++)
        {
            text += `${int[i]}&#8419;`;
        }

        return text;
    },
    isInteger: (num: number) => {
    return (num ^ 0) === num;
    }
}
export default utils;
