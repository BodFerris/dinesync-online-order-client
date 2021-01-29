<template>
    <div ref="mainContainer" class="autoGrowContainer" style="max-height: 0px;">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, Teleport, onBeforeMount, onBeforeUnmount, onMounted, watch } from 'vue';

export interface IAutoGrowContainer {
    expand: () => void,
    collapse: () => void,
    toggle: () => void
}

export default defineComponent({
    name: 'AutoGrowContainer',
    components: {
    },
    emits: [],
    props: {
        maxHeight: String
    },

    setup(props, context) {
        // template refs
        const mainContainer = ref(null as unknown as HTMLElement);

        const expand = () => {
            mainContainer.value.style.maxHeight = props.maxHeight!;
        }

        const collapse = () => {
            mainContainer.value.style.maxHeight = '0px';
        }

        const toggle = () => {
            if (mainContainer.value.style.maxHeight === '0px') {
                expand();
            }
            else {
                collapse();
            }
        }
 
        return {
            mainContainer,

            expand,
            collapse,
            toggle

        };
    }
    
    
});

</script>

<style scoped>
.autoGrowContainer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.2s ease-in;
}
</style>