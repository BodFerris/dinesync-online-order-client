<template>
    <div class="mainContent">
        <header>
            <div class="headingNameAndMenuContainer majorHeadingText">
                <div>{{ mainHeadingText }}</div>
                <div v-if="selectedMenu" class="menuNameContainer" ref="menuNameContainer"
                    @click="showMenuDropdown()"><span>{{ selectedMenu.name }}<i class="material-icons" 
                        style="color: var(--var-primaryNeutralVar3-color);">arrow_drop_down</i></span></div>
            </div>

            <button ref="headingButton" class="headingButton" @click="toggleOrderPanel()">
                <div class="viewCartContainer">
                    <template v-if="isOrderPanelOpened">
                        <div class="iconContainer"><i class="material-icons">visibility_off</i></div>
                        <div class="viewCartLabel">Hide Order</div>
                    </template>
                    <template v-else>
                        <div class="iconContainer"><i class="material-icons">shopping_cart</i></div>
                        <div class="viewCartLabel">View Order</div>
                    </template>
                </div>
            </button>

        </header>
        <div class="splitContent">
            <div ref="menuContainer" class="menuContainer">
                <template v-if="selectedMenu">
                    <div v-for="categoryItem in selectedMenu.categoryList" :key="categoryItem.id" style="margin-bottom: 3rem;">
                        <div style="font-size: 2.4rem; text-transform: uppercase; color: #0a2749; margin-bottom: 1.5rem; letter-spacing: 0.1rem;">{{ categoryItem.name }}</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(32rem, 1fr)); grid-gap: 2rem;">
                            <MenuItemCard v-for="menuItem in categoryItem.menuItemList" :key="menuItem.id" 
                                    :menu="selectedMenu" :menuItem="menuItem" width="auto"
                                    @addToOrderRequested="addToOrder(menuItem)" />
                        </div>
                    </div>
                </template>
            </div>

            <div class="orderContainer" ref="orderContainer">
                <div class="orderContainerHeading majorHeadingText">Order</div>
                <div class="orderContainerMenuItems">
                    <div v-if="!ticket || ticket.menuItemList.length == 0">Empty.  Select menu items from the left to add to the order.</div>
                    <div v-else>
                        <div v-for="orderMenuItem in ticket.menuItemList" :key="orderMenuItem.id" style="margin-bottom: 2rem;">
                            <div class="menuItemRow">
                                <div style="padding-right: 1rem;">
                                    <div class="menuItemTitleContainer">
                                        <button class="nux-flatButton menuItemEditButton"><i class="material-icons"
                                                @click="editMenuItem(orderMenuItem)">edit</i></button>
                                        <div  @click="editMenuItem(orderMenuItem)">{{ orderMenuItem.name }}</div>
                                        <div v-if="orderMenuItem.amount > 1" style="padding-left: 0.33em" >x{{ orderMenuItem.amount }}</div>
                                        <div v-if="orderMenuItem.size != ''" style="margin-left:0.33em;">({{ orderMenuItem.size }})</div>
                                    </div>
                                </div>
                                <div class="menuItemTitlePriceContainer">
                                    <div>{{ getMenuItemPriceNoOptions(orderMenuItem) }}</div>
                                    <button class="nux-flatButton menuItemEditButton"
                                            @click="deleteMenuItem(orderMenuItem)"><i class="material-icons">delete</i></button>
                                </div>
                            </div>
                            
                            <TicketMenuItemOptionView :orderMenuItem="orderMenuItem" />
                        </div>
                    </div>
                </div>
                <div class="orderContainerFooter" v-if="ticket && ticket.menuItemList.length > 0">
                    <div class="menuItemRow">
                        <div>Subtotal</div>
                        <div>{{ toPriceText(order.totalPrice) }}</div>
                    </div>
                    <div class="menuItemRow">
                        <div>Tax</div>
                        <div>{{ toPriceText(order.totalTax) }}</div>
                    </div>
                    <div class="menuItemRow" style="margin-top: 1rem; font-weight: 800;">
                        <div>TOTAL</div>
                        <div>${{ toPriceText(toMoney(order.totalPrice + order.totalTax)) }}</div>
                    </div>
                    <button class="checkoutButton" @click="submitOrder()">Submit Order</button>
                </div>
            </div>
        </div>

        <div class="footer">
            <div  v-if="!ticket || ticket.menuItemList.length == 0">
                Empty Order
            </div>
            <div v-else>
                <div>${{ toPriceText(toMoney(order.totalPrice + order.totalTax)) }}</div>
            </div>
        </div>

        <DropdownFlyout ref="menuDropdown"  width="30rem" textFieldName="name" @selected="changeMenu" />

        <OrderMenuItemDialog ref="orderMenuItemDialog" />

        <SubmitPaymentDialog ref="submitPaymentDialog" :order="order" :restaurantInfo="restaurantInfo" />

        <SimpleDialog ref="messageDialog">
            <div ref="messageDialogContent" style="font-size: 1.5rem; font-weight: 600">
            </div>
        </SimpleDialog>

        <SimpleDialog ref="paymentAcceptedPopup">
            <div v-if="lastOrder" class="paymentAcceptedPopup">
                <div class="paymentAcceptedHeading">Order Sent to Restaurant</div>
                <div>
                    Payment ${{submittedOrderGrandTotal}} received for<br/>order id {{lastOrder.orderNumber}}
                </div>
            </div>
        </SimpleDialog>

    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';

import DropdownFlyout, { IDropdownFlyout } from '@/next-ux2/components/containers/dropdown-flyout.vue';

import SimpleDialog, {ISimpleDialog } from '@/next-ux2/components/dialogs/simple-dialog.vue';
import { IModalDialog } from '@/next-ux2/components/dialogs/modal-dialog.vue';
import SubmitPaymentDialog, { getGrandTotalToCharge } from "@/components/PaymentComponents/SubmitPaymentDialog.vue";
import OrderMenuItemDialog, { IOrderMenuItemDialog } from './MenuComponents/OrderMenuItemDialog.vue';

import MenuItemCard from './MenuComponents/MenuItemCard.vue';
import TicketMenuItemOptionView from './MenuComponents/TicketMenuItemOptionView.vue';

import { InventoryItem, MenuDTO, MenuItemDTO } from '@/dinesync/dto/MenuDTO';
import { OrderHelper } from '@/dinesync/dto/utility/OrderHelper';
import { DataManager } from '@/DataManager';
import { OrderDTO, OrderStateEnum, OrderGroupDTO, OrderMenuItemDTO } from '@/dinesync/dto/OrderDTO';
import { OrderProcessor } from '@/dinesync/ordermanagement/OrderProcessor';
import { NumUtility, StringUtility, GUID, HtmlUtility } from '@/next-ux2/utility';
import { ObjectHelper } from '@/dinesync/dto/utility/ObjectHelper';
import { MenuHelper } from '@/dinesync/dto/utility/MenuHelper';
import { IRestaurantInfo } from '@/dinesync/dto/RestaurantDTO';
import { hPlacement, vPlacement } from '@/next-ux2/utility/point-interface';


function createOrderNumber() {
    let availableCharacters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let returnValue = '';
    for (let i = 0; i <= 4; i++) {
        returnValue += availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    } 
    return returnValue;
}

function  createNewOrder(restaurantId: string): OrderDTO {
    let newOrder = new OrderDTO();
    newOrder.id = GUID.create();
    newOrder.parentId = restaurantId;
    newOrder.orderNumber = createOrderNumber();
    newOrder.orderType = 'Carry-Out';
    newOrder.status = OrderStateEnum.waitingForFullPayment;
    newOrder.serverName = 'Online';
    newOrder.takenDate = Date.now();
    newOrder.lastModified = Date.now();

    // add a defaul ticket to the order
    let ticket = OrderHelper.createTicket(newOrder, restaurantId, 'Online');
    newOrder.groupList.push(ticket);

    return newOrder;
}

export default defineComponent({
    name: 'MenuPage',
    components: {
        DropdownFlyout,
        SimpleDialog,
        MenuItemCard,
        TicketMenuItemOptionView,
        OrderMenuItemDialog,
        SubmitPaymentDialog
    },
    props: {
    
    },
    setup(props, context) {
        let orderProcessor: OrderProcessor;
        let liquorList = new Array<InventoryItem>();

        // template refs
        const orderContainer = ref(null as unknown as HTMLElement);
        const headingButton = ref(null as unknown as HTMLButtonElement);
        const menuNameContainer = ref(null as unknown as HTMLElement);
        const menuContainer =ref(null as unknown as HTMLElement);
        const orderMenuItemDialog = ref(null as unknown as IOrderMenuItemDialog);
        const submitPaymentDialog = ref(null as unknown as IModalDialog);
        const menuDropdown = ref(null as unknown as IDropdownFlyout);
        const messageDialog = ref(null as unknown as ISimpleDialog);
        const messageDialogContent = ref(null as unknown as HTMLElement);
        const paymentAcceptedPopup = ref(null as unknown as ISimpleDialog);

        // data
        const mainHeadingText = ref('');
        const isOrderPanelOpened = ref(false);
        const menuList = ref(new Array<MenuDTO>());
        const restaurantInfo = ref<IRestaurantInfo>( {
            name: '',
            defaultTaxRate: 0,
            defaultMenuName: '',
            onlineSurcharge: 0,
            isOnlineOrdersStopped: false,
            onlineOrdersStoppedMessage: '',
            hasOnlineOrders: true,
            onlineOrdersCloseTimeOffset: 0
        });
        const selectedMenu = ref(null as unknown as MenuDTO);
        const order = ref(null as unknown as OrderDTO);
        const lastOrder = ref(null as unknown as OrderDTO);
        const ticket = ref(null as unknown as OrderGroupDTO);

        const dismissOpenedOrderPanelBodyClickHandler = (eventInfo: MouseEvent) => {
            if (isOrderPanelOpened.value &&
                    !HtmlUtility.isPointInElementBounds(eventInfo.clientX, eventInfo.clientY, orderContainer.value) &&
                    !HtmlUtility.isPointInElementBounds(eventInfo.clientX, eventInfo.clientY, headingButton.value)) {
                hideOrderPanel();
            }
        };

        const dismissOpenedOrderPanelBodySrollHandler = (eventInfo: Event) => {
            if (isOrderPanelOpened.value) {
                hideOrderPanel();
            }
        };

        // media query hooks
        const mediaQuery = window.matchMedia('(max-width: 750px');
        const mediaQueryChangeHandler = () => {
            if (window.innerWidth <= 750) {
                hideOrderPanel();
                document.body.addEventListener('click', dismissOpenedOrderPanelBodyClickHandler);
            }
            else {
                orderContainer.value.classList.remove('showOrderContainerAnimation');
                orderContainer.value.classList.remove('hideOrderContainerAnimation');
                isOrderPanelOpened.value = true;
                document.body.removeEventListener('click', dismissOpenedOrderPanelBodyClickHandler);
            }
        };

        // methods
        const addToOrder = async (menuItem: MenuItemDTO) => {
            let newOrderItem = OrderHelper.createOrderMenuItemFromMenuItem(menuItem, ticket.value.id, menuItem.priceList[0].size, liquorList);
            try {
                let result = await orderMenuItemDialog.value.show(newOrderItem, liquorList);
                if (result === 'ok') {
                    ticket.value.menuItemList.push(newOrderItem);
                    orderProcessor.handleTicketMutated(ticket.value, order.value, liquorList);
                }
            }
            catch (errorInfo) {
                console.log(errorInfo);
            }
        }

        const editMenuItem = async (menuItem: OrderMenuItemDTO) => {
            let originalData = JSON.stringify(menuItem);
            let clonedMenuItem =  ObjectHelper.cleanDto(menuItem);

            let result = await orderMenuItemDialog.value.show(clonedMenuItem, liquorList);
            if (result === 'ok') {
                if (originalData !== JSON.stringify(clonedMenuItem)) {
                    let indexOfMenuItemReplacing = ticket.value.menuItemList.findIndex(i => i.id === clonedMenuItem.id);
                    ticket.value.menuItemList.splice(indexOfMenuItemReplacing, 1, clonedMenuItem);
                    orderProcessor.handleTicketMutated(ticket.value, order.value, liquorList);
                }
            }
        }

        const deleteMenuItem = (menuItem: OrderMenuItemDTO) => {
            let indexOfMenuItem = ticket.value.menuItemList.findIndex(i => i.id === menuItem.id);
            ticket.value.menuItemList.splice(indexOfMenuItem, 1);
            orderProcessor.handleTicketMutated(ticket.value, order.value, liquorList);
        }

        const getMenuItemPriceNoOptions = (value: OrderMenuItemDTO) => {
            let price = OrderHelper.getMenuItemPriceWithMultiplierNoOptions(value);
            let priceText= StringUtility.toPriceText(price);
            return priceText;
        }

        const showMenuDropdown = () => {
            let anchorElement = menuNameContainer.value;
            menuDropdown.value.show(anchorElement);
        }

        const changeMenu = (menuToUse: MenuDTO) => {
            selectedMenu.value = menuToUse;
        }

        const submittedOrderGrandTotal = computed((): string => {
            if (lastOrder.value) {
                let grandTotal = getGrandTotalToCharge(lastOrder.value, restaurantInfo.value.onlineSurcharge);
                return StringUtility.toPriceText(grandTotal);
            }
            else {
                return '0.00';
            }
        });

        const submitOrder = async () => {
            let result = await submitPaymentDialog.value.show();
            if (result === 'ok') {
                lastOrder.value = ObjectHelper.cleanDto(order.value);
                paymentAcceptedPopup.value.show(document.body, 'center', 'center');

                order.value = createNewOrder(selectedMenu.value.parentId);
                ticket.value = order.value.groupList[0];
            }
        }

        const showOrderPanel = () => {
                orderContainer.value.classList.add('showOrderContainerAnimation');
                orderContainer.value.classList.remove('hideOrderContainerAnimation');
                isOrderPanelOpened.value = true;
                menuContainer.value.addEventListener('scroll', dismissOpenedOrderPanelBodySrollHandler);
        }

        const hideOrderPanel = () => {
            orderContainer.value.classList.remove('showOrderContainerAnimation');
            orderContainer.value.classList.add('hideOrderContainerAnimation');
            isOrderPanelOpened.value = false;
            menuContainer.value.removeEventListener('scroll', dismissOpenedOrderPanelBodySrollHandler);
        }

        const toggleOrderPanel = () => {
            if (isOrderPanelOpened.value) {
                hideOrderPanel();
            }
            else {
                showOrderPanel();
            }
        }

        const showMessage = (message: string, anchorElement?: HTMLElement) => {
            let horizPos: hPlacement = 'center';
            let vertPos: vPlacement = 'bottom'

            if (!anchorElement) {
                anchorElement = document.body;
                vertPos = 'center';
            }

            messageDialogContent.value.innerHTML = message;
            messageDialog.value.show(anchorElement, horizPos, vertPos);
        }

        let dataInitalizer = async () => {
            let menuData = await DataManager.fetchMenuData();
            menuList.value = menuData;

            menuDropdown.value.resetList(menuList.value);
            await nextTick();
            menuDropdown.value.setSelectedItem(menuList.value[0]);

            order.value = createNewOrder(selectedMenu.value.parentId);
            ticket.value = order.value.groupList[0];

            liquorList = await DataManager.fetchLiquorList();

            restaurantInfo.value = await DataManager.fetchRestaurantData();
            orderProcessor = new OrderProcessor(false, restaurantInfo.value.defaultTaxRate, false);

            let defaultMenu = MenuHelper.getDefaultMenuBasedOnTime(Date.now(), menuData, restaurantInfo.value.defaultMenuName);
            if (!defaultMenu) {
                defaultMenu = menuData[0];
            }

            selectedMenu.value = defaultMenu;
            menuDropdown.value.setSelectedItem(selectedMenu.value);

            mainHeadingText.value = restaurantInfo.value.name + ' ' + ((menuList.value.length > 1) ? 'Menus' : 'Menu');
        };

        onMounted(() => {
            dataInitalizer();
            mediaQuery.addEventListener('change', mediaQueryChangeHandler);

            // when app first loads, there is no resize, so trigger the callback
            // to get the initial value set
            mediaQueryChangeHandler();
        });

        onBeforeUnmount(() => {
            mediaQuery.removeEventListener('change', mediaQueryChangeHandler);
        });
        
        return {
            orderContainer,
            headingButton,
            orderMenuItemDialog,
            submitPaymentDialog,
            menuDropdown,
            menuContainer,
            menuNameContainer,
            messageDialog,
            messageDialogContent,
            paymentAcceptedPopup,

            isOrderPanelOpened,
            menuList,
            selectedMenu,
            order,
            lastOrder,
            ticket,
            mainHeadingText,
            restaurantInfo,

            toMoney: NumUtility.toMoney,
            toPriceText: StringUtility.toPriceText,
            getMenuItemPriceNoOptions,
            submittedOrderGrandTotal,

            showMenuDropdown,
            changeMenu,
            addToOrder,
            editMenuItem,
            deleteMenuItem,
            submitOrder,
            toggleOrderPanel
        }

    }

});
</script>

<style scoped>
.mainContent {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.splitContent {
    display: flex;
    flex: 1 1 0;
    position: relative;
    overflow: hidden;
}

.menuContainer {
    flex: 1 1 auto; 
    padding: 2rem; 
    box-sizing: border-box; 
    overflow: hidden auto;

    border: 0px solid var(--var-sideBarVar2-background);
    border-top-width: 1px;
}

.orderContainer {
    position: relative;
    flex: 0 0 auto;
    width: 34rem;
    padding: 1.5rem 1.5rem 1.5rem 2.2rem;
    box-sizing: border-box;
    overflow: hidden;

    display: flex;
    flex-direction: column;
    
    background-color: var(--var-sideBarVar1-background);
    box-shadow: 0.1rem 0.5rem 1.5rem 0rem var(--var-primaryOverlay-color);

    color: var(--var-sideBarFont-color);
    font-size: 1.6rem;
    font-weight: 600;
}

.showOrderContainerAnimation {
    animation-name: showOrderView
}

.hideOrderContainerAnimation {
    animation-name: hideOrderView
}

.orderContainerHeading {
    flex: 0 0 auto;
    overflow: hidden;
    text-transform: uppercase;
    letter-spacing: 0.1rem;
}

.orderContainerMenuItems {
    flex: 1 1 auto;
    position: relative;
    margin-top: 1.5rem;
    box-sizing: border-box;
    overflow: hidden;
    overflow-y:  auto;
    -webkit-overflow-scrolling: touch;

    letter-spacing: 0.1rem;
}

.menuItemTitleContainer {
    display: flex;
    align-items: center;
}

.menuItemTitlePriceContainer {
    display: inline-flex;
    align-items: center;
}

.menuItemRow,
.orderContainerMenuItems >>> .menuItemRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.orderContainerFooter {
    flex: 0 0 auto;
    overflow: hidden;
}

header {
    flex: 0 0 auto;
    background-color: var(--var-sideBarVar1-background);
    color: var(--var-sideBarFont-color);
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 2rem;
    height: 6.4rem;
    box-shadow: 0.1rem 0.5rem 1.5rem -0.6rem var(--var-primaryOverlay-color);
}

.headingNameAndMenuContainer,
.menuNameContainer {
    display: inline-flex;
    align-items: center;
    font-size: 2.6rem; 
    font-weight: 600;
}

.menuNameContainer {
    padding: 0.1em 0.33em;
    margin-left: 0.33em;
    border: 1px solid var(--var-primaryNeutralVar3-color);
}

.majorHeadingText {
    font-size: 2.6rem; 
    font-weight: 600;
}

.footer {
    display: none;
    flex: 0 0 auto;

    align-items: center;
    justify-content: center;

    padding: 0.5rem 2rem;
    box-sizing: border-box;
    font-size: 1.5rem;
    font-weight: 600;

    background-color: var(--var-primaryVar3-color);
    color: var(--var-sideBarFont-color);
}

h1 {
    padding: 0;
    margin: 0;
}

.categoryHeading {
    font-size: 2.4rem; 
    text-transform: uppercase; 
    color: #0a2749; 
    margin-bottom: 1.5rem; 
    letter-spacing: 0.1rem;
}

.nux-flatButton.menuItemEditButton {
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 100%;
    border-width: 0;
    padding: 0.5rem;
}

.nux-flatButton.menuItemEditButton .material-icons {
    color: var(--var-primaryNeutralVar3-color);
    font-size: 2rem;
}

button.checkoutButton { 
    margin-top: 2rem;

    padding: 1rem;
    box-sizing: border-box;
    width: 100%;
    height: 5rem;
    background-color: var(--var-sideBarVar2-background);
    border: 2px solid var(--var-themeColorNeutralVar1-color);
    border-radius: 5rem;

    color: var(--var-sideBarFont-color);
    font-size: 1.7rem;
    letter-spacing: 0.06em;
    font-weight: 600;
}

button.checkoutButton:active {
    background-color: var(--var-primaryVar3-color);
}

.paymentAcceptedPopup {
    display: flex;
    flex-direction: column;
    font-size: 1.7rem;
}

.paymentAcceptedHeading {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

button.headingButton {
    display:none;
    margin: 0;
    margin-left: auto;
    border-width: 0;
    padding: 0;
    width: 7.7rem;
    height: 6.2rem;

    color: var(--var-sideBarFont-color);
    background-color: transparent;
}

button.headingButton .iconContainer {
    border: 1px solid var(--var-sideBarFont-color);
    border-radius: 100%;
    width: 3.2rem;
    height: 3.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

button.headingButton .iconContainer .material-icons {
    font-size: 1.8rem;
}

button.headingButton:active {
    filter: brightness(80%);
}

.viewCartContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: auto;
}

.viewCartLabel {
    padding-top: 0.2rem;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.07rem;
}



@media only screen and (max-width: 750px) {
    button.headingButton {
        display: block;
    }

    .orderContainer {
        position:absolute;
        width: 100%;
        max-width: 34rem;
        height: 100%;
        margin: auto;
        top: 0;
        right: 0;
        animation-duration:  0.3s;
        animation-timing-function:  ease-out;
        animation-fill-mode:  forwards;
    }

    .footer {
        display: flex;
    }
} 

@keyframes hideOrderView {
    0% {
        transform: translate(0, 0);
    }
    100% {
        transform: translate(105%, 0);
        visibility: hidden;
    }
}

@keyframes showOrderView {
    0% {
        visibility: visibility;
        transform: translate(100%, 0);
    }
    100% {
        transform: translate(0, 0);
        
    }
}


</style>
