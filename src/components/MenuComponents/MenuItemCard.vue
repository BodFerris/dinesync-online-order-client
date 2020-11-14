<template>
    <div class="menuItemCard" :style="{width: width}">
            <div v-if="menuItem.areTaxesCoveredByPrice" class="includesTaxHeading">price includes tax</div>
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
            <button v-if="menuItemAvailabilityInfo.isAvailable" class="linkButton alignWithoutPadding" @click="handleAddToOrderClick">
                <div class="buttonContentContainer">
                    <i class="material-icons" style="font-size: 1.3em; margin-right: 0.3em;">add_circle</i>
                    <span>Add to order</span>
                </div>
            </button>
            <div v-else class="menuItemUnavailableInfoContainer">
                {{ menuItemAvailabilityInfo.reasonForUnavailability }}
            </div>
        </div>
        
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { MenuItemDTO, IMenuItem, MenuDTO } from '@/dinesync/dto/MenuDTO';
import { StringUtility } from '@/next-ux2/utility/string-utility';
import { OrderMenuItemDTO } from '@/dinesync/dto/OrderDTO';
import { MenuHelper } from '@/dinesync/dto/utility/MenuHelper';

export default defineComponent({
  name: 'MenItemCard',
  emits: ['addToOrderRequested'],
  props: {
    width: {
        type: String,
        default: '32rem'
    },

    menuItem: {
        type: Object,
        default: () => {}
    },

    menu: {
        type: Object,
        default: () => {}
    }
  },
  
  setup(props, context) {
      // prop refs
      const width = ref(props.width);
      const menuItem = ref<MenuItemDTO>(props.menuItem as MenuItemDTO);
      const menu = ref<MenuDTO>(props.menu as MenuDTO);
      const menuItemAvailabilityInfo = ref(MenuHelper.getMenuItemAvailabilityInfo(props.menu as MenuDTO, props.menuItem as MenuItemDTO ));

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
          menuItemAvailabilityInfo,

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
    position: relative;
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

.includesTaxHeading {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    padding: 0.2rem 1.7rem 0.2rem 0.2rem;
    width: 100%;
    
    text-align: right;
    font-size: 1.2rem;
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

.menuItemUnavailableInfoContainer {
    padding: 0.7rem 0;
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.1rem;
}

.menuItemFooter {
    flex: 0 0 auto;
    box-sizing: border-box;
    padding-top: 0.7rem;

    display: flex;
    align-items: center;
}

.menuItemSizeLabel {
    font-size: 1.3rem;
    font-style: italic;
    margin-right: 0.5rem;
}
</style>
