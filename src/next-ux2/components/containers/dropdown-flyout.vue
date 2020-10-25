<template>
    <teleport to="body">
        <div ref="flyoutContainer" class="nux-dropDownFlyoutContainer" :style="{width: width}">
            <div v-if="items">
                <div class="nux-dropDownFlyoutItem" 
                        v-for="(item, i) in items" 
                        :key="item.id ? item.id : getItemText(item)"
                        :ref="el => { flyoutItemElementList[i] = el }"
                        @click="handleItemClick(item);">
                    <slot :item ="item">
                        {{ getItemText(item) }}
                    </slot>
                </div>                
            </div>
            <div v-else>
                <slot name="content">
                </slot>
            </div>
        </div>
    </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, Teleport, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import globalEventHandler from '@/next-ux2/events/gobal-event-handler';

import { StringUtility, HtmlUtility } from '../../utility';
import { Handler } from 'mitt';

export interface IDropdownFlyout {
    selectedItem: any,
    items: Array<unknown>,
    getItemText(item: any): string;
    setSelectedItem(item: any): void;
    resetList(list: Array<any>): void;
    isOpened(): boolean;
    show(anchorElement: HTMLElement): Promise<void>;
    hide(): void;
}

export default defineComponent({
    name: 'DropdownFlyout',
    emits: ['selected'],
    props: {
        itemList: {
            type: Array,
            default: () => []
        },
        width: {
            type: String,
            default: '32rem'
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
        // privates;
        let acceptHandler = null as unknown as ()=>void;
        let rejectHandler = null as unknown as ()=>void;
        let showTimestamp = 0;
        let lastHideRequestTimestamp = 0;

        // template refs
        const flyoutContainer = ref(null as unknown as HTMLElement);
        const flyoutItemElementList = ref([] as Array<HTMLElement>);

        // data
        const items = ref(props.itemList);
        const selectedItem = ref(null as unknown as Object | string);

        // public methods
        const getItemText = (item: any) => {
            if (StringUtility.isNullOrEmpty(props.textFieldName)) {
                return item.toString();
            }
            else {
                return item[props.textFieldName];
            }
        };

        const setSelectedItem = (item: any) => {
            if (item !== selectedItem.value) {
                // there should only ever be one selected, so this
                // just tries to correct a bug if there is any multiple selections present
                flyoutItemElementList.value.forEach(i => {
                    // need to make sure the element exsists since
                    // it is added to the ref by assigning an index directly
                    // and the list is not reset if the bound list changes
                     if(i) {
                        i.classList.remove('selected'); 
                     }
                });

                if (item) {
                    let itemIndex = items.value.indexOf(item);
                    if (itemIndex >= 0) {
                        let element = flyoutItemElementList.value[itemIndex];
                        if (element) {
                            // the list needs to be rendered first before the html element exists;
                            // so making sure it exists before trying to set the class
                            element.classList.add('selected');
                        }
                    }
                }

                selectedItem.value = item;
                context.emit('selected', item);
            }
        }

        const handleItemClick = (item: any) => {
            setSelectedItem(item);
        };

        const resetList = (list: Array<any>) => {
            flyoutItemElementList.value.length = 0;
            items.value = list;
            setSelectedItem(null);
        }

        const isOpened = () => {
            return flyoutContainer.value.style.display !== 'none';
        }

        const show = (anchorElement: HTMLElement): Promise<void> => {
            return new Promise<void>((accept, reject) => {
                showTimestamp = Date.now();
                acceptHandler = accept;
                rejectHandler = reject;

                document.body.addEventListener('click', bodyClickHandler, { once: true, passive: true}); 

                // NOTE: the display must first be set to compute height and widths
                try {
                    flyoutContainer.value.style.display = 'inline-flex';
                    flyoutContainer.value.scrollTop = 0;
                    let placement = HtmlUtility.getVerticalPlacement(flyoutContainer.value, anchorElement, 4, 'bottom');
                    flyoutContainer.value.style.top = `${placement.point.y}px`;
                    flyoutContainer.value.style.left = `${placement.point.x}px`;
                    flyoutContainer.value.style.animationName = 'dialogEntrance';
                }
                catch (errorInfo) {
                    if (reject) {
                        reject(errorInfo);
                    }
                }
            })
        }

        const hide = () => {
            let container = flyoutContainer.value;
            if (container.style.display !== 'none') {
                container.addEventListener('animationend', () => {
                    if (container && container.style.animationName === 'dialogExit') {
                        container.style.display = 'none';
                    }
                });

                container.style.animationName = 'dialogExit';
            }
        };

        watch(props.itemList, () => {
            items.value = props.itemList;
        });

        // private methods
        const bodyClickHandler = () => {
            // check to see if the current timestamp is very close
            // to the curren time, if so, ignore the body click and
            // add the listener again
            //
            // want to avoid immediately closing the dialog if the 
            // dropdown show method is invoked in a click handler
            if ((Date.now() - showTimestamp) < 100) {
                document.body.addEventListener('click', bodyClickHandler, { once: true, passive: true}); 
            }
            else if (isOpened()) {
                hide();
            }
        }

        const popupHideRequestedHandler = (hideRequestTimestamp: number) => {
            // want to avoid situations that a click used to open the dialog is
            // not interpreted incorecctly.  Also, in cases where several event
            // handlers make the request about the same time is ingored as well.
            let timeDiff1 = Math.abs(hideRequestTimestamp - showTimestamp);
            let timeDiff2 = Math.abs(hideRequestTimestamp - lastHideRequestTimestamp);
            if (isOpened() && ((timeDiff1 > 100) && (timeDiff2 > 100))) {
                hide();
                lastHideRequestTimestamp = Date.now();
            }
        }

        globalEventHandler.emitter.on('popupHideRequested', hideRequestTimestamp  => popupHideRequestedHandler(hideRequestTimestamp));

        onBeforeUnmount(() => {
            document.body.removeEventListener('click', bodyClickHandler);
            globalEventHandler.emitter.off('popupHideRequested', popupHideRequestedHandler as Handler<any>);
        });

        onMounted(()=> {
            if (props.zIndex !== 0) {
                flyoutContainer.value.style.zIndex = props.zIndex.toString();
            }
            
        })

        watch(() => props.itemList, () => { resetList(props.itemList); });

        
        return {
            flyoutContainer,
            flyoutItemElementList,
            items,
            selectedItem,
            getItemText,
            setSelectedItem,
            handleItemClick,
            resetList,
            isOpened,
            show,
            hide
        };
    }
});

</script>

