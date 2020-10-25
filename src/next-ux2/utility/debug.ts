import { Trace } from './trace';
import { TypeUtility } from './type-utility';

export class Debug {
    public static assertFail(category: string, message: string) {
        Trace.logError(message, category);
        debugger;
    }

    public static assert(condition: boolean, category: string, message: string) {
        if (!condition) {
            Trace.logError(message, category);
            debugger;
        }
    }

    public static assertIsNull(value: Object, category: string, message: string) {
        if (!TypeUtility.isNull(value)) {
            Trace.logError(message, category);
            debugger;
        }
    }
    
    public static assertIsNotNull(value: Object, category: string, message: string) {
        if (TypeUtility.isNull(value)) {
            Trace.logError(message, category);
            debugger;
        }
    }

    public static createErrorPayload(name: string, message: string, description = ''): {
        name: string,
        message: string,
        description?: string
    } {
        return {
            name: name,
            message: message,
            description: description,
        };
    }

    public static wrapError(errorInfo: any, errorName?: string): Error {
        if (!errorInfo) {
            return {
                name: 'Developer Bug',
                message: 'ErrorWrapper used with a null errorInfo argument.',
                stack: ''
            }
        }

        let err: Error = <any>null;
        if (errorInfo instanceof Error) {
            err = {
                name: errorInfo.name,
                message: errorInfo.message,
                stack: errorInfo.stack
            }
        }
        else if (errorInfo.message) {
            let errorNameToUse = 'Unknown Error';

            if (errorInfo.name && !errorName) {
                errorNameToUse = errorInfo.name 
            }
            else if (errorName) {
                errorNameToUse = errorName;
            }

            err = {
                name: errorNameToUse,
                message: errorInfo.message,
                stack: ''
            }
        }
        else if (errorInfo.name) {
            err = {
                name: errorInfo.name,
                message: '',
                stack: ''
            }
        }
        else if (typeof(errorInfo) === 'string') {
            err = {
                name: 'Error',
                message: errorInfo,
                stack: ''
            }
        }
        else {
            if (!errorName) {
                errorName = 'Unknown Error';
            }

            let message = errorInfo.toString();
            try {
                message = JSON.stringify(errorInfo);
            }
            catch (e) {
                // ignore
            }
            err = {
                name: errorName,
                message: message,
                stack: ''
            }
        }

        return err;
    }
}