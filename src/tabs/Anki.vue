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
              :subtitle="new Date(item.date).toLocaleString()"
              :class="{ 'text-grey': item.archived }">
              <template v-slot:prepend>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon 
                      v-bind="props"
                      @click="toggleArchiveItem(item)" 
                      :color="item.archived ? 'primary' : 'grey'"
                    >
                      {{ item.archived ? 'mdi-archive-refresh' : 'mdi-archive' }}
                    </v-icon>
                  </template>
                  <span>{{ util.getText(item.archived ? 'Unarchive' : 'Archive') }}</span>
                </v-tooltip>
              </template>
              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-tooltip location="top" max-width="300">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon size="small" @click="searchHistoryItem(item)" :color="item.archived ? 'grey' : 'primary'">
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
            <v-btn color="success" variant="text" size="small" prepend-icon="mdi-upload" @click="triggerExport" :disabled="!searchHistory.length || exportingToAnki" class="ml-auto mr-2 text-capitalize" :loading="exportingToAnki">
              {{ util.getText('Anki') }}
            </v-btn>
          </div>

          <v-alert v-if="ankiStatus.message" :type="ankiStatus.type" class="mb-4" density="compact" closable @click:close="setAnkiStatus(null, null)">
            <span v-html="ankiStatus.message.replace(/\n/g, '<br>')"></span>
          </v-alert>

          <v-row density="compact">
            <v-col cols="12">
              <v-text-field
                v-model="deckName"
                :label="util.getText('Anki Deck')"
                required
                density="compact"
                hide-details
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="nodeType"
                :label="util.getText('Anki Note Type')"
                required
                density="compact"
                hide-details
                readonly
              ></v-text-field>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <ConfirmDialog
        v-model="showConfirmDialog"
        :title="util.getText('Confirm Deletion')"
        :message="util.getText('Are you sure you want to clear search history?')"
        :cancelText="util.getText('Cancel')"
        :confirmText="util.getText('Confirm')"
        @confirm="confirmAction()"/>
  </div>
</template>

<script setup>
    import ConfirmDialog from './comp/ConfirmDialog.vue';
    import { util } from '../util.js';
    import { Model, Deck, Note, Package as AnkiPackage } from '../lib/genanki.js';
    import initSqlJs from 'sql.js';
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
      deckName: 'Sozdik.kz',
      nodeType: 'Sozdik.kz',
      exportingToAnki: false,
      ankiStatus: {
        message: '',
        type: 'info'
      },

      showConfirmDialog: false,
      confirmAction: () => {},
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
    },
    
    async load_history() {
      try {
        const history = await util.get_history();
        this.searchHistory = history.sort((a, b) => {
          if (!!a.archived === !!b.archived) {
            return new Date(b.date) - new Date(a.date);
          }
          return a.archived ? 1 : -1;
        });
      } catch (error) {
        console.error("Error loading search history:", error);
        this.searchHistory = [];
      }
    },

    async toggleArchiveItem(item) {
      await util.set_archive_status(item, !item.archived);
      await this.load_history();
    },

    searchHistoryItem(item) {
      if (!item || !item.prefix || !item.front || item.archived) return;
      
      chrome.runtime.sendMessage({
        background: true,
        action: "search_in_sozdik",
        action_params: [item.prefix, item.front]
      });
    },

    clearHistory() {
      this.confirmAction = async () => {
        await util.dbProxy.history.clear();
        this.searchHistory = [];
      };
      this.showConfirmDialog = true;
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

    get_id_from_name(name) {
      const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return hash % 1000000000; // Ensure the ID is within a valid range
    },

    async triggerExport() {
      if (!this.searchHistory || this.searchHistory.length === 0) {
        this.setAnkiStatus('warning', util.getText('No words to process or request count is 0.'));
        return;
      }
      
      this.exportingToAnki = true;
      this.setAnkiStatus('info', util.getText('Exporting to Anki...'));

      try {
        // Initialize SQL.js if not already available globally
        if (!window.SQL) {
            try {
                const SQL = await initSqlJs({
                  locateFile: filename => `/js/sql/${filename}`
                });
                window.SQL = SQL;
            } catch (e) {
                console.error("Failed to load SQL.js", e);
                throw new Error("Failed to load SQL.js: " + e.message);
            }
        }

        const modelId = this.get_id_from_name(this.nodeType);
        const ankiModel = new Model({
          id: modelId,
          name: this.nodeType,
          flds: [
            { name: 'Front' },
            { name: 'Back' },
            { name: 'Sound' },
            { name: 'Image' },
            { name: 'Context' },
            { name: 'Transcription' },
          ],
          req: [
            [0, "all", [0]],
          ],
          tmpls: [
            {
              name: util.getText('mainTemplate') || 'Card 1',
              qfmt: `<div>{{Front}}</div><div class="transcription">{{Transcription}}</div>`,
              afmt: `<div>{{FrontSide}}</div><hr id=answer><div>{{Back}}</div><div><img src="{{Image}}"></div><div class="context">{{Context}}</div>`,
            },
          ],
          css: `.card { font-family: arial; font-size: 1.5rem; text-align: center; color: black; background-color: white; }`,
        });

        const ankiDeck = new Deck(modelId + 1, this.deckName);
        const ankiPackage = new AnkiPackage();
        ankiPackage.addDeck(ankiDeck);

        const wordsToExport = this.searchHistory.filter(item => !item.archived);

        if (wordsToExport.length === 0) {
            this.setAnkiStatus('warning', util.getText('No words to process or request count is 0.'));
            return;
        }

        for (const item of wordsToExport) {
          if (!item.front || !item.back) continue;

          const note = new Note(ankiModel, [
            item.front,
            item.back,
            '', // Sound
            '', // Image
            '', // Context
            '', // Transcription
          ]);
          ankiDeck.addNote(note);
        }

        const fileName = `${ wordsToExport.length }-Sozdik.kz-${ new Date().toISOString().split('T')[0] }.apkg`;
        ankiPackage.writeToFile(fileName);
        this.setAnkiStatus('success', util.getText('Successfully exported {0} cards to Anki', [fileName]));
      } catch (error) {
        console.error('Error exporting to Anki:', error);
        this.setAnkiStatus('error', util.getText('Failed to export to Anki: {0}', [error.message]));
      } finally {
        this.exportingToAnki = false;
      }
    },

    setAnkiStatus(type, message) {
      this.ankiStatus.type = type || '';
      this.ankiStatus.message = message || '';
    }
  }
}
</script>