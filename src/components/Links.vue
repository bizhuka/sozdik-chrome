<template>
    <div :key="languageKey">
        <v-label density="compact">{{ TitleText ? util.getText(TitleText) : '' }}</v-label>

        <v-breadcrumbs v-if="items && items.length" :items="items" density="compact">
            <!-- >>>>>> divider=">" -->
            <template v-slot:divider>
                <v-icon icon="mdi-chevron-right" />
            </template>

            <template v-slot:item="{ item }">
                <v-breadcrumbs-item :href="item.href" @click.prevent.stop="onClickHandler(item)">
                    {{ item.title }}
                </v-breadcrumbs-item>
            </template>
        </v-breadcrumbs>
    </div>
</template>

<script>
import { util } from '../util.js';

export default {
    props: {
        TitleText: {
            type: String,
            required: false
        },

        items: {
            type: Array,
            required: true,
        },

        clickHandler: {
            type: Function,
            required: false,
        }
    },

    data() {
        return {
            util,
            languageKey: 0 // Key to force re-rendering
        };
    },

    mounted() {
        // Listen for language changes and update the key to force re-rendering
        window.addEventListener('language-changed', this.updateLanguageKey);
    },
    
    beforeUnmount() {
        // Clean up the event listener
        window.removeEventListener('language-changed', this.updateLanguageKey);
    },

    methods: {
        updateLanguageKey() {
            // Increment the key to force re-rendering
            this.languageKey++;
        },
        
        onClickHandler(item) {
            if(this.clickHandler)
                this.clickHandler(item)
            else if (item.href) {
                window.open(item.href, '_blank');
            }
        }
    }
}
</script>