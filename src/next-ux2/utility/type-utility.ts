export class TypeUtility {
    public static isNull(value: any): boolean {
        if ((value === null) || (typeof value === 'undefined')) {
            return true;
        }
        else {
            return false;
        }
    }
}