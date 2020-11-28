import { RestaurantOwnerDTO } from './RestaurantOwnerDTO';
import { RestaurantSiteDTO } from './RestaurantSiteDTO';
import { PosDeviceDTO } from './PosDeviceDTO';
import { FloorItemDTO } from '../FloorplanDTO';
import { InventoryItem } from '../MenuDTO';

export class CoreDataDTO {
    restaurantOwner: RestaurantOwnerDTO | null = null;
    restaurantSite: RestaurantSiteDTO | null = null;
    posDevice: PosDeviceDTO | null = null;
    floorLayoutList: Array<FloorItemDTO> | null = null;
    inventoryList: Array<InventoryItem> | null = null;
    typeName: string = 'CoreDataDTO';
}