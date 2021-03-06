import { StringUtility, GUID } from '@/next-ux2/utility/';

export class ObjectHelper { 
    // Copies the basic types (number, string, booleans) from updated to original.
    // Perf improvement when updating an object and UX binding, since the
    // lists are typically bound to other UI elements, and if nothing has not
    // changed in the list, then get a huge perf hit when just updating one
    // field on the parent object if the entire object is updated.
    // (Especially when using the clone and repalce object method that rebinds everyting.)
    //
    // NOTE: Field names with underscores (_) are ignored, since these are
    // considered special properties that are generated by business logic
    // after data is set.
    //
    // Also, child objects are generally more complex and handle its own updating.
    static copyPrimativeTypes(original:any, updated: any) {
        let keys = Object.keys(updated);
        keys.forEach((key) => {
            // fields starting with udnerscores are considred special and not copied,
            // and only primitive typed (string, number, boolean) are copied
            let propertyType = typeof updated[key];
            if (!key.startsWith('_') && 
                    ((propertyType === 'string') || (propertyType === 'number') || (propertyType === 'boolean'))) {

                original[key] = updated[key];
            }
        });
    }

    static clone(data: any): any {
        return JSON.parse(JSON.stringify(data));
    }

    static isDirty(originalData: any, updatedData: any) {
        return JSON.stringify(originalData) !== JSON.stringify(updatedData);
    }

    // Returns a data transfer object free of extraneous properites
    static cleanDto(data: any): any {
        let returnValue: any = Object.create({});
        let fieldNames = Object.getOwnPropertyNames(data);
        
        for (let i = 0; i < fieldNames.length; i++) {
            let propName = fieldNames[i];
            
            // underscores are used for databinding purposes
            // or other state based values not pertinent to the
            // actual data
            if (propName.startsWith('_')) {
                continue
            }

            let propType = typeof data[propName];

            if (propType === 'object' && !Array.isArray(data[propName])) {
                // if an object, then clean the data of that object;
                if (data[propName] === null) {
                    returnValue[propName] = null;
                }
                else {
                    returnValue[propName] = ObjectHelper.cleanDto(data[propName]);
                }
            }
            else if (Array.isArray(data[propName])) {
                // transfer each item of the array8
                returnValue[propName] = [];

                for (let i=0; i < data[propName].length; i++) {
                    let arrayItem = data[propName][i];
                    let arrayItemType = typeof arrayItem;
                    if (arrayItemType === 'object' && !Array.isArray(arrayItem)) {
                        // if an object, then clean the data of that object;
                        returnValue[propName].push(ObjectHelper.cleanDto(arrayItem));
                    }
                    else if (Array.isArray(arrayItem)) {
                        if ((arrayItem.length === 0) || (typeof arrayItem[0] !== 'object')) {
                            returnValue[propName] = JSON.parse(JSON.stringify(arrayItem));
                        }
                        else {
                            throw new Error('cleanDto does not support an array of object arrays');
                        }
                    }
                    else {
                        returnValue[propName].push(arrayItem);
                    }
                }
            }
            else {
                returnValue[propName] = data[propName];
            }
            
        }
        
        return returnValue;
    }

    // Change id and parent id of all child objects and arrays of child objects
    // note, this deletes any field names that start with an underscore except
    // for the root level object.
    //
    // The passed in data is MUTATED, and data MUST be an object.
    static resetId(data: any, parentId: string) {
        let fieldNames = Object.getOwnPropertyNames(data);

        // if the object has an ID property, then set the id and parentId;
        // this needs to be done before any of the child objects are processed
        if (data.id !== null && typeof(data.id) !== 'undefined') {
            data.id = GUID.create();
        }

        if (!StringUtility.isNullOrEmpty(parentId)) {
            data.parentId = parentId;
        }
        
        for (let i = 0; i < fieldNames.length; i++) {
            let propName = fieldNames[i];
            
            // underscores are used for databinding purposes
            // or other state based values not pertinent to the
            // actual data; though, keep the mongodb _id
            if (propName.startsWith('_')) {
                delete data[propName];
                continue;
            }

            let propType = typeof data[propName];
            if (propType === 'object' && !Array.isArray(data[propName])) {
                // if an object, then clean the data of that object;
                if (data[propName] !== null) {
                    ObjectHelper.resetId(data[propName], data.id);
                }
            }
            else if (Array.isArray(data[propName])) {
                for (let i=0; i < data[propName].length; i++) {
                    let arrayItem = data[propName][i];
                    let arrayItemType = typeof arrayItem;

                    if (arrayItemType === 'object' && !Array.isArray(arrayItem)) {
                        if (arrayItem.id !== null && typeof(arrayItem.id) !== 'undefined') {
                            arrayItem.id = GUID.create();
                        }

                        if (!StringUtility.isNullOrEmpty(parentId)) {
                            arrayItem.parentId = parentId;
                        }
                        // if an object, then clean the data of that object;
                        ObjectHelper.resetId(arrayItem, arrayItem.id);
                    }
                    else if (Array.isArray(arrayItem)) {
                        throw new Error('resetId does not support an array of arrays');
                    }
                }
            }
        }
    }

    public static isObjectDirty(original: any, compare: any, isLastModifiedUsed = false) {
        if (isLastModifiedUsed && (original.lastModified !== compare.lastModified)) {
            return true;
        }
        else {
            let originalCleaned = ObjectHelper.cleanDto(original);
            let compareCleaned = ObjectHelper.cleanDto(compare);
            delete originalCleaned.lastModified;
            delete compareCleaned.lastModified;
            return JSON.stringify(originalCleaned) !== JSON.stringify(compareCleaned);
        }
    }
}