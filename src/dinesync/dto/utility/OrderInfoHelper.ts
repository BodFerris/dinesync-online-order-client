import { OrderMenuItemDTO, OrderMenuItemOptionDTO, IOrderMenuItemOptionGroup, OrderMenuItemOptionGroupDTO, IOptionGroupQuantityInfo, IOptionQuantityInfo } from '../OrderDTO';
import { IOptionShared, IOptionGroupShared } from '../MenuDTO';
import { OrderHelper } from './OrderHelper';

export class OrderInfoHelper {
    static doChoicesAffectPrice(orderMenuItem: OrderMenuItemDTO) {
        let returnValue = false;

        let optionWorker = (optionItem: IOptionShared) => {
            if (optionItem.quantityInfoList.some(i => i.price > 0)) {
                returnValue = true;
            }
        }

        let groupWorker = (groupItem: IOptionGroupShared) => {
            if (groupItem.quantityInfoList.some(i => i.price > 0)) {
                returnValue = true;
            }
        }

        // NOTE: Perf can be improved by creating a short-circuit walker; 
        // but reusing the existing walker that will iterate over every option
        OrderHelper.optionGroupActionWalker(orderMenuItem.optionGroupList, groupWorker, optionWorker);

        return returnValue;
    }

    static doesOptionGroupAffectPrice(optionGroup: OrderMenuItemOptionDTO) {
        let returnValue = false;
        returnValue = optionGroup.quantityInfoList.some(i => i.price);
        return returnValue;
    }

    // validates the option and the option items, returning a list of warnings and errors.
    // error is when a max quantity is exceeded
    // warning is when  min quantity has not been met
    static validateOptionGroup(optionGroup: OrderMenuItemOptionGroupDTO, size: string): {warningList: Array<string>, errorList: Array<string>} {
        // validation is either done group level or option level;
        // NOTE: it doesn't matter what quanitfy checked to see if pricing
        // is based on group level or option level.  If done at group levle, then
        // the quantity info for all sizes will have a price > 0
        let returnValue = {warningList: new Array<string>(), errorList: new Array<string>() };

        if (optionGroup.quantityInfoList.length === 0) {
            // bar bevverages do not have group qntity info lists and do not need to be validated
            return returnValue;
        }

        let optionsImpactingOrder = OrderHelper.getOptionsImpactingOrder([optionGroup]);
        let groupQuantityInfo = <IOptionGroupQuantityInfo>OrderHelper.getPriceBySize(size, optionGroup.quantityInfoList);

        // TODO: I'm not too sure why validation was only done if price is not zero;
        // in somecases, menu items allow to pick 2 sides out of 4, for example
        // If making true does not regress, then keep it
        //let isValidationDonebyGroupLevel = groupQuantityInfo.price > 0;
        let isValidationDonebyGroupLevel = true;

        if (isValidationDonebyGroupLevel) {
            let totalOptionsSelected = optionsImpactingOrder.reduce((agg, i) => {
                if (i.optionItem && i.optionItem.isSelected) {
                    agg += i.optionItem.amount;
                }
     
                return agg;
             }, 0);

             if ((groupQuantityInfo.maxOptionsAllowed !== 0) && (totalOptionsSelected > groupQuantityInfo.maxOptionsAllowed)) {
                 returnValue.errorList.push(`Exceeded max options allowed for ${optionGroup.name}.  Max selection allowed is ${groupQuantityInfo.maxOptionsAllowed}.`);
             }

             if ((groupQuantityInfo.minOptionsAllowed !== 0)  && (totalOptionsSelected < groupQuantityInfo.minOptionsAllowed)) {
                 let amountOfOptionsAvailable = groupQuantityInfo.minOptionsAllowed - totalOptionsSelected ;
                 returnValue.warningList.push(`You can select ${amountOfOptionsAvailable} more options for ${optionGroup.name}.`);
             }
        }
        else {
            // validate each option
            optionsImpactingOrder.forEach((optionItemInfo) => {
                if (optionItemInfo.optionItem!.isSelected) {
                    let optionQuantityInfo = <IOptionQuantityInfo>OrderHelper.getPriceBySize(size, optionItemInfo.optionItem!.quantityInfoList);
                    let optionQty = optionItemInfo.optionItem!.amount;
                    if ((optionQuantityInfo.maxQuantityAllowed !== 0) &&  (optionQty > optionQuantityInfo.maxQuantityAllowed)) {
                        returnValue.errorList.push(`Exceeded max quantity allowed for ${optionItemInfo.optionItem!.name} in ${optionGroup.name}.  Max selection allowed is ${optionQuantityInfo.maxQuantityAllowed}.`);
                    }

                    if (optionQty < optionQuantityInfo.minExpectedQuantity) {
                        let amountOfQtyAvailable = optionQuantityInfo.minExpectedQuantity - optionQty;
                        returnValue.warningList.push(`You can add ${amountOfQtyAvailable} more to your quantity for ${optionItemInfo.optionItem!.name} in ${optionGroup.name}.`);
                    }
                }
            });
        }

        return returnValue;
    }
}