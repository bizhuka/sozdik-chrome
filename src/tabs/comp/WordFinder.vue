<template>
    <v-combobox
        clearable
        density="compact"
        :autofocus="autofocus"
        :label="description"
        :rules="[rules]"
        
        v-model="word"        
        :items="words"

        v-model:menu="isMenuOpen"
        
        @keydown.enter="searchWord" 
        @update:search="fetchSuggestions">

        <template v-slot:append-inner v-if="word">
            <v-icon @click="searchWord" class="search-icon">mdi-magnify</v-icon>
        </template>

        <template v-slot:append v-if="moveUpIcon">
            <v-icon @click="moveTop(prefix)">{{ moveUpIcon }}</v-icon>
        </template>
    </v-combobox>
</template>

<script>
// import { util } from '../../util.js';

export default {
    data() {
        return {
            word: '',
            words: [],
            isMenuOpen: false
        };
    },
    props: {
        description: {
            type: String,
            required: true,
        },
        prefix: {
            type: String,
            required: true
        },
        autofocus: {
            type: Boolean,
            required: false,
        },
        rules: {
            type: Function,
            required: true,
        },
        regex: {
            type: RegExp,
            required: true,
        },
        moveUpIcon: {
            type: String,
            required: true
        },
        moveTop: {
            type: Function,
            required: true
        }
    },
    methods: {
        searchWord() {
            // Remove characters that don't match the regex pattern
            let filteredWord = '';
            for (let char of this.word) 
                if (this.regex.test(char)) {
                    filteredWord += char;
                }
            this.word = filteredWord.toLowerCase();
            if(!this.word)
                return;

            chrome.runtime.sendMessage({
                background: true,
                action: "search_in_sozdik",
                action_params: [
                    this.prefix,
                    this.word]
            }, (result) => {
                console.log(result);
            })
        },
        async fetchSuggestions(newValue) {
            let newWords = [];

            // Only fetch suggestions for words with non-empty value
            if (newValue)
                try {
                    const response = await fetch(`https://sozdik.kz/suggests/${this.prefix}/${encodeURIComponent(newValue)}/2/0/10/`);
                    if (response.ok) {
                        const result = await response.json();
                        newWords = result?.data?.suggests //?.slice(0, 5)
                                     || [];
                    }
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                }

            // Keep menu open
            this.isMenuOpen = newWords.length > 0;
            this.words = newWords;
        }
    }
}
</script>

<style scoped></style>