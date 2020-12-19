export class Validator {
    public static isEmail(value: string): boolean {
        let regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regExp.test(value);
    }

    public static isPhoneNumber(value: string, isAreaCodeRequired=false): boolean {
        //let regExp = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;
        let regExp =/([+]?\d{1,2}[.-\s]?)?(\(?\d{3}\)?[.-\s]?)?(\d{3}[.-\s]?)\d{4}/g;
        if (isAreaCodeRequired) {
            regExp =/([+]?\d{1,2}[.-\s]?)?(\(?\d{3}\)?[.-\s]?)(\d{3}[.-\s]?)\d{4}/g;
        }

        return regExp.test(value);
    }

    public static isNumber(value: string): boolean {
        var numberRegEx = /^-{0,1}\d*\.{0,1}\d+$/;
        return numberRegEx.test(value);
    }

    public static isWholeNumber(value: string): boolean {
        var numberRegEx = /^\d+$/
        return numberRegEx.test(value);
    }

    public static isPrice(value: string): boolean {
        var priceRegex = /^[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?$/;
        return priceRegex.test(value);
    }
}