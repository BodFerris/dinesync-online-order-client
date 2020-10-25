import { MenuDTO } from './MenuDTO';
import { TableDTO } from './TableDTO';
import { IOrderCore, IOrderGroupCore } from './OrderDTO';
import { PosDeviceDTO } from './SystemData/PosDeviceDTO';

export interface IRestaurantCoreInfo {
    id: string;
    parentId: string;
    name: string;
    address1: string;
    address2: string;
}

export class RestaurantDTO implements IRestaurantCoreInfo {
    public id: string = '';
    public parentId: string = '';
    public name: string = '';
    public menuList: Array<MenuDTO> = [];
    public tableList: Array<TableDTO> = [];
    public tableLayoutSvg: string = '';
    public address1: string = '';
    public address2: string = '';
    public phoneNumber: string = '';
    public timezone: string = 'America/Los_Angeles';
    
    public lastModified: number = 0
    public typeName: string = 'RestaurantDTO';
}

export interface IOperationTime {
    id: string;
    parentId: string;
    dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    openTime: number;
    closeTime: number;
    typeName: string;
}

export class OperationTimeDTO implements IOperationTime {
    public id: string = '';
    public parentId: string = '';
    public dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' = 'Monday';
    public openTime: number = 0;
    public closeTime: number = 0;

    public typeName: string = 'OperationTimeDTO';
}

export interface IMenuOperationTime extends IOperationTime {
    isAvailable: boolean;
    useRestaurantOpenTime: boolean;
    useRestaurantCloseTime: boolean;
}

export class MenuOperationTimeDTO extends OperationTimeDTO implements IMenuOperationTime {
    public isAvailable: boolean = false;
    public useRestaurantOpenTime: boolean = false;
    public useRestaurantCloseTime: boolean = false;

    public typeName: string = 'MenuOperationTimeDTO';
}

export class OperationTimeExceptionDTO {
    public id: string = '';
    public parentId: string = '';
    public date: number = 0;
    public openTime: number = 0;
    public closeTime: number = 0;
    public message: string = '';

    public typeName: string = 'OperationTimeExceptionDTO';
}

export interface ICourse {
    id: string;
    parentId: string;
    position: number;
    name: string;
}

export class CourseDTO implements ICourse {
    public id: string = '';
    public parentId: string = '';
    public position: number = 0;
    public name: string = '';

    public typeName: string = 'CourseDTO';
}

export type PayPeriodType = 'period' | 'date' | '';
export interface IPayPeriod {
    periodUnitSkip: number;
    payPeriodType: PayPeriodType;
    data: string
}

export class PayPeriodDTO implements IPayPeriod {
    public id: string = '';
    public parentId: string = '';
    public periodUnitSkip: number = 0;
    public payPeriodType: PayPeriodType = '';
    public data: string = '';

    public typeName: string = 'PayPeriodDTO';
}

export type TimeRecordType = 'timePunch' | 'holiday' | 'vacation' | 'sickLeave' | 'pto' | 'break' | '';
export type TimeRecordCreatedByType = 'manual' | 'login' | '';
export interface IEmployeeTimeRecord {
    id: string;
    parentId: string;
    accountName: string;
    startTime: number;
    endTime: number;
    hourlyRate: number;
    recordType: TimeRecordType;
    isVoid: boolean;
    createdVia: TimeRecordCreatedByType;
    addedBy: string;
    voidedBy: string;
    notes: string;

    typeName: string
}

export class EmployeeTimeRecordDTO implements IEmployeeTimeRecord {
    public id: string = '';
    public parentId: string = '';
    public accountName: string = '';
    public startTime: number = 0;
    public endTime: number = 0;
    public hourlyRate: number = 0;
    public recordType: TimeRecordType = '';
    public isVoid: boolean = false;
    public createdVia: TimeRecordCreatedByType = '';
    public addedBy: string = '';
    public voidedBy: string = '';
    public notes: string = '';

    public typeName: string = 'EmployeeTimeRecordDTO';
}

export interface IEmployeeTimeAndTipDatum {
    accountName: string;
    month: number;
    day: number;
    date: number,
    totalHours: number;
    cashTipTotal: number;
    creditTipTotal: number;
    timeRecordList: Array<IEmployeeTimeRecord>;
}

export interface IEmployeeTimeAndTipGroupDatum {
    accountName: string;
    employeeTimeAndTipList: Array<IEmployeeTimeAndTipDatum>;
}

export interface IDataSearchBase {
    restaurantId: string;
    startTimestamp: number;
    endTimestamp: number;
}

// TODO: There are two interfaces with the name IOrderSearchCriteria;
// the other one is in YumTum.OrderMangaer namespace, and is used with
// searching for oders and returning the full order object that includes
// children, but this is used to only return the order object used in reporting
export interface IOrderSearchCriteria extends IDataSearchBase {
    status: string;
}

export interface IPaymentRecordSearchCriteria extends IDataSearchBase {
    serverId: string;
}

export interface ICrashCore {
    id: string;
    timestamp: number;
    message: string;
    description: string;
    stack: string;
    category: string;
    typeName: string;
}

export interface ICrashClient extends ICrashCore {
    parentId: string;
    deviceId: string;
}

export interface ITraceCore {
    id: string;
    timestamp: number;
    category: string;
    message: string;
    clientInfo: {
        id?: string,
        parentId?: string,
        clientType?: string
    };
    logType: string;
    typeName: string;
}

export interface IHeartBeat {
    id: string;
    parentId: string;
    deviceId: string;
    timestamp: number;
    typeName: string;
}

export interface IRestaurantStatusInfo {
    deviceList: Array<PosDeviceDTO>;
    orderList: Array<IOrderCore>;
    ticketList: Array<IOrderGroupCore>;
    crashList: Array<ICrashClient>;
    traceList: Array<ITraceCore>;
    heartBeatList: Array<IHeartBeat>;
}


export interface IModifedObject {
    id: string;
    parentId: string,
    lastModified: number,
    deleteTimestamp?: number,
    deletedTypeName?: string,
    typeName: string
}

