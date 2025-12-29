import { util } from './util.js'
import { languages } from './translations.js'

// Initialize the util object
util.init().catch(error => {
    console.error("Error initializing util:", error);
});

class MessageHandler {
    // constructor() {}

    static async get_instance() {
        if (!MessageHandler.instance) {
            MessageHandler.instance = new MessageHandler();
        }
        await util.read_options()
        return MessageHandler.instance;
    }

    async test_ping() {
        return "pong"
    }

    async search_in_sozdik(prefix, word) {
        // Create a new tab with the search URL
        const tab = await chrome.tabs.create({
            url: `https://sozdik.kz/kk/dictionary/translate/${prefix}/${encodeURIComponent(word)}/`,
            active: true,
        });

        // Add a listener to detect when the page has loaded
        chrome.tabs.onUpdated.addListener(async function listener(tabId, changeInfo) {
            if (tabId !== tab.id || changeInfo.status !== 'complete')
                return;
            // Page has loaded completely
            chrome.tabs.onUpdated.removeListener(listener);

            const back = await util.get_sozdik_content({tabId: tabId});
            // console.log(`back`, back)
            if(back)
                util.add_to_history({
                    prefix: prefix,
                    front: word,
                    back: back
                });
        }.bind(this));
    }

    async prompt_translator(method, sentence) {
        let action = util.getText('Do Translate');
        const words = sentence.trim().split(/\s+/);
        if (words.length === 1) {
            action += ` ${ util.getText('Morphology') }`;
        }        
        // Add calque detection instruction if the option is enabled
        if (util.options.calque) {
            action = util.getText('Do Calque');
        }        
        const encodedSentence = encodeURIComponent(action + '\n\n'  + sentence);

        let url = ''
        switch (method){
            case "grok":
                url = `https://grok.com/?q=${encodedSentence}`
                // url = `https://x.com/i/grok?text=${encodedSentence}`
                break;
            case "chatgpt":
                url = `https://chat.openai.com/?q=${encodedSentence}`
                break;
            default:
                return;
        }
        
        await chrome.tabs.create({
            url: url,
            active: true
        });
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async upload_sozdik_history(items) {
        // Limit the number of words to fetch
        const allWords = Array.from(items).slice(0, util.options.historyLimit).reverse();
        for (let i = 0; i < allWords.length; i++) {
            const word = allWords[i];
    
            if (!word.text || !word.url) {
                await this.delay(util.options.baseDelay);
                continue;
            }

            // Get the prefix from the URL
            const parts = word.url.split("/");
            const prefix = parts.length >= 7 ? `${parts[6]}/${parts[7]}` : '';

            // Get the content of the word
            // console.log(word)
            const backHTML = await util.get_sozdik_content({url: word.url});
            // console.log(word, prefix, backHTML)

            // Send a message to the popup
            await chrome.runtime.sendMessage({
                anki: true,
                action: "update_history_progress",
                action_params: [prefix, word.text, backHTML, `... ${word.text} - ${i + 1} (${allWords.length})`]
            });

            await this.delay(util.options.baseDelay);
        }
    
        return true;
    }

    async send_command(command) {
        chrome.commands.onCommand.dispatch(command);
    }
}

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.background)
        return;

    // Use the updated util.callMethod that handles async calls and sendResponse
    MessageHandler.get_instance()
        .then(instance => {
            util.callMethod(instance, message, sendResponse);
        });

    return true; // This keeps the message port open
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(
        {
            id: "sozdik_menu",
            title: "Sozdik.kz",
            contexts: ["selection"],
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error(`Error creating context menu: ${chrome.runtime.lastError}`);
            } else {
                console.log("Context menu item created successfully.");
            }
        }
    );

});

// chrome.action.onClicked.addListener((tab) => {
//     chrome.sidePanel.open({ tabId: tab.id });
//     //  chrome.action.setPopup({popup: 'popup.html'});
//     //  chrome.action.openPopup();
// });

chrome.commands.onCommand.addListener((command) => {
    if (command === 'sozdik_popup') {
        chrome.action.setPopup({popup: 'popup.html'});
        chrome.action.openPopup();
    } else if (command === 'sozdik_side_panel') {
        util.open_side_panel({ active: true, currentWindow: true });
    }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // Sort languages by prefix
    await util.read_options();

    if (info.menuItemId === "sozdik_menu" && info.selectionText) {
        const selectedText = info.selectionText.trim();
        const words = selectedText.split(/\s+/);

        const handler = new MessageHandler();
        if (words.length === 1) {
            for (const [language, { prefix, rule }] of Object.entries(languages)) {
                const validationResult = rule(selectedText);
                if (validationResult === true) {
                    handler.search_in_sozdik(prefix, selectedText);
                    return;
                }
            }
        }
        handler.prompt_translator(util.options.translatorMethod, selectedText, false)
    }
});