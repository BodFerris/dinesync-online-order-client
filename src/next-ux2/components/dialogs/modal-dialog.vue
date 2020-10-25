<template>
    <teleport to="body">
        <div ref="backgroundOverlay" class="nux-background-overlay" :style="overlayStyleOverride">
            <div ref="dialogContainer" class="nux-dlg-container" :style="containerStyleOverride">
                <div class="nux-dlg-header" :style="headerStyleOverride">
                    <div class="nux-dlg-title">
                        <slot name="header"></slot>
                    </div>
                </div>
                <div :style="mainContentStyleOverride" class="nux-dlg-content">
                    <slot name="content"></slot>
                </div>
                <div :style="secondaryContentStyleOverride" class="nux-dlg-secondaryContent">
                    <slot name="secondaryContent"></slot>
                </div>
                <div ref="footerElement" class="nux-dlg-footerContainer" :style="footerStyleOverride">
                    <slot name="footer">
                        <button v-if="!isCancelButtonRemoved" class="nux-flatButton" @click="handleCloseRequest('cancel')">Cancel</button>
                        <button
                            class="nux-flatButton"
                            @click="handleCloseRequest('ok')"
                        >Ok</button>
                    </slot>
                </div>

                <!-- used to disable user interaction with the dialog -->
                <div ref="clickEaterOverlay" class="clickEaterOverlay" style="display: none;"></div>
            </div>
        </div>
    </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, Teleport, nextTick, onBeforeUnmount, onMounted } from 'vue';
import { StringUtility } from '@/next-ux2/utility';
import { IError } from '@/next-ux2/utility/error-interface';

export interface IModalDialog {
    show(): Promise<string>,
    hide(value: string): void,
    footerElement: HTMLElement
}

export default defineComponent({
    name: 'ModalDialog',
    inheritAttrs: false,
    emits: ['closeRequested'],
    props: {
        headerPadding: {
            type: String,
            default: ''
        },
        contentPadding: {
            type: String,
            default: ''
        },
        footerPadding: {
            type: String,
            default: ''
        },
        width: {
            type: String,
            default: ''
        },
        maxWidth:{
            type: String,
            default: ''
        },
        maxHeight: {
            type: String,
            default: ''
        },
        isScrollingOff: {
            type: Boolean,
            default: false
        },
        zIndex: {
            type: Number,
            default: 0
        },
        animationDurationMs: {
            type: Number,
            default: 200
        },
        isCancelButtonRemoved: {
            type: Boolean,
            default: false
        },
        isManuallyClosed: {
            type: Boolean,
            default: false
        }
    },

    setup(props, context) {
        // privates;
        let showTimestamp = 0;
        let acceptHandler = null as unknown as (value: string)=>void;

        // template refs
        const backgroundOverlay = ref(null as unknown as HTMLElement);
        const dialogContainer = ref(null as unknown as HTMLElement);
        const clickEaterOverlay = ref(null as unknown as HTMLElement);
        const footerElement = ref(null as unknown as HTMLElement);

        // props
        const isCancelButtonRemoved = ref(props.isCancelButtonRemoved);
        const isManuallyClosed = ref(props.isManuallyClosed);

        // data
        const overlayStyleOverride = ref(null as unknown as {zIndex?: string, display: string});
        const containerStyleOverride = ref(null as unknown as Object);
        const headerStyleOverride = ref(null as unknown as Object);
        const mainContentStyleOverride = ref(null  as unknown as Object);
        const secondaryContentStyleOverride = ref(null  as unknown as Object);
        const footerStyleOverride = ref(null  as unknown as Object);

        if (!StringUtility.isNullOrEmpty(props.maxWidth) ||
            !StringUtility.isNullOrEmpty(props.maxHeight) ||
            !StringUtility.isNullOrEmpty(props.width)) {
            let styleInfo = {} as any;
            if (!StringUtility.isNullOrEmpty(props.maxWidth)) {
                styleInfo.maxWidth = props.maxWidth;
            }

            if (!StringUtility.isNullOrEmpty(props.maxHeight)) {
                styleInfo.maxHeight = props.maxHeight;
            }

            if (!StringUtility.isNullOrEmpty(props.width)) {
                styleInfo.width = props.width;
            }

            containerStyleOverride.value = styleInfo;
        }

        if (!StringUtility.isNullOrEmpty(props.headerPadding)) {
            headerStyleOverride.value = { padding: props.headerPadding } as any;
        }

        if (!StringUtility.isNullOrEmpty(props.contentPadding)) {
            if (props.isScrollingOff) {
                mainContentStyleOverride.value = { padding: props.contentPadding, overflowY: 'hidden' } as any;
            }
            else {
                mainContentStyleOverride.value = { padding: props.contentPadding } as any;
            }

            secondaryContentStyleOverride.value = { padding: props.contentPadding } as any;
        }
        else if (props.isScrollingOff) {
            mainContentStyleOverride.value = { overflowY: 'hidden' } as any;
        }

        if (!StringUtility.isNullOrEmpty(props.footerPadding)) {
            footerStyleOverride.value = { padding: props.footerPadding } as any;
        }

        if (props.zIndex !== 0) {
            overlayStyleOverride.value = { zIndex: props.zIndex, display: 'none' }  as any;
        }
        else {
            overlayStyleOverride.value = { display: 'none' } as any;
        }

        // public methods
        const show = (): Promise<string> => {
            return new Promise<string>((accept, reject) => {
                acceptHandler = accept;

                if (isOpened()) {
                    let error: IError = {
                        name: "DialogAlreadyShown",
                        message: "Dialog with the same type is already active"
                    };

                    reject(error);
                }
                else {
                    //animate overlay
                    overlayStyleOverride.value.display = 'flex';
                    backgroundOverlay.value.style.animationName = "overlayEntrance";

                    //animate dialog
                    dialogContainer.value.style.animationName = "dialogEntrance";
                }
            });
        }

        const hide = (value: string) => {
            // set up wachdogs to ensure that the display is set to none;
            // if the css animation duration values change, then this
            // value needs to change as well;
            //
            // A little bit is added to animation time to try to ensure the anmation goes
            // all the way through
            let animationDurationMs = props.animationDurationMs;
            setTimeout(() => {
                try {
                    overlayStyleOverride.value.display = 'none';
                }
                catch (errorInfo) {
                    // this could be a critical bug, because
                    // if the overlay is not guarenteed closed,
                    // then this will appear as a deadlock
                    // TODO: Log error somewhere, perhaps in local storage
                    console.error('ERROR: Watchdog to ensure dialog overlay is removed failed: ' + errorInfo.message);
                }
            }, animationDurationMs + 75);

            try {
                backgroundOverlay.value.addEventListener('animationend', () => {
                    if (backgroundOverlay.value.style.animationName === 'overlayExit') {
                        overlayStyleOverride.value.display = 'none';
                    }
                });
            }
            catch (errorInfo) {
                overlayStyleOverride.value.display = 'none';

                let message = "unknown error";
                if (errorInfo.message) {
                    message = errorInfo.message;
                }

                console.error('Error occured while performing dialog close animations: ' + message);
                
            }
            finally {
                backgroundOverlay.value.style.animationName = 'overlayExit';
                dialogContainer.value.style.animationName = 'dialogExit';

                acceptHandler?.(value);
            }
        };

        const disable = () => {
            clickEaterOverlay.value.style.display = 'none';
        }

        const enable = () => {
            clickEaterOverlay.value.style.display = 'block';
        }        

        const isOpened = () => {
            let displayStyle = window.getComputedStyle(backgroundOverlay.value).getPropertyValue('display');
            return  displayStyle !== 'none';
        }

        // private methods
        const handleCloseRequest = (value: string) => {
            if (props.isManuallyClosed) {
                context.emit('closeRequested', value);
            }
            else {
                hide(value);
            }
        };
        
        return {
            backgroundOverlay,
            dialogContainer,
            footerElement,
            clickEaterOverlay,

            isCancelButtonRemoved,

            overlayStyleOverride,
            containerStyleOverride,
            headerStyleOverride,
            mainContentStyleOverride,
            secondaryContentStyleOverride,
            footerStyleOverride,

            show,
            hide,
            disable,
            enable,
            isOpened,

            handleCloseRequest
        };
    }
});

</script>
