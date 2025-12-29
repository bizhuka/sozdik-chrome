<template>
  <div>
    <v-card-actions class="d-flex justify-center">
      <div class="v-btn-group">
        <v-btn @click="cycleLanguage" color="primary" class="text-capitalize">
          {{ getCurrentLanTitle() }}
        </v-btn>
        
        <v-btn :prepend-icon="optionsData.lightTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"
          @click="toggleTheme" color="primary" class="text-capitalize">
          {{ optionsData.lightTheme ? util.getText('Light') : util.getText('Dark') }}
        </v-btn>
      </div>
    </v-card-actions>

    <Links :key="languageKey + '1'" :TitleText="util.getText('Hotkeys')" :items="[
      { title: util.getText('Open popup') + ' (Alt+Z)', icon:'mdi-keyboard', disabled: true },
      { title: util.getText('Open side panel') + ' (Alt+X)', icon:'mdi-keyboard', disabled: true },
      { title: util.getText('Right click'), icon:'mdi-mouse-right-click-outline', disabled: true }]" />
  
    <Links :key="languageKey + '2'" :TitleText="util.getText('Links')" :items="[
      { title: util.getText('Demo'), href: 'https://www.youtube.com/watch?v=ThNuHfj6DWg', icon:'mdi-youtube', disabled: false },
      { title: util.getText('Mark us'), icon:'mdi-star', href: 'https://chromewebstore.google.com/detail/sozdikkz/nmddeglnlchflckfnljocljafbgamemd', disabled: false }]" />

    <Links :key="languageKey + '3'" :TitleText="util.getText('Sozdik.kz About')" :items="[
      { title: 'X (Twitter): sozdik', href: 'https://x.com/sozdik', disabled: false, icon: 'mdi-twitter'  },
      { title: 'e-mail: info@sozdik.kz', href: 'mailto:info@sozdik.kz', disabled: false, icon: 'mdi-email' }]" />

    <Links :key="languageKey + '4'" :TitleText="util.getText('Plugin About')" :items="[
      { title: 'Telegram: modekz', href: 'https://t.me/modekz', disabled: false, icon: 'mdi-send' },
      { title: 'e-mail: modekz@gmail.com', href: 'mailto:modekz@gmail.com', disabled: false, icon: 'mdi-email' }]" />
  </div>
</template>

<script setup>
    import { util } from '../util.js';
</script>

<script>
import { languages } from '../translations.js';
import Links from './comp/Links.vue';

export default {
  components: {
    Links
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
  data() {
    return {
      languageKey: 0
    };
  },

  methods: {
    async cycleLanguage() {
      // languages sorting can be different
      const stable_languages_list = languages.map(item => item.key ).sort();
      const currentIndex = stable_languages_list.indexOf(this.optionsData.language);
      this.optionsData.language = stable_languages_list[(currentIndex + 1) % stable_languages_list.length];

      await this.saveOptions();
      this.languageKey++;

      // console.log(stable_languages_list)
    },

    getCurrentLanTitle(){
      return languages.find(item => item.key === this.optionsData.language).title
    },

    async toggleTheme() {
      this.optionsData.lightTheme = !this.optionsData.lightTheme;
      await this.saveOptions();
    }
  }
};
</script> 