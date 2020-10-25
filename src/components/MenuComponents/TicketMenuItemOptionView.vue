<template>
<!-- the 3.4rem margins are to keep the text aligned since there are edit buttons to the left and right of the menu title -->
    <div class="menuItemRow" v-for="item in optionInfoList" :key="item.title" style="margin-left: 3.4rem; opacity: 0.85; font-size: 0.8em">
        <div class="menuItemNameContainer">{{ titleText(item) }}</div>
        <div class="priceContainer" style="margin-right: 3.4rem;">{{ item.price }}</div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick, watchEffect} from 'vue';

import { OrderMenuItemOptionGroupDTO, OrderMenuItemOptionDTO, OrderMenuItemDTO, IOrderOptionItemPrintInfo } from '@/dinesync/dto/OrderDTO';
import { IMenuItemPrice } from '@/dinesync/dto/MenuDTO';

import { StringUtility } from '@/next-ux2/utility';
import { OrderHelper } from '@/dinesync/dto/utility/OrderHelper';

interface IPriceInfo {
    size: string,
    price: number
}

export default defineComponent({
    name: 'TicketMenuItemOptionView',
    components: {

    },
    emits: [],
    props: {
        orderMenuItem: OrderMenuItemDTO
    },

    setup(props, context) {
        // template refs
        
        // prop refs
        const optionInfoList = ref(OrderHelper.getPrintOptionItemInfo(props.orderMenuItem as OrderMenuItemDTO, true));

        const titleText = (value: IOrderOptionItemPrintInfo): string => {
            let returnValue = value.title;
            let quanityText = '';
            if (value.isQuantityWordUsed) {
                quanityText = value.quantity;
            }
            else if (!StringUtility.isNullOrEmpty(value.quantity.trim())) {
                if (parseInt(value.quantity) > 1) {
                    quanityText = 'x' + value.quantity;
                }
            }

            if (!StringUtility.isNullOrEmpty(quanityText)) {
                    returnValue += ` (${quanityText})`;
            }

            return returnValue;
        }

        watchEffect(() => {
            optionInfoList.value = OrderHelper.getPrintOptionItemInfo(props.orderMenuItem as OrderMenuItemDTO, true);
        })

        return {
            optionInfoList,

            titleText
        };
    }
});

</script>

<style scoped>

.choiceContainer {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
}

.choiceContainerInfoLabel {
    font-size: 1.4rem; 
    margin-top: 0.3rem;
}

.choiceContainerWrapper {
    display: flex;
    flex-direction: column;

    box-sizing: border-box;
    padding: 1rem 0;

    width: 100%;
    overflow: hidden;
}

.choiceContainer.withQuantity {
    justify-content: space-between;
}

.quantityInputContainer {
    display: flex;
    align-items: center;
}

button.outlineButton {
    margin: 0;
    padding: 0;
    border: 3px solid var(--var-primary-color);
    border-radius: 0.4rem;
    width: 2.2rem;
    height: 2.2rem;
    background-color: transparent;
}

button.outlineButton .material-icons {
    font-size: 1.7rem;
}

button.outlineButton:active {
    background-color: var(--var-primaryOverlay-color);
}

button.outlineButton .buttonContent {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--var-primaryFont-color);
    font-weight: 600;
    font-size: 1.5rem;
    letter-spacing: 0.05rem;
    text-transform: uppercase;
}

.quantityLabel {
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0 1.5rem;
}

.quantityWordLabel {
    font-size: 1.5rem;
    font-weight: 400;
    width: 8rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
    padding: 0 0.3rem;
    box-sizing: border-box;
}


</style>