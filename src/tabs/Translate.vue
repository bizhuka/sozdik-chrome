<template>
  <div>
    <v-tooltip :text="util.getText('Calque Tooltip')" location="top" open-delay="500">
      <template v-slot:activator="{ props }">
        <v-switch v-bind="props" v-model="optionsData.calque"
          :label="optionsData.calque ? util.getText('Calque') : util.getText('Translate')"
          @update:model-value="saveOptions" />
      </template>
    </v-tooltip>

    <v-textarea clearable autofocus="true" :label="util.getText('Text')" v-model="word_translate">
      <template v-slot:append>
        <div class="d-flex flex-column">
          <v-btn icon :color="word_translate ? 'primary' : ''" @click="translateWord('chatgpt')" :disabled="!word_translate">
            <v-icon>mdi-chat</v-icon>
          </v-btn>
          <v-btn icon :color="word_translate ? 'primary' : ''" @click="translateWord('grok')" :disabled="!word_translate" class="mt-4 mb-2">
            <v-icon>mdi-twitter</v-icon>
          </v-btn>
        </div>
      </template>
    </v-textarea>
  </div>
</template>

<script setup>
  import { util } from '../util.js';
</script>

<script>
import { util } from '../util.js';
export default {
  props: {
    optionsData: {
      type: Object,
      required: true
    },
    saveOptions: {
      type: Function,
      required: true
    }
  },
  
  data() {
    return {
      word_translate: ''
    };
  },
  
  methods: {
    async translateWord(method) {
      this.optionsData.translatorMethod = method;
      await this.saveOptions();

      chrome.runtime.sendMessage({
        background: true,
        action: "prompt_translator",
        action_params: [
          method,
          this.word_translate]
      }, (result) => {
        console.log(result);
      });
    }
  }
}
</script> 