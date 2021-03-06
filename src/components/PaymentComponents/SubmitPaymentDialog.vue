<template>
    <ModalDialog ref="dialog" headerPadding="0px" width="34rem">
        <template v-slot:header>
            <div  ref="dialogHeading" class="dialogHeading">
                <div>Charge ${{ grandTotalToChargeText }}</div>
            </div>
        </template>
        <template v-slot:content>
            <div class="mainContent">
                <div class="totalSummary" v-if="areGrandTotalsShown">
                    <label>Subtotal</label>
                    <div class="price">${{ subtotalText }}</div>
                </div>
                <div class="totalSummary" v-if="order && order.totalTax > 0">
                    <label>Tax</label>
                    <div class="price">${{ taxTotalText }}</div>
                </div>
                <div class="totalSummary"  v-if="onlineSurcharge > 0">
                    <label>Online Surcharge</label>
                    <div class="price">${{ toPriceText(onlineSurcharge) }}</div>
                </div>
                <div class="totalSummary" style="font-weight: 600;"  v-if="areGrandTotalsShown">
                    <label>Grand Total</label>
                    <div class="price">${{ grandTotalToChargeText }}</div>
                </div>
                <div class="horizontalRule"></div>

                <label class="nux-labelVertical">Delivery Method</label>
                <Dropdown  ref="orderTypeDropdown" width="30rem"  :itemList="orderTypeList" @selected="handleOrderTypeSelected" />

                <label class="nux-labelVertical">name for pickup (go by name)</label>
                <input ref="gobyNameTextBox" type="text" class="nux-textBox" style="width: 100%;" />

                <label class="nux-labelVertical" >phone number</label>
                <input ref="phoneOrEmailTextBox" type="text" class="nux-textBox" style="width: 100%;" />

                <AutoGrowContainer ref="addressAutoGrowContainer" maxHeight="10rem">
                    <label class="nux-labelVertical" >address</label>
                    <textarea ref="addressTextBox" class="nux-textBox" style="width: 100%; height: 6rem"></textarea>
                </AutoGrowContainer>

                <AutoGrowContainer ref="tableAutoGrowContainer" maxHeight="10rem">
                    <label class="nux-labelVertical" >table</label>
                    <input ref="tableTextBox" type="text" class="nux-textBox" style="width: 100%;" />
                </AutoGrowContainer>                
            </div>
        </template>
        <template v-slot:secondaryContent>
            <div ref="paymentRequestButton" style="margin-top: 1rem;"></div>
        </template>
        <template v-slot:footer>
            <button class="nux-flatButton" @click="hide(false)" >Exit</button>
        </template>
    </ModalDialog>

    <SimpleDialog ref="messageDialog">
        <div ref="messageDialogContent" style="font-size: 1.5rem; font-weight: 600">
        </div>
    </SimpleDialog>

</template>

<script lang="ts">
import SimpleDialog, { ISimpleDialog } from "@/next-ux2/components/dialogs/simple-dialog.vue";
import ModalDialog, { IModalDialog } from "@/next-ux2/components/dialogs/modal-dialog.vue";
import Dropdown, { IDropdown } from "@/next-ux2/components/input/dropdown.vue";
import AutoGrowContainer, {IAutoGrowContainer} from '@/next-ux2/components/containers/auto-grow-container.vue';

import { computed, defineComponent, onMounted, ref } from 'vue';

import { IConfig } from '@/common/IConfig';
import { IRestaurantInfo } from '@/dinesync/dto/RestaurantDTO';
import { convertProcessorCardTypeToSystem, createPaymentIntent, creatExpString } from "@/payments/stripe-processor";
import { IOnlineTransactionInfo, OrderDTO } from '@/dinesync/dto/OrderDTO';
import { NumUtility, StringUtility, Validator } from '@/next-ux2/utility';
import { OrderHelper } from '@/dinesync/dto/utility/OrderHelper';
import { DataManager } from '@/DataManager';
import { OrderManager } from '@/payments/order-manager';
import { hPlacement, vPlacement } from "@/next-ux2/utility/point-interface";

declare var AppConfig: IConfig;

export function getGrandTotalToCharge(order: OrderDTO, onlineSurcharge: number): number {
    if (!onlineSurcharge) {
        onlineSurcharge = 0;
    }

    return NumUtility.toMoney(getTotalOrderCost(order) + onlineSurcharge);
}

function getTotalOrderCost(order: OrderDTO): number {
    return NumUtility.toMoney(order.totalPrice + order.totalTax);
}

function toPriceText(value: number): string {
    if (value) {
        return StringUtility.toPriceText(value);
    }
    else {
        return '0.00';
    }
}

interface IValidatedData {
    isValid: boolean;
    errorReason: string;
    phoneNumber: string; 
    email: string,
    nameForPickup: string,
    address: string,
    orderType: string,
    table: string
}

var payButton: stripe.elements.Element;
let stripe = Stripe(AppConfig.stripeKey);

function cleanupPayment() {
    if (payButton) {
        payButton.unmount();
        payButton.destroy();
    }
}

async function intializePaymentButton(
        paymentButtonHost: HTMLElement, 
        handlePaymentErrorCallback: (message: string) => void,
        phoneOrEmailTextBox: HTMLInputElement,
        restaurantInfo: IRestaurantInfo, 
        order: OrderDTO,
        paymentSuccesfullyCompletedCallback: ()=> void,
        validateData: () => IValidatedData): Promise<boolean> {


    let grandTotalCharge = getGrandTotalToCharge(order, restaurantInfo.onlineSurcharge);
    let paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
            label: restaurantInfo.name,
            amount: Math.round(grandTotalCharge * 100)
        }
    });

    let elements = stripe.elements();
    payButton = elements.create('paymentRequestButton', {
        paymentRequest: paymentRequest
    });

    let validatedData: IValidatedData;
    let canMakePaymentResult = await paymentRequest.canMakePayment();
    if (canMakePaymentResult) {
        payButton.mount(paymentButtonHost);
        
        payButton.on('click', (clickEventInfo) => {
            try {
                validatedData = validateData();
                if (!validatedData.isValid) {
                    clickEventInfo.preventDefault();
                    return;
                }
            }
            catch (errorInfo) {
                validatedData = {} as IValidatedData;
                console.error('Error occured when validating data: ' + errorInfo.message);
                clickEventInfo.preventDefault();
                return;
            }
        });
        
        paymentRequest.on('cancel', () => {
            console.log('cancelled');
        });

        paymentRequest.on('paymentmethod', async (eventInfo) => {
            try {
                order.contactPhone = validatedData.phoneNumber;
                order.contactName = validatedData.nameForPickup;
                order.contactAddress = validatedData.address;
                order.tableId = validatedData.table;
                order.orderType = validatedData.orderType;
                order.groupList[0].name = validatedData.nameForPickup;

                // if delivery order, make sure that the address is within
                // delivery distance

                

                // validate that the order price and menu items matches the official menu
                let validateOrderResult = await OrderManager.validateOrder(order);
                if (!validateOrderResult.isValid) {
                    handlePaymentErrorCallback('Payment failed with order validation. ' + validateOrderResult.failureReason);
                    eventInfo.complete('fail');
                    return;
                }


                // stripe payment intent
                var clientSecret = await createPaymentIntent(grandTotalCharge, order.id, order.groupList[0].id);
                if (StringUtility.isNullOrEmpty(clientSecret)) {
                    
                    handlePaymentErrorCallback('Payment failed.  Problems contacting the server.');
                    eventInfo.complete('fail');
                    return;
                }
                else {
                    // stripe payment
                    let confirmResult = await stripe.confirmCardPayment(
                        clientSecret, {payment_method: eventInfo.paymentMethod.id}, {handleActions: false});

                    if (confirmResult.error) {
                        let errorMessage = confirmResult.error?.message;
                        if (StringUtility.isNullOrEmpty(errorMessage)) {
                            errorMessage = 'An error occured while trying to process payment.';
                        }

                        handlePaymentErrorCallback('Payment failed.  ' + errorMessage);
                        eventInfo.complete('fail');
                        return;
                    }
                    else {
                        eventInfo.complete('success');

                        // create transaction info
                        let transactionInfo = {
                            transactionId: confirmResult.paymentIntent?.id,
                            transactionId2: eventInfo.paymentMethod.id,
                            transactionId3: '',
                            transactionTimestamp: eventInfo.paymentMethod.created*1000,
                            chargeAmount: (confirmResult.paymentIntent?.amount ?? 0)/100,
                            name: eventInfo.paymentMethod.billing_details.name ?? '',
                            creditType: convertProcessorCardTypeToSystem(eventInfo.paymentMethod.card?.brand),
                            lastFour: eventInfo.paymentMethod.card?.last4 ?? '',
                            cardExp: creatExpString(eventInfo.paymentMethod.card?.exp_month.toString() ?? '', eventInfo.paymentMethod.card?.exp_year.toString() ?? ''),
                            sendToEmail: validatedData.email,
                            textPhoneNumber: validatedData.phoneNumber
                        } as IOnlineTransactionInfo

                        // send the order to the resturant
                        try {
                            let errorMessage = await OrderManager.captureOrder(order, transactionInfo, validateOrderResult.signature, validateOrderResult.deviceName);
                            if (!StringUtility.isNullOrEmpty(errorMessage)) {
                                throw new Error(errorMessage);
                            }
                            
                        }
                        catch (errorInfo) {
                            // this is  tricky situation, the payment has been charged,
                            // but there was an error when trying to capture the order
                            // at the restaurant; need to inform the client, perhaps
                            // via email or text that they need to call the restaurant
                            // to confirm their order
                            throw new Error('Not Implemented: need to add feature to email or text if order failed');
                        }

                        if (confirmResult.paymentIntent?.status === 'requires_action') {
                            let stripeConfirmResult = await stripe.confirmCardPayment(clientSecret);
                            stripeConfirmResult.paymentIntent
                            if (stripeConfirmResult.error) {
                                handlePaymentErrorCallback('Payment failed.  Try using a different card.');
                            }
                            else {
                                paymentSuccesfullyCompletedCallback();
                            }
                        }
                        else {
                            paymentSuccesfullyCompletedCallback();
                        }
                    }
                }
            }
            catch (errorInfo) {
                handlePaymentErrorCallback('Payment failed.  ' + errorInfo.message);
                eventInfo.complete('fail');
            }

        });

        return true;
    }
    else {
        return false;
    }
}

export default defineComponent({
    name: 'SubmitPaymentDialog',
    components: {
        SimpleDialog,
        ModalDialog,
        Dropdown,
        AutoGrowContainer
    },
    emits: [],
    props: {
        order: OrderDTO,
        restaurantInfo: Object
    },

    setup(props, context) {
        let paymentClient: any = null;

        // template refs
        const dialog = ref(null as unknown as IModalDialog);
        const messageDialog = ref(null as unknown as ISimpleDialog);
        const messageDialogContent = ref(null as unknown as HTMLElement);
        const dialogHeading = ref(null as unknown as HTMLElement);
        const paymentRequestButton = ref(null as unknown as HTMLDivElement);
        const phoneOrEmailTextBox = ref(null as unknown as HTMLInputElement);
        const gobyNameTextBox = ref(null as unknown as HTMLInputElement);
        const orderTypeDropdown = ref(null as unknown as IDropdown);
        const addressTextBox = ref(null as unknown as HTMLTextAreaElement);
        const tableTextBox = ref(null as unknown as HTMLInputElement);
        const addressAutoGrowContainer = ref(null as unknown as IAutoGrowContainer)
        const tableAutoGrowContainer = ref(null as unknown as IAutoGrowContainer)

        // data
        const orderTypeList = ref(['Carry-Out']);

        const validateData = (): IValidatedData => {
            let returnValue = {
                isValid: false,
                errorReason: '',
                phoneNumber: '',
                email: '',
                nameForPickup: '',
                address: '',
                table: '',
                orderType: 'Carry-Out'
            } as IValidatedData;

            let errorMessage = '';

            let gobyNameValue = gobyNameTextBox.value.value.trim();
            if (StringUtility.isNullOrEmpty(gobyNameValue.trim())) {
                errorMessage += 'Name for pickup cannot be empty. ';
            }
            else if (gobyNameValue.length > 15) {
                errorMessage += 'Name for pickup must be less than 15 characters.';
            }
            else {
                returnValue.nameForPickup = gobyNameValue;
            }

            let phoneOrEmailValue = phoneOrEmailTextBox.value.value.trim();
            if (Validator.isPhoneNumber(phoneOrEmailValue, true)) {
                returnValue.phoneNumber = phoneOrEmailValue;
            }
            else {
                errorMessage += 'Requires a valid phone number with area code. ';
            }

            let orderType = orderTypeDropdown.value.selectedItem as string;
            returnValue.orderType = orderType;
            switch(orderType) {
                case 'Delivery':
                    // need to ensure that there is an address
                    let address = addressTextBox.value.value.trim();
                    if (StringUtility.isNullOrEmpty(address) || (address.length < 5)) {
                        errorMessage += 'Delivery orders require a valid address. ';
                    }
                    else {
                        returnValue.address = address;
                    }
                    break;

                case 'Dine-In':
                    let table = tableTextBox.value.value.trim();
                    if (StringUtility.isNullOrEmpty(table)) {
                        errorMessage += 'Dine-in online orders require your table code. ';
                    }
                    else {
                        returnValue.table = table;
                    }
                    break;
            }
            
            returnValue.isValid = errorMessage === '';
            returnValue.errorReason = errorMessage;

            if (errorMessage !== '') {
                showMessage(errorMessage, phoneOrEmailTextBox.value);
            }

            return returnValue
        }

        const hide = async (isPaymentSucessful: boolean) => {
            if (isPaymentSucessful) {
                dialog.value.hide('ok');
            }
            else {
                dialog.value.hide('cancel');
            }

            cleanupPayment();
        }

        const show = async () => {

            // create order type dropown options
            let restaurantInfo = props.restaurantInfo as IRestaurantInfo;
        
            orderTypeList.value.length = 0;
            orderTypeList.value.push('Carry-Out');
            if (restaurantInfo.hasDelivery) {
                orderTypeList.value.push('Delivery');
            }

            // select carry-out as the default delivery type
            orderTypeDropdown.value.selectedItem = 'Carry-Out';

            if (restaurantInfo.allowOnlineDineInOrdering) {
                orderTypeList.value.push('Dine-In');
            }

            let waitForDialogToClosePromise = dialog.value.show();
            
            let wasButtonCreated = await intializePaymentButton(
                paymentRequestButton.value, 
                handlePaymentError,
                phoneOrEmailTextBox.value,
                props.restaurantInfo as IRestaurantInfo,
                props.order as OrderDTO, 
                () => { hide(true); },
                validateData);
                
            if (!wasButtonCreated) {
                showMessage('Your system or browser does not support Apple, Google, or Microsoft Pay.');
            }

            let result = await waitForDialogToClosePromise;
            return result;
        };

        const handlePaymentError = (message: string) => {
            showMessage(message);
        }

        const handleOrderTypeSelected = (typeSelected: string) => {
            switch(typeSelected){
                case 'Carry-Out':
                    addressAutoGrowContainer.value.collapse();
                    tableAutoGrowContainer.value.collapse();
                    break;

                case 'Delivery':
                    addressAutoGrowContainer.value.expand();
                    tableAutoGrowContainer.value.collapse();
                    break;

                case 'Dine-In':
                    addressAutoGrowContainer.value.collapse();
                    tableAutoGrowContainer.value.expand();
                    break;

            }
        }
        
        const showMessage = (message: string, anchorElement?: HTMLElement) => {
            let horizPos: hPlacement = 'center';
            let vertPos: vPlacement = 'bottom'

            if (!anchorElement) {
                anchorElement = dialogHeading.value;
                vertPos = 'center';
            }

            messageDialogContent.value.innerHTML = message;
            messageDialog.value.show(anchorElement, horizPos, vertPos);
        }

        const onlineSurcharge = computed((): number => {
            let restaurantInfo = props.restaurantInfo as IRestaurantInfo;
            if (restaurantInfo) {
                return restaurantInfo.onlineSurcharge;
            }
            else {
                return 0;
            }
        });

        const grandTotalToChargeText = computed((): string => {
            let order = props.order;
            if (order) {
                return toPriceText(getGrandTotalToCharge(order, props.restaurantInfo!.onlineSurcharge));
            }
            else {
                return '0.00';
            }
        });

        const subtotalText = computed((): string => {
            let order = props.order;
            if (order) {
                return toPriceText(order.totalPrice);
            }
            else {
                return '0.00';
            }
        });

        const taxTotalText  = computed((): string => {
            let order = props.order;
            if (order) {
                return toPriceText(order.totalTax);
            }
            else {
                return '0.00';
            }
        });

        const areGrandTotalsShown = computed((): boolean => {
            let order = props.order;
            if (order) {
                return (props.restaurantInfo!.onlineSurcharge !== 0) || (order.totalTax > 0);
            }
            else {
                return false;
            }
        });

        return {
            dialog,
            messageDialog,
            messageDialogContent,
            dialogHeading,
            phoneOrEmailTextBox,
            gobyNameTextBox,
            paymentRequestButton,
            orderTypeDropdown,
            addressTextBox,
            tableTextBox,
            addressAutoGrowContainer,
            tableAutoGrowContainer,

            orderTypeList,

            onlineSurcharge,
            grandTotalToChargeText,
            subtotalText,
            taxTotalText,
            areGrandTotalsShown,

            toPriceText: toPriceText,

            handleOrderTypeSelected,

            show,
            hide
        };
    }
});
</script>

<style scoped>
.mainContent {
    display: flex; 
    flex-direction: column;
    margin-top: 2rem;
}

.dialogHeading {
    width: 100%;
    display: flex; 
    align-items: center;
    justify-content: center;
    height: 7.2rem;
    font-size: 1.7rem;
    font-weight: 600;

    background-color: var(--var-sideBarVar1-background);
    color: var(--var-sideBarFont-color);
}

.totalSummary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    font-size: 1.5rem;
}

.totalSummary label {
    margin: 0;
    padding: 0;
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05rem;
}

.totalSummary label {
    color: var(--var-primary-color);
}

.totalSummary .price {
    font-size: 1.5rem;
}

.horizontalRule {
    height: 1px;
    width: 100%;
    margin: 0.7rem 0;
    background-color: var(--var-secondaryVar1-color);
}

.nux-labelVertical {
    margin-top: 0.5rem;
}

.statusContainer {
    display: flex;
    align-items: center;
    height: 8.6rem;
    width: 100%;
    margin-top: 1rem;
    overflow: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    font-size: 1.5rem;
}

.autoGrowContainer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.2s ease-in;
}

</style>