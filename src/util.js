import Dexie from "dexie";
import { translations, cyrillicToLatin2021, getText, languages } from './translations.js';

class DbProxy extends Dexie {
    constructor() {
        super('sozdik');

        // New version with prefix+front as primary key
        this.version(1).stores({
            history: '[prefix+front], date',
        });

        this.history = this.table('history');
    }
}

export const util = {
    dbProxy: null,
    options: {
        lightTheme: false,
        language: 'қаз',
        languages_order: [],
        baseDelay: 1500,
        historyLimit: 10,
        translatorMethod: 'chatgpt',
        calque: false,
        ankiDeck: '',
        ankiModel: '',
    },

    async init() {
        this.dbProxy = new DbProxy();
        await this.read_options();
        return this;
    },

    open_side_panel(params) {
        // Get the active tab without using await
        chrome.tabs.query(params, (tabs) => {
            if (tabs && tabs.length > 0) {
                chrome.sidePanel.open({ tabId: tabs[0].id });
            }
        });
    },

    async get_sozdik_tabs() {
        return await chrome.tabs.query({
            url: "https://sozdik.kz/*"
        });
    },

    cyrillicToLatin2021(text) {
        return cyrillicToLatin2021(text);
    },

    getText(key, args = []) {
        return getText(key, this.options, translations, args);
    },

    async read_options() {
        try {
            const opt = await chrome.storage.local.get("options");            
            this._set_options(opt.options || {});
        } catch (e) {
            console.error("Error loading options from localStorage:", e);
        }

        if (this.options.languages_order && this.options.languages_order.length > 0) {
            // Create a new array to store languages in the saved order
            const orderedLanguages = [];

            // First add languages in the saved order
            this.options.languages_order.forEach(prefix => {
                const lang = languages.find(l => l.prefix === prefix);
                if (lang) orderedLanguages.push(lang);
            });

            // Add any remaining languages that weren't in the saved order
            languages.forEach(lang => {
                if (!orderedLanguages.find(l => l.prefix === lang.prefix))
                    orderedLanguages.push(lang);
            });

            // Replace the languages array contents while keeping the reference
            languages.length = 0;
            languages.push(...orderedLanguages);
        }
    },

    async save_options(newOptions) {
        this._set_options(newOptions)
        await chrome.storage.local.set({ options: this.options });
    },

    async _set_options(options) {
        for (let key in options) {
            if (this.options.hasOwnProperty(key)) {
                if (Array.isArray(this.options[key])) {
                    this.options[key] = [...options[key]];
                    continue;
                }
                this.options[key] = options[key];
            }
        }
    },

    async get_sozdik_content(params) {
        let tabId = params.tabId;

        // First tab with sozdik.kz url
        if (!tabId) {
            const [tab] = await chrome.tabs.query({ url: "https://sozdik.kz/*", currentWindow: true });
            if (!tab)
                return null;
            tabId = tab.id;
        }

        const result = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            args: [params.url || null, params.history || false],
            function: async (url, history) => {
                async function fetchWithRetry(url, retries = 0) {
                    const MAX_RETRIES = 3;
                    const MAX_DELAY = 5000;

                    try {
                        // console.log(url)
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return await response.text();
                    } catch (error) {
                        if (retries >= MAX_RETRIES) throw error;
                        debugger;
                        await delay(Math.min(baseDelay * Math.pow(2, retries), MAX_DELAY));
                        return fetchWithRetry(url, retries + 1);
                    }
                }

                function get_history_info(doc) {
                    const historyList = doc.querySelectorAll("#dictionary_history_contents > a");
                    const result = [];
                    for (const item of historyList)
                        result.push({
                            text: item.querySelector("article > :is(h1, h2, h3, h4, h5, h6)")?.textContent || null,
                            url: item.href
                        });
                    return {
                        items: result,
                        userName: doc.querySelector(".ig_user_avatar_user_name")?.textContent.split('ID:')[0] || null,
                    };
                }

                function get_word_info(doc) {
                    // Clean the innerHTML using the helper
                    const article = doc.querySelector("#dictionary_translate_article");
                    if (!article)
                        return null;

                    // Remove the first h2 tag if it exists
                    const firstH2 = article.querySelector('h2');
                    if (firstH2) {
                        firstH2.remove();
                    }

                    // Remove elements with hidden attribute
                    const hiddenElements = article.querySelectorAll('[hidden]');
                    hiddenElements.forEach(element => element.remove());

                    // Remove attributes that are not needed
                    const allElements = article.getElementsByTagName('*');
                    for (const element of allElements)
                        Array.from(element.attributes).forEach(attr => {
                            if (attr.name !== 'open')
                                element.removeAttribute(attr.name);
                        });

                    return article.innerHTML
                        // Remove all the noindex comments
                        .replace(/<!--\/noindex-->|<!--noindex-->/g, '')

                        // Remove all the new lines and trim the text
                        .split('\n')
                        .filter(line => line.trim())
                        .join('\n')
                        .trim();
                }
                const finalUrl = url ? url : history ? 'https://sozdik.kz/kk/dictionary/history/' : null;
                // console.log(`finalUrl=${finalUrl}`)
                const rawHTML = finalUrl ? await fetchWithRetry(finalUrl) : document.documentElement.outerHTML

                const parser = new DOMParser();
                const doc = parser.parseFromString(rawHTML, "text/html");
                // console.log(history, doc)
                return history ? get_history_info(doc) : get_word_info(doc);
            },
        });

        return result[0].result;
    },

    async add_to_history(item) {
        // Delete if exists
        await this.dbProxy.history.delete([item.prefix, item.front]);
        if (item.back) {
            const clone = { ...item };

            clone.date = new Date();
            await this.dbProxy.history.add(clone);
        }
        // Notify that history has been updated
        chrome.runtime.sendMessage({
            anki: true,
            action: "load_history"
        });
    },

    async set_archive_status(item, status) {
        await this.dbProxy.history.update([item.prefix, item.front], { archived: status });
        chrome.runtime.sendMessage({
            anki: true,
            action: "load_history"
        });
    },

    async get_history() {
        return await this.dbProxy.history.orderBy("date").reverse().toArray();
    },

    async callMethod(context, message, sendResponse) {
        // Handle the async call and sendResponse
        try {
            // Ensure we keep the message channel open for async responses
            if (!message.action || typeof context[message.action] !== 'function')
                throw new Error(`Invalid action specified: ${message.action}`);

            const result = await context[message.action](...(message.action_params || []));
            if (sendResponse) {
                sendResponse({ data: result });
            }
        } catch (error) {
            console.error(`Error in callMethod for action ${message.action}:`, error);
            if (sendResponse) {
                sendResponse({ error: error.message });
            }
            return false;
        }
        return true;
    },

    // Anki Connect API functions - Removed

}