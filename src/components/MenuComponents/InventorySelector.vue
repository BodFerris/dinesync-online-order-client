<template>
    <div>
        <SimpleDialog ref="dialog" :isClosePreventedWhenTappingOnContainer="true" maxWidth="100%">
            <div>
                <div>
                    <label class="nux-inputLabel nux-labelVertical" style="display:block;">Liquor Type</label>
                    <Dropdown  ref="classTypeDropdown" width="24rem"  :itemList="classTypeList"
                        @selected="handleClassChanged" />
                </div>

                <div style="margin-top: 1rem;">
                    <label class="nux-inputLabel nux-labelVertical" style="display:block;">Category</label>
                    <Dropdown  ref="categoryDropdown" width="24rem"  :itemList="categoryList" 
                        @selected="handleSelectionChange" />
                </div>

                <div class="ingredientListContainer nux-controlBorder">
                    <button class="nux-flatButton"  style="width: 100%;"
                                v-on:click="handleSelectInventory(inventoryItem)"
                                v-for="inventoryItem in inventoryList" 
                                :key="inventoryItem.name">
                        <div class="buttonContentContainer"><i class="material-icons">input</i><span>{{ inventoryItem.name }}</span></div>
                    </button>
                    <div v-if="inventoryList.length === 0" class="emptyIngredientMessageContainer">
                        No Liquors for Selection                     
                    </div>

                </div>
            </div>
        </SimpleDialog>
    </div>
</template>


<script lang="ts">

import SimpleDialog, { ISimpleDialog } from "@/next-ux2/components/dialogs/simple-dialog.vue";
import Dropdown, { IDropdown } from "@/next-ux2/components/input/dropdown.vue";

import { InventoryItem } from '@/dinesync/dto/MenuDTO';

import { defineComponent, ref, nextTick, onMounted } from 'vue';

function createInventorySelectorLookupTables(inventoryList: Array<InventoryItem>) {
    let classTypeList = new Array<string>();
    let categoryTypeList = new Array<string>();

    let classNameToInventoryLookup = {} as any;
    let categoryToInventoryLookup = {} as any;
    let classNameToCategoryLookup = {} as any;
    let classNameAndCategoryToInventoryLookup = {} as any;
    let masterInventoryList = [];
        
    inventoryList.forEach((inventoryItem) => {
        if (!classNameToInventoryLookup[inventoryItem.className]) {
            classNameToInventoryLookup[inventoryItem.className] = [];
        }

        if (!categoryToInventoryLookup[inventoryItem.categoryName]) {
            categoryToInventoryLookup[inventoryItem.categoryName] = [];
        }

        if (!classNameToCategoryLookup[inventoryItem.className]) {
            classNameToCategoryLookup[inventoryItem.className] = ['ALL'];
        }

        let classAndCategoryId = inventoryItem.className + inventoryItem.categoryName;
        if (!classNameAndCategoryToInventoryLookup[classAndCategoryId]) {
            classNameAndCategoryToInventoryLookup[classAndCategoryId] = [];
        }

        if (classNameToInventoryLookup[inventoryItem.className].indexOf(inventoryItem) < 0) {
            classNameToInventoryLookup[inventoryItem.className].push(inventoryItem);  
        }

        if (categoryToInventoryLookup[inventoryItem.categoryName].indexOf(inventoryItem) < 0) {
            categoryToInventoryLookup[inventoryItem.categoryName].push(inventoryItem);
        }

        if (classNameToCategoryLookup[inventoryItem.className].indexOf(inventoryItem.categoryName) < 0) {
            classNameToCategoryLookup[inventoryItem.className].push(inventoryItem.categoryName);
        }
        
        if (classNameAndCategoryToInventoryLookup[classAndCategoryId].indexOf(inventoryItem)< 0) {
            classNameAndCategoryToInventoryLookup[classAndCategoryId].push(inventoryItem);
        }

        let categoryListForClass = classNameToCategoryLookup[inventoryItem.className];
        if (categoryListForClass.indexOf(inventoryItem.categoryName) < 0) {
            categoryListForClass.push(inventoryItem.categoryName);
            categoryListForClass.sort();
        }

        if (classTypeList.indexOf(inventoryItem.className) < 0) {
            classTypeList.push(inventoryItem.className);
        }

        if (categoryTypeList.indexOf(inventoryItem.categoryName) < 0) {
            categoryTypeList.push(inventoryItem.categoryName);
        }
    });

    classTypeList.sort();
    categoryTypeList.sort();
    classTypeList.splice(0, 0, 'ALL');
    categoryTypeList.splice(0, 0, 'ALL');

    classNameToCategoryLookup['ALL'] = [...categoryTypeList];

    return {
        classTypeList,
        categoryTypeList,

        classNameToInventoryLookup,
        categoryToInventoryLookup,
        classNameToCategoryLookup,
        classNameAndCategoryToInventoryLookup,

        masterInventoryList: [...inventoryList].sort((a, b) => a.name.localeCompare(b.name))
    };
}

export interface IInventorySelector {
    show(fullInventoryList: Array<InventoryItem>, anchorElement: HTMLElement, initialClass?: string, initialCategory?: string): Promise<InventoryItem>
}

export default defineComponent({
    name: 'InventorySelector',
    components: {
        SimpleDialog,
        Dropdown
    },
    emits: [],
    props: {
    },

    setup(props, context) {
        // private
        let classNameToInventoryLookup = {} as { [className: string]: Array<InventoryItem> } ;
        let categoryToInventoryLookup = {} as { [classNameAndCategoryId: string]: Array<InventoryItem> };
        let classNameToCategoryLookup = {} as { [className: string]: Array<string> };
        let classNameAndCategoryToInventoryLookup = {} as { [classNameAndCategoryId: string]: Array<InventoryItem> };
        let masterInventoryList = new Array<InventoryItem>();

        let selectedInventoryItem: InventoryItem | null;

        // template refs
        const dialog = ref(null as unknown as ISimpleDialog);

        const classTypeDropdown = ref(null as unknown as IDropdown);
        const categoryDropdown = ref(null as unknown as IDropdown);

        // data
        const classTypeList = ref(new Array<string>());
        const categoryList = ref(new Array<string>());
        const inventoryList = ref(new Array<InventoryItem>());

        // private methods

        // public methods
        const handleSelectionChange = () => {
            let selectedClass = classTypeDropdown.value.selectedItem;
            let selectedCategory = categoryDropdown.value.selectedItem;

            // if class or category have not been selected, then exit;
            // this can only occur when initally setting up
            if (!selectedClass || ! selectedCategory) {
                return;
            }
            
            if ((selectedClass === 'ALL') && (selectedCategory === 'ALL')) {
                inventoryList.value.splice(0, inventoryList.value.length, ...masterInventoryList);
            }
            else if ((selectedClass !== 'ALL') && (selectedCategory === 'ALL')) {
                inventoryList.value.splice(0, inventoryList.value.length, ...classNameToInventoryLookup[selectedClass]);
            }
            else if ((selectedClass === 'ALL') && (selectedCategory !== 'ALL')) {
                inventoryList.value.splice(0, inventoryList.value.length, ...categoryToInventoryLookup[selectedCategory]);
            }
            else if ((selectedClass !== 'ALL') && (selectedCategory !== 'ALL')) {
                inventoryList.value.splice(0, inventoryList.value.length, ...classNameAndCategoryToInventoryLookup[selectedClass + selectedCategory]);
            }
        }

        const handleClassChanged = async (className: string) => {
            // update the category list to match what's available for the class list;
            // select the same cateogry if it exists, otherwise select ALL.
            let categoryListForClass = classNameToCategoryLookup[className];

            let categoryDropdown_ = categoryDropdown.value;
            let selectedCategory = categoryDropdown_.selectedItem as string;
            let categoryToSelect = selectedCategory;
            if (categoryListForClass.indexOf(selectedCategory) < 0) {
                categoryToSelect = "ALL";
            }

            categoryDropdown_.resetList(categoryListForClass);

            // wait for the dropdown to databind and then call handleSelectionChange
            // to popualte the incredients associsated with the class and 
            // category filter.
            await nextTick();
            categoryDropdown_.selectedItem = categoryToSelect;

            handleSelectionChange();
        }

        const getSelectedInventory = () => {
            return selectedInventoryItem;
        }

        const handleSelectInventory = (inventoryItem: InventoryItem) => {
            selectedInventoryItem = inventoryItem;
            dialog.value.hide();
        }

        const show = async (fullInventoryList: Array<InventoryItem>, anchorElement: HTMLElement, initialClass = 'ALL', initialCategory = 'ALL') => {
            selectedInventoryItem = null;

            // if the inventory lookup tables have already been set, then don't repeat
            if (Object.keys(classNameToInventoryLookup).length === 0) {
                let lookupTables = createInventorySelectorLookupTables(fullInventoryList);
                classTypeList.value.splice(0, classTypeList.value.length, ...lookupTables.classTypeList);
                categoryList.value.splice(0, categoryList.value.length, ...lookupTables.categoryTypeList);
                classNameToInventoryLookup = lookupTables.classNameToInventoryLookup;
                categoryToInventoryLookup = lookupTables.categoryToInventoryLookup;
                classNameToCategoryLookup = lookupTables.classNameToCategoryLookup;
                classNameAndCategoryToInventoryLookup = lookupTables.classNameAndCategoryToInventoryLookup;
                masterInventoryList = lookupTables.masterInventoryList;

                await nextTick();
            }
            
            await nextTick();
            classTypeDropdown.value.selectedItem = initialClass;
            categoryDropdown.value.selectedItem = initialCategory;
            
            await dialog.value.show(anchorElement, 'right', 'center');
            return selectedInventoryItem;
        }
            
        return {
            dialog,
            classTypeDropdown,
            categoryDropdown,

            classTypeList,
            categoryList,
            inventoryList,

            handleSelectionChange,
            handleClassChanged,
            handleSelectInventory,

            show
        };
    }
});

</script>

<style scoped>
    .ingredientListContainer {
        position: relative;
        margin-top: 2rem; 
        height: 15rem; 
        overflow: none; 
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
        width: 24rem;
        box-sizing: border-box;
    }

    .emptyIngredientMessageContainer {
        position: absolute; 
        width: 100%; 
        height: 100%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        text-transform: uppercase;
        letter-spacing: 0.07rem;
    }

</style>