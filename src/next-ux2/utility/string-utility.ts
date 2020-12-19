import { TypeUtility } from './type-utility';
import { NumUtility } from './num-utility';

export class StringUtility {
    public static isNullOrEmpty(value: string | undefined): boolean {
        if (TypeUtility.isNull(value)) {
            return true;
        }
        
        if (value?.trim() === '') {
            return true;
        }
        else {
            return false;
        }
    }

    public static isEmail(value: string): boolean {
        let regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regExp.test(value);
    }

    public static isNumber(value: string): boolean {
        var numberRegEx = /^-{0,1}\d*\.{0,1}\d+$/;
        return numberRegEx.test(value);
    }

    public static isWholeNumber(value: string): boolean {
        var numberRegEx = /^[-]?\d+$/
        return numberRegEx.test(value);
    }

    public static isPrice(value: string): boolean {
        var priceRegex = /^[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?$/;
        return priceRegex.test(value);
    }

    public static toHash(value: string): number {
        let hash = 0;
        
        for (let i = 0; i < value.length; i++) {
            let char = value.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash;
        }

        return Math.abs(hash);
    }

    public static padRight(value:string, width: number): string {
        let returnValue = value + '                                                             ';
        return returnValue.substr(0, width);
    }

    public static toCsv(arrayOfRows:Array<Array<any>>): string {
        let returnValue ='';
        // Fields with embedded commas or double-quote characters must be quoted.
        // 1997,Ford,E350,"Super, luxurious truck"
        //
        // Each of the embedded double-quote characters must be represented by a pair of double-quote characters.
        // 1997,Ford,E350,"Super, ""luxurious"" truck"
        arrayOfRows.forEach((rowItem) => {
            rowItem.forEach((cell, index) => {
                if (typeof(cell) === 'string') {
                    let normalziedCell = (<string>cell).replace(/"/g, '""');
                    returnValue += '"' + normalziedCell + '"';
                }
                else {
                    returnValue += cell.toString();
                }

                if (index !== (rowItem.length-1)) {
                    returnValue += ',';
                }
            });

            returnValue += '\r\n';
        });


        return returnValue;
    }

    public static toPriceText(value: number): string {
        if ((typeof (value) !== 'undefined') && (value !== null)) {
            value = NumUtility.toMoney(value);
            var totalPaidText = value + '';
            if (totalPaidText.indexOf('.') < 0) {
                totalPaidText = totalPaidText + '.00';
            }
            else {
                totalPaidText = (totalPaidText + '0').substring(0, totalPaidText.indexOf('.') + 3);
            }

            return totalPaidText
        }

        return '';
    }

    public static getPhoneNumberData(phoneNumber: string): {countryCode: number, areaCode: number, localNumber: number } {
        let returnValue= {
            countryCode: 1,
            areaCode: 0,
            localNumber: 0
        };

        let digits = phoneNumber.replace(/\D+/g, '');
        if (digits.length >= 7) {
            // work backwords, there are 7 digits for a local number
            returnValue.localNumber = parseInt(digits.substr(digits.length - 7));
        }

        if (digits.length >= 10) {
            returnValue.areaCode = parseInt(digits.substr(digits.length - 10, 3));
        }

        if (digits.length > 10) {
            returnValue.countryCode = parseInt(digits.substr(0, digits.length - 10));
        }

        return returnValue;
    }

    public static toInt16Array(text: string): Int16Array {
        let returnValue = new Int16Array(text.length);
        for (let i = 0; i < text.length; i++) {
            returnValue[i] = text.charCodeAt(i);
        }

        return returnValue;
    }

    public static convertBufferToBase64(buffer: ArrayBuffer): string {
        let base64 = '';
        const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        const bytes = new Uint8Array(buffer);
        const byteLength = bytes.byteLength;
        const byteRemainder = byteLength % 3;
        const mainLength = byteLength - byteRemainder;

        let a;
        let b;
        let c;
        let d;
        let chunk;

        // Main loop deals with bytes in chunks of 3
        for (let i = 0; i < mainLength; i += 3) {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

            // Use bitmasks to extract 6-bit segments from the triplet
            a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
            c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
            d = chunk & 63;        // 63       = 2^6 - 1

            // Convert the raw binary segments to the appropriate ASCII encoding
            base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder === 1) {
            chunk = bytes[mainLength];

            a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

            // Set the 4 least significant bits to zero
            b = (chunk & 3) << 4; // 3   = 2^2 - 1

            base64 += `${encodings[a]}${encodings[b]}==`;
        } else if (byteRemainder === 2) {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

            a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

            // Set the 2 least significant bits to zero
            c = (chunk & 15) << 2; // 15    = 2^4 - 1

            base64 += `${encodings[a]}${encodings[b]}${encodings[c]}=`;
        }

        return base64;   
    }

}