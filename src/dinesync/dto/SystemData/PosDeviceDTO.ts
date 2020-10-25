import { CashDrawerDTO } from '../OrderDTO';
import {PosDeviceSettingsDTO } from '../Settings';

export interface IPosDevice {
    id: string;
    parentId: string;
    restaurantOwnerId: string;
    cashDrawer: CashDrawerDTO;
    settings: PosDeviceSettingsDTO;

    lastModified: number
    typeName: string;
}

export class PosDeviceDTO {
    public id: string = '';
    public parentId: string = '';
    public restaurantOwnerId: string = '';
    public cashDrawer: CashDrawerDTO = null;
    public settings: PosDeviceSettingsDTO = null;

    public lastModified = 0;
    public typeName: string = 'PosDeviceDTO';
}