<template>
    <div class="choiceContainerWrapper">
        <div class="choiceContainer withQuantity" :class="{'withQuantity': orderMenuItemOption.isMoreThanOne || orderMenuItemOption.isQuantityWordUsed}">
            <Checkbox :boundObject="orderMenuItemOption" boundPropName="isSelected">{{ orderMenuItemOption.name }}</Checkbox>

            <div class="quantityInputContainer">
                <template v-if="orderMenuItemOption.isMoreThanOne && !orderMenuItemOption.isQuantityWordUsed">
                    <button class="outlineButton" @click="changeQty(-1)">
                        <div class="buttonContent"><i class="material-icons">remove</i></div>
                    </button>
                    <div class="quantityLabel">{{ orderMenuItemOption.amount }}</div>
                    <button class="outlineButton" @click="changeQty(1)">
                        <div class="buttonContent"><i class="material-icons">add</i></div>
                    </button>
                </template>
                <template v-else-if="orderMenuItemOption.isMoreThanOne && orderMenuItemOption.isQuantityWordUsed">
                    <button class="outlineButton" @click="prevQuantityWord()">
                        <div class="buttonContent"><i class="material-icons">chevron_left</i></div>
                    </button>
                    <div class="quantityWordLabel">{{ orderMenuItemOption.selectedQuantityWord }}</div>
                    <button class="outlineButton" @click="nextQuantityWord()">
                        <div class="buttonContent"><i class="material-icons">chevron_right</i></div>
                    </button>
                </template>
            </div>
        </div>
        <div class="choiceContainerInfoLabel" v-if="subheadingContent != ''">{{ subheadingContent }}</div>
        <button @click="requestChangeLiquor()" class="changeLiquorButton" v-if="isBarBeverage" style="margin-top:0.7rem;">
            <div class="buttonContentContainer"><i class="material-icons">outbond</i><span>change liquor</span></div>
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';

import InventorySelector, { IInventorySelector } from './InventorySelector.vue';

import Checkbox from '@/next-ux2/components/input/checkbox.vue';

import { OrderMenuItemOptionGroupDTO, OrderMenuItemOptionDTO } from '@/dinesync/dto/OrderDTO';
import { IMenuItemPrice } from '@/dinesync/dto/MenuDTO';

import { StringUtility } from '@/next-ux2/utility';
import { MenuHelper } from '@/dinesync/dto/utility/MenuHelper';
import { OrderInfoHelper } from '@/dinesync/dto/utility/OrderInfoHelper';

interface IPriceInfo {
    size: string,
    price: number
}

export default defineComponent({
    name: 'OrderMenuItemOptionView',
    components: {
        InventorySelector,
        Checkbox
    },
    emits: ['changeLiquorRequested'],
    props: {
        orderMenuItemOptionGroup: OrderMenuItemOptionGroupDTO,
        orderMenuItemOption: OrderMenuItemOptionDTO,
        isBarBeverage: {
            type: Boolean,
            default: false
        },
        doesGroupControlPricing: {
            type: Boolean,
            default: false
        }
    },

    setup(props, context) {
        // template refs
        
        // prop refs
        const orderMenuItemOption = ref(props.orderMenuItemOption!);

        // data
        const subheadingContent = ref('');

        // public methods
        const changeQty = (offset: number) => {
            // never go below 1
            let newQty = orderMenuItemOption.value.amount + offset;
            if (newQty < 1) {
                newQty = 1
            }

            orderMenuItemOption.value.amount = newQty;

            // auto select the option whenever changing qty
            orderMenuItemOption.value.isSelected = true;
        }

        const prevQuantityWord = () => {
            let wordList = MenuHelper.createWordList(orderMenuItemOption.value.quantityWordRange);
            let currentIndex = wordList.indexOf(orderMenuItemOption.value!.selectedQuantityWord);
            let newIndex = 0;
            if (currentIndex > 1) {
                newIndex = currentIndex - 1;
            }
            orderMenuItemOption.value.selectedQuantityWord = wordList[newIndex];
        }

        const nextQuantityWord = () => {
            let wordList = MenuHelper.createWordList(orderMenuItemOption.value.quantityWordRange);
            let currentIndex = wordList.indexOf(orderMenuItemOption.value.selectedQuantityWord);
            let newIndex = wordList.length - 1;
            if (currentIndex < (wordList.length - 1)) {
                newIndex = currentIndex + 1;
            }

            orderMenuItemOption.value.selectedQuantityWord = wordList[newIndex];
        }

        const requestChangeLiquor = () => 
            { context.emit('changeLiquorRequested', { optionGroup: props.orderMenuItemOptionGroup, optionItem: props.orderMenuItemOption }); };

        const getSubheadingContent = ()=> {
            let returnValue = '';
            let quantityInfo = orderMenuItemOption.value.selectedQuantityInfo;
            if ((quantityInfo.price > 0) && orderMenuItemOption.value.isMoreThanOne) {
                returnValue = `$${StringUtility.toPriceText(quantityInfo.price)} extra for each one`;
                if (quantityInfo.maxQuantityBeforeCharging > 0) {
                    returnValue += ` over ${quantityInfo.maxQuantityBeforeCharging}`;
                }
            }

            return returnValue;
        };

        subheadingContent.value = getSubheadingContent();

        watch(props.orderMenuItemOption!, (refObject, oldValue) => {
            orderMenuItemOption.value = props.orderMenuItemOption!
            subheadingContent.value = getSubheadingContent();
            
        });
        
        return {
            orderMenuItemOption,
            subheadingContent,
            isBarBeverage: props.isBarBeverage,

            changeQty,
            prevQuantityWord,
            nextQuantityWord,
            requestChangeLiquor
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

button.changeLiquorButton {
    padding: 0 0 0.7rem 0;
    margin: 0;
    font-size: 1.5rem;
    border-width: 0;
    background-color: transparent;
}

button.changeLiquorButton .material-icons {
    font-size: inherit
}

button.changeLiquorButton:active {
    background-color: var(--var-secondaryOverlay5-background);
}

button.changeLiquorButton:focus {
    outline: none;
}

</style>