<template>
    <ModalDialog ref="dialog">
        <template v-slot:header>
            <div>Payment</div>
        </template>
        <template v-slot:content>
            <div style="display: flex; flex-direction: column;">
                <div ref="googlePayButtonHost" class="payButtonHost"></div>
            </div>
        </template>
    </ModalDialog>
    
</template>

<script lang="ts">
// https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions
import SimpleDialog, { ISimpleDialog } from "@/next-ux2/components/dialogs/simple-dialog.vue";
import ModalDialog, { IModalDialog } from "@/next-ux2/components/dialogs/modal-dialog.vue";

import { defineComponent, onMounted, ref } from 'vue';

import { loadGpayScript } from "@/payments/stripe-processor";

export default defineComponent({
    name: 'InventorySelector',
    components: {
        SimpleDialog,
        ModalDialog
    },
    emits: [],
    props: {
    },

    setup(props, context) {
        // template refs
        const dialog = ref(null as unknown as IModalDialog);
        const googlePayButtonHost = ref(null as unknown as HTMLElement);

        const show = async () => {
            let result = await dialog.value.show();
            return result;
        };

        const handleGooglePay = () => {

        }

        onMounted(async ()=> {
            let result = await loadGpayScript();
            if (result.paymentClient) {
                let googlePayButton = result.paymentClient.createButton({
                    onClick: handleGooglePay,
                    buttonSizeMode: 'fill'
                });

                googlePayButtonHost.value.appendChild(googlePayButton);

            }
            else {
                console.error('Failed to load GPay scripts: ' + result.statusMessage);
            }
        });

        return {
            dialog,
            googlePayButtonHost,

            show
        };
    }
});
</script>

<style scoped>
.payButtonHost {
    width: 15rem;
    height: 3.2rem;
}
</style>