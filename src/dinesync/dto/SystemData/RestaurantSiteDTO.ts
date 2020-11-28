import { RestaurantDTO, EmployeeTimeRecordDTO } from '../RestaurantDTO';
import { MenuDTO } from '../MenuDTO';
import { RestaurantSiteSettingsDTO } from '../Settings';


export class RestaurantSiteDTO {
    public restaurant: RestaurantDTO | null = null;
    public editMenuList: Array<MenuDTO> = [];

    // employeeTimeRecordList is deprecated; it no longer caches employee clocked in info
    public employeeTimeRecordList: Array<EmployeeTimeRecordDTO> = [];

    public settings: RestaurantSiteSettingsDTO | null = null;

    public typeName = 'RestaurantSiteDTO';
}
