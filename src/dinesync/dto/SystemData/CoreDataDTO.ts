import { RestaurantOwnerDTO } from './RestaurantOwnerDTO';
import { RestaurantSiteDTO } from './RestaurantSiteDTO';
import { PosDeviceDTO } from './PosDeviceDTO';
import { FloorItemDTO } from '../FloorplanDTO';
import { InventoryItem } from '../MenuDTO';

export class CoreDataDTO {
    restaurantOwner: RestaurantOwnerDTO;
    restaurantSite: RestaurantSiteDTO;
    posDevice: PosDeviceDTO;
    floorLayoutList: Array<FloorItemDTO>;
    inventoryList: Array<InventoryItem>;
    typeName: string = 'CoreDataDTO';
}