import { IMenuItem, ISubmenuItem, IMenuItemOptionGroup, IMenuItemOption, IOptionShared, IOptionGroupShared, IIngredient, MenuItemOptionGroupDTO, InventoryItem, MenuItemOptionDTO, MenuItemPriceDTO, MenuItemDTO } from '../MenuDTO';
import {
    IOrder,
    IOrderGroup,
    IOrderMenuItem,
    IOrderMenuItemOptionGroup,
    IOrderMenuItemOption,
    OrderMenuItemDTO,
    OrderMenuItemOptionDTO,
    OrderMenuItemOptionGroupDTO,
    OrderOptionItemInfo,
    IOrderOptionItemPrintInfo,
    OrderGroupDTO,
    IDiscount,
    PaymentDTO,
    PayTransationTypeEnum,
    PaymentState,
    PaymentClosedReason,
    OrderStateEnum,
    CashDrawerDTO,
    CashChangeInfoDTO,
    DiscountTypeEnum,
    DiscountDTO,
    IPayment,
    CardTransactionDTO,
    ICardTransaction,
    IOptionQuantityInfo,
    ITicketLiquorUsageInfo,
    IOptionGroupQuantityInfo
} from '../OrderDTO';
import { GUID, StringUtility, NumUtility, Debug } from '@/next-ux2/utility';
import { PosDeviceDTO } from '../SystemData/PosDeviceDTO';
import { ObjectHelper } from './ObjectHelper';

export class OrderHelper {

    // update the pricePerUnit for object in the destination list.  Ingredien items in a Menu (used for bar beverages)
    // has a price per unit set to the value at the time that the menu item was crated.  However, the pricePerUnit can
    // be updated, but any object that is using the associated inventoryItem is not automatically udpated.  The update
    // occurs at runtime using this method.
    static updatePricePerUnit(pricePerUnitInventorySource: Array<{name: string, pricePerUnit: number}>, destList: Array<{name: string, pricePerUnit: number}>) {
        if (!pricePerUnitInventorySource) {
            return;
        }

        destList.forEach((item) => {
            let foundItemToUpdate = pricePerUnitInventorySource.find(i => i.name === item.name);
            if (foundItemToUpdate) {
                foundItemToUpdate.pricePerUnit = item.pricePerUnit;
            }
            
        })
    }

    static updateBarOptionWithNewLiquor(optionItem: OrderMenuItemOptionDTO, liquorItem: InventoryItem) {
        optionItem.quantityInfoList.forEach((quantityInfoItem) => {
            quantityInfoItem.price = NumUtility.toMoney(quantityInfoItem.defaultQuantity * liquorItem.pricePerUnit);
        });

        optionItem.selectedQuantityInfo.price = NumUtility.toMoney(optionItem.selectedQuantityInfo.defaultQuantity * liquorItem.pricePerUnit);
        optionItem.name = liquorItem.name;
    }

    public static createOrderMenuItemFromMenuItem(
        menuItem: IMenuItem,
        ticketId: string,
        size: string | number,
        inventoryList: Array<InventoryItem>): IOrderMenuItem {

        var returnValue: IOrderMenuItem = new OrderMenuItemDTO();

        let priceInfo = OrderHelper.getPriceBySize(size, menuItem.priceList);
        returnValue.size = priceInfo!.size;
        returnValue.price = priceInfo!.price;

        let sizeName = priceInfo!.size;

        returnValue.id = GUID.create();
        returnValue.parentId = ticketId;
        returnValue.menuItemId = menuItem.id;
        returnValue.lastModified = Date.now();
        returnValue.priceList = [];
        returnValue.areTaxesCoveredByPrice = menuItem.areTaxesCoveredByPrice;
        returnValue.printerDestination = menuItem.printerDestination;
        returnValue.name = menuItem.name;
        returnValue.profitCenter = menuItem.profitCenter;
        returnValue.isBarBeverage = menuItem.isBarBeverage;
        returnValue.amount = 1;

        menuItem.priceList.forEach((priceItem) => {
            returnValue.priceList.push({ price: priceItem.price, size: priceItem.size });
        });

        menuItem.sizeToIngredientList.forEach((sizeToIngredientItem) => {
            returnValue.sizeToIngredientList.push(ObjectHelper.clone(sizeToIngredientItem));
        });

        // Add SubMenuItems as Add-Ons
        if (menuItem.subMenuItemList.length > 0) {
            let submenuItemGroup: IOrderMenuItemOptionGroup = new OrderMenuItemOptionGroupDTO();
            submenuItemGroup.id = GUID.create();
            submenuItemGroup.parentId = returnValue.id;
            submenuItemGroup.name = 'Add-Ons';
            returnValue.optionGroupList.push(submenuItemGroup);

            menuItem.subMenuItemList.forEach((subMenuItem: ISubmenuItem, index: number) => {
                if (!StringUtility.isNullOrEmpty(subMenuItem.name)) {
                    let newOption: IOrderMenuItemOption = new OrderMenuItemOptionDTO();
                    newOption.id = GUID.create();
                    newOption.amount = 1;
                    newOption.parentId = submenuItemGroup.id;
                    newOption.name = subMenuItem.name;
                    newOption.isMoreThanOne = false;

                    subMenuItem.priceList.forEach((priceItem) => {
                        newOption.quantityInfoList.push({
                            size: priceItem.size,
                            price: priceItem.price,
                            minExpectedQuantity: 0,
                            maxQuantityAllowed: 0,
                            maxQuantityBeforeCharging: 1,
                            defaultQuantity: 1
                        })

                        newOption.sizeToIngredientList.push({
                            size: priceItem.size,
                            ingredientList: []
                        });
                    });

                    subMenuItem.sizeToIngredientList.forEach((sizeToIngredientItem) => {
                        newOption.sizeToIngredientList.push(sizeToIngredientItem);
                    });

                    submenuItemGroup.optionList.push(newOption);

                    let menuItemPrice = OrderHelper.getPriceBySize(sizeName, subMenuItem.priceList);
                    newOption.price = menuItemPrice!.price;
                }
            });
        }

        if (menuItem.isBarBeverage) {
            // bar beverages don't have choices/options,
            // but menu item ingredients become the options/choices
            let optionGroup = new OrderMenuItemOptionGroupDTO();
            optionGroup.id = GUID.create();
            optionGroup.name = 'Bar';
            optionGroup.parentId = returnValue.id;
            optionGroup.position = 0;
            optionGroup.optionList = OrderHelper.createBarBeverageOptionsFromIngredients(optionGroup.id, menuItem.sizeToIngredientList, inventoryList, sizeName);

            returnValue.optionGroupList.push(optionGroup);
        }
        else {
            // the recursive method used to generate OrderMenuItemOption from the menu items MenuItemOption
            // does not quite fit the model of OrderMenuItemOption.  They key is to have the 
            // return value's optionGroupList to be populated, so create a stub with the return value's
            // optionGroupList that will get populated by the recursive method.
            let copyObject = {
                id: returnValue.id,
                typeName: returnValue.typeName,
                isSelected: false,
                optionGroupList: returnValue.optionGroupList
            };

            OrderHelper.copyMenuItemOptionsToOrderOptionsRecursive(copyObject, menuItem, sizeName);
        }
        
        return returnValue;
    }
    
    // Create a list of menu options based on the ingredientlist for a bar beverage;
    // it updates the price per unit to what is in the inventoryList.  If not found
    // in the inventory list, then uses the price in the sizeToIngredientList
    //
    // Presumes the price per unit is the same across all sizes.
    private static createBarBeverageOptionsFromIngredients(
            optionGroupId: string,
            sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}>,
            inventoryList: Array<InventoryItem>,
            size: string): Array<OrderMenuItemOptionDTO> {
        let returnValue = new Array<OrderMenuItemOptionDTO>();

        // ingredients are the same for each size
        if (sizeToIngredientList.length > 0) {
            // ingredientList gets updated with the most current price per to unit;
            // create a copy to avoid mutating
            let ingredientList: Array<IIngredient> =  JSON.parse(JSON.stringify(sizeToIngredientList[0].ingredientList));

            // it is okay that the sizeToIngredientList gets mutated when upating the pricePerUnit
            // TODO: Perhaps check to see if the inventoryList needs to be sliced to a smaller list;
            // most likely the perf improvement will be pointless
            OrderHelper.updatePricePerUnit(inventoryList, ingredientList);

            for (let i=0; i < ingredientList.length; i++) {
                let ingredientItem = ingredientList[i];
                
                let orderMenuItemOption = new OrderMenuItemOptionDTO();
                orderMenuItemOption.id = GUID.create();
                orderMenuItemOption.parentId = optionGroupId,
                orderMenuItemOption.position = 0;
                orderMenuItemOption.isSelectedByDefault = true;
                orderMenuItemOption.isSelected = true;
                orderMenuItemOption.isBarItem = true;
                orderMenuItemOption.name = ingredientItem.name;
                orderMenuItemOption.originalBarItemInfo = { name: ingredientItem.name, pricePerUnit: ingredientItem.pricePerUnit};
            
                // size to ingredientlist defaultQuantity is the quantity of the bar ingredient
                sizeToIngredientList.forEach((sizeIngredientItem) => {
                    let ingredientInfo = sizeIngredientItem.ingredientList.find(i => i.name === ingredientItem.name);
                    orderMenuItemOption.quantityInfoList.push({
                        size: sizeIngredientItem.size,
                        minExpectedQuantity: 0,
                        maxQuantityAllowed: 0,
                        maxQuantityBeforeCharging: 0,
                        defaultQuantity: ingredientInfo!.quantity,
                        price: NumUtility.toMoney(ingredientItem.pricePerUnit * ingredientInfo!.quantity)
                    });

                    orderMenuItemOption.sizeToIngredientList.push({
                        size: sizeIngredientItem.size,
                        ingredientList: []
                    })
                });

                orderMenuItemOption.amount = 1;
                orderMenuItemOption.selectedQuantityInfo = orderMenuItemOption.quantityInfoList.find(i => i.size == size) as IOptionQuantityInfo;
                orderMenuItemOption.price = orderMenuItemOption.selectedQuantityInfo.price;

                returnValue.push(orderMenuItemOption);
            }
        }

        return returnValue;
    }

    public static createBarExraShotOption(optionGroupId: string, ingredientItem: InventoryItem, sizeList: Array<{ size: string}>, size: string): OrderMenuItemOptionDTO {
        let orderMenuItemOption = new OrderMenuItemOptionDTO();
        orderMenuItemOption.id = GUID.create();
        orderMenuItemOption.parentId = optionGroupId,
        orderMenuItemOption.position = 0;
        orderMenuItemOption.isSelectedByDefault = false;
        orderMenuItemOption.isSelected = true;
        orderMenuItemOption.isBarItem = true;
        orderMenuItemOption.name = ingredientItem.name;
        orderMenuItemOption.originalBarItemInfo = { name: ingredientItem.name, pricePerUnit: ingredientItem.pricePerUnit};


        // size to ingredientlist defaultQuantity is the quantity of the bar ingredient
        sizeList.forEach((sizeInfo) => {
            orderMenuItemOption.quantityInfoList.push({
                size: sizeInfo.size,
                minExpectedQuantity: 0,
                maxQuantityAllowed: 0,
                maxQuantityBeforeCharging: 0,
                defaultQuantity: 1,
                price: NumUtility.toMoney(ingredientItem.pricePerUnit)
            });

            orderMenuItemOption.sizeToIngredientList.push({
                size: sizeInfo.size,
                ingredientList: []
            })
        });

        orderMenuItemOption.amount = 1;
        orderMenuItemOption.isMoreThanOne = true;
        orderMenuItemOption.selectedQuantityInfo = orderMenuItemOption.quantityInfoList.find(i => i.size == size) as IOptionQuantityInfo;
        orderMenuItemOption.price = orderMenuItemOption.selectedQuantityInfo.price;

        return orderMenuItemOption;
    }

    private static copyMenuItemOptionsToOrderOptionsRecursive = (
        parent: { id: string, typeName: string, isSelected: boolean, optionGroupList: Array<IOrderMenuItemOptionGroup> },
        menuItemGroupListContainer: { optionGroupList: Array<IMenuItemOptionGroup> },
        size: string) => {

        menuItemGroupListContainer.optionGroupList.forEach((optionGroup: IMenuItemOptionGroup) => {
            let newOrderOptionGroup = new OrderMenuItemOptionGroupDTO();
            newOrderOptionGroup.id = GUID.create();
            newOrderOptionGroup.parentId = parent.id;
            newOrderOptionGroup.position = optionGroup.position;
            newOrderOptionGroup.name = optionGroup.name;
            parent.optionGroupList.push(newOrderOptionGroup);

            optionGroup.quantityInfoList.forEach(quantityInfoItem => {
                newOrderOptionGroup.quantityInfoList.push(ObjectHelper.clone(quantityInfoItem));
            });

            optionGroup.optionList.forEach((option: IMenuItemOption) => {
                let newOrderOption = new OrderMenuItemOptionDTO();
                newOrderOption.id = GUID.create();
                newOrderOption.parentId = newOrderOptionGroup.id;
                newOrderOption.amount = 1;
                newOrderOption.position = option.position;
                newOrderOption.isMoreThanOne = option.isMoreThanOne;
                newOrderOption.quantityWordRange = option.quantityWordRange;
                newOrderOption.isQuantityWordUsed = option.isQuantityWordUsed;
                newOrderOption.selectedQuantityWord = option.defaultQuantityWord;
                newOrderOption.isSelectedByDefault = option.isSelectedByDefault;
                newOrderOption.name = option.name;

                option.quantityInfoList.forEach(quantifyInfoItem => {
                    newOrderOption.quantityInfoList.push(ObjectHelper.clone(quantifyInfoItem));
                });

                option.sizeToIngredientList.forEach((sizeToIngredientItem) => {
                    newOrderOption.sizeToIngredientList.push(ObjectHelper.clone(sizeToIngredientItem));
                });

                let priceSelected = <IOptionQuantityInfo>OrderHelper.getPriceBySize(size, option.quantityInfoList);
                newOrderOption.price = priceSelected.price;
                newOrderOption.amount = priceSelected.defaultQuantity;
                newOrderOption.selectedQuantityInfo = priceSelected;
                newOrderOptionGroup.optionList.push(newOrderOption);

                // make sure default quantity is 1 in case of data entry errors
                newOrderOption.amount = (newOrderOption.amount <= 0) ? 1 : newOrderOption.amount;

                // Determine if the option should be selected.
                // Only selcted if the parent is selected and the new option.isSelectedByDefault is true
                // NOTE: parent can only be a OrderMenuItem object or OrderMenuItemOption
                if (parent.isSelected || (parent.typeName.replace('DTO', '') == 'OrderMenuItem')) {
                    newOrderOption.isSelected = newOrderOption.isSelectedByDefault;
                }

                OrderHelper.copyMenuItemOptionsToOrderOptionsRecursive(newOrderOption, option, size);
            });

        });
    }

    public static getPriceBySize(size: string | number, priceList: Array<{ price: number, size: string }>): { price: number, size: string } | null {
        var menuItemPriceSelected: { price: number, size: string } | null = null;
        priceList.some((priceItem): boolean => {
            if ((typeof (size) === 'string') && (priceItem.size === size)) {
                menuItemPriceSelected = priceItem;
                return true;
            }
            else if ((typeof (size) === 'number') && NumUtility.isZero(priceItem.price - size, .01)) {
                menuItemPriceSelected = priceItem;
                return true;
            }
            else {
                return false;
            }
        });

        return menuItemPriceSelected;
    }

    public static updateOptionsQuantityFromSizeChange(menuItem: {optionGroupList: Array<IOptionGroupShared>}, oldSize: string, newSize: string) {
        
        let optionUpdater = (optionItem: IOptionShared) => {
            let orderOptionItem = <IOrderMenuItemOption>optionItem;
            if (orderOptionItem.isMoreThanOne) {
                let oldQuantityInfo = <IOptionQuantityInfo>OrderHelper.getPriceBySize(oldSize, orderOptionItem.quantityInfoList);
                let newQuantityInfo = <IOptionQuantityInfo>OrderHelper.getPriceBySize(newSize, orderOptionItem.quantityInfoList);
                let diffForOldSize = orderOptionItem.amount - oldQuantityInfo.defaultQuantity;
                orderOptionItem.amount = newQuantityInfo.defaultQuantity + diffForOldSize;

                // never go below 1
                orderOptionItem.amount = (orderOptionItem.amount < 1) ? 1 : orderOptionItem.amount;
            }
        }

        OrderHelper.optionGroupActionWalker(menuItem.optionGroupList, null, optionUpdater);
    }

    public static createTicket(order: IOrder, restaurantId: string, serverName: string): IOrderGroup {
        let ticket = new OrderGroupDTO();
        ticket.id = GUID.create();
        ticket.parentId = order.id;
        ticket.restaurantId = restaurantId;
        ticket.orderNumber = order.orderNumber;
        ticket.orderTakenTimestamp = order.takenDate;
        ticket.ticketTimestamp = Date.now();
        ticket.ticketId = OrderHelper.createTicketId(order);
        ticket.name = 'Customer ' + OrderHelper.getTicketSequenceNumber(order);
        ticket.serverName = serverName;
        ticket.status = OrderStateEnum.waitingForFullPayment;
        ticket.lastModified = Date.now();

        return ticket;
    }

    public static createTicketId(order: IOrder): string {
        let findTicketIdAttempCount = 0;
        let doesTicketIdExist = true;
        let newTicketId = '';

        while (doesTicketIdExist) {
            findTicketIdAttempCount++;
            newTicketId = '0000' + findTicketIdAttempCount.toString();
            newTicketId = newTicketId.substring(newTicketId.length - 3);
            doesTicketIdExist = false;
            for (let i = 0; i < order.groupList.length; i++) {
                if (order.groupList[i].ticketId.toLowerCase().trim() == newTicketId.toLocaleLowerCase().trim()) {
                    doesTicketIdExist = true;
                    break;
                }
            }
        }

        return newTicketId;
    }

    public static getTicketSequenceNumber(order: IOrder): number {
        let ticketNameNumber = 0;
        let doesNameExist = true;
        let newName = '';
        for (let i = 0; i < order.groupList.length; i++) {
            let ticket = order.groupList[i];
            // The name should always be a string (at least an empty string), but no 
            // need to crash if there was a bug that caused the name field to be null
            if (!ticket.name && ticket.name.trim() !== '0') {
                ticket.name = '';
            }

            // default ticket names have 'Customer x' format, where x is a number
            let normalizedName = ticket.name.trim().toLowerCase().replace('customer ', '').trim();

            // check to see if the name is a number, which 
            // may be used to explicitly state seat number
            if (StringUtility.isWholeNumber(normalizedName)) {
                let tempNumber = parseInt(normalizedName);
                if (tempNumber > ticketNameNumber) {
                    ticketNameNumber = tempNumber;
                }
            }
        }

        // always use the next available number
        ticketNameNumber++;

        return ticketNameNumber;
    }

    public static getMenuItemPriceWithMultiplierNoOptions(orderMenuitem: IOrderMenuItem): number {
        var returnValue = NumUtility.toMoney(orderMenuitem.amount * orderMenuitem.price);
        return returnValue;
    }

    public static getPriceImpactFromUnselectedDefaultOption(optionItem: IOrderMenuItemOption): number {
        Debug.assert(optionItem.isSelectedByDefault,
            'OrderHelper', 'Bad paremter for getPriceImpactFromUnselectedDefaultOption '
        + 'option item needs to be isSelectedByDefault, but it is not.');

        let amount = optionItem.price;
        if (optionItem.isMoreThanOne) {
            amount = NumUtility.toMoney(optionItem.selectedQuantityInfo.price * optionItem.selectedQuantityInfo.maxQuantityBeforeCharging);
        }

        
        let optionItemWalker = (optionItem: IOrderMenuItemOption) => {
            optionItem.optionGroupList.forEach((group: IOrderMenuItemOptionGroup) => {
                group.optionList.forEach((childOptionItem: IOrderMenuItemOption) => {
                    if (childOptionItem.isSelectedByDefault) {
                        let childPrice = childOptionItem.price;
                        if (childOptionItem.isMoreThanOne) {
                            childPrice = childOptionItem.selectedQuantityInfo.price * childOptionItem.selectedQuantityInfo.defaultQuantity;
                        }

                        amount = NumUtility.toMoney(amount + childPrice);
                        optionItemWalker(childOptionItem);
                    }
                });
            });
        };

        optionItemWalker(optionItem);

        return amount;
    }

    public static getOptionsImpactingOrder(optionGroupList: Array<IOrderMenuItemOptionGroup>): Array<OrderOptionItemInfo> {
        var returnValue = new Array<OrderOptionItemInfo>();

        let optionWalker = (group: IOrderMenuItemOptionGroup, parentOptionInfoList: Array<OrderOptionItemInfo>, indent: number) => {
            let parentOptionInfo: OrderOptionItemInfo | null = null;
            let parentOption: IOrderMenuItemOption | null = null;
            if (parentOptionInfoList.length > 0) {
                parentOptionInfo = parentOptionInfoList[parentOptionInfoList.length - 1];
                parentOption = parentOptionInfo.optionItem;
            }

            // if an option group has a price, then individual option prices
            // do not count, and only the the total amount of options  over the
            // maxQuantityBeforeCharging amount; essentailly all option items
            // are looked at as a group
            //
            // It doesn't matter what size, becaue if one size charges,
            // then they all should charge.
            //
            // NOTE: bar items do not have a quantityInfoList and don't
            // do group level costing.
            let isCostGroupLevel = false;
            if (group.quantityInfoList.length > 0) {
                isCostGroupLevel = group.quantityInfoList[0].price > 0;
            }

            let optionItemUsedCount = 0;
            let groupQuatityInfo: IOptionGroupQuantityInfo;

            group.optionList.forEach((optionItem: IOrderMenuItemOption) => {
                let parentMultiplyFactor = 1;
                if (parentOptionInfo != null) {
                    parentMultiplyFactor = parentOptionInfo.multiplyFactor;
                }

                if (!groupQuatityInfo) {
                    // the size used by an option is the same for all options
                    groupQuatityInfo = <IOptionGroupQuantityInfo>OrderHelper.getPriceBySize(optionItem.selectedQuantityInfo.size, group.quantityInfoList);
                }

                // the amount for the option is based on the options maxQuantityBeforeCharging, 
                // which is the amount allowed before charging and the amount selected.
                //
                // The effective quanitty to use is impacted by whether the option is selected
                // by default.  If selected by default, then the base menu price
                // includes the maxQuantityBeforeCharging before charging.
                //
                // Also, group based price only has one-level deep of options, option items
                // do not have groups
                let quantityBoundaryToCharge = optionItem.selectedQuantityInfo.maxQuantityBeforeCharging;
                let effectiveQuantityToCharge = optionItem.amount - quantityBoundaryToCharge;

                if (optionItem.isSelected) {
                    optionItemUsedCount += optionItem.amount;
                }

                // canont be negative
                effectiveQuantityToCharge = (effectiveQuantityToCharge < 0) ? 0 : effectiveQuantityToCharge;

                // also, if it is not more-than-one (in other words, it is either have it or not)
                // then set quantityBoundaryToCharge to 1
                if (!optionItem.isMoreThanOne) {
                    effectiveQuantityToCharge = 1;
                }

                let optionInfo = new OrderOptionItemInfo();
                // TODO: multiplyFactor was used to help calculate descendant options,
                // however it also used to calculate the current options price.  however,
                // there is a problem when the default quantity is not 1, because then 
                // the factor used to calcluate current options price is not hte same as
                // the descendant.  For example, let's say that the current option has
                // 4 selected for the quantity and the default quantity to use before charging,
                // is 2.  The effective factor will be 2, but any child options will need
                // to use the factor of 4.
                // TODO: need to add any property to optionInfo that has the mutliplyFactor
                // factor that is used with descendants
                optionInfo.multiplyFactor = effectiveQuantityToCharge * parentMultiplyFactor;
                optionInfo.group = group;
                optionInfo.indent = indent;
                optionInfo.optionItem = optionItem;
                optionInfo.parentOption = parentOption;

                let wasOriginalLiquorTypeReplaced = optionItem.originalBarItemInfo.name !== optionItem.name;

                let barItemPriceDiffBetweenOriginalAndCurrent = 0;
                let originalBarPrice = 0;
                if (optionItem.isBarItem) {
                    let currentBarPrice = optionItem.price;
                    originalBarPrice = NumUtility.toMoney(optionItem.originalBarItemInfo.pricePerUnit * optionItem.selectedQuantityInfo.defaultQuantity);
                    barItemPriceDiffBetweenOriginalAndCurrent = currentBarPrice - originalBarPrice;
                    if (NumUtility.isZero(barItemPriceDiffBetweenOriginalAndCurrent, 0.01)) {
                        barItemPriceDiffBetweenOriginalAndCurrent = 0;
                    }
                }

                // an option is of interest if it is selected but not by default
                // or it is not selected but selected by default
                // or it is a bar item that replaced it's default liquor
                if ((optionItem.isSelected && !optionItem.isSelectedByDefault)
                    || (!optionItem.isSelected && optionItem.isSelectedByDefault)
                    || (optionItem.isSelected && optionItem.isMoreThanOne && optionItem.amount > 0 && !optionItem.isQuantityWordUsed)
                    || (optionItem.isSelected && optionItem.isQuantityWordUsed)
                    /* TODO: the barItemPriceDiffBetweenOriginalAndCurrent should not be needed, remove and test to pull out */
                    || (optionItem.isSelected && optionItem.isBarItem && ((Math.abs(barItemPriceDiffBetweenOriginalAndCurrent) > 0) || wasOriginalLiquorTypeReplaced))) {

                    // There are instances where sub option needs to be in the list 
                    // but the parent is not.  This occurs when the parent option
                    // is selected by default but one of its child options has an impact.
                    if ((parentOption != null) && parentOption.isSelectedByDefault) {
                        parentOptionInfoList.forEach((parentInfo: OrderOptionItemInfo) => {
                            let isParentIntheList = false;
                            for (let i = 0; i < returnValue.length; i++) {
                                if (returnValue[i].optionItem === parentInfo.optionItem) {
                                    isParentIntheList = true;
                                    break;
                                }
                            }

                            if (!isParentIntheList) {
                                // if we got to this point, then the parent option
                                // is already selected.
                                returnValue.push(parentInfo);
                            }
                        });
                    }
                    
                    // Bar items are treated a bit differently.  If a liquor has been replaced,
                    // then the replaced liquor also needs to show up as beeing removed
                    //
                    // NOTE: Use isSelectedByDefault to determine between Bar group and Extra Shot group
                    if (optionItem.isBarItem && optionItem.isSelected && optionItem.isSelectedByDefault) {
                        // the returned list is strictly used for price calculations;
                        // so do not need to set all properties 
                        let replacedLiquorOptionItem = new OrderMenuItemOptionDTO();
                        replacedLiquorOptionItem.parentId = group.id;
                        replacedLiquorOptionItem.id = GUID.create();
                        replacedLiquorOptionItem.isSelectedByDefault = true;
                        replacedLiquorOptionItem.isSelected = false;
                        replacedLiquorOptionItem.name = optionItem.originalBarItemInfo.name;
                        replacedLiquorOptionItem.price = originalBarPrice;

                        let replacedLiquorOptionInfo = new OrderOptionItemInfo();
                        replacedLiquorOptionInfo.group = group;
                        replacedLiquorOptionInfo.indent = indent;
                        replacedLiquorOptionInfo.multiplyFactor = 1
                        replacedLiquorOptionInfo.optionItem = replacedLiquorOptionItem;
                        replacedLiquorOptionInfo.parentOption = parentOption;

                        returnValue.push(replacedLiquorOptionInfo);
                    }

                    // NOTE: Bar items will always have isSelectedByDefault trie.
                    // while "Extra Shots" bar items will not
                    if (optionItem.isBarItem && !optionItem.isSelected && optionItem.isSelectedByDefault) {
                        // for bar items, if it is unselected, then make sure the option
                        // printed on the screen uses the original liquor and price
                        let replacedLiquorOptionItem = new OrderMenuItemOptionDTO();
                        replacedLiquorOptionItem.parentId = group.id;
                        replacedLiquorOptionItem.id = GUID.create();
                        replacedLiquorOptionItem.isSelectedByDefault = true;
                        replacedLiquorOptionItem.isSelected = false;
                        replacedLiquorOptionItem.name = optionItem.originalBarItemInfo.name;
                        replacedLiquorOptionItem.price = originalBarPrice;
                        
                        optionInfo.optionItem = replacedLiquorOptionItem;
                    }

                    returnValue.push(optionInfo);
                }

                if (optionItem.isSelected) {
                    optionItem.optionGroupList.forEach((group: IOrderMenuItemOptionGroup) => {
                        let parentList = new Array<OrderOptionItemInfo>();
                        parentList.push.apply(parentList, parentOptionInfoList);
                        parentList.push(optionInfo);
                        optionWalker(group, parentList, indent + 1);
                    });
                }
            });

            // if is priced by group then create an option info
            // with a custom name and price
            if (isCostGroupLevel) {
                let effectiveGroupItemCount = optionItemUsedCount - groupQuatityInfo!.maxQuantityBeforeCharging;
                if (effectiveGroupItemCount > 0) {
                    let groupOptionInfo = new OrderOptionItemInfo();
                    groupOptionInfo.group = group;
                    groupOptionInfo.multiplyFactor = 1;
                    groupOptionInfo.group = group;
                    groupOptionInfo.indent = indent;
                    groupOptionInfo.optionItem = null;
                    groupOptionInfo.parentOption = null;
                    groupOptionInfo.isIgnoredForKitchenPrint = true;
                    groupOptionInfo.overrideName = group.name + " cost";
                    groupOptionInfo.overridePrice = NumUtility.toMoney(groupQuatityInfo!.price * effectiveGroupItemCount);
                    returnValue.push(groupOptionInfo);
                }
            }
        };

        optionGroupList.forEach((group: IOrderMenuItemOptionGroup) => {
            optionWalker(group, [], 0);
        });

        return returnValue;
    }

    public static getPriceImpactFromOption(optionItem: IOrderMenuItemOption, multiplyFactor = 1): number {
        let amount = 0;

        /*
        if (optionItem.isSelected && optionItem.isSelectedByDefault && multiplyFactor > 1) {
            // if the option is selected by default, then the first one is not charged
            amount = NumUtility.toMoney(NumUtility.toMoney((optionItem.price * multiplyFactor)) - optionItem.price);
            if (NumUtility.isZero(amount)) {
                amount = 0;
            }
        }
        */

        if (optionItem.isSelected && optionItem.isSelectedByDefault && optionItem.isBarItem) {
            // bar item, check to see if the default liquor was changed
            let currentBasePrice = optionItem.price;
            let originalBasePrice = NumUtility.toMoney(optionItem.originalBarItemInfo.pricePerUnit * optionItem.selectedQuantityInfo.defaultQuantity);
            if (!NumUtility.isZero(currentBasePrice - originalBasePrice, 0.015) || (optionItem.name !== optionItem.originalBarItemInfo.name)) {
                amount = currentBasePrice;
            }
        }
        else if (optionItem.isSelected) {
            amount = NumUtility.toMoney(optionItem.price * multiplyFactor);
        }
        else if (!optionItem.isSelected && optionItem.isSelectedByDefault) {
            // if option is unslected but the price of menu item had it already built-in,
            // then need to offset the price
            amount = -OrderHelper.getPriceImpactFromUnselectedDefaultOption(optionItem);
        }

        return amount;
    }

    // isMenuItemQuanityIncluded determines if the prices of the option include multiple factor of the
    // menu item quanity.  For exmaple, if the menu item quantity is 3, and the option item quanity is 2,
    // and the option item price is 2, then the price impact of hte optoin is 3*2*optionPrice.
    public static getPrintOptionItemInfo(menuItem: IOrderMenuItem, isMenuItemQuanityIncluded?: boolean): Array<IOrderOptionItemPrintInfo> {
        let returnValue = new Array<IOrderOptionItemPrintInfo>();

        let optionList = OrderHelper.getOptionsImpactingOrder(menuItem.optionGroupList);
        optionList.forEach((optionItemInfo: OrderOptionItemInfo) => {
            let title = '';
            let quantity = '';
            let price = '';
            let indent = optionItemInfo.indent;

            let optionItem = optionItemInfo.optionItem;
            if (optionItem) {
                let optionItemPrice = OrderHelper.getPriceImpactFromOption(optionItem, optionItemInfo.multiplyFactor);
                if (isMenuItemQuanityIncluded) {
                    optionItemPrice = NumUtility.toMoney(menuItem.amount * optionItemPrice);
                }
    
                if (optionItem.isSelected) {
                    let prefix = 'WITH';
    
                    // if it is bar item and it is an xtra shot (dentoed by !isSelectedByDefault)
                    // then use "XTRA" for the preix
                    if (optionItem.isBarItem && !optionItem.isSelectedByDefault) {
                        prefix = "XTRA";
                    }
    
                    title = prefix + ' ' + optionItem.name;
                    if (optionItem.isMoreThanOne && !optionItem.isQuantityWordUsed) {
                        quantity = optionItem.amount.toString();
                    }
                    else if (optionItem.isQuantityWordUsed) {
                        quantity = optionItem.selectedQuantityWord;
                    }
    
                    if (!NumUtility.isZero(optionItemPrice)
                        && !(optionItem.isSelectedByDefault && optionItem.isMoreThanOne && optionItem.amount === 1)) {
                        price = StringUtility.toPriceText(optionItemPrice);
                    }
                    else {
                        price = ' ';
                    }
                }
                else {
                    title = 'NO ' + optionItem.name;
                    if (!NumUtility.isZero(optionItemPrice)) {
                        price = '(' + StringUtility.toPriceText(optionItemPrice) + ')';
                    }
                    else {
                        price = ' ';
                    }
                }
            }
            else {
                title = optionItemInfo.overrideName;

                let optionItemPrice = optionItemInfo.overridePrice;
                if (isMenuItemQuanityIncluded) {
                    optionItemPrice = NumUtility.toMoney(menuItem.amount * optionItemPrice);
                }
                price = StringUtility.toPriceText(optionItemPrice);
            }

            returnValue.push({
                title: title,
                quantity: quantity,
                isQuantityWordUsed: false ?? optionItem?.isQuantityWordUsed,
                price: price,
                indent: indent
            });
        });

        return returnValue;
    }

    public static getPriceImpactFromOptions(menuItem: IOrderMenuItem): number {
        let optionInfoList = OrderHelper.getOptionsImpactingOrder(menuItem.optionGroupList);
        let amount = 0;

        optionInfoList.forEach((optionItemInfo: OrderOptionItemInfo) => {
            if (optionItemInfo.optionItem) {
                amount +=  OrderHelper.getPriceImpactFromOption(optionItemInfo.optionItem, optionItemInfo.multiplyFactor);
            }
            else {
                amount += optionItemInfo.overridePrice * optionItemInfo.multiplyFactor;
            }
        });

        return NumUtility.toMoney(amount);
    }

    public static calculateMenuItemTotalPrice(menuItem: IOrderMenuItem): number {
        var totalPrice = menuItem.amount * (menuItem.price + OrderHelper.getPriceImpactFromOptions(menuItem));
        return NumUtility.toMoney(totalPrice);
    }

    // discounts are either applied directly to menu item or to ticket or to both
    public static getTicketDiscountCount(ticket: IOrderGroup): number {
        let returnValue = 0;
        ticket.menuItemList.forEach(item => returnValue += item.discountList.length);
        returnValue += ticket.discountList.length;
        return returnValue
    }

    static optionGroupActionWalker(
        optionGroupList: Array<IOptionGroupShared>,
        groupAction: ((group: IOptionGroupShared) => void) | null,
        optionAction: ((optionItem: IOptionShared) => void) | null) {

        optionGroupList.forEach((optionGroup) => {
            if (groupAction) {
                groupAction(optionGroup);
            }

            OrderHelper.optionItemActionWalker(optionGroup.optionList, groupAction, optionAction);
        });
    }

    static optionItemActionWalker(
        optionList: Array<IOptionShared>,
        groupAction: ((group: IOptionGroupShared) => void) | null,
        optionAction: ((optionItem: IOptionShared) => void) | null)  {

        optionList.forEach((optionItem) => {
            if (optionAction) {
                optionAction(optionItem);
            }

            OrderHelper.optionGroupActionWalker(optionItem.optionGroupList, groupAction, optionAction);
        });
    }

    static flattenSelectedOptionList(optionGroupList: Array<OrderMenuItemOptionGroupDTO>): Array<OrderMenuItemOptionDTO> {
        let returnValue = new Array<OrderMenuItemOptionDTO> ();
        let optionItemAction = (optionItem: IOptionShared) => {
            let orderOptionItem  =<IOrderMenuItemOption>optionItem;
            if (orderOptionItem.isSelected) {
                returnValue.push(orderOptionItem);
            }
        }

        OrderHelper.optionGroupActionWalker(optionGroupList, null, optionItemAction);
        return returnValue;
    }

    public static getTotalDiscount(discountList: Array<IDiscount>): number {
        var returnValue = 0;
        discountList.forEach((discount: IDiscount) => {
            returnValue += discount.amount;
        });

        return NumUtility.toMoney(returnValue);
    }

    public static getTicketTotals(ticket: IOrderGroup, taxRate: number): { totalPrice: number, adjustedTax: number, untaxedTotal: number, totalPaid: number, totalTip: number } {
        let returnValue = {
            totalPrice: 0,
            untaxedTotal: 0,
            adjustedTax: 0,
            totalPaid: 0,
            totalTip: 0
        };

        let taxedAmount = 0;
        ticket.menuItemList.forEach((menuItem: IOrderMenuItem) => {
            let menuItemTotalPrice = OrderHelper.calculateMenuItemTotalPrice(menuItem) - OrderHelper.getTotalDiscount(menuItem.discountList);
            if (!menuItem.areTaxesCoveredByPrice) {
                taxedAmount += menuItemTotalPrice;
            }
            else {
                returnValue.untaxedTotal += menuItemTotalPrice;
            }

            returnValue.totalPrice += menuItemTotalPrice;
        });

        // adjust for any discounts directly applied to ticket (not menu item)
        let totalTicketDiscount = 0;
        if (ticket.discountList.length > 0) {
            totalTicketDiscount = OrderHelper.getTotalDiscount(ticket.discountList);
            returnValue.totalPrice -= totalTicketDiscount;
        }


        // Taxas are applied to taxable menu items minus ticket discounts;
        // if ticket discounts exceed taxable amount, then tax is zero and
        // all taxable amount becomes untaxed
        if (totalTicketDiscount > taxedAmount) {
            taxedAmount = 0;
            returnValue.untaxedTotal = ticket.totalPrice;
        }
        else {
            taxedAmount -= totalTicketDiscount;
        }


        let taxTotal = NumUtility.toMoney(taxedAmount * taxRate);
        if (NumUtility.isZero(taxTotal, .02)) {
            returnValue.adjustedTax = 0;
        }
        else {
            returnValue.adjustedTax = NumUtility.toMoney(taxTotal);
        }

        returnValue.totalPrice = NumUtility.toMoney(returnValue.totalPrice);
        returnValue.untaxedTotal = NumUtility.toMoney(returnValue.untaxedTotal);

        let totalPayment = 0;
        let totalTip = 0;
        ticket.paymentList.forEach((paymentItem) => {
            if (!paymentItem.isFullyRefunded && (paymentItem.closedReason !== PaymentClosedReason.voided)) {
                totalPayment += paymentItem.moneyAppliedToBill;
                totalTip += paymentItem.tip;
            }
        });

        returnValue.totalPaid = NumUtility.toMoney(totalPayment);
        returnValue.totalTip = NumUtility.toMoney(totalTip);

        return returnValue;
    }

    public static getTicketTotal(ticket: IOrderGroup) {
        return (ticket.totalPrice + ticket.tax);
    }

    public static getTicketBalance(ticket: IOrderGroup): number {
        let balance = NumUtility.toMoney(OrderHelper.getTicketTotal(ticket) - ticket.totalPaid);
        if (NumUtility.isZero(balance, .004)) {
            balance = 0;
        }

        return balance;
    }

    // updates the order totals based on ticket totals;
    // tickets must be updated before calling this method
    public static getOrderTotals(order: IOrder): { totalPrice: number, adjustedTax: number, untaxedTotal: number, totalPaid: number, totalTip: number } {
        let returnValue = {
            totalPrice: 0,
            untaxedTotal: 0,
            adjustedTax: 0,
            totalPaid: 0,
            totalTip: 0
        };

        order.groupList.forEach((ticketItem) => {
            returnValue.totalPrice += ticketItem.totalPrice;
            returnValue.untaxedTotal += ticketItem.untaxedTotal;
            returnValue.adjustedTax += ticketItem.tax;
            returnValue.totalPaid += ticketItem.totalPaid;
            returnValue.totalTip += ticketItem.totalTip;
        })

        return returnValue;
    }

    // This gets very messy because different menu items do or do not include taxes
    public static getDiscountToZeroOutTicket(ticket: IOrderGroup, taxRate: number): number {
        // What seems to be an easy solution has turned into some type of derivate/integral;
        // TODO: Surely there is a nice math fucntion to get this number vs guessing
        let discount = ticket.totalPrice - ticket.totalPaid/(1+taxRate) - ticket.untaxedTotal*taxRate/(1+taxRate)
        let clonedTicket =<IOrderGroup>ObjectHelper.clone(ticket);
        let testDiscount = OrderHelper.createDiscount(clonedTicket.id);
        testDiscount.amount = discount;
        clonedTicket.discountList.push(testDiscount)

        let wasDiscountFoundToZeroEverythingOut = false;
        let totalAtttempts = 0;
        while (!wasDiscountFoundToZeroEverythingOut && totalAtttempts < 1000) {
            totalAtttempts++;
            let totals = OrderHelper.getTicketTotals(clonedTicket, taxRate);
            let diffrenceToZero = totals.totalPrice - totals.totalPaid + totals.adjustedTax;
            if (NumUtility.isZero(diffrenceToZero, .01)) {
                wasDiscountFoundToZeroEverythingOut = true;
            }
            else {
                if (diffrenceToZero < 0) {
                    discount -= .01;
                }
                else {
                    discount += .01;
                }

                testDiscount.amount = discount;
            }
        }

        return NumUtility.toMoney(discount);
    }

    public static updateOrderAggregators(order: IOrder) {
        let profitCenterLookup: { [name: string]: number } = {};
        let discountLookup: { [name: string]: number } = {};

        order.groupList.forEach((ticketItem) => {
            ticketItem.menuItemList.forEach((menuItem) => {
                // profit center
                if (!profitCenterLookup[menuItem.profitCenter]) {
                    profitCenterLookup[menuItem.profitCenter] = 0;
                }

                let menuItemTotalPrice = OrderHelper.calculateMenuItemTotalPrice(menuItem);
                profitCenterLookup[menuItem.profitCenter] += menuItemTotalPrice;

                // discount
                menuItem.discountList.forEach((discountItem) => {
                    if (!discountLookup[discountItem.name]) {
                        discountLookup[discountItem.name] = 0;
                    }

                    discountLookup[discountItem.name] += discountItem.amount;
                });
            });

            ticketItem.discountList.forEach((discountItem) => {
                if (!discountLookup[discountItem.name]) {
                    discountLookup[discountItem.name] = 0;
                }

                discountLookup[discountItem.name] += discountItem.amount;
            });
        });

        order.profitCenterAggregation = [];
        let profitCenterKeys = Object.keys(profitCenterLookup);
        for (let i = 0; i < profitCenterKeys.length; i++) {
            let key = profitCenterKeys[i];
            order.profitCenterAggregation.push({
                id: key,
                parentId: order.id,
                amount: NumUtility.toMoney(<number>profitCenterLookup[key]),
                typeName: 'AggregationDTO'
            });
        }

        // alphabetize the profit center agg list
        order.profitCenterAggregation.sort((a, b): number => {
            if (a.id === b.id) {
                return 0;
            }
            else if (a.id < b.id) {
                return -1;
            }
            else {
                return 1;
            }
        });

        order.discountAggregation = [];
        let discountKeys = Object.keys(discountLookup);
        for (let i = 0; i < discountKeys.length; i++) {
            let key = discountKeys[i];
            order.discountAggregation.push({
                id: key,
                parentId: order.id,
                amount: NumUtility.toMoney(<number>discountLookup[key]),
                typeName: 'AggregationDTO'
            });
        }

        // alphabetize the discount agg list
        order.profitCenterAggregation.sort((a, b): number => {
            if (a.id === b.id) {
                return 0;
            }
            else if (a.id < b.id) {
                return -1;
            }
            else {
                return 1;
            }
        });
    }

    static resetOrderMenuItemChoicePrice(selectePriceName: string, menuItem: IOrderMenuItem): boolean {
        let isSizeFoundInAllQuantityInfoList = true;
        let optionAction = (optionItem: IOrderMenuItemOption) => {
            let selectedQuantityInfo = OrderHelper.getPriceBySize(selectePriceName, optionItem.quantityInfoList);
            if (!selectedQuantityInfo) {
                isSizeFoundInAllQuantityInfoList = false;
            }
            else {
                optionItem.price = selectedQuantityInfo.price;
                optionItem.selectedQuantityInfo = <IOptionQuantityInfo>selectedQuantityInfo;
            }
        }

        OrderHelper.optionGroupActionWalker(menuItem.optionGroupList, null, <(optionItem: IOptionShared) => void>optionAction);

        return isSizeFoundInAllQuantityInfoList;
    }

    static updateTicketSearchOptimizationKeyList(ticket: IOrderGroup, liquorInventoryList: Array<InventoryItem>) {
        // Last Four Credit Card Info
        ticket.paymentLastFourList = [];
        ticket.paymentList.forEach((paymentItem) => {
            let lastFourValue = paymentItem.lastFour.trim();
            if ((paymentItem.transactionType === PayTransationTypeEnum.payByCard) && !StringUtility.isNullOrEmpty(lastFourValue)) {
                let wasLastFourAlreadyInList = ticket.paymentLastFourList.findIndex(i => i.id === lastFourValue) >= 0;
                if (!wasLastFourAlreadyInList) {
                    ticket.paymentLastFourList.push({
                        id: lastFourValue,
                        parentId: ticket.id,
                        typeName: 'SearchOptimizationKeyDTO'
                    });
                }
            }
        });

        ticket.paymentLastFourList.sort((a, b) => a.id.localeCompare(b.id));

        // bar beverage info
        ticket.doesTicketIncludeLiquor = false;
        ticket.liquorUsageList = [];
        ticket.menuItemList.forEach((menuItem) => {
            if (menuItem.isBarBeverage) {
                ticket.doesTicketIncludeLiquor = true;
                let flattenedOptionList = OrderHelper.flattenSelectedOptionList(menuItem.optionGroupList);
                flattenedOptionList.forEach((optionItem) => {
                    if (optionItem.isBarItem) {
                        let existingAggregrator = ticket.liquorUsageList.find(i => i.name === optionItem.name);
                        if (existingAggregrator) {
                            existingAggregrator.units += optionItem.selectedQuantityInfo.defaultQuantity;
                        }
                        else {
                            // NOTE: all liquor inventory items have a unqiue name regardless
                            // of class cand category
                            let liquorInventoryItem = liquorInventoryList.find(i => i.name === optionItem.name);
                            let className = "UNKNOWN";
                            if (liquorInventoryItem) {
                                className = liquorInventoryItem.className;
                            } 

                            let liquorAgg = {
                                name: optionItem.name,
                                className: className,
                                units: optionItem.selectedQuantityInfo.defaultQuantity
                            }

                            ticket.liquorUsageList.push(liquorAgg);
                        }
                    }
                });
                
            }
        });

        ticket.liquorUsageList.sort((a, b) => {
            if (a.className === b.className) {
                return a.name.localeCompare(b.name);
            }
            else {
                return a.className.localeCompare(b.className);
            }
        })
    }

    static mapTicketLiquorInfoByClass(liquorInfoList: Array<ITicketLiquorUsageInfo>): Array<{ 
            className: string, 
            liquorList: Array<{name: string, units: number}>
        }> {

        let classNameToLiquorListLookup: {[className: string]: Array<{name: string, units: number}>} = {};
        let returnValue = new Array<{ 
            className: string, 
            liquorList: Array<{name: string, units: number}>
        }>();

        liquorInfoList.forEach((liquorInfoItem) => {
            liquorInfoItem.liquorUsageList.forEach((liquorUsageItem) => {
                let classGroup = returnValue.find(i => i.className === liquorUsageItem.className);
                if (!classGroup) {
                    classGroup = {
                        className: liquorUsageItem.className,
                        liquorList: [{ name: liquorUsageItem.name, units: liquorUsageItem.units }]
                    }

                    returnValue.push(classGroup);
                }
                else {
                    let liquorItem = classGroup.liquorList.find(i => i.name === liquorUsageItem.name);
                    if (!liquorItem) {
                        classGroup.liquorList.push({ name: liquorUsageItem.name, units: liquorUsageItem.units});
                    }
                    else {
                        liquorItem.units += liquorUsageItem.units;
                    }
                }
            });
        });

        returnValue.sort((a, b) => a.className.localeCompare(b.className));
        returnValue.forEach((classGroup) => {
            classGroup.liquorList.sort((a, b) => a.name.localeCompare(b.name));
        });

        return returnValue;

    }

    public static doesTicketHaveAnyPayments(ticket: IOrderGroup): boolean {
        return ticket.paymentList.length > 0;
    }

    public static doesOrderHaveAnyPayments(order: IOrder): boolean {
        for (let i = 0; i < order.groupList.length; i++) {
            if (OrderHelper.doesTicketHaveAnyPayments(order.groupList[i])) {
                return true;
            }
        }

        return false;
    }

    public static createPayment(orderGroup: IOrderGroup, restaurantId: string, posDeviceId: string, cashDrawerId: string): PaymentDTO {
        var payment = new PaymentDTO();
        payment.lastModified = Date.now();

        payment.id = GUID.create();
        payment.parentId = orderGroup.id;
        payment.orderId = orderGroup.parentId;
        payment.restaurantId = restaurantId;
        payment.orderTakenTimestamp = orderGroup.orderTakenTimestamp;

        payment.serverId = orderGroup.serverName;
        payment.posDeviceId = posDeviceId;
        payment.cashDrawerId = cashDrawerId;

        payment.transactionTime = Date.now();

        // TODO: payment.type has been deprecated
        payment.type = ''
        payment.transactionType = PayTransationTypeEnum.payByCash;
        payment.state = PaymentState.open;

        // TODO: partialpaymentbalance, paymentpercent have been deprecarted
        payment.partialPaymentBalance = 0;
        payment.partialPaymentPercent = 0;

        return payment
    }

    public static applyCreditTransactionToPayment(cardTransaction: ICardTransaction, payment: IPayment) {
        payment.lastFour = cardTransaction.cardObscured;
        payment.cardExp = cardTransaction.cardExp;
        payment.nameOnCard = cardTransaction.nameOnCard;
        payment.cardId = cardTransaction.cardId;
        payment.cardPresentType = cardTransaction.cardPresentType;
        payment.cardEntryMode = cardTransaction.cardEntryMode;
        payment.cardAuthCode = cardTransaction.cardAuthCode;
        payment.cardBalanceAmount = NumUtility.toMoney(parseInt(cardTransaction.cardBalanceAmount) / 100);

        payment.cardTerminalId = cardTransaction.cardTerminalId;
        payment.cardAid = cardTransaction.cardAid;
        payment.cardIad = cardTransaction.cardIad;
        payment.cardTvr = cardTransaction.cardTvr;
        payment.cardTsi = cardTransaction.cardTsi;
        payment.cardArc = cardTransaction.cardArc;
        payment.cardCvm = cardTransaction.cardCvm;
    }

    public static createRefundPayment(
        orderGroup: IOrderGroup,
        restaurantId: string,
        posDeviceId: string,
        cashDrawerId: string,
        serverName: string,
        amount: number,
        transactionType: 'refundByCard' | 'refundByCash'): PaymentDTO {

        var payment = new PaymentDTO();
        payment.lastModified = Date.now();

        payment.id = GUID.create();
        payment.parentId = orderGroup.id;
        payment.restaurantId = restaurantId;
        payment.orderId = orderGroup.parentId;
        payment.orderTakenTimestamp = orderGroup.orderTakenTimestamp;
        payment.serverId = serverName;
        payment.posDeviceId = posDeviceId;
        payment.cashDrawerId = cashDrawerId;

        // TODO: Perhaps this should be the transaction time from the payment processor
        payment.transactionTime = Date.now();
        // type is deprecated
        payment.type = '';
        payment.transactionType = transactionType;

        // TODO: partialpaymentbalance, paymentpercent have been deprecarted
        payment.partialPaymentBalance = 0;
        payment.partialPaymentPercent = 0;
        payment.moneyAppliedToBill = 0;

        payment.moneyReturned = amount;
        payment.tip = 0;
        OrderHelper.closePayment(payment, PaymentClosedReason.transactionComplete);

        return payment;
    }

    public static closePayment(payment: IPayment, closeReason: PaymentClosedReason) {
        payment.closedReason = closeReason;
        payment.isClosed = true;
        payment.state = PaymentState.closed;
        payment.lastModified = Date.now();
    }

    public static createDiscount(parentId: string) {
        let returnValue = new DiscountDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = parentId;
        returnValue.discountType = DiscountTypeEnum.customDiscountType;

        return returnValue;
    }

    public static createCashDrawer(posDevice: PosDeviceDTO, serverName: string): CashDrawerDTO {
        let returnValue = new CashDrawerDTO();
        returnValue.id = GUID.create();
        returnValue.parentId = posDevice.id;
        returnValue.restaurantId = posDevice.parentId;
        returnValue.openDate = Date.now();
        returnValue.openedByUser = serverName;
        returnValue.lastModified = Date.now();

        return returnValue;
    }

    public static addCashToTill(cashDrawer: CashDrawerDTO, serverName: string, amount: number, reason: string) {
        let cashChangeInfo = new CashChangeInfoDTO();
        cashChangeInfo.id = GUID.create();
        cashChangeInfo.parentId = cashDrawer.id;
        cashChangeInfo.time = Date.now();
        cashChangeInfo.user = serverName
        cashChangeInfo.amount = amount;
        cashChangeInfo.reason = reason;

        cashDrawer.cashAddedTotal += amount;
        cashDrawer.lastModified = Date.now();
        cashDrawer.cashAddedList.push(cashChangeInfo);
    }

    public static isOrderDirty(original: IOrder, compare: IOrder): boolean {
        if ((original.lastModified != compare.lastModified) ||
            !NumUtility.isZero(original.totalPrice - compare.totalPrice, .01) ||
            !NumUtility.isZero(original.totalPaid - compare.totalPaid, .01) ||
            (original.tableId.toLowerCase() != compare.tableId.toLowerCase()) ||
            (original.groupList.length != compare.groupList.length) ||
            (original.contactName != compare.contactName) ||
            (original.contactAddress != compare.contactAddress) ||
            (original.contactPhone != compare.contactPhone) ||
            (original.orderType != compare.orderType)) {
            return true;
        }
        else {
            return ObjectHelper.isObjectDirty(original, compare);
        }
    }

    public static isMenuItemDirty(original: IOrderMenuItem, compare: IOrderMenuItem): boolean {
        return ObjectHelper.isObjectDirty(original, compare, false);
    }
}