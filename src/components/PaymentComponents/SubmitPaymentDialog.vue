<template>
    <ModalDialog ref="dialog">
        <template v-slot:header>
            <div>Payment</div>
        </template>
        <template v-slot:content>
            <div class="mainContent">
                <label class="nux-labelVertical">phone number or email</label>
                <input type="text" class="nux-textBox" style="width: 30rem;" />
                    
                <div style="margin-top: 2.2rem">Toal charge: ${{ totalPrice }}</div>
                <div class="payButtonList">
                    <div ref="googlePayButtonHost" class="payButtonHost"></div>
                    <button v-if="applePayAvailabilityState == 'available'" class="payButtonHost applePayButton" @click="handleApplePay()" />
                </div>

                <div ref="paymentRequestButton"></div>
                
                <div ref="statusContainer" class="statusContainer">

                </div>
            </div>
        </template>
    </ModalDialog>
    
</template>

<script lang="ts">
// https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions
import SimpleDialog, { ISimpleDialog } from "@/next-ux2/components/dialogs/simple-dialog.vue";
import ModalDialog, { IModalDialog } from "@/next-ux2/components/dialogs/modal-dialog.vue";

import { computed, defineComponent, onMounted, ref } from 'vue';

import { loadGpayScript, createPaymentRequestPayload, completeTokenPayment, validateApplePaySession } from "@/payments/stripe-processor";
import { OrderDTO } from '@/dinesync/dto/OrderDTO';
import { NumUtility, StringUtility } from '@/next-ux2/utility';
import { OrderHelper } from '@/dinesync/dto/utility/OrderHelper';


declare var ApplePaySession: any;


function setStatusMessage(hostElement: HTMLElement, statusMessage: string) {
    hostElement.textContent = statusMessage;
}

function getTotalToCharge(order: OrderDTO): number {
    return NumUtility.toMoney(order.totalPrice + order.totalTax);
}


export default defineComponent({
    name: 'SubmitPaymentDialog',
    components: {
        SimpleDialog,
        ModalDialog
    },
    emits: [],
    props: {
        order: OrderDTO
    },

    setup(props, context) {
        let paymentClient: any = null;

        // template refs
        const dialog = ref(null as unknown as IModalDialog);
        const googlePayButtonHost = ref(null as unknown as HTMLElement);
        const statusContainer = ref(null as unknown as HTMLElement);
        const paymentRequestButton = ref(null as unknown as HTMLDivElement);

        // props and other refs
        const applePayAvailabilityState = ref('');

        const isApplePaySupported = () => {
            if ((window as any).ApplePaySession) {
                return true;
            }
            else {
                return false;
            }
        }

        const show = async () => {
            setStatusMessage(statusContainer.value, '');
            let result = await dialog.value.show();
            return result;
        };

        const totalPrice = computed((): string => {
            let order = props.order;
            if (order) {
                return StringUtility.toPriceText(getTotalToCharge(order));
            }
            else {
                return '0.00';
            }
        });

        //https://github.com/jnm733/gulp-web/blob/54a3eb578e2da51761c9e0c0e3582340a54f62e1/public/js/deposit.js
        // good overview of using google nad apple pay

        const handleGooglePay = async () => {
            let priceToCharge = getTotalToCharge(props.order!);
            let priceText = StringUtility.toPriceText(priceToCharge);
            setStatusMessage(statusContainer.value, `Initiated Google Pay for ${priceText} `);

            let paymentRequestPayload = createPaymentRequestPayload(priceToCharge);
            console.log(paymentRequestPayload);
            try {
                let paymentTokenInfo = await paymentClient.loadPaymentData(paymentRequestPayload);
                console.log(paymentTokenInfo);
                setStatusMessage(statusContainer.value,  `Google Pay token generated and completing payment`);
                
                let tokenJsonText = paymentTokenInfo.paymentMethodData.tokenizationData.token;
                let tokenObject = JSON.parse(tokenJsonText);
                let payToken = tokenObject.id;

                let result = await completeTokenPayment(priceToCharge, payToken , 'Test charge', props.order!.id, props.order!.groupList[0].id);
                if (result.isSuccess) {
                    setStatusMessage(statusContainer.value, 'Payment sucessful.');
                }
                else {
                    setStatusMessage(statusContainer.value, `Payment failed: ${result.statusMessage}`);
                }

            }
            catch (errorInfo) {
                console.log('payment request failed: ' + errorInfo.statusMessage);
                setStatusMessage(statusContainer.value, `Google Pay failed: ${errorInfo.statusMessage} `);
            }

        }
        

        // https://medium.com/@ionutghisoi95/apple-pay-example-payments-1-acc2b7954b05
        const handleApplePay = async () => {
            return new Promise((accept) => {

                const paymentRequest = {
                    countryCode: "US",
                    currencyCode: "USD",
                    supportedNetworks: ["masterCard", "visa", "amex"],
                    merchantCapabilities: ["supports3DS"],
                    total: {
                        label: "Dinesync Inc.",
                        amount: "1.25"
                    }
                }

                const applePaySession = new ApplePaySession(10, paymentRequest);

                applePaySession.onvalidatemerchant = async (eventInfo: any) => {
                    var validatinResult = await validateApplePaySession(eventInfo.validationURL);
                    console.log(validatinResult);
                    applePaySession.completeMerchantValidation(validatinResult);
                }

                applePaySession.onpaymentauthorized = async (payEventInfo: any) => {
                    let priceToCharge = getTotalToCharge(props.order!);
                    console.log(payEventInfo.payment);
                    console.log(payEventInfo.payment.token);
                    console.log('aaa; ' + payEventInfo.payment.token.id);
                    console.log('--------------------');
                    console.log(JSON.stringify(payEventInfo));

                    applePaySession.completePayment(ApplePaySession.STATUS_FAILURE);
                    /*
                    let result = await completeTokenPayment(priceToCharge, payEventInfo.payment.token , 'Test charge', props.order!.id, props.order!.groupList[0].id);
                    if (result.isSuccess) {
                        applePaySession.completePayment(ApplePaySession.STATUS_SUCCESS);
                        setStatusMessage(statusContainer.value, 'Payment sucessful.');
                    }
                    else {
                        applePaySession.completePayment(ApplePaySession.STATUS_FAILURE);
                        setStatusMessage(statusContainer.value, `Payment failed: ${result.statusMessage}`);
                    }
                    */
                };

                applePaySession.begin();

            })



        };

        onMounted(async ()=> {
            let result = await loadGpayScript();
            paymentClient = result.paymentClient;
            if (paymentClient) {
                let googlePayButton = paymentClient.createButton({
                    onClick: handleGooglePay,
                    buttonSizeMode: 'fill'
                });

                googlePayButtonHost.value.appendChild(googlePayButton);

            }
            else {
                console.error('Failed to load GPay scripts: ' + result.statusMessage);
            }

            if ((window as any).ApplePaySession) {
                if ((window as any).ApplePaySession.canMakePayments()) {
                    applePayAvailabilityState.value = 'available';
                }
            }
            
            let stripe = (Stripe as any)('pk_test_Hh3Sz1xYRjwDAKJ5MxHtGTBY00jOYEr8Xc', {
                apiVersion: "2020-08-27",
            });
            let paymentRequest = stripe.paymentRequest({
                country: 'US',
                currency: 'usd',
                total: {
                    label: 'BBQ Pit',
                    amount: 1050
                },
                requestPayerPhone: true,
                requestPayerEmail: true
            });

            let elements = stripe.elements();
            let payButton = elements.create('paymentRequestButton', {
                paymentRequest: paymentRequest
            });

            let canMakePaymentResult = await paymentRequest.canMakePayment();
            if (canMakePaymentResult) {
                payButton.mount(paymentRequestButton.value);
            }
            

        });


        return {
            dialog,
            googlePayButtonHost,
            statusContainer,
            paymentRequestButton,

            totalPrice,
            applePayAvailabilityState,

            handleApplePay,

            isApplePaySupported,
            show
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

.payButtonHost {
    width: 15rem;
    height: 4.2rem;
}

.payButtonList {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 32rem;
}

.applePayButton {
    display: inline-block;
    -webkit-appearance: -apple-pay-button;
    -apple-pay-button-type: check-out; 
    -apple-pay-button-style: black;
}

.statusContainer {
    display: flex;
    align-items: center;
    max-width: 32rem;
    height: 8.6rem;
    width: 100%;
    margin-top: 2.6rem;
    overflow: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    font-size: 1.5rem;
}
</style>