
    import { IOptionGroupQuantityInfo, IOptionQuantityInfo } from './OrderDTO';

    export type PrinterDestinationType = '' | 'primaryKitchen' | 'secondaryKitchen' | 'bar' | 'none';

    export interface IClientMenuEditRequest {
        accountName: string,
        menuId: string,
        menuName: string
    }

    export interface IClientMenuEditResponse {
        accountName: string,
        timestamp: number,
        isGranted: boolean
    }

    export interface IOptionGroupShared {
        name: string;
        quantityInfoList: Array<IOptionGroupQuantityInfo>;
        optionList: Array<IOptionShared>
    }

    export interface IOptionShared {
        name: string;
        quantityInfoList: Array<IOptionQuantityInfo>,
        optionGroupList: Array<IOptionGroupShared>;
        sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}>;
    }
    

    export interface IMenuItemOptionGroup extends IOptionGroupShared {
        id: string;
        parentId: string;
        position: number;
        optionList: Array<IMenuItemOption>;
        typeName: string;
    }

    export class MenuItemOptionGroupDTO implements IMenuItemOptionGroup {
        public id: string = '';
        public parentId: string = '';
        public name: string = '';
        public quantityInfoList: Array<IOptionGroupQuantityInfo> = [];
        public position: number = 0;
        public optionList: Array<MenuItemOptionDTO> = [];
        public typeName: string = 'MenuItemOptionGroupDTO';
    }

    export interface IIngredient {
        name: string;
        pricePerUnit: number;
        defaultQuantity: number;
        quantity: number;
    }

    export interface IMenuItemOption extends IOptionShared {
        id: string;
        parentId: string;
        isSelectedByDefault: boolean;
        isMoreThanOne: boolean;
        position: number;
        menuItemSourceId: string;
        isQuantityWordUsed: boolean;
        quantityWordRange: string;
        defaultQuantityWord: string;
        optionGroupList: Array<IMenuItemOptionGroup>;
        sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}>;
        typeName: string;
    }

    export class MenuItemOptionDTO implements IMenuItemOption {
        public id: string = '';
        public parentId: string = '';
        public name: string = '';
        public isSelectedByDefault: boolean = false;
        public isMoreThanOne: boolean = false;
        public position: number = 0;
        public menuItemSourceId: string = '';
        public isQuantityWordUsed: boolean = false;
        public quantityWordRange: string = '';
        public defaultQuantityWord: string = '';
        public quantityInfoList: Array<IOptionQuantityInfo> = [];
        public optionGroupList: Array<MenuItemOptionGroupDTO> = [];
        public sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}> = [];
        public typeName: string = 'MenuItemOptionDTO';
    }

    export interface IMenuItemPrice {
        id: string;
        parentId: string;
        price: number;
        priceText: string;
        size: string;
        position: number;
        typeName: string;
    }

    export class MenuItemPriceDTO implements IMenuItemPrice {
        public id: string = '';
        public parentId: string = '';
        public price: number = 0;
        public priceText: string = '';
        public size: string = '';
        public position: number = 0;
        public typeName: string = 'MenuItemPriceDTO';
    }

    export interface IMenuItemBase {
        id: string;
        parentId: string;

        // categoryId is deprecated
        categoryId: string;
        menuItemId: string;
        name: string;
        description: string;
        priceList: Array<IMenuItemPrice>;
        position: number;
        hasSizes: boolean;
        optionGroupList: Array<IMenuItemOptionGroup>;
        
        // NOTE: In most cases (and probably all, the ingredients used is the same,
        // only the quantity value is different.  However, keeping a flattened model
        // of having full ingredient data in the list instead of having an ingredientList
        // coupled with a sizeToQuantityList
        sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}>;
    }

    export class MenuItemBaseDTO implements IMenuItemBase {
        public id: string = '';
        public parentId: string = '';

        // categoryId is depecrated
        public categoryId: string = '';
        public menuItemId: string = '';
        public name: string = '';
        public description: string = '';
        public priceList: Array<MenuItemPriceDTO> = [];
        public position: number = 0;
        public hasSizes: boolean = false;
        public optionGroupList: Array<MenuItemOptionGroupDTO> = [];
        public sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}> = [];
    }

    export interface ISubmenuItem extends IMenuItemBase {
        typeName: string;
    }

    export class SubmenuItemDTO extends MenuItemBaseDTO implements ISubmenuItem {
        public typeName: string = 'SubmenuItemDTO';
    }

    export interface IMenuItem extends IMenuItemBase {
        profitCenter: string;
        isAvailableForCarryOut: boolean;
        isHiddenFromWebsite: boolean;
        isBarBeverage: boolean;
        areTaxesCoveredByPrice: boolean;
        printerDestination: PrinterDestinationType;
        subMenuItemList: Array<ISubmenuItem>;
        lastModified: number;
        typeName: string;
    }

    export class MenuItemDTO extends MenuItemBaseDTO implements IMenuItem {
        public profitCenter: string = '';
        public isAvailableForCarryOut: boolean = false;
        public isBarBeverage: boolean = false;
        public isHiddenFromWebsite: boolean = false;
        public areTaxesCoveredByPrice: boolean = false;
        public printerDestination: PrinterDestinationType = '';
        public subMenuItemList: Array<SubmenuItemDTO> = [];
        public lastModified: number = 0;
        public typeName: string = 'MenuItemDTO';
    }

    export interface ICategory {
        id: string;
        parentId: string;
        name: string;
        description: string ;
        profitCenter: string;
        isAvailableForCarryOut: boolean;
        isHiddenFromWebsite: boolean;
        areTaxesCoveredByPrice: boolean;
        printerDestination: PrinterDestinationType;
        menuItemList: Array<IMenuItem>;
        position: number;
        lastModified: number;
        typeName: string;
    }

    export class CategoryDTO implements ICategory {
        public id: string = '';
        public parentId: string = '';
        public name: string = '';
        public description: string = '';
        public profitCenter: string = '';
        public isAvailableForCarryOut: boolean = false;
        public isHiddenFromWebsite: boolean = false;
        public areTaxesCoveredByPrice: boolean = false;
        public printerDestination: PrinterDestinationType = '';
        public menuItemList: Array<MenuItemDTO> = [];
        public position: number = 0;
        public lastModified: number = 0;
        public typeName: string = 'CategoryDTO';
    }

    export interface IMenu {
        id: string;
        parentId: string;
        name: string;
        description: string;
        isAvailableForCarryOut: boolean;
        categoryList: Array<ICategory>;
        operationHoursList: Array<any>;
        lastModified: number;
        typeName: string;
    }

    export class MenuDTO implements IMenu {
        public id: string = '';
        public parentId: string = '';
        public name: string = '';
        public description: string = '';
        public isAvailableForCarryOut: boolean = false;
        public categoryList: Array<CategoryDTO> = [];
        public operationHoursList: Array<any> = [];
        public lastModified: number = 0;
        public typeName: string = 'MenuDTO';
    }

    export class MenuStockItemDTO {
        public id: string = '';
        public parentId: string = '';
        public menuId: string = '';
        public menuItemId: string = '';
        public menuItemName: string = '';
        public isCounting: boolean = false;
        public amountAvailable: number = 0;
        public typeName: string = 'MenuStockItemDTO';
    }

    export class InventoryItem {
        id: string = '';
        parentId: string = '';
        name: string = '';
        groupName: string = '';
        className: string = '';
        categoryName: string = '';
        pricePerUnit: number = 0;
        totalUnits: number = 0;
        lastModified: number = 0;

        typeName: string = 'InventoryItem';
    }

    export class InventoryAdjustment {
        id: string = '';
        parentId: string = ''; // id of InventoryItem
        restaurantId: string = '';
        inventoryItemParentLastModified: number = 0;
        name: string = '';
        adjustment: number = 0;
        lastModified: number = 0;
        adjustmentType: 'orderResync' | 'manual' = 'manual';
        // order resync occurs when an adjustment fails to register
        // at time or order closing.

        typeName: string = 'InventoryAdjustment';
    }

    export interface IInventoryOffset {
        inventoryItemId: string;
        offset: number;
    }
