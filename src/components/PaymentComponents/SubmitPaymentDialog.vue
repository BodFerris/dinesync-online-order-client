<template>
    <ModalDialog ref="dialog" headerPadding="0px">
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
                <label class="nux-labelVertical">phone number or email</label>
                <input type="text" class="nux-textBox" style="width: 30rem;" />

                <div ref="paymentRequestButton"></div>
                
                <div ref="statusContainer" class="statusContainer">

                </div>
            </div>
        </template>
        <template v-slot:footer>
            <button class="nux-flatButton" @click="hide()" >Exit</button>
        </template>
    </ModalDialog>
    
</template>

<script lang="ts">
import SimpleDialog, { ISimpleDialog } from "@/next-ux2/components/dialogs/simple-dialog.vue";
import ModalDialog, { IModalDialog } from "@/next-ux2/components/dialogs/modal-dialog.vue";

import { computed, defineComponent, onMounted, ref } from 'vue';

import { createPaymentRequestPayload, completeTokenPayment, validateApplePaySession } from "@/payments/stripe-processor";
import { OrderDTO } from '@/dinesync/dto/OrderDTO';
import { NumUtility, StringUtility } from '@/next-ux2/utility';
import { OrderHelper } from '@/dinesync/dto/utility/OrderHelper';
import { DataManager } from '@/DataManager';


function setStatusMessage(hostElement: HTMLElement, statusMessage: string) {
    hostElement.textContent = statusMessage;
}

function getGrandTotalToCharge(order: OrderDTO, onlineSurcharge: number): number {
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



export default defineComponent({
    name: 'SubmitPaymentDialog',
    components: {
        SimpleDialog,
        ModalDialog
    },
    emits: [],
    props: {
        order: OrderDTO,
        onlineSurcharge: {
            type: Number,
            default: 0
        }
    },

    setup(props, context) {
        let paymentClient: any = null;

        // template refs
        const dialog = ref(null as unknown as IModalDialog);
        const statusContainer = ref(null as unknown as HTMLElement);
        const paymentRequestButton = ref(null as unknown as HTMLDivElement);

        const hide = async () => {
             dialog.value.hide('ok');
        }

        const show = async () => {
            setStatusMessage(statusContainer.value, '');
            let result = await dialog.value.show();
            return result;
        };

        const grandTotalToChargeText = computed((): string => {
            let order = props.order;
            if (order) {
                return toPriceText(getGrandTotalToCharge(order, props.onlineSurcharge));
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
                return (props.onlineSurcharge !== 0) || (order.totalTax > 0);
            }
            else {
                return false;
            }
        });


        return {
            dialog,
            statusContainer,
            paymentRequestButton,

            onlineSurcharge: props.onlineSurcharge,

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

.totalSummary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
}

.totalSummary label {
    margin: 0;
    padding: 0;
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05rem;

    color: var(--var-primary-color);
}

.totalSummary .price {
    font-size: 1.5rem;
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