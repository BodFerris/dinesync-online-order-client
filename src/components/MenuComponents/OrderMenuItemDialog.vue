<template>
    <ModalDialog ref="dialog" v-if="orderMenuItem" :isManuallyClosed="true" @closeRequested="closeRequested" 
            headerPadding="0px" contentPadding="0px" >
        <template v-slot:header>
            <div class="menuItemHeadingContainer">
                <div class="headingMainContentContainer">
                    <div ref="menuItemHeading" class="menuItemHeading">
                        <div style="margin-right: 1rem;">{{ orderMenuItem.name }}</div>
                        <button ref="changePriceButton" v-if="orderMenuItem.priceList.length > 1" class="changePriceButton"
                                @click="showPriceDropdown()">
                            <div class="buttonContent multipleSizes">
                                <i class="material-icons">edit</i>
                                <div v-if="isNullOrEmpty(selectedPrice.price.size)" class="headingSizeLabel">{{ selectedPrice.price.size }}</div>
                                <div>{{ toPriceText(selectedPrice.price) }}</div>
                            </div>
                        </button>
                        <div v-else>{{ toPriceText(selectedPrice.price) }}</div>
                    </div>
                    <div class="menuItemSubheading" v-if="isBreakdownPriceShown">
                        <div class="menuItemSubheadingLabelInfo">
                            <div class="label">base</div><div>{{ toPriceText(orderPriceSummary.basePrice) }}</div>
                        </div>
                        <div class="menuItemSubheadingLabelInfo">
                            <div class="label">add-on</div><div>{{ toPriceText(orderPriceSummary.addOnPrice) }}</div>
                        </div>
                        <div class="menuItemSubheadingLabelInfo">
                            <div class="label">total</div><div>${{ toPriceText(toMoney(orderPriceSummary.basePrice + orderPriceSummary.addOnPrice)) }}</div>
                        </div>
                    </div>
                </div>

                <div class="headingQtyContainer">
                    <div style="margin-left: 1.7rem;">
                        <div style="font-size: 1.5rem; font-weight: 400; margin-bottom: 0.3rem; text-align: center;">quantity</div>
                        <div class="quantityInputContainer">
                            <button class="outlineButton" @click="changeQty(-1)" style="border-color: var(--var-primaryFont-color); border-width: 1px;">
                                <div class="buttonContent"><i class="material-icons">remove</i></div>
                            </button>
                            <div class="quantityLabel">{{ orderMenuItem.amount }}</div>
                            <button class="outlineButton" @click="changeQty(1)" style="border-color: var(--var-primaryFont-color); border-width: 1px;">
                                <div class="buttonContent"><i class="material-icons">add</i></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:content>
            <div style="display: flex; flex-direction: column; padding: 0 2rem 0 2rem;">
                <button v-if="orderMenuItem.isBarBeverage" class="nux-flatButton addLiquorButton">
                    <div class="buttonContentContainer">
                        <i class="material-icons">add</i><span>Add Liquor</span>
                    </div>
                </button>
                <div style="margin-top: 1rem;" :class="{barMenuItemOptionGroupsContainer: orderMenuItem.isBarBeverage}">
                    <div v-for="(optionGroup, i) in orderMenuItem.optionGroupList" :key="optionGroup.id" class="choiceGroupContainer">
                        <div :ref="el => { groupHeadingElementList[i] = el }" class="choicesHeading" @click="showErrorDialogForGroup(optionGroup)">
                            <i v-if="(errorList.length) > 0 && optionGroup._errorList && (optionGroup._errorList.length > 0)" class="material-icons" style="font-size: 2rem; color: red;">error</i>
                            <div>{{ optionGroup.name }}</div>
                        </div>
                        <div class="choicesSubheading" v-if="getGroupSubHeadingText(optionGroup) != ''">{{ getGroupSubHeadingText(optionGroup) }}</div>
                        <OrderMenuItemOptionView v-for="optionItem in optionGroup.optionList" :key="optionItem.id" 
                                :orderMenuItemOption="optionItem" :orderMenuItemOptionGroup="optionGroup"
                                :isBarBeverage="orderMenuItem.isBarBeverage" :doesGroupControlPricing="getGroupSubHeadingText(optionGroup) != ''" 
                                @changeLiquorRequested="handleLiquorChangeRequested"/>
                    </div>
                    <div v-if="orderMenuItem.isBarBeverage && orderMenuItem.optionGroupList.length == 1">
                        Custmoize your drink<br/>by adding liquor
                    </div>
                </div>
            </div>
        </template>

    </ModalDialog>

    <SimpleDialog ref="errorDialog">
        <div>
            <div class="mainLabel warningErrorLabel">Errors</div>
            <div style="font-size: 1.7rem; padding: 0.5rem 0;" v-for="errorItem in errorList" :key="errorItem">{{ errorItem }}</div>
            <div v-if="warningList.length > 0" class="mainLabel warningErrorLabel" style="margin-top: 1.5rem;">Warnings</div>
            <div style="font-size: 1.7rem; padding: 0.5rem 0;" v-for="warningItem in warningList" :key="warningItem">{{ warningItem }}</div>
        </div>
    </SimpleDialog>

    <ConfirmDialog ref="warningConfirmDialog">
        <div style="font-size: 1.7rem; max-width: 42rem;">
            <div style="margin-bottom: 1rem;">You have not selected some choices that come with your order.</div>
            <div style="font-size: 1.7rem; padding: 0.5rem 0;" v-for="warningItem in warningList" :key="warningItem">{{ warningItem }}</div>

            <div style="margin-top: 1.5rem;">
                <span style="font-weight:bold;">Do you want to continue with closing this dialog?</span>
            </div>
        </div>
    </ConfirmDialog>

    <InventorySelector ref="inventorySelector" />

    <DropdownFlyout ref="priceDropdown" textFieldName="dropdownText" :itemList="priceDropdownList" width="16rem" 
        @selected="changeSize" />

</template>

<script lang="ts">
import { defineComponent, ref, nextTick, watchEffect, onErrorCaptured, WatchStopHandle} from 'vue';

import ModalDialog, { IModalDialog } from '@/next-ux2/components/dialogs/modal-dialog.vue';
import SimpleDialog, { ISimpleDialog } from '@/next-ux2/components/dialogs/simple-dialog.vue';
import ConfirmDialog, { IConfirmDialog } from '@/next-ux2/components/dialogs/confirm-dialog.vue';
import DropdownFlyout, { IDropdownFlyout } from '@/next-ux2/components/containers/dropdown-flyout.vue'

import OrderMenuItemOptionView from './OrderMenuItemOptionView.vue';
import InventorySelector, { IInventorySelector } from './InventorySelector.vue';

import { OrderMenuItemDTO, OrderMenuItemOptionGroupDTO, IOptionGroupQuantityInfo, OrderMenuItemOptionDTO } from '@/dinesync/dto/OrderDTO';
import { IMenuItemPrice, InventoryItem, IOptionGroupShared } from '@/dinesync/dto/MenuDTO';

import { StringUtility, NumUtility } from '@/next-ux2/utility';
import { MenuHelper } from '@/dinesync/dto/utility/MenuHelper';
import { OrderInfoHelper } from '@/dinesync/dto/utility/OrderInfoHelper';
import { OrderHelper } from '@/dinesync/dto/utility/OrderHelper';
import confirmDialogVue from '@/next-ux2/components/dialogs/confirm-dialog.vue';

export interface IOrderMenuItemDialog {
    show(orderMenuItemInfo: OrderMenuItemDTO, liquorInventoryList: Array<InventoryItem>): Promise<string>;
    hide(value: string): void;
}

interface IPriceInfo {
    size: string,
    price: number
}

export default defineComponent({
    name: 'OrderMenuItemDialog',
    components: {
        ModalDialog,
        SimpleDialog,
        ConfirmDialog,
        DropdownFlyout,
        OrderMenuItemOptionView,
        InventorySelector
    },
    setup(props, context) {
        let stopWatchEffect: WatchStopHandle;
        let liquorList = new Array<InventoryItem>();

        // template refs
        const dialog = ref(null as unknown as IModalDialog);
        const errorDialog = ref(null as unknown as ISimpleDialog);
        const warningConfirmDialog = ref(null as unknown as IConfirmDialog);
        const inventorySelector = ref(null as unknown as IInventorySelector)
        const priceDropdown = ref(null as unknown as IDropdownFlyout);
        const menuItemHeading = ref(null as unknown as HTMLElement);
        const changePriceButton = ref(null as unknown as HTMLElement);
        const groupHeadingElementList = ref(new Array<HTMLElement>());
        
        // data
        const orderMenuItem = ref(null as unknown as (OrderMenuItemDTO | null));
        const selectedPrice = ref(null as unknown as IPriceInfo);
        const priceDropdownList = ref(new Array<{size: string, price: number, dropdownText: string}>());
        const orderPriceSummary = ref({basePrice: 0, addOnPrice: 0});
        const isBreakdownPriceShown = ref(false);
        const errorList = ref(new Array<string>());
        const warningList = ref(new Array<string>());

        // public methods
        const toPriceText = StringUtility.toPriceText;
        const toMoney = NumUtility.toMoney;

        const getGroupSubHeadingText = (optionGroup: OrderMenuItemOptionGroupDTO) => {
            if (!optionGroup.quantityInfoList || optionGroup.quantityInfoList.length === 0) {
                // bar menu items do not have quantityInfoList in optiongroups
                return '';
            }

            let returnValue = '';
            
            let selectedSize = orderMenuItem.value!.size;
            let quantityInfo = OrderHelper.getPriceBySize(selectedSize, optionGroup.quantityInfoList) as IOptionGroupQuantityInfo;
            // TODO: Add an assert if quantity info is null
            if (quantityInfo.minOptionsAllowed > 0) {
                returnValue += `Choose any`;

                if (quantityInfo.minOptionsAllowed > 1) {
                    returnValue += ` ${quantityInfo.minOptionsAllowed}`;
                }
            }

            if (quantityInfo.maxOptionsAllowed > 0) {
                if (quantityInfo.minOptionsAllowed > 0) {
                    returnValue += ` up to a max of ${quantityInfo.maxOptionsAllowed }.`;
                }
                else {
                    returnValue += `Choose up to a max of ${quantityInfo.maxOptionsAllowed }.`
                }
            }

            if (quantityInfo.price > 0) {
                if (returnValue != '') {
                    returnValue += ' ';
                }

                returnValue += `$${toPriceText(quantityInfo.price)} extra`;

                if (quantityInfo.maxQuantityBeforeCharging === 0) {
                    returnValue += ' for each one.';
                }

                if (quantityInfo.maxQuantityBeforeCharging > 0) {
                    returnValue += ` for any over ${quantityInfo.maxQuantityBeforeCharging}.`;
                }
            }

            return returnValue;
        };

        const showErrorDialogForGroup = (optionGroup: OrderMenuItemOptionGroupDTO) => {
            errorList.value = new Array<string>();
            warningList.value = new Array<string>();

            let errorListToAdd = (optionGroup as any)._errorList as Array<string>;
            let warningListToAdd = (optionGroup as any)._warningList as Array<string>;

            errorList.value.push(...errorListToAdd)
            warningList.value.push(...warningListToAdd);

            if ((errorList.value.length > 0) || (warningList.value.length > 0)) {
                let anchor = groupHeadingElementList.value[orderMenuItem.value!.optionGroupList.indexOf(optionGroup)];
                errorDialog.value.show(anchor, 'left', 'bottom');
            }
        }

        const closeRequested = async (closeValue: string) => {
            errorList.value = new Array<string>();
            warningList.value = new Array<string>();

            if (closeValue === 'ok') {
                // validate the data
                let groupAction = (group: IOptionGroupShared) => {
                    let groupInfo = group as any;
                    if (groupInfo._errorList) {
                        errorList.value.push(...groupInfo._errorList)
                    }

                    if (groupInfo._warningList) {
                        warningList.value.push(...groupInfo._warningList);
                    }
                }

                OrderHelper.optionGroupActionWalker(orderMenuItem.value!.optionGroupList, groupAction, null);

                if ((errorList.value.length === 0) && (warningList.value.length === 0)) {
                    stopWatchEffect();
                    dialog.value.hide('ok');
                }
                else if (errorList.value.length > 0) {
                    errorDialog.value.show(menuItemHeading.value, 'center', 'bottom');
                }
                else if (warningList.value.length > 0) {
                    let anchor =  dialog.value.footerElement;
                    let confirmDialog = warningConfirmDialog.value;
                    let confirmResult = await confirmDialog.show(anchor, 'center', 'top');
                    if (confirmResult) {
                        stopWatchEffect?.();
                        dialog.value.hide(closeValue);
                    }
                }
            }
            else  {
                stopWatchEffect?.();
                dialog.value.hide(closeValue);
            }

        };

        const show = async (orderMenuItemInfo: OrderMenuItemDTO, liquorInventoryList: Array<InventoryItem>): Promise<string> => {
            liquorList = liquorInventoryList;

            // add a properties to bind any errors and warnings to the ux
            let groupAction = (optionGroup: IOptionGroupShared) => { (optionGroup as any)._errorList = []; (optionGroup as any)._warningList; };
            OrderHelper.optionGroupActionWalker(orderMenuItemInfo.optionGroupList, groupAction, null);
            errorList.value = [];
            warningList.value = [];

            priceDropdownList.value = [];
            orderMenuItemInfo.priceList.forEach(i => {
                let dropdownText = StringUtility.toPriceText(i.price);
                if (!StringUtility.isNullOrEmpty(i.size)) {
                    dropdownText += ` (${i.size})`;
                }
                priceDropdownList.value.push({ 
                    size: i.size, 
                    price: i.price, 
                    dropdownText: dropdownText
                });
            });

            // 30 Aug 2020: Bug with Vue 3 Beta.
            // If an object is an exact copy of an existing object but a new refernece,
            // Vue will map it to other instances. This is problematic when you want to
            // databind to a clone of an object.  The isue seemed to be with any child
            // objects of the object being bound.
            //
            // To work around-this issue.  Set the value to null then wait for a ui tick,
            // then set the reference
            // anywhere as a reference
            orderMenuItem.value = null;
            await nextTick();

            orderMenuItem.value = orderMenuItemInfo;
            selectedPrice.value = orderMenuItem.value.priceList.find(i => i.size === orderMenuItem.value!.size) as IPriceInfo;
            isBreakdownPriceShown.value = OrderInfoHelper.doChoicesAffectPrice(orderMenuItemInfo);

            // update the pricing whenver price or order menu item mutates
            stopWatchEffect = watchEffect(()=> {
                if (orderMenuItem.value) {
                    orderPriceSummary.value = {
                        basePrice: orderMenuItem.value.price, 
                        addOnPrice: OrderHelper.getPriceImpactFromOptions(orderMenuItem.value)
                    }

                    // validate the data to show any erors on option groups:
                    // NOTE: This might be a perf issue on very low end machines since
                    // it will go through all groups and options any any one option changes
                    let groupAction = (optionGroup: IOptionGroupShared) => { 
                        let optionGroupData = optionGroup as OrderMenuItemOptionGroupDTO;
                        let errorAndWarningLists = OrderInfoHelper.validateOptionGroup(optionGroupData, orderMenuItem.value!.size);
                        (optionGroupData as any)._errorList = errorAndWarningLists.errorList;
                        (optionGroupData as any)._warningList = errorAndWarningLists.warningList;
                    }

                    OrderHelper.optionGroupActionWalker(orderMenuItem.value.optionGroupList, groupAction, null);
                }
            });

            // wait for the ui to udpate before showing the dialog
            await nextTick();
            
            let result = await dialog.value.show();

            // remove the properties added to bind errors and warnings
            groupAction = (optionGroup: IOptionGroupShared) => { delete(optionGroup as any)['_errorList']; delete (optionGroup as any)['_warningList']; };
            OrderHelper.optionGroupActionWalker(orderMenuItemInfo.optionGroupList, groupAction, null);

            return result;
        }
        
        const showPriceDropdown = () => {
            if (orderMenuItem.value!.priceList.length > 1) {
                let anchorElement = changePriceButton.value;
                let priceDropdown_ = priceDropdown.value;
                let selectedPrice = priceDropdownList.value.find(i => i.size === orderMenuItem.value!.size);
                priceDropdown_.setSelectedItem(selectedPrice);
                priceDropdown_.show(anchorElement);
            }
        }

        const changeQty = (offset: number) => {
            let newValue = orderMenuItem.value!.amount + offset;
            if (newValue < 0) {
                newValue = 1;
            }

            orderMenuItem.value!.amount = newValue;
        }

        const changeSize = (sizeInfo: {size: string, price: number}) => {
            if (!sizeInfo) {
                return;
            }

            if (sizeInfo.size !== orderMenuItem.value!.size) {
                orderMenuItem.value!.price = sizeInfo.price;
                orderMenuItem.value!.size = sizeInfo.size;
                selectedPrice.value = orderMenuItem.value!.priceList.find(i => i.size == sizeInfo.size) as IPriceInfo;
                OrderHelper.resetOrderMenuItemChoicePrice(sizeInfo.size, orderMenuItem.value!);
                OrderHelper.updateOptionsQuantityFromSizeChange(orderMenuItem.value!, orderMenuItem.value!.size, sizeInfo.size);
            }
        }

        const handleLiquorChangeRequested = async (eventArgs: { optionGroup: OrderMenuItemOptionGroupDTO, optionItem: OrderMenuItemOptionDTO }) => {
            let inventoryItem =  liquorList.find(i => i.name === eventArgs.optionItem.name);
            let classSelect = 'ALL';
            let categorySelect = 'ALL';
            if (inventoryItem) {
                classSelect = inventoryItem.className;
                categorySelect = inventoryItem.categoryName;
            }

            let anchorElement = menuItemHeading.value;
            let selectedLiquorItem = await inventorySelector.value.show(liquorList, anchorElement, classSelect, categorySelect);
            if (selectedLiquorItem) {
                // update the option price per unt and prices for the sizes
                // with the new liquor
                if (selectedLiquorItem.name !== eventArgs.optionItem.name) {
                    OrderHelper.updateBarOptionWithNewLiquor(eventArgs.optionItem, selectedLiquorItem);

                    // Need to adjust all the prices to the menu item after a liquor was changed
                    //OrderHelper.resetOrderMenuItemChoicePrice(orderMenuItem.value!.size, orderMenuItem.value!);
                }
            }
        }

        return {
            dialog,
            inventorySelector,
            priceDropdown,
            changePriceButton,
            changeSize,
            errorDialog,
            warningConfirmDialog,
            menuItemHeading,
            groupHeadingElementList,

            orderMenuItem,
            selectedPrice,
            priceDropdownList,
            orderPriceSummary,
            isBreakdownPriceShown,
            errorList,
            warningList,

            showPriceDropdown,
            changeQty,
            handleLiquorChangeRequested,
            getGroupSubHeadingText,
            toPriceText,
            toMoney,
            isNullOrEmpty: StringUtility.isNullOrEmpty,

            showErrorDialogForGroup,
            closeRequested,

            show
        };
    }
});

</script>

<style scoped>
.menuItemHeadingContainer {
    display: flex;
    align-items: stretch;
    margin-bottom: 1rem;
    padding: 2rem 2rem  1rem 2rem;
    min-width: 31rem;

    box-shadow: 0px -0.8rem 4rem 0.6rem var(--var-secondaryOverlay4-background);
}

.headingMainContentContainer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1 1 auto;
}

.headingQtyContainer {
    border: 0px solid var(--var-primaryNeutralVar3-color); 
    border-left-width: 1px; 
    margin-left: 1.7rem;

    display: flex;
    flex-direction: column;

    justify-content: center;
    align-items: center;
}


.menuItemHeading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    font-size: 1.8rem;
    font-weight: 600;
}

.headingSizeLabel {
    color: var(--var-primary-color); 
    font-weight: 300; 
    font-size: 0.8em; 
    margin-right: 1rem; 
    text-transform: uppercase; 
    letter-spacing: 0.03em
}

.menuItemSubheading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.5rem;
    font-weight: 400;
    color: var(--var-primaryFont-color);
    margin-top: 0.3rem;
}

.menuItemSubheading .label {
    margin-right: 0.33em;
    font-style: italic;
}

.menuItemSubheadingLabelInfo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.barMenuItemOptionGroupsContainer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.choicesHeading {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.05rem;
    text-transform: uppercase;
    color: var(--var-primary-color);
}

.choicesSubheading {
    font-size: 1.4rem;
    font-weight: 400;
    max-width: 29rem;
}

.choiceGroupContainer {
    margin-bottom: 1.7rem;
    border: 0 solid var(--var-secondaryOverlay1-background);
    border-bottom-width: 1px;
}

.choiceGroupContainer:last-child {
    border-bottom-width: 0px;
}

/* bar menu items only have two groups that are in the same row, so don't add division line */
.barMenuItemOptionGroupsContainer .choiceGroupContainer {
    border-bottom-width: 0px;
}
.barMenuItemOptionGroupsContainer .choiceGroupContainer:first-child {
    margin-right: 5rem;
}

.mainLabel.warningErrorLabel {
    font-size: 1.6rem; 
    font-weight: bold
}

button.changePriceButton {
    margin: 0;
    padding: 0;
    background-color: transparent;
    border-width: 0;
    font-size: inherit;
}



button.changePriceButton:active {
    background-color: rgba(0, 0, 0, 0.3);
}

button.changePriceButton .buttonContent {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 8rem;
    line-height: 1.5em;
}

button.changePriceButton .buttonContent.multipleSizes {
    min-width: 15rem;
}

button.changePriceButton .buttonContent .material-icons  {
    color: var(--var-primary-color)
}

.addLiquorButton {
    align-self: flex-start; 
    margin-left: -1.2rem; /* the negative margin left is to visually line the "plus" font icon with the other text content  */
}

@media only screen and (max-width: 500px) {
    button.changePriceButton .buttonContent,
    button.changePriceButton .buttonContent.multipleSizes {
        min-width: 0;
    }
}

</style>