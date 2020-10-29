import {
    IMenu, 
    IMenuItem,
    IMenuItemOptionGroup, 
    IMenuItemOption, 
    ICategory, 
    IMenuItemPrice, 
    MenuItemPriceDTO, 
    MenuItemOptionDTO, 
    MenuItemOptionGroupDTO, 
    CategoryDTO,
    MenuItemDTO,
    MenuDTO,
    InventoryItem,
    InventoryAdjustment,
    IOptionGroupShared,
    IIngredient} from '../MenuDTO';
import { MenuOperationTimeDTO, IMenuOperationTime } from '../RestaurantDTO';
import { GUID, DateUtility } from '@/next-ux2/utility/';
import { ObjectHelper } from './ObjectHelper';
import { IOptionQuantityInfo } from '../OrderDTO';

export class MenuHelper {
    public static isCategoryDirty(original: ICategory, compare: ICategory): boolean {
        return ObjectHelper.isObjectDirty(origin, compare);
    }

    public static isMenuItemDirty(original: IMenuItem, compare: IMenuItem): boolean {
        return ObjectHelper.isObjectDirty(origin, compare);
    }
    
    static createMenuItemOperationTime(parentId: string, dayOfWeek:  'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'): MenuOperationTimeDTO {
        let menuOperationTime = new MenuOperationTimeDTO();
        menuOperationTime.id = GUID.create();
        menuOperationTime.parentId = parentId;
        menuOperationTime.dayOfWeek = dayOfWeek;
        menuOperationTime.closeTime = 0;
        menuOperationTime.openTime = 0;
        menuOperationTime.useRestaurantCloseTime = true;
        menuOperationTime.useRestaurantOpenTime = true;
        menuOperationTime.isAvailable = true;
        
        return menuOperationTime;
    }

    public static createMenu(restaurantId: string): IMenu {
        let returnValue = new MenuDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = restaurantId;
        returnValue.lastModified = Date.now();

        returnValue.operationHoursList.push(MenuHelper.createMenuItemOperationTime(returnValue.id, 'Monday'));
        returnValue.operationHoursList.push(MenuHelper.createMenuItemOperationTime(returnValue.id, 'Tuesday'));
        returnValue.operationHoursList.push(MenuHelper.createMenuItemOperationTime(returnValue.id, 'Wednesday'));
        returnValue.operationHoursList.push(MenuHelper.createMenuItemOperationTime(returnValue.id, 'Thursday'));
        returnValue.operationHoursList.push(MenuHelper.createMenuItemOperationTime(returnValue.id, 'Friday'));
        returnValue.operationHoursList.push(MenuHelper.createMenuItemOperationTime(returnValue.id, 'Saturday'));
        returnValue.operationHoursList.push(MenuHelper.createMenuItemOperationTime(returnValue.id, 'Sunday'));

        return returnValue;
    }

    public static createCategory(menu: IMenu): ICategory {
        let returnValue = new CategoryDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = menu.id;
        returnValue.lastModified = Date.now();
        
        return returnValue;
    }

    public static createMenuItem(category: ICategory): IMenuItem {
        let returnValue = new MenuItemDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = category.id;
        returnValue.lastModified = Date.now();
        returnValue.isHiddenFromWebsite = category.isHiddenFromWebsite;
        returnValue.isAvailableForCarryOut = category.isAvailableForCarryOut;
        returnValue.profitCenter = category.profitCenter;
        returnValue.printerDestination = category.printerDestination;
        returnValue.areTaxesCoveredByPrice = category.areTaxesCoveredByPrice;

        return returnValue;
    }

    public static createPrice(menuItem: IMenuItem): IMenuItemPrice {
        let returnValue = new MenuItemPriceDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = menuItem.id;
        
        return returnValue;
    }

    public static createOptionGroup(owner: {id: string }, menuItem: IMenuItem): IMenuItemOptionGroup {
        let returnValue = new MenuItemOptionGroupDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = owner.id;

        menuItem.priceList.forEach((priceItem) => {
            returnValue.quantityInfoList.push({
                size: priceItem.size,
                minOptionsAllowed: 0,
                maxOptionsAllowed: 0,
                maxQuantityBeforeCharging: 0,
                price: 0
            })
        });
        
        return returnValue;
    }

    static createOption(owner: {id: string }, priceList: Array<IMenuItemPrice>): IMenuItemOption {
        let returnValue = new MenuItemOptionDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = owner.id;

        for (let i=0; i < priceList.length; i++) {
            let priceItem = priceList[i];

            let newQuantityItem = <IOptionQuantityInfo>{
                size: priceItem.size,
                minExpectedQuantity: 0,
                maxQuantityAllowed: 0,
                maxQuantityBeforeCharging: 1,
                defaultQuantity: 1,
                price: 0
            }

            returnValue.quantityInfoList.push(newQuantityItem);
            
            returnValue.sizeToIngredientList.push({
                size: priceItem.size,
                ingredientList: []
            })
        }
        
        return returnValue;
    }

    static mergeOptionGroupIntoMenuItem(groupParent: IMenuItem, optionGroup: IMenuItemOptionGroup, isReplaced: boolean) {
        // Don't mutate the optionGroup passed in, and map the prices to the destination
        optionGroup = ObjectHelper.cleanDto(optionGroup);
        optionGroup = optionGroup
        optionGroup.id = GUID.create();
        optionGroup.parentId = groupParent.id;

        // ensure that all the immediate child options parent id is  valid
        optionGroup.optionList.forEach((optionItem) => {
            optionItem.parentId = optionGroup.id;
        })

        MenuHelper.priceResetOptionWalker(groupParent, optionGroup);

        // if option group does not exist add it, and if it exists and isReplaced is true,
        // then empty the option list
        let optionGroupToMerge = groupParent.optionGroupList.find(i => i.name.toLowerCase() === optionGroup.name.toLowerCase());
        if (!optionGroupToMerge) {
            optionGroupToMerge = optionGroup;
            groupParent.optionGroupList.push(optionGroupToMerge);
        }

        optionGroup.optionList.forEach((optionItem, index) => {
            let existingIndex = optionGroupToMerge!.optionList.findIndex(i => i.name.toLowerCase() === optionItem.name.toLowerCase());
            if (existingIndex < 0) {
                // option does not exist, so add it
                optionGroupToMerge!.optionList.splice(index, 0, optionItem);
            }
            else if (isReplaced) {
                // option exists and merge is replacing, so replace
                optionGroupToMerge!.optionList.splice(existingIndex, 1, optionItem);
            }
        });

    }


    // NOTE: Resyncing prices presumes the price has already been sorted of smallest to largest size
    // before starting the resync
    private static priceResetGroupWalker(menuItem: IMenuItem, groupListOwner: {optionGroupList: Array<IOptionGroupShared>}) {
        groupListOwner.optionGroupList.forEach(groupItem => {
            // if price list lenght change, then truncate or expand
            if (groupItem.quantityInfoList.length < menuItem.priceList.length) {
                // price was added, no need to set any of the values since
                // a full pass occurs at the end of this method that resycns
                // the size name
                let totalItemsToAdd = menuItem.priceList.length - groupItem.quantityInfoList.length;
                for (let i=0; i < totalItemsToAdd; i++) {
                    groupItem.quantityInfoList.push({
                        size: '',
                        minOptionsAllowed: 0,
                        maxOptionsAllowed: 0,
                        maxQuantityBeforeCharging: 0,
                        price: 0
                    });
                }
            }
            else if (groupItem.quantityInfoList.length > menuItem.priceList.length) {
                // prices were removed, so truncate
                let startIndex = menuItem.priceList.length;
                let totalToRemove = groupItem.quantityInfoList.length - menuItem.priceList.length;
                groupItem.quantityInfoList.splice(startIndex, totalToRemove);
            }

            // reset the size names
            menuItem.priceList.forEach((priceItem, index) => {
                groupItem.quantityInfoList[index].size = priceItem.size;
            });

            groupItem.optionList.forEach(optionItem => {
                MenuHelper.priceResetOptionWalker(menuItem, groupItem);
            })
        })
    }

    private static priceResetOptionWalker(menuItem: IMenuItem, optionGroup: IOptionGroupShared) {
        optionGroup.optionList.forEach(optionItem => {
            // if price list length change, then truncate or expand
            if (optionItem.quantityInfoList.length < menuItem.priceList.length) {
                // price was added, no need to set any of the values since
                // a full pass occurs at the end of this method that resycns
                // the size name
                let totalItemsToAdd = menuItem.priceList.length - optionItem.quantityInfoList.length;
                for (let i=0; i < totalItemsToAdd; i++) {
                    optionItem.quantityInfoList.push({
                        size: '',
                        minExpectedQuantity: 0,
                        maxQuantityAllowed: 0,
                        maxQuantityBeforeCharging: 0,
                        defaultQuantity: 0,
                        price: 0
                    });

                    optionItem.sizeToIngredientList.push({
                       size: '', 
                       ingredientList: []
                    });
                }
            }
            else if (optionItem.quantityInfoList.length > menuItem.priceList.length) {
                // prices were removed, so truncate
                let startIndex = menuItem.priceList.length;
                let totalToRemove = optionItem.quantityInfoList.length - menuItem.priceList.length;
                optionItem.quantityInfoList.splice(startIndex, totalToRemove);
                optionItem.sizeToIngredientList.splice(startIndex, totalToRemove);
            }

            // reset the size names
            menuItem.priceList.forEach((priceItem, index) => {
                optionItem.quantityInfoList[index].size = priceItem.size;
                optionItem.sizeToIngredientList[index].size = priceItem.size;
            });

            MenuHelper.priceResetGroupWalker(menuItem, optionItem);
        })
    }

    static resyncMenuItemPriceList(menuItem: IMenuItem) {
        // reset the choices/options
        MenuHelper.priceResetGroupWalker(menuItem, menuItem);   
        
        // reset the ingredient list directly on the menu item
        // if price list length change, then truncate or expand
        if (menuItem.sizeToIngredientList.length < menuItem.priceList.length) {
            // price was added, no need to set any of the values since
            // a full pass occurs at the end of this method that resycns
            // the size name
            let totalItemsToAdd = menuItem.priceList.length - menuItem.sizeToIngredientList.length ;
            let defaultIngredientsForSizeList: Array<IIngredient> = [];
            if ((menuItem.sizeToIngredientList.length > 0) && (menuItem.sizeToIngredientList[0].ingredientList.length > 0)) {
                // all sizes must have th exact same ingredient list by default
                // (at least for bar group, but that is the only group being used right now)
                defaultIngredientsForSizeList = JSON.parse(JSON.stringify(menuItem.sizeToIngredientList[0].ingredientList));
                defaultIngredientsForSizeList.forEach((item) => {
                    item.quantity = 0;
                })
            }

            for (let i=0; i < totalItemsToAdd; i++) {
                menuItem.sizeToIngredientList.push({
                    size: '', 
                    ingredientList: JSON.parse(JSON.stringify(defaultIngredientsForSizeList))
                });
            }
        }
        else if (menuItem.sizeToIngredientList.length > menuItem.priceList.length) {
            // prices were removed, so truncate
            let startIndex = menuItem.priceList.length;
            let totalToRemove = menuItem.sizeToIngredientList.length - menuItem.priceList.length;
            menuItem.sizeToIngredientList.splice(startIndex, totalToRemove);
        }

        // reset the size names
        menuItem.priceList.forEach((priceItem, index) => {
            menuItem.sizeToIngredientList[index].size = priceItem.size;
        });

    }

    public static createWordList(wordListCsv: string): Array<string> {        
        let wordArray = wordListCsv.split(',');

        // remove empty words
        for (let i = wordArray.length-1;  i >= 0; i--) {
            if (wordArray[i]) {
                wordArray[i] = wordArray[i].trim();
            }

            if (!wordArray[i] || wordArray[i] === '') {
                wordArray.splice(i, 1);
            }
        }

        return wordArray.filter(v => v && v.trim() !== '');
    }

    static getMenuItemCount(menu: IMenu): number {
        let returnValue = 0;
        menu.categoryList.forEach((category) => {
            category.menuItemList.forEach((menuItem) => {
                returnValue++;
            });
        })

        return returnValue;
    }

    static findCategoryFromMenuList(menuList: Array<IMenu>, categoryId: string): ICategory | null {
        for (let menuIndex = 0; menuIndex < menuList.length; menuIndex++) {
            let menu = menuList[menuIndex];
            
            for (let categoryIndex = 0; categoryIndex < menu.categoryList.length; categoryIndex++) {
                let category = menu.categoryList[categoryIndex];
                if (category.id === categoryId) {
                    return category;
                }
            }
        }

        return null;
    }

    static getCategoryForMenuItem(menu: IMenu,  menuItem: IMenuItem): ICategory | null {
        for (let i=0; i < menu.categoryList.length; i++) {
            let categoryItem = menu.categoryList[i];
            for (let menuItemIndex=0; menuItemIndex < categoryItem.menuItemList.length; menuItemIndex++) {
                let item = categoryItem.menuItemList[menuItemIndex];
                if (item.id === menuItem.id) {
                    return categoryItem;
                }
            }
        }

        return null;
    }

    // TODO: Need to compensate for timezone
    static isTimeWithinOperationTime(time: number, operationTime: IMenuOperationTime): boolean {
        if (!operationTime.isAvailable) {
            return false;
        }
        else {
            let date = new Date(time);;
            let dayOfWeek = DateUtility.getFullDayFromJavascriptDayOfWeek(date.getDay());
            if (dayOfWeek !== operationTime.dayOfWeek) {
                return false
            }
            else {
                if (operationTime.useRestaurantOpenTime && operationTime.useRestaurantCloseTime) {
                    // if the days match and the menu is available during all restaurant hours, then it's a full match
                    return true;
                }
                else {
                    // day of week match, now check that the hours match
                    let operationTimeOpenDate = new Date(operationTime.openTime);
                    let operationTimeCloseDate = new Date(operationTime.closeTime)
                    let startHour = operationTimeOpenDate.getUTCHours();
                    let startMinutes = operationTimeOpenDate.getUTCMinutes();
                    let endHour = operationTimeCloseDate.getUTCHours();
                    let endMinutes = operationTimeCloseDate.getUTCMinutes();

                    if (operationTime.useRestaurantOpenTime) {
                        startHour = 0;
                        startMinutes = 0;
                    }

                    if (operationTime.useRestaurantCloseTime) {
                        endHour = 23;
                        endMinutes = 59
                    }

                    // make a date with the same year, month, and day as the comparision
                    // but set the start and end hours and minutes to the operation time
                    let normalizedStartOperationDate = new Date(time);
                    normalizedStartOperationDate.setHours(startHour);
                    normalizedStartOperationDate.setMinutes(startMinutes);

                    let normalizedEndOperationDate = new Date(time);
                    normalizedEndOperationDate.setHours(endHour);
                    normalizedEndOperationDate.setMinutes(endMinutes);

                    let normalizedStartTime = normalizedStartOperationDate.getTime();
                    let normaslizedEndTime = normalizedEndOperationDate.getTime();

                    return ((time >= normalizedStartTime) && (time <= normaslizedEndTime));
                }
            }
        }
    }

    static isMenuAvailableForTime(time: number, menu: IMenu): boolean {
        // get the operation tinme associated with the day
        let date = new Date(time);
        let dayOfWeekIndex = DateUtility.getMondayRefDayOfWeekNumberFromJavscriptDay(date.getDay());

        let operationTime: IMenuOperationTime = menu.operationHoursList[dayOfWeekIndex];

        return MenuHelper.isTimeWithinOperationTime(time, operationTime);
    }

    static redoIdForMenuItem(menuItem: IMenuItem, parentId: string) {
        menuItem.id = GUID.create();
        menuItem.parentId = parentId;
        
        if (menuItem.subMenuItemList) {
            menuItem.subMenuItemList.forEach((submenuItem) => {
                MenuHelper.redoIdForMenuItem(<any>submenuItem, menuItem.id);
            });
        }

        menuItem.optionGroupList.forEach((optionGroup) => {
            optionGroup.parentId = menuItem.id;
        })
    }

    // TODO: Need to compensate for timezone
    static getDefaultMenuBasedOnTime(time: number, menuList: Array<IMenu>, menuNamePreference = ''): IMenu | null {
        let returnValue = null;

        if (!menuNamePreference) {
            menuNamePreference = '';
        }

        let isExactMenuMatchFound = false;
        let menuItemCountOfReturnvalue = 0;
        let index = 0;
        while (!isExactMenuMatchFound && index < menuList.length) {
            let menu = menuList[index];
            if (MenuHelper.isMenuAvailableForTime(time, menu)) {
                // get the menu item count
                if ((menu.name.toLowerCase().trim() === menuNamePreference.toLowerCase().trim()) && (menuNamePreference != '')) {
                    returnValue = menu;
                    isExactMenuMatchFound = true;
                }
                else {
                    let menuItemCount = MenuHelper.getMenuItemCount(menu);
                    if (menuItemCount > menuItemCountOfReturnvalue) {
                        returnValue = menu;
                        menuItemCountOfReturnvalue = menuItemCount;
                    }
                }
            }

            index++;
        }

        return returnValue;
    }

    // TODO: Need to compensate for timezone
    static getMenuItemAvailabilityInfo(menu: IMenu, menuItem: IMenuItem): { isAvailable: boolean, reasonForUnavailability: string} {
        let returnValue = {
            isAvailable: false,
            reasonForUnavailability: ''
        };

        if (!menu) {
            return returnValue;
        }

        let menuItemCategory = MenuHelper.getCategoryForMenuItem(menu, menuItem);

        if (menuItem.isTemporarilyUnavailable) {
            returnValue.reasonForUnavailability = menuItem.reasonForUnavailability;
        }
        else if(menuItemCategory?.isTemporarilyUnavailable) {
            returnValue.reasonForUnavailability = menuItemCategory.reasonForUnavailability;
        }
        else if (!menuItem.isAvailableForCarryOut) {
            returnValue.reasonForUnavailability = 'Dine-In only';
            returnValue.isAvailable = false;
        }
        else if (menu.isTemporarilyUnavailable) {
            returnValue.reasonForUnavailability = menu.reasonForUnavailability
        }
        else if (!MenuHelper.isMenuAvailableForTime(Date.now(), menu)) {
            returnValue.reasonForUnavailability = 'Menu not availabe at curren time';
        }
        else {
            returnValue.isAvailable = true;
        }

        return returnValue;
    }

    static createInventoryItem(restaurantId: string, groupName = '', className= '', categoryName = ''): InventoryItem {
        let returnValue = new InventoryItem();
        returnValue.id = GUID.create();
        returnValue.parentId = restaurantId;
        returnValue.groupName = groupName;
        returnValue.className = className;
        returnValue.categoryName = categoryName;

        return returnValue;
    }

    static createInventoryAdjustment(inventoryItem: InventoryItem) {
        let returnValue = new InventoryAdjustment();
        returnValue.id = GUID.create();
        returnValue.parentId = inventoryItem.id;
        returnValue.restaurantId = inventoryItem.parentId;
        returnValue.name = inventoryItem.name;
        return returnValue;
    }
}