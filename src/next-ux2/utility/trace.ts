import { DateUtility } from './date-utility';

export class Trace {

    public static getLogMessageTimestampHeading(): string {
        let currentDate = new Date();
        let timeStampString = currentDate.getTime() + ' ' + 
        DateUtility.toBasicDateFormat(currentDate, true) + ' ' +
        DateUtility.toBasicTimeFormat(currentDate, true);

        // set the width
        let width = 33;
        let spacesToAdd = width - timeStampString.length;
        for (let i =0; i < spacesToAdd; i++) {
            timeStampString += ' ';
        }

        return timeStampString;
    }

    public static logError(message: string, category = '') {
        console.log('ERROR     ' + Trace.getLogMessageTimestampHeading() + 
            category + '  ' + message);
    }

    public static logWarning(message: string, category = '') {
        console.log('WARNING   ' + Trace.getLogMessageTimestampHeading() + 
            category + '  ' + message);
    }

    public static logInfo(message: string, category = '') {
        console.log('INFO      ' + Trace.getLogMessageTimestampHeading() + 
        category + '  ' + message);
    }
}