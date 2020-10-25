import { RestaurantOwnerDTO } from './RestaurantOwnerDTO';
import { RestaurantSiteDTO } from './RestaurantSiteDTO';
import { PosDeviceDTO } from './PosDeviceDTO';
import { FloorItemDTO } from '../FloorplanDTO';

export interface ICoreData {
    getRestaurantOwner(): Promise<RestaurantOwnerDTO>;
    getRestaurantSite(): Promise<RestaurantSiteDTO>;
    getPosDevice(): Promise<PosDeviceDTO>;
    getFloorLayoutList(): Promise<Array<FloorItemDTO>>
}