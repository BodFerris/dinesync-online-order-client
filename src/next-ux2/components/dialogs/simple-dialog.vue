<template>
    <teleport to="body">
        <div ref="mainContainer"  class="nux-dlg-simple noCommandFooter" @mousedown="handleDialogContainerClick" @click="handleDialogContainerClick">
            <div v-bind:style="{maxWidth: maxWidth}" class="nux-dlg-simple-mainContent">
                <slot></slot>
            </div>
        </div> 
    </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, Teleport, nextTick, onBeforeUnmount, onMounted } from 'vue';
import globalEventHandler from '@/next-ux2/events/gobal-event-handler';

import { StringUtility, HtmlUtility } from '../../utility';
import { hPlacement, vPlacement } from '@/next-ux2/utility/point-interface';

export interface ISimpleDialog {
    show(anchorElement: HTMLElement, horizontal: hPlacement, vertical: vPlacement): Promise<void>,
    hide(): void
}

export default defineComponent({
    name: 'SimpleDialog',
    emits: ['showaimationended', 'closed'],
    props: {
        isClosePreventedWhenTappingOnContainer: {
            type: Boolean,
            default: false
        },
        maxWidth: {
            type: String,
            default: '32rem'
        },
        zIndex: {
            type: Number,
            default: 0
        }
    },

    setup(props, context) {
        // privates;
        let showTimestamp = 0;
        let acceptHandler = null as unknown as ()=>void;

        // template refs
        const mainContainer = ref(null as unknown as HTMLElement);

        // public methods
        const handleDialogContainerClick = (eventData: MouseEvent) => {
            if (props.isClosePreventedWhenTappingOnContainer) {
                // body clicks are used by popups to dismiss, so if preventing it from bubbling,
                // then send an event to notify any popups to dismiss
                globalEventHandler.emitter.emit('popupHideRequested', Date.now());
                event!.cancelBubble = true;
                return false;
            }
        }

        const show = (anchorElement: HTMLElement, horizontal: hPlacement, vertical: vPlacement): Promise<void> => {
            return new Promise<void>(async (accept, reject) => {
                showTimestamp = Date.now();
                acceptHandler = accept;

                document.body.addEventListener('click', bodyClickHandler, { once: true, passive: false}); 

                // fire an event to denote when the dialog's open animation has completed
                mainContainer.value.addEventListener('animationend', (eventInfo) => {
                    if (eventInfo.animationName === 'dialogEntrance') {
                        context.emit('showaimationended');
                    }
                }, { once: true });

                // NOTE: the display must first be set to compute height and widths
                mainContainer.value.style.display = 'flex';

                // need to set the display in order for measuring, then
                // wait for databinding
                await nextTick();

                let point = HtmlUtility.getAnchorPoint(anchorElement, mainContainer.value, horizontal, vertical);
                mainContainer.value.style.top = `${point.y}px`;
                mainContainer.value.style.left = `${point.x}px`;
                mainContainer.value.style.animationName = 'dialogEntrance';

                // ensure that it is within screen bounds, if not, adjust.
                // NOTE: Need to change the style on the elmeent to position it
                // before calling validateElementWitinScreenBounds
                //
                // The element may not be added to the dom or other bindings
                // affecting layout may not be applied, so ensure it is 
                // within screen on the next ui tick
                await nextTick();
                let screenBoundsResult = HtmlUtility.validateElementWitinScreenBounds(mainContainer.value);
                if (!screenBoundsResult.isInBounds) {
                    point.x += screenBoundsResult.x;
                    point.y += screenBoundsResult.y;

                    mainContainer.value.style.top = point.y + 'px';
                    mainContainer.value.style.left = point.x + 'px';
                }
                
            });
        }

        const hide = () => {
            try {
                let container = mainContainer.value;
                if (container.style.display !== 'none') {
                    container.addEventListener('animationend', () => {
                        if (container && container.style.animationName === 'dialogExit') {
                            container.style.display = 'none';
                        }
                    });

                    container.style.animationName = 'dialogExit';
                }
            }
            catch (errorInfo) {
                mainContainer.value.style.display = 'none';
                let message = "unknown error";
                if (errorInfo && errorInfo.message) {
                    message = errorInfo.message;
                }

                console.error("Error occured while performing dialog close animation: " + message);
            }
            finally {
                context.emit('showaimationended');
                acceptHandler?.();
            }
        };

        // private methods
        const isOpened = () => {
            return mainContainer.value.style.display !== 'none';
        }

        const bodyClickHandler = (eventArgs: MouseEvent) => {
            // check to see if the current timestamp is very close
            // to the curren time, if so, ignore the body click and
            // add the listener again
            //
            // want to avoid immediately closing the dialog if the 
            // dropdown show method is invoked in a click handler
            let isClickEventWithinDialog = HtmlUtility.isPointInElementBounds(eventArgs.clientX, eventArgs.clientY, mainContainer.value);
            if (((Date.now() - showTimestamp) < 100) 
                    || (props.isClosePreventedWhenTappingOnContainer && isClickEventWithinDialog)) {
                document.body.addEventListener('click', bodyClickHandler, { once: true, passive: true}); 
            }
            else if (isOpened()) {
                hide();
            }
        }

        onBeforeUnmount(() => {
            document.body.removeEventListener('click', bodyClickHandler);
        });

        onMounted(()=> {
            if (props.zIndex !== 0) {
                mainContainer.value.style.zIndex = props.zIndex.toString();
            }
            
        })
        
        return {
            handleDialogContainerClick,
            mainContainer,
            show,
            hide
        };
    }
});

</script>
