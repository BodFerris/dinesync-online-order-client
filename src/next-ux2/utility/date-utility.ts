export class DateUtility {
    public static readonly msInHour = 1000 * 60 * 60;
    public static readonly msInWeek = DateUtility.msInHour * 24 * 7;
    public static readonly msInYear = 31536000000;

    public static getMonthNameFromNumber(value: number): string {
        switch (value) {
            case 0:
                return 'Jan';
            case 1:
                return 'Feb';
            case 2:
                return 'Mar';
            case 3:
                return 'Apr';
            case 4:
                return 'May';
            case 5:
                return 'Jun';
            case 6:
                return 'Jul';
            case 7:
                return 'Aug';
            case 8:
                return 'Sep';
            case 9:
                return 'Oct';
            case 10:
                return 'Nov';
            case 11:
                return 'Dec';
            default:
                throw new Error('Invalid number for month: ' + value.toString());
        }
    }

    public static getFullMonthNameFromAbbreviation(value: string): string {
        value = value.toLowerCase();
        switch (value) {
            case 'jan':
                return 'January';
            case 'feb':
                return 'Febuary';
            case 'mar':
                return 'March';
            case 'apr':
                return 'April';
            case 'may':
                return 'May';
            case 'jun':
                return 'June';
            case 'jul':
                return 'July';
            case 'aug':
                return 'August';
            case 'sep':
                return 'September';
            case 'oct':
                return 'October';
            case 'nov':
                return 'Novemeber';
            case 'dec':
                return 'December';
            default:
                throw new Error('Invalid abbreviation for month: ' + value);
        }
    }

    public static getDayOfWeekFromNumber(value: number): string {
        switch (value) {
            case 0:
                return 'Sun';
            case 1:
                return 'Mon';
            case 2:
                return 'Tue';
            case 3:
                return 'Wed';
            case 4:
                return 'Thu';
            case 5:
                return 'Fri';
            case 6:
                return 'Sat';
            default:
                throw new Error('Invalid number for day: ' + value.toString());
        }
    }

    public static getFullDayFromAbbreviation(value: string): string {
        value = value.toLowerCase();
        switch (value) {
            case 'sun':
                return 'Sunday';
            case 'mon':
                return 'Monday';
            case 'tue':
                return 'Tuesday';
            case 'wed':
                return 'Wednesday';
            case 'thu':
                return 'Thursday';
            case 'fri':
                return 'Friday';
            case 'sat':
                return 'Saturday';
            default:
                throw new Error('Invalid day abbreviation: ' + value);
        }
    }

    static getMondayRefDayOfWeekNumberFromJavscriptDay(day: number): number {
        return (day + 6) % 7;
    }

    static getFullDayFromJavascriptDayOfWeek(day: number): string {
        switch (day) {
            case 0:
                return 'Sunday';
            case 1:
                return 'Monday';
            case 2:
                return 'Tuesday';
            case 3:
                return 'Wednesday';
            case 4:
                return 'Thursday';
            case 5:
                return 'Friday';
            case 6:
                return 'Saturday';

            default:
                throw new Error('Invalid day argument: ' + day.toString());
        }
    }

    private static createFullDateText(date: Date): string {
        return DateUtility.toBasicDateFormat(date) + ' ' + DateUtility.toBasicTimeFormat(date);
    }


    public static toBasicDateFormat(date: Date, isLocal?: boolean): string {
        let dayOfMonth = (isLocal) ? date.getDate() : date.getUTCDate();
        let month = (isLocal) ? date.getMonth() : date.getUTCMonth();
        let fullYear = (isLocal) ? date.getFullYear() : date.getUTCFullYear();

        return dayOfMonth + ' ' + DateUtility.getMonthNameFromNumber(month) + ' ' + fullYear;
    }

    public static toBasicDayMonthFormat(date: Date, isLocal?: boolean): string {
        let dayOfMonth = (isLocal) ? date.getDate() : date.getUTCDate();
        let month = (isLocal) ? date.getMonth() : date.getUTCMonth();
        let fullYear = (isLocal) ? date.getFullYear() : date.getUTCFullYear();

        return dayOfMonth + ' ' + DateUtility.getMonthNameFromNumber(month);
    }

    public static toBasicTimeFormat(date: Date, isLocal?: boolean): string {
        let getMinutes = (n: number): string => { return (n < 10 ? '0' : '') + n.toString() };
        let h = (isLocal) ? date.getHours() : date.getUTCHours();
        let m = (isLocal) ? date.getMinutes() : date.getUTCMinutes();
        return (h % 12 || 12) + ':' + getMinutes(m) + ' ' + (h < 12 ? 'AM' : 'PM');
    }

    public static getInputTypeDateValue(date: Date, isLocal?: boolean) {
        // 2011-09-29
        let year = isLocal ? date.getFullYear().toString() : date.getUTCFullYear().toString();
        let month = isLocal ?  (date.getMonth() + 1).toString() : (date.getUTCMonth() + 1).toString();
        if (month.length === 1) month = '0' + month;
        let day = isLocal ? (date.getDate()).toString() : (date.getUTCDate()).toString();
        if (day.length === 1) day = '0' + day;


        return year + '-' + month + '-' + day;
    }

    public static getInputTypeTimeValue(date: Date, isLocal?: boolean) {
        let hours = isLocal ? date.getHours().toString() : date.getUTCHours().toString();
        if (hours.length === 1) hours = '0' + hours;

        let minutes = isLocal ? date.getMinutes().toString() :  date.getUTCMinutes().toString();
        if (minutes.length === 1) minutes = '0' + minutes;

        return hours + ':' + minutes;
    }

    public static mergeDateAndTime(date: Date, time: Date): Date {
        let utcTimeStamp = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
            time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), time.getUTCMilliseconds());
        
        let returnValue = new Date(utcTimeStamp);
        return returnValue;
    }

    // returns a local time based on the values of UTC. For exmpale,
    // if the utc horus is set to 6, then the local time hours will use 6
    public static createLocalTimeAndDateBasedOnUtcValues(utcTime: number) {
        let utcDate = new Date(utcTime);
        let localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds(), utcDate.getUTCMilliseconds());
        return localDate.getTime();

    }    

    static getMomentDateFormat(date: Date, seconds=0, msValue=0) {
        return { 
            year: date.getUTCFullYear(), 
            month: date.getUTCMonth(), 
            day: date.getUTCDate(), 
            hour: date.getUTCHours(), 
            minute: date.getUTCMinutes(), 
            second: seconds, 
            millisecond: msValue
        };
    }
}