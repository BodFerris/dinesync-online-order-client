<template>
    <teleport to="body">
        <div ref="mainContainer"  class="nux-dlg-simple" @mousedown="handleDialogContainerClick" @click="handleDialogContainerClick" >
            <div class="nux-dlg-simple-mainContent">
                <slot></slot>
            </div>
            <div class="nux-dlg-footerContainer">
                <button class=nux-flatButton style=margin-right:2rem;
                    v-on:click="handleCloseRequest(false)">{{ rejectButtonText }}</button>
                <button class=nux-flatButton
                    v-on:click="handleCloseRequest(true)">{{ acceptButtonText }}</button>
            </div>
        </div> 
    </teleport>
</template>
<script lang="ts">
import { defineComponent, ref, Teleport, nextTick, onBeforeUnmount, onMounted } from 'vue';
import globalEventHandler from '@/next-ux2/events/gobal-event-handler';

import { StringUtility, HtmlUtility } from '../../utility';
import { hPlacement, vPlacement } from '@/next-ux2/utility/point-interface';

export interface IConfirmDialog {
    show(anchorElement: HTMLElement, horizontal: hPlacement, vertical: vPlacement): Promise<boolean>,
    hide(value: boolean): void
}

export default defineComponent({
    name: 'ConfirmDialog',
    emits: ['showaimationended', 'closeRequested'],
    props: {
        rejectButtonText: {
            type: String,
            default: 'No'
        },
        acceptButtonText:{
            type: String,
            default: 'Yes'
        },
        zIndex: {
            type: Number,
            default: 0
        },
        isManuallyClosed: {
            type: Boolean,
            default: false
        }
    },

    setup(props, context) {
        // privates;
        let showTimestamp = 0;
        let acceptHandler = null as unknown as (value: boolean)=>void;

        // template refs
        const mainContainer = ref(null as unknown as HTMLElement);

        // Prop refs
        const rejectButtonText = ref(props.rejectButtonText);
        const acceptButtonText = ref(props.acceptButtonText);

        const show = (anchorElement: HTMLElement, horizontal: hPlacement, vertical: vPlacement): Promise<boolean> => {
            return new Promise<boolean>(async (accept, reject) => {
                showTimestamp = Date.now();
                acceptHandler = accept;

                document.body.addEventListener('click', bodyClickHandler, { once: true, passive: true}); 

                // fire an event to denote when the dialog's open animation has completed
                mainContainer.value.addEventListener('animationend', (eventInfo) => {
                    if (eventInfo.animationName === 'dialogEntrance') {
                        context.emit('showaimationended');
                    }
                }, { once: true });

                // NOTE: the display must first be set to compute height and widths
                mainContainer.value.style.display = 'flex';

                // give databinding a chance to give accurate measurementsfs
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

        const handleDialogContainerClick = (eventData: MouseEvent) => {
            // body clicks are used by popups to dismiss, so if preventing it from bubbling,
            // then send an event to notify any popups to dismiss
            globalEventHandler.emitter.emit('popupHideRequested', Date.now());
            event!.cancelBubble = true;
            return false;
        }

        const handleCloseRequest = (value: boolean) => {
            if (props.isManuallyClosed) {
                context.emit('closeRequested', value);
            }
            else {
                hide(value);
            }
        }

        const hide = (value: boolean) => {
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
                acceptHandler?.(value);
            }
        };

        // private methods
        const isOpened = () => {
            return mainContainer.value.style.display !== 'none';
        }

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
                hide(false);
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
            mainContainer,

            handleDialogContainerClick, 
            handleCloseRequest,
            show,
            hide
        };
    }
});

</script>
