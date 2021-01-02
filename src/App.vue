<template>
  <div id="app">
    <MenuPage />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MenuPage from './components/MenuPage.vue';

export default defineComponent({
  name: 'App',
  components: {
    MenuPage
  }
});
</script>

<style>
html,
body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: fixed;
}

html {
    font-size: 62.5%;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--var-primary-background);
    color: var(--var-primaryFont-color);
    font-size: 1.5rem;
}

::-webkit-scrollbar {
    width: 0.5rem;
}

::-webkit-scrollbar-thumb {
    background-color: rgb(190, 190, 180);
}

::-webkit-scrollbar-track-piece {
    background-color: #cdcdc3;
}

#app {
    width: 100%;
    height: 100%;
    overflow: hidden;
    
}

button.linkButton {
    margin: 0;
    padding: 0.7rem;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.05rem;
    text-transform: uppercase;
    color: var(--var-primary-color);
    background-color: transparent;
    border-width: 0;
}

button.linkButton:active {
    background-color: var(--var-secondaryOverlay5-background);
}

button.linkButton.alignWithoutPadding {
    margin-left: -0.7rem;
}

 .buttonContentContainer {
    display: flex;
    align-items: center;
}

.buttonContentContainer .material-icons {
    margin-right: 0.3em;
}

 .buttonContentContainer .icon {
     height: 1.4em;
     margin-right: 0.33em;
 }

 .quantityInputContainer {
    display: flex;
    align-items: center;
}

button.outlineButton {
    margin: 0;
    padding: 0;
    border: 3px solid var(--var-primary-color);
    border-radius: 0.4rem;
    width: 2.2rem;
    height: 2.2rem;
    background-color: transparent;
}

button.outlineButton .material-icons {
    font-size: 1.7rem;
}

button.outlineButton:active {
    background-color: var(--var-primaryOverlay-color);
}

button.outlineButton .buttonContent {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--var-primaryFont-color);
    font-weight: 600;
    font-size: 1.5rem;
    letter-spacing: 0.05rem;
    text-transform: uppercase;
}


.quantityLabel {
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0 1.5rem;
}

.quantityWordLabel {
    font-size: 1.5rem;
    font-weight: 400;
    width: 8rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
    padding: 0 0.3rem;
    box-sizing: border-box;
}


 .mainLabel {
     font-size: 1.5rem;
     text-transform: uppercase;
     letter-spacing: 0.07rem;
 }

</style>
