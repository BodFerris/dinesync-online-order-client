<template>
    <div>
        <div ref="dropdownContainer" class="nux-dropdownContainer" :style="{ fontSize: fontSize, width: width }"
                @click="showDropdown">
            <input ref="textbox" type="text" class="nux-dropdownTextbox" :placeholder="placeholder"  readonly />
            <div class="nux-dropdownIconContainer"><i class="material-icons">arrow_drop_down</i></div>
        </div>
        <DropdownFlyout ref="flyout" :width="width" :textFieldName="textFieldName" :zIndex="zIndex"
                :itemList="itemList"
                @selected="handleSelectedItem" />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, Teleport, onBeforeMount, onBeforeUnmount, onMounted, watch } from 'vue';
import { StringUtility } from '@/next-ux2/utility/string-utility';
import DropdownFlyout, { IDropdownFlyout } from '../containers/dropdown-flyout.vue';

export interface IDropdown {
    items: Array<any>,
    selectedItem: any,
    selectItem(item: any): void;
    showDropdown(): void;
    resetList(list: Array<any>): void;
    dropdownContainer: HTMLElement
}

export default defineComponent({
    name: 'Dropdown',
    components: {
        DropdownFlyout
    },
    emits: ['selected'],
    props: {
        itemList: {
            type: Array,
            default: () => []
        },
        bindingObject: {
            type: Object,
            default: null
        },
        bindingProperty: {
            type: String,
            default: null
        },

        fontSize: {
            type: String,
            default: 'inherit'
        },
        width: {
            type: String,
            default: '15rem'
        },
        placeholder: {
            type: String,
            default: ''
        },
        textFieldName: {
            type: String,
            default: null
        },
        zIndex: {
            type: Number,
            default: 0
        }
    },

    setup(props, context) {
        // template refs
        const dropdownContainer = ref(null as unknown as HTMLElement);
        const textbox = ref(null as unknown as HTMLInputElement);
        const flyout = ref(null as unknown as IDropdownFlyout);

        // data
        const itemList = ref(props.itemList);
        const bindingObject = ref(null as unknown as Object);
        const bindingProperty = ref(null as unknown as string);
        
        const selectedItem = computed({
            get: () =>  flyout.value.selectedItem,
            set: value => { 
                flyout.value.setSelectedItem(value);
                handleSelectedItem(value);
            }
        });

        const items = computed({
            get: () => flyout.value.items,
            set: value => {
                flyout.value.items = value;
            }
        });

        const handleSelectedItem = (item: any) => {
            if (!item) {
                textbox.value.value = '';
            }
            else {
                textbox.value.value = flyout.value.getItemText(item);

                if (bindingObject.value && bindingProperty.value) {
                    (bindingObject.value as any)[bindingProperty.value] = item;
                }

                context.emit('selected', item);
            }
        }

        // methods
        const showDropdown = () => {
            flyout.value.show(dropdownContainer.value);
        }

        const resetList = (list: Array<any>) => { flyout.value.resetList(list) };

        return {
            dropdownContainer,
            textbox,
            flyout,

            itemList,
            items,
            selectedItem,
            handleSelectedItem,
            resetList,
            showDropdown
        };
    },

    methods: {
        
    }
    
});

</script>