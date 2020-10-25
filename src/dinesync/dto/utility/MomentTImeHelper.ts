import moment from 'moment';

export interface IMomentObjectFormat {
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number
}

export class MomentTimeHelper {
    public static getMomentDateFormatFromUTC(date: Date, seconds=0, msValue=0) {
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

    // dateInfo is any acceptable moement date format: javascript Date, timestamp, or IMomentObjectFormat
    public static getDateWithTimezone(dateInfo: any, timezone: string): moment.Moment {
        return moment.tz(dateInfo, timezone);
    }

    static convertToOfficalTzName(friendlyName: string): string {
        let returnValue = friendlyName;

        switch (friendlyName.toLowerCase()) {
            case 'pacific':
                returnValue = 'America/Los_Angeles';
                break;

            case 'phoneix':
                returnValue = 'America/Phoenix';
                break;

            case 'mountain':
                returnValue = 'America/Denver';
                break;

            case 'central':
                returnValue = 'America/Chicago';
                break;

            case 'eastern':
                returnValue = 'America/New_York';
                break;
            
            break;
        }
        return returnValue;
    }

    static friendlyTimeZoneList = ['Pacific', 'Phoenix', 'Mountain', 'Central', 'Eastern'];
    
}