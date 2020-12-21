<template>
    <div ref="progressContainer" class="nux-progressContainer">
        <div ref="progressElement" class="nux-progressBar"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export interface IProgressBar {
    show: ()=>void;
    hide: ()=>void;
    isActive: () => boolean;
}

export default defineComponent({
    name: 'ProgressBar',
    components: {
       
    },
    props: {

    },

    setup(props, context) {
        // template refs
        const progressContainer = ref(null as unknown as HTMLElement);
        const progressElement = ref(null as unknown as HTMLElement);

        const show = () => {
            progressContainer.value.style.visibility = 'visible';
            progressElement.value.style.animationPlayState = 'running';
        }

        const hide = () => {
            progressContainer.value.style.visibility = 'hidden';
            progressElement.value.style.animationPlayState = 'paused';
        }

        const isActive = () => {
            return progressElement.value.style.animationPlayState === 'running';
        }

        return {
            progressContainer,
            progressElement,
            
            show,
            hide,
            isActive
        };
    },
    
});

</script>