<template>
  <div>
    <WordFinder 
      v-for="(item, index) in allLanguages" 
      :description="item.description" 
      :rules="item.rule"
      :regex="item.regex"
      :autofocus="index === 0" 
      :moveUpIcon="index !== 0 ? 'mdi-arrow-up' : ''" 
      :prefix="item.prefix"
      :moveTop="moveTop" 
      v-bind="item" 
    />
  </div>
</template>

<script>
import WordFinder from './comp/WordFinder.vue';
import { languages } from '../translations.js';

export default {
  components: {
    WordFinder
  },
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
  computed: {
    allLanguages() {
      const currentLatin = languages.find(item => item.key === this.optionsData.language).latin
      return languages.filter(item => item.latin === currentLatin);
    }
  },
  methods: {
    async moveTop(prefix) {
      // Move the current item to the top
      const index = languages.findIndex(item => item.prefix === prefix);
      if (index < 0)
        return;

      const temp = languages[index];
      languages.splice(index, 1);
      languages.unshift(temp);

      // Save the new language order
      this.optionsData.languages_order = languages.map(lang => lang.prefix);
      await this.saveOptions();
    }
  }
};
</script>