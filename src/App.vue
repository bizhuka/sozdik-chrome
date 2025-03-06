<template>
  <v-app>
    <v-main>
      <v-card style="height: 100%;"> <!--  -->
        <v-tabs v-model="tab" bg-color="primary" grow>
          <v-tab value="search">
            <v-icon left>mdi-magnify</v-icon>
            Sozdik.kz
          </v-tab>
          <!-- Translate -->
          <v-tab value="translate">
            <v-icon left>mdi-translate</v-icon>
          </v-tab>
          <!-- Anki -->
          <v-tab v-if="header" value="anki">
            <v-icon left>mdi-cards</v-icon>
          </v-tab>
          <!-- About -->
          <v-tab value="about">
            <v-icon left>mdi-information-outline</v-icon>
          </v-tab>
        </v-tabs>

        <v-card-text style="height: 100%;"> <!-- style="height: 100%;" -->
          <v-tabs-window v-model="tab"> <!-- style="height: 90%;" -->
            <v-tabs-window-item value="search">
              <WordFinder v-for="(item, index) in allLanguages" :description="item.description" :rules="item.rule"
                :autofocus="index === 0" :moveUpIcon="index !== 0 ? 'mdi-arrow-up' : ''" :prefix="item.prefix"
                :moveTop="moveTop" v-bind="item" />
            </v-tabs-window-item>

            <v-tabs-window-item value="translate">
              <v-switch v-model="optionsData.morphology"
                :label="util.getText(optionsData.morphology ? 'Morphology' : 'Translate')"
                @update:model-value="saveOptions" />
              <v-textarea clearable autofocus="true" :label="util.getText('Text')" v-model="word_translate">
                <template v-slot:append>
                  <v-icon :disabled="!word_translate" @click="translateWord">mdi-magnify</v-icon>
                </template>
              </v-textarea>
            </v-tabs-window-item>

            <v-tabs-window-item v-if="header" value="anki">
              <v-label v-if="header" density="compact" class="primary" :text="header">
                <v-icon density="compact" :color="statusColor">{{ statusIcon }}</v-icon>
              </v-label>

              <v-slider v-model="optionsData.historyLimit" :min="0" :max="100" :step="5" thumb-label
                @update:model-value="saveOptions">
                <template v-slot:prepend>
                  <v-tooltip :text="util.getText('History Limit')">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props">mdi-history</v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </v-slider>

              <v-slider v-model="optionsData.baseDelay" :min="300" :max="3000" :step="100" thumb-label
                @update:model-value="saveOptions">
                <template v-slot:prepend>
                  <v-tooltip :text="util.getText('Request Delay (ms)')">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props">mdi-timer</v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </v-slider>

              <div class="d-flex flex-column align-center justify-center">
                <v-tooltip :text="util.getText('CSV Delimiter')">
                <template v-slot:activator="{ props }">
                  <v-radio-group v-bind="props" v-model="optionsData.csvDelimiter" inline density="compact"
                    @update:model-value="saveOptions">
                    <v-radio value="," label="Excel CSV ','"></v-radio>
                    <v-radio value=";" label="Anki CSV ';'"></v-radio>
                  </v-radio-group>
                </template>
              </v-tooltip>

                <v-btn @click="downloadHistory" :loading="exportIsLoading" v-if="optionsData.historyLimit > 0"
                  class="text-capitalize mt-4">
                  <v-icon left>mdi-history</v-icon>
                    {{ util.getText('Download') }}
                </v-btn>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="about">

              <Links :TitleText="'Sozdik.kz About'" :items="[
                { title: 'X (Twitter): sozdik', href: 'https://x.com/sozdik', disabled: false },
                { title: 'e-mail: info@sozdik.kz', href: 'mailto:info@sozdik.kz', disabled: false }]" />

              <Links :TitleText="'Plugin About'" :items="[
                { title: 'Telegram: modekz', href: 'https://t.me/modekz', disabled: false },
                { title: 'e-mail: modekz@gmail.com', href: 'mailto:modekz@gmail.com', disabled: false }]" />

            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
    </v-main>

    <AppFooter>

      <v-card-actions class="d-flex justify-center">
        <div class="v-btn-group">
          <v-btn prepend-icon="mdi-web" @click="toggleLanguage" color="primary" class="text-capitalize">
            {{ optionsData.inRussian ? util.getText('Language') : util.getText('Language') }}
          </v-btn>

          <v-btn v-if="!optionsData.inRussian" @click="toggleAlphabet" color="primary" class="text-capitalize">
            {{ optionsData.useLatin ? util.getText('Latin') : util.getText('Cyrillic') }}
          </v-btn>
          
          <v-btn :prepend-icon="optionsData.lightTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"
            @click="toggleTheme" color="primary" class="text-capitalize">
            {{ optionsData.lightTheme ? util.getText('Light') : util.getText('Dark') }}
          </v-btn>

        </div>
      </v-card-actions>
    </AppFooter>
  </v-app>
</template>

<!-- /////////////////////////////////////////////////////////////////////////////////////////////////// -->

<script setup>
import { util, languages } from './util.js';
import WordFinder from './components/WordFinder.vue'
import Links from './components/Links.vue'
import { ref, onMounted, computed } from "vue";
import { useTheme } from "vuetify";

const theme = useTheme();

const optionsData = ref(util.options)
const allLanguages = computed(() => {
  return languages.filter(item => item.latin === optionsData.value.useLatin);
});

const toggleLanguage = async () => {
  optionsData.value.inRussian = !optionsData.value.inRussian;
  await saveOptions();
};

const toggleTheme = async () => {
  optionsData.value.lightTheme = !optionsData.value.lightTheme;
  await saveOptions();
};

const toggleAlphabet = async () => {
  optionsData.value.useLatin = !optionsData.value.useLatin;
  await saveOptions();
};

const moveTop = async (prefix) => {
  // Move the current item to the top
  const index = languages.findIndex(item => item.prefix === prefix);
  if (index < 0)
    return;

  const temp = languages[index];
  languages.splice(index, 1);
  languages.unshift(temp);

  // Save the new language order
  optionsData.value.languages_order = languages.map(lang => lang.prefix);
  await saveOptions();
};

const saveOptions = async () => {
  theme.global.name.value = optionsData.value.lightTheme ? "light" : "dark";
  optionsData.value = { ...optionsData.value }
  util.save_options(optionsData.value);
  
  // Emit a custom event to notify components that options (including language) have changed
  window.dispatchEvent(new Event('language-changed'));
}

onMounted(async () => {
  try {
    await util.read_options()
    await saveOptions();
  } catch (error) {
    console.error("Error during initilization:", error)
  }
})

defineExpose({
  saveOptions,
  moveTop,
  allLanguages,
  optionsData,
})

</script>

<!-- /////////////////////////////////////////////////////////////////////////////////////////////////// -->
<script>
export default {
  data() {
    return {
      tab: null,
      userName: '',
      header: '',

      statusIcon: 'mdi-account',
      statusColor: 'blue-darken-2',
      exportIsLoading: false,

      word_translate: '',
    };
  },

  // async created() { },
  // watch: { },
  // computed: { },

  async mounted() {

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message.foreground)
        return;

      // Use the updated util.callMethod that handles async calls and sendResponse
      util.callMethod(this, message, sendResponse);
      return true; // This keeps the message port open
    })

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes("https://sozdik.kz/"))
      return;

    const userInfo = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const userInfo = document.querySelector(".ig_user_avatar_user_name")?.textContent.split('ID:')[0];
        return userInfo;
      },
    });

    if (userInfo && userInfo[0] && userInfo[0].result) {
      this.userName = userInfo[0].result;
      this.header = this.userName;
    }

  },

  methods: {
    async moveTop(prefix) {
      console.log("moveTop", prefix);
    },

    async downloadHistory() {
      this.exportIsLoading = true;
      this.statusIcon = '';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.runtime.sendMessage({
        background: true,
        action: "download_history",
        action_params: [tab.id]
      }, (result) => {
        this.exportIsLoading = false;
        this.header = this.userName;

        // Set status icon based on result
        if (result?.data?.success) {
          // Show success icon with green color
          this.statusIcon = 'mdi-check-circle';
          this.statusColor = 'success';
        } else {
          // Show error icon with red color
          this.statusIcon = 'mdi-alert-circle';
          this.statusColor = 'error';

          // If there's an error message, log it
          if (result?.error) {
            console.error('Export error:', result.error);
          }
        }

        // Reset status after 3 seconds
        setTimeout(() => {
          this.statusIcon = 'mdi-account';
          this.statusColor = 'blue-darken-2';
        }, 3000);
      });
    },

    async update_history_progress(text) {
      this.header = text;
    },

    async translateWord() {

      chrome.runtime.sendMessage({
        background: true,
        action: "prompt_chatgpt",
        action_params: [
          this.word_translate,
          util.options.morphology]
      }, (result) => {
        console.log(result);
      })
    },
  },
}
</script>

<style></style>