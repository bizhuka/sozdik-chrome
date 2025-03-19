<template>
  <v-app>
    <v-main>
      <v-card variant="flat" style="height: 100%;">
        <v-tabs v-model="tab" bg-color="primary" grow>
          <v-tab value="search">
            <v-icon left>mdi-magnify</v-icon>
            Sozdik.kz
          </v-tab>
          <!-- Translate -->
          <v-tab value="translate" v-if="!isPopup">
            <v-icon left>mdi-translate</v-icon>
          </v-tab>
          <!-- Anki -->
          <v-tab value="anki" v-if="!isPopup">
            <v-icon left>mdi-cards</v-icon>
          </v-tab>
          <!-- About -->
          <v-tab value="about">
            <v-icon left>mdi-cog-outline</v-icon>
            <v-btn v-if="isPopup" icon size="small" class="ml-2" @click="openSidePanel" style="position: absolute; right: 0;">
              <v-icon>mdi-dock-right</v-icon>
            </v-btn>
          </v-tab>
        </v-tabs>

        <v-card-text style="height: 100%;">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="search">
              <Search
                :optionsData="optionsData" 
                :saveOptions="saveOptions" 
              />
            </v-tabs-window-item>

            <v-tabs-window-item value="translate">
              <Translate 
                :optionsData="optionsData" 
                :saveOptions="saveOptions" 
              />
            </v-tabs-window-item>

            <v-tabs-window-item value="anki">
              <Anki 
                :optionsData="optionsData"
                :saveOptions="saveOptions"
              />
            </v-tabs-window-item>

            <v-tabs-window-item value="about">
              <About 
                :optionsData="optionsData" 
                :saveOptions="saveOptions" 
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
    </v-main>

    <AppFooter />
  </v-app>
</template>

<!-- /////////////////////////////////////////////////////////////////////////////////////////////////// -->

<script>
import { util } from './util.js';
import Search from './tabs/Search.vue';
import Translate from './tabs/Translate.vue';
import Anki from './tabs/Anki.vue';
import About from './tabs/About.vue';
import AppFooter from './tabs/AppFooter.vue';

export default {
  components: {
    Search,
    Translate,
    Anki,
    About,
    AppFooter
  },
  
  props: {
    isPopup: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      optionsData: util.options,
      tab: this.isPopup ? 'search' : 'translate',
    };
  },
  
  computed: {
    theme() {
      return this.$vuetify.theme;
    }
  },
  
  methods: {
    async saveOptions() {
      this.theme.global.name = this.optionsData.lightTheme ? "light" : "dark";
      this.optionsData = { ...this.optionsData };
      util.save_options(this.optionsData);
    },
    
    async openSidePanel() {
      util.open_side_panel({ currentWindow: true });
      window.close();
    }
  },
  
  async mounted() {
    try {
      await util.init();
      await this.saveOptions();
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  },
  
  expose: ['saveOptions', 'optionsData']
}
</script>