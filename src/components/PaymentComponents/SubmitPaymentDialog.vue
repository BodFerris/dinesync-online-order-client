<template>
    <ModalDialog ref="dialog" headerPadding="0px" width="34rem">
        <template v-slot:header>
            <div class="dialogHeading">
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
                    <label>Online Surchage</label>
                    <div class="price">${{ toPriceText(onlineSurcharge) }}</div>
                </div>
                <div class="totalSummary" style="font-weight: 600;"  v-if="areGrandTotalsShown">
                    <label>Grand Total</label>
                    <div class="price">${{ grandTotalToChargeText }}</div>
                </div>
                <div class="deliveryMethodSummary" style="font-weight: 600; margin-top: 1.5rem">
                    <label>Delivery Method</label>
                    <div class="price">Carry-Out</div>
                </div>
                <label class="nux-labelVertical">phone number or email</label>
                <input type="text" class="nux-textBox" style="width: 100%;" />

                
                <div ref="statusContainer" class="statusContainer">

                </div>

<div ref="paymentRequestButton"></div>
            </div>
        </template>
        <template v-slot:footer>
            <button class="nux-flatButton" @click="hide(false)" >Exit</button>
        </template>
    </ModalDialog>
    
</template>

<script lang="ts">
import SimpleDialog, { ISimpleDialog } from "@/next-ux2/components/dialogs/simple-dialog.vue";
import ModalDialog, { IModalDialog } from "@/next-ux2/components/dialogs/modal-dialog.vue";

import { computed, defineComponent, onMounted, ref } from 'vue';

import { IConfig } from '@/common/IConfig';
import { IRestaurantInfo } from '@/dinesync/dto/RestaurantDTO';
import { convertProcessorCardTypeToSystem, createPaymentIntent, creatExpString } from "@/payments/stripe-processor";
import { IOnlineTransactionInfo, OrderDTO } from '@/dinesync/dto/OrderDTO';
import { NumUtility, StringUtility } from '@/next-ux2/utility';
import { OrderHelper } from '@/dinesync/dto/utility/OrderHelper';
import { DataManager } from '@/DataManager';
import { OrderManager } from '@/payments/order-manager';

declare var AppConfig: IConfig;

function setStatusMessage(hostElement: HTMLElement, statusMessage: string) {
    hostElement.textContent = statusMessage;
}

function getGrandTotalToCharge(order: OrderDTO, onlineSurcharge: number): number {
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

async function intializePaymentButton(
        paymentButtonHost: HTMLElement, 
        statusHostElement: HTMLElement,
        restaurantInfo: IRestaurantInfo, 
        order: OrderDTO,
        paymentSuccesfullyCompletedCallback: ()=> void): Promise<boolean> {

    let stripe = Stripe(AppConfig.stripeKey);

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
    let payButton = elements.create('paymentRequestButton', {
        paymentRequest: paymentRequest
    });

    let canMakePaymentResult = await paymentRequest.canMakePayment();
    if (canMakePaymentResult) {
        payButton.mount(paymentButtonHost);
        paymentRequest.on('paymentmethod', async (eventInfo) => {
            try {
                // validate that the order price and menu items matches the official menu
                let validateOrderResult = await OrderManager.validateOrder(order);
                if (!validateOrderResult.isValid) {
                    setStatusMessage(statusHostElement,  'Payment failed with order validation. ' + validateOrderResult.failureReason);
                    eventInfo.complete('fail');
                    return;
                }

                // stripe payment intent
                var clientSecret = await createPaymentIntent(grandTotalCharge, order.id, order.groupList[0].id);
                if (StringUtility.isNullOrEmpty(clientSecret)) {
                    setStatusMessage(statusHostElement,  'Payment failed.  Problems contacting the server.');
                    eventInfo.complete('fail');
                    return;
                }
                else {
                    // stripe payment
                    let confirmResult = await stripe.confirmCardPayment(
                        clientSecret, {payment_method: eventInfo.paymentMethod.id}, {handleActions: false});

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
                        cardExp: creatExpString(eventInfo.paymentMethod.card?.exp_month.toString() ?? '', eventInfo.paymentMethod.card?.exp_year.toString() ?? '')
                    } as IOnlineTransactionInfo
                        
                    if (confirmResult.error) {
                        let errorMessage = confirmResult.error.message;
                        if (StringUtility.isNullOrEmpty(errorMessage)) {
                            errorMessage = ''
                        }

                        setStatusMessage(statusHostElement,  'Payment failed.  ' + errorMessage);
                        eventInfo.complete('fail');
                    }
                    else {
                        eventInfo.complete('success');

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
                                setStatusMessage(statusHostElement,  'Payment failed.  Try using a different card.');
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
                setStatusMessage(statusHostElement,  'Payment failed.  ' + errorInfo.message);
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
        ModalDialog
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
        const statusContainer = ref(null as unknown as HTMLElement);
        const paymentRequestButton = ref(null as unknown as HTMLDivElement);

        const hide = async (isPaymentSucessful: boolean) => {
            if (isPaymentSucessful) {
                dialog.value.hide('ok');
            }
            else {
                dialog.value.hide('cancel');
            }
             
        }

        const show = async () => {
            setStatusMessage(statusContainer.value, '');
            let waitForDialogToClosePromise = dialog.value.show();
            
            let wasButtonCreated = await intializePaymentButton(
                paymentRequestButton.value, 
                statusContainer.value,
                props.restaurantInfo as IRestaurantInfo,
                props.order as OrderDTO, 
                () => { hide(true); });
                
            if (!wasButtonCreated) {
                setStatusMessage(statusContainer.value, 'System does not support Apple, Google, or Microsoft Pay.');
            }

            let result = await waitForDialogToClosePromise;
            return result;
        };

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
            statusContainer,
            paymentRequestButton,

            onlineSurcharge,
            grandTotalToChargeText,
            subtotalText,
            taxTotalText,
            areGrandTotalsShown,

            toPriceText: toPriceText,

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

.deliveryMethodSummary,
.totalSummary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    font-size: 1.5rem;
}

.deliveryMethodSummary label,
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


.statusContainer {
    display: flex;
    align-items: center;
    height: 8.6rem;
    width: 100%;
    margin-top: 1rem;
    margin-bottom: 1rem;
    overflow: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    font-size: 1.5rem;
}
</style>