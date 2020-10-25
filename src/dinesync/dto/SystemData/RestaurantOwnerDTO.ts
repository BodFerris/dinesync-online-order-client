
import { WebsiteInfoDTO } from '../WebsiteDTO';
import { UserDTO } from '../UserDTO';
import { RestaurantOwnerSettingsDTO } from '../Settings';

export class RestaurantOwnerDTO {
    public id: string = '';
    public websiteInfo: WebsiteInfoDTO = null;
    public userList = new Array<UserDTO>();
    public settings: RestaurantOwnerSettingsDTO = null;

    public typeName = 'RestaurantOwnerDTO';
}
