export class NumUtility {
    public static isZero(value: number, tolerance?: number) {
        if (!tolerance) {
            tolerance = .0001;
        }

        return (Math.abs(value) <= tolerance);
    }

    public static toMoney(value: number): number {
        if ((value === null) || (typeof(value) === 'undefined') || isNaN(value)) {
            value = 0;
        }

        let returnValue = +(value + 0.001).toFixed(2);
        if (Math.abs(returnValue) < .004) {
            returnValue = 0;
        }

        return returnValue;
    }

    static getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    
}
