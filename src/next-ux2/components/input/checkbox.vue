<template>
    <label class="checkbox" :style="{fontSize: size}">
        <input ref="checkboxInput" type="checkbox" @click="handleClick" v-model="bindingObjectToUse[boundPropName]" />
        <span class="overlay" :style="{width: size, height: size}">
            <i class="material-icons icon" style="font-size: inherit;">check</i>
        </span>
        <span class="actualCheckboxLabel">
            <slot></slot>
        </span>
    </label>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
    name: 'Checkbox',
    emits: ['click'],
    props: {
        boundObject: Object,
        boundPropName: String,
        size: {
            type: String,
            default: '1.5rem'
        }
    },

    setup(props, context) {
        // template refs
        const checkboxInput = ref (null as unknown as HTMLInputElement);

        // setup binding object
        let bindingObjectToUse: any = { checkValue: false };
        let bindingPropName = 'checkValue';
        if (props.boundObject) {
            bindingObjectToUse = props.boundObject;
            bindingPropName = props.boundPropName!;
        }

        const bindingObject = ref(bindingObjectToUse as Object);

        // props
        const size = ref(props.size);

        // computed
        const checked = computed({
            get: () => checkboxInput.value.checked,
            set: (value: boolean) => { 
                (bindingObject.value as any)[bindingPropName] = value;
            }
        });

        // methods
        const handleClick = () => {
            context.emit('click');
        };

        return {
            size,
            checkboxInput,
            
            bindingObjectToUse,
            bindingPropName,
            checked,

            handleClick
        };
    }
});
</script>

<style scoped>
.checkbox {
    display: inline-flex;
    align-items: center;
    position: relative;
    font-size: 1.5rem;
}

.checkbox input {
    position: absolute;
    opacity: 0;
    }

.checkbox .actualCheckboxLabel {
    margin-left: 0.33em;
    user-select: none;
}

.checkbox .overlay {
    position: relative;
    display: inline-block;
    top: 0px;
    left: 0px;
    height: 1.5rem;
    width: 1.5rem;
    background-color: transparent;
    border-radius: 0.4rem;
    border: 0.2rem solid var(--var-primary-color);
    transform: rotate(-90deg);
    transition: all 0.3s;

    user-select: none;
}

.checkbox .overlay .icon {
    display: block;
    color: transparent;
    width: 100%;
}

.checkbox input:checked ~ .icon {
    color: var(--var-sideBarFont-color);
}

.checkbox input:checked ~ .overlay {
    background-color: var(--var-primaryVar1-color);
    border-radius: 0.4rem;
    transform: rotate(0deg);
    opacity: 1;
    border: 0.2rem solid var(--var-primary-color);
}

.checkbox input:checked ~ .overlay .icon {
    color: var(--var-sideBarFont-color);
    
}
</style>