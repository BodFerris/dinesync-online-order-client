import { CategoryDTO, MenuDTO, MenuItemDTO } from './dinesync/dto/MenuDTO';
import { MenuHelper } from './dinesync/dto/utility/MenuHelper';

export class DataManager {
    static async fetchMenuData(): Promise<Array<MenuDTO>> {
        var fetchResult = await fetch('menuTestData.json');
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
        var fetchResult = await fetch('restaurantInfo.json');
        if (fetchResult.ok) {
            return JSON.parse(await fetchResult.text());
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }

    static async fetchLiquorList(): Promise<any> {
        var fetchResult = await fetch('liquorList.json');
        if (fetchResult.ok) {
            return JSON.parse(await fetchResult.text());
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }
}