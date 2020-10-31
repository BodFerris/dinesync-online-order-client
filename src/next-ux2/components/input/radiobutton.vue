<template>
    <label class="radiobutton" :style="{fontSize: size}">
        <input type="radio" :name="groupName" @click="handleClick" 
                :value="value"    v-model="bindingObject[bindingPropName]" />
        <span class="overlay" :style="{width: size, height: size}">
            <span class="innerContent"></span>
        </span>

        <span class="actualLabel">
            <slot></slot>
        </span>
    </label>
</template>

<script lang="ts">
import { StringUtility } from '@/next-ux2/utility';
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
    name: 'RadioButton',
    emits: ['click'],
    props: {
        groupName: {
            type: String,
            default: ''
        },
        value: {
            type: String,
            default: ''
        },

        bindingObject: Object,

        bindingPropName: String,
        size: {
            type: String,
            default: '1.5rem'
        }
    },

    setup(props, context) {
        // props
        const size = ref(props.size);
        const groupName = ref(props.groupName);
        const bindingObject = ref(props.bindingObject as Object);
        const bindingPropName = ref(props.bindingPropName);
        const value = ref(props.value);

        // methods
        const handleClick = () => {
            context.emit('click');
        };

        return {
            groupName,
            size,
            
            bindingObject,
            bindingPropName,
            value,

            handleClick
        };
    }
});
</script>

<style scoped>
.radiobutton {
    display: inline-flex;
    align-items: center;
    position: relative;
    font-size: 1.5rem;
}

.radiobutton input {
    position: absolute;
    opacity: 0;
    overflow: hidden;
    width: 0;
    height: 0;
}

.radiobutton .actualLabel {
    margin-left: 0.33em;
    user-select: none;
}

.radiobutton .overlay {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    top: 0px;
    left: 0px;
    background-color: transparent;
    border-radius: 100%;
    border: 0.2rem solid var(--var-primary-color);

    user-select: none;
}

.radiobutton .overlay .innerContent {
    display: inline-block;
    background-color: var(--var-primary-color);
    width: 55%;
    height: 55%;
    border: 1px solid transparent;
    border-radius: 100%;

    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s;
}

.radiobutton input:checked ~ .overlay .innerContent {
    opacity: 1;
    transform: scale(1);
    background-color: var(--var-primary-color);
}

</style>