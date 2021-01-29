import { CategoryDTO, InventoryItem, MenuDTO, MenuItemDTO } from './dinesync/dto/MenuDTO';
import { MenuHelper } from './dinesync/dto/utility/MenuHelper';

export class DataManager {
    //https://localhost:44354/api/RestaurantClient/OnlineData/asdfasdf/ddd
    static restaurantId = '475cd90c-d11b-4351-8a25-d836984c1796';
    //static onlineDataEndpoint = "https://localhost:44354/";
    static onlineDataEndpoint = "https://seattleservice.dinesync.com/";

    static async fetchMenuData(): Promise<Array<MenuDTO>> {
        let endPoint = DataManager.onlineDataEndpoint + `api/RestaurantClient/OnlineData/${DataManager.restaurantId}/menus.json`;
        var fetchResult = await fetch(endPoint, {
            method: 'GET',
            cache: 'reload'
        });
        if (fetchResult.ok) {
            let menuList =  JSON.parse(await fetchResult.text()) as Array<MenuDTO>;

            // clean the menu data, removing any elements hidden from the website
            menuList.forEach((menu) => {
                // remove any categories hidden from website
                menu.categoryList = menu?.categoryList.reduce((udpatedCategoryList, category) => {
                    if (!category.isHiddenFromWebsite) {
                        // remove any menuitems hidden from website
                        category.menuItemList = category.menuItemList?.reduce((updatedMenuItemList, menuItem) => {
                            if (!menuItem.isHiddenFromWebsite) {
                                updatedMenuItemList.push(menuItem);
                            }

                            return updatedMenuItemList;
                        }, new Array<MenuItemDTO>());

                        if (category.menuItemList.length > 0) {
                            udpatedCategoryList.push(category);
                        }
                    }
                    
                    return udpatedCategoryList
                }, new Array<CategoryDTO>());

                // remove any menus that have no categories
                menuList = menuList.reduce((updatedMenuList, menu)=> {
                    if (menu.categoryList.length > 0) {
                        updatedMenuList.push(menu);
                    }
                    return updatedMenuList;
                }, new Array<MenuDTO>())

            });

            return menuList;
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }

    static async fetchRestaurantData(): Promise<any> {
        let endPoint = DataManager.onlineDataEndpoint + `api/RestaurantClient/OnlineData/${DataManager.restaurantId}/restaurantInfo.json`;
        var fetchResult = await fetch(endPoint, {
            method: 'GET',
            cache: 'reload'
        });

        if (fetchResult.ok) {
            let jsonText = await fetchResult.text();
            return JSON.parse(jsonText);
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }

    static async fetchLiquorList(): Promise<Array<InventoryItem>> {
        let endPoint = DataManager.onlineDataEndpoint + `api/RestaurantClient/OnlineData/${DataManager.restaurantId}/liquorList.json`;
        var fetchResult = await fetch(endPoint, {
            method: 'GET',
            cache: 'reload'
        });

        if (fetchResult.ok) {
            return JSON.parse(await fetchResult.text());
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }
}