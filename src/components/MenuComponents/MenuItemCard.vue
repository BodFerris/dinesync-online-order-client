<template>
    <div class="menuItemCard" :style="{width: width}">
        <div class="menuItemHeadingContainer">
            <div class="menuItemHeading">
                <div>{{ menuItem.name }}</div>
                <div v-if="menuItem.priceList.length <= 2">{{ toCondensedPriceListText(menuItem.priceList) }}</div>
            </div>
            <template v-if="menuItem.priceList.length > 2">
                <div  v-for="priceItem in menuItem.priceList" :key="priceItem.size" class="menuItemPriceListContainer">
                    <div><span class="menuItemSizeLabel" v-if="!isStringEmpty(priceItem.size)">{{ priceItem.size }}</span>${{ toPriceText(priceItem.price) }}</div>
                </div>
            </template>
        </div>
        
        <div class="menuItemDescription">{{ menuItem.description }}</div>

        <div class="menuItemFooter">
            <button class="linkButton alignWithoutPadding" @click="handleAddToOrderClick">
                <div class="buttonContentContainer">
                    <i class="material-icons" style="font-size: 1.3em; margin-right: 0.3em;">add_circle</i>
                    <span>Add to order</span>
                </div>
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { MenuItemDTO, IMenuItem } from '@/dinesync/dto/MenuDTO';
import { StringUtility } from '@/next-ux2/utility/string-utility';

export default defineComponent({
  name: 'MenItemCard',
  emits: ['addToOrderRequested'],
  props: {
    width: {
        type: String,
        default: '32rem'
    },

    menuItem: Object,
    default: () => {}
  },
  
  setup(props, context) {

      // prop refs
      const width = ref(props.width);
      const menuItem = ref(props.menuItem);

      const toCondensedPriceListText = (priceList: Array<{price: number, size: string}>) =>  {
          let returnValue = '';

          if (priceList.length === 1) {
              let priceItem = priceList[0];
              returnValue = '$' + StringUtility.toPriceText(priceItem.price);
          }
          else {
              priceList.forEach((priceItem, i) => {
                  returnValue += '$' +StringUtility.toPriceText(priceItem.price);
                  if (i !== (priceList.length -1)) {
                      returnValue += ' / ';
                  }
              })
          }

          return returnValue;
      }

      const handleAddToOrderClick = () => { context.emit('addToOrderRequested', menuItem.value) };

      return {
          width,
          menuItem,

          toCondensedPriceListText,
          handleAddToOrderClick,
          isStringEmpty: StringUtility.isNullOrEmpty,
          toPriceText: StringUtility.toPriceText
          
      }
  }

});
</script>

<style scoped>
.menuItemCard {
    display: flex;
    flex-direction: column;
    height: 17rem;
    box-sizing: border-box;
    padding: 1.7rem 1.7rem 0.7rem 1.7rem;
    background-color: var(--var-primaryNeutralVar3-color);
}

.menuItemHeadingContainer {
    flex: 0 0 auto;
    color: var(--var-primaryFont-color);
    box-sizing: border-box;
    padding-bottom: 1rem;
}

.menuItemHeading {
    flex: 0 0 auto; 

    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--var-primaryFont-color);
}


.menuItemPriceListContainer {
    display: flex; 
    align-items:  baseline; 
    justify-content: space-between; 
    font-size: 1.5rem; 
    font-weight: 600; 
    box-sizing: border-box;
}

.menuItemDescription {
    flex: 1 1 auto;

    color: var(--var-primaryFont-color);
    font-size: 1.4rem; 
    letter-spacing: 0.05rem;
    overflow: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.menuItemFooter {
    flex: 0 0 auto;
    box-sizing: border-box;
    padding-top: 0.7rem;
}

.menuItemSizeLabel {
    font-size: 1.3rem;
    font-style: italic;
    margin-right: 0.5rem;
}
</style>
