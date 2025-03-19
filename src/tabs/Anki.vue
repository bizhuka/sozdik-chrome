<template>
  <div>
    <v-expansion-panels v-model="expandedPanels" class="fill-width">
      <v-expansion-panel :title="util.getText('History') + ' (' + searchHistory.length + ')'">
        <v-expansion-panel-text>
          <div class="d-flex align-center mb-2">                      
            <v-btn color="error" variant="text" size="small" prepend-icon="mdi-delete" @click="clearHistory" :disabled="!searchHistory.length" class="ml-auto mr-2 text-capitalize">
              {{ util.getText('Delete all') }}
            </v-btn>
          </div>

          <v-list v-if="searchHistory.length" density="compact" lines="two">
            <v-list-item v-for="(item, index) in searchHistory"
              :key="index"
              :title="item.front"
              :subtitle="new Date(item.date).toLocaleString()">
              <template v-slot:prepend>
                <v-icon @click="deleteHistoryItem(item)" color="grey">mdi-delete</v-icon>
              </template>
              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-tooltip location="top" max-width="300">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon size="small" @click="searchHistoryItem(item)" color="primary">
                        <v-icon>mdi-magnify</v-icon>
                      </v-btn>
                    </template>
                    <div v-html="item.back ? '<h3>' + item.front + '</h3>' + item.back : util.getText('No translation')"></div>
                  </v-tooltip>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <v-card v-else>
            <v-card-text class="text-center">
              {{ util.getText('No search history found') }}
            </v-card-text>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel :title="current_word ? current_word : 'Sozdik.kz'" @click="expandSozdikPanel">
        <v-expansion-panel-text>
          <div class="d-flex align-center mb-2">
            <v-btn color="primary" variant="text" size="small" prepend-icon="mdi-download" @click="importHistory" :disabled="!sozdik_user || optionsData.historyLimit === 0 || sozdik_items.length === 0" :loading="importIsLoading" class="ml-auto mr-2 text-capitalize">
              {{ sozdik_user }} - {{ sozdik_items.length }}
            </v-btn>
          </div>

          <v-slider v-model="optionsData.historyLimit" :min="0" :max="100" :step="5" thumb-label
            @update:model-value="saveOptions">
            <template v-slot:prepend>
              <v-tooltip :text="util.getText('History Limit')" location="left" open-delay="500">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props">mdi-history</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-slider>

          <v-slider v-model="optionsData.baseDelay" :min="500" :max="3000" :step="100" thumb-label
            @update:model-value="saveOptions">
            <template v-slot:prepend>
              <v-tooltip :text="util.getText('Request Delay (ms)')" location="left" open-delay="500">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props">mdi-timer</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-slider>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel title="Anki">
        <v-expansion-panel-text>
          <div class="d-flex align-center mb-2">
            <v-btn color="success" variant="text" size="small" prepend-icon="mdi-upload" @click="exportToAnki" :disabled="!searchHistory.length || !optionsData.ankiDeck || !optionsData.ankiModel" class="ml-auto mr-2 text-capitalize" :loading="ankiLoading.export">
              {{ util.getText('Anki') }}
            </v-btn>
          </div>

          <v-alert v-if="ankiStatus.message" :type="ankiStatus.type" class="mb-4" density="compact" closable @click:close="setAnkiStatus(null, null)">
            <span v-html="ankiStatus.message.replace(/\n/g, '<br>')"></span>
          </v-alert>

          <v-row density="compact">
            <v-col cols="12" sm="6">
              <v-combobox
                v-model="optionsData.ankiDeck"
                :items="ankiDecks.items"
                :loading="ankiDecks.loading"
                :label="util.getText('Anki Deck')"
                @click:clear="optionsData.ankiDeck = ''"
                @update:model-value="saveOptions"
                clearable
                @focus="loadAnkiDecks"
                density="compact"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-cards</v-icon>
                </template>
                <template v-slot:append-inner>
                  <v-icon @click="loadAnkiDecks" color="primary">mdi-refresh</v-icon>
                </template>
              </v-combobox>
            </v-col>
            <v-col cols="12" sm="6">
              <v-combobox
                v-model="optionsData.ankiModel"
                :items="ankiModels.items"
                :loading="ankiModels.loading"
                :label="util.getText('Anki Note Type')"
                @click:clear="optionsData.ankiModel = ''"
                @update:model-value="saveOptions"
                clearable
                @focus="loadAnkiModels"
                density="compact"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-note-text</v-icon>
                </template>
                <template v-slot:append-inner>
                  <v-icon @click="loadAnkiModels" color="primary">mdi-refresh</v-icon>
                </template>
              </v-combobox>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h5">{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" variant="text" @click="confirmDialog.show = false" class="text-capitalize">
            {{ util.getText('Cancel') }}
          </v-btn>
          <v-btn color="error" variant="text" @click="confirmDialog.confirm()" class="text-capitalize">
            {{ util.getText('Confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
    import { util } from '../util.js';
</script>

<script>
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
      expandedPanels: [0],
      searchHistory: [],
      sozdik_user: '',
      sozdik_items: [],
      current_word: '',
      importIsLoading: false,
      
      // Anki integration
      ankiDecks: {
        items: [],
        loading: false
      },
      ankiModels: {
        items: [],
        loading: false
      },
      ankiLoading: {
        export: false,
        version: null
      },
      ankiStatus: {
        message: '',
        type: 'info'
      },
      
      // Confirmation dialog
      confirmDialog: {
        show: false,
        title: '',
        message: '',
        confirm: () => {}
      }
    };
  },
  
  mounted() {
    this.initializeComponent();
  },
  
  methods: {
    async initializeComponent() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {      
        if (!message.anki)
          return;

        // Use the updated util.callMethod that handles async calls and sendResponse
        util.callMethod(this, message, sendResponse);
        return true; // This keeps the message port open
      });

      await this.load_history();
      
      // Initialize Anki integration
      try {
        this.ankiLoading.version = await util.ankiConnect('version');
        console.log('Connected to Anki, version:', this.ankiLoading.version);

        await this.loadAnkiDecks();
        await this.loadAnkiModels();
      } catch (error) {
        this.setAnkiStatus('error', util.getText('Failed to connect to Anki. Make sure Anki is running with AnkiConnect plugin installed.'));
      }
    },
    
    async load_history() {
      try {
        this.searchHistory = await util.get_history();
      } catch (error) {
        console.error("Error loading search history:", error);
        this.searchHistory = [];
      }
    },

    async deleteHistoryItem(item) {
      // Delete the item from the history
      item.back = null;
      util.add_to_history(item);
      await this.load_history();
    },

    searchHistoryItem(item) {
      if (!item || !item.prefix || !item.front) return;
      
      chrome.runtime.sendMessage({
        background: true,
        action: "search_in_sozdik",
        action_params: [item.prefix, item.front]
      });
    },

    clearHistory() {
      this.showConfirmDialog(
        util.getText('Confirm Deletion'),
        util.getText('Are you sure you want to clear search history?'),
        async () => {
          await util.dbProxy.history.clear();
          this.searchHistory = [];
          this.confirmDialog.show = false;
        }
      );
    },

    showConfirmDialog(title, message, confirmCallback) {
      this.confirmDialog.title = title;
      this.confirmDialog.message = message;
      this.confirmDialog.confirm = confirmCallback;
      this.confirmDialog.show = true;
    },

    async expandSozdikPanel() {
      const content = await util.get_sozdik_content({
        history: true
      });

      // Delete items that already exist in the history
      this.sozdik_items = content.items.filter(item => 
        !this.searchHistory.some(historyItem => historyItem.front === item.text)
      );
      this.sozdik_user = content.userName;
    },

    async importHistory() {
      this.importIsLoading = true;

      chrome.runtime.sendMessage({
        background: true,
        action: "upload_sozdik_history",
        action_params: [this.sozdik_items]
      }, async (result) => {
        this.importIsLoading = false;
        this.current_word = '';

        if(result.data){
          await this.load_history();
          await this.expandSozdikPanel();
        }
      });
    },

    async update_history_progress(prefix, front, back, progress) {
      util.add_to_history({prefix, front, back});
      this.current_word = progress;
    },

    async loadAnkiDecks() {
      await this.loadAnkiList('deckNames', this.ankiDecks);      
    },

    async loadAnkiModels() {
      await this.loadAnkiList('modelNames', this.ankiModels);
    },

    async loadAnkiList(type, list) {
      try {
        list.loading = true;
        this.setAnkiStatus(null, null);
        list.items = await util.ankiConnect(type);
      } catch (error) {
        this.setAnkiStatus('error', util.getText('Failed to connect to Anki. Make sure Anki is running with AnkiConnect plugin (ID: 2055492159) installed.'));
      } finally {
        list.loading = false;
      }
    },

    async exportToAnki() {
      const loaded = this.ankiLoading.version || this.ankiDecks.items.length > 0 || this.ankiModels.items.length > 0;
      if (!loaded || !this.searchHistory.length || !util.options.ankiDeck || !util.options.ankiModel) {
        this.setAnkiStatus('warning', util.getText('No cards were exported. Make sure your history contains items with translations.'));
        return;
      }

      try {
        this.ankiLoading.export = true;
        this.setAnkiStatus('info', util.getText('Exporting to Anki...'));

        const results = await util.exportToAnki(this.searchHistory);

        if(results.duplicates > 0 && results.failed === 0){
          this.setAnkiStatus('warning', util.getText('Successfully exported {0} cards to Anki ({1} duplicates skipped)', [results.success, results.duplicates]));
        } else if (results.success > 0) {
          this.setAnkiStatus('success', results.failed > 0 ? 
            util.getText('Successfully exported {0} cards to Anki ({1} failed)', [results.success, results.failed]) : 
            util.getText('Successfully exported {0} cards to Anki', [results.success]));
        } else if (results.failed > 0) {
          this.setAnkiStatus('error', util.getText('Failed to export {0} cards to Anki. Check console for details.', [results.failed]));
        }
      } catch (error) {
        console.error('Error exporting to Anki:', error);
        this.setAnkiStatus('error', util.getText('Failed to export to Anki: {0}', [error.message]));
      } finally {
        this.ankiLoading.export = false;
      }
    },

    setAnkiStatus(type, message) {
      this.ankiStatus.type = type || '';
      this.ankiStatus.message = message || '';
    }
  }
}
</script> 