import { util, languages } from './util.js'

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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "sozdik_menu" && info.selectionText) {
        const selectedText = info.selectionText.trim();
        const words = selectedText.split(/\s+/);

        if (words.length === 1) {
            // Sort languages by prefix
            await util.read_options();

            for (const [language, { prefix, rule }] of Object.entries(languages)) {
                const validationResult = rule(selectedText);
                if (validationResult === true) {
                    util.search_in_sozdik(prefix, selectedText);
                    return;
                }
            }            
        }
        new MessageHandler().prompt_chatgpt(selectedText, false)
    }
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

    async prompt_chatgpt(sentence, morphology) {
        const gptTab = await chrome.tabs.create({
            url: 'https://chatgpt.com/',
            active: true
        });

        const prompt_prefix = morphology ? util.getText('Do Morphology') : util.getText('Do Translate');

        return new Promise((resolve, reject) => {
            const TIMEOUT_MS = 30 * 1000; // 30 second timeout
            let timeout;

            const listener = async function (tabId, changeInfo, updatedTab) {
                if (tabId === gptTab.id && changeInfo.status === "complete") {
                    clearTimeout(timeout);
                    chrome.tabs.onUpdated.removeListener(listener);

                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: gptTab.id },
                            func: call_prompt_chatgpt,
                            args: [sentence, prompt_prefix],
                            world: 'MAIN',
                            injectImmediately: true,
                        });
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                }
            };

            // Set timeout to cleanup
            timeout = setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                reject(new Error('Timeout waiting for ChatGPT tab to load'));
            }, TIMEOUT_MS);

            // Add the listener
            chrome.tabs.onUpdated.addListener(listener);
        });
    }

    async download_history(tabId) {
        // Get the current options
        const options = util.options;
        
        const history = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: call_download_history,
            args: [options.baseDelay, options.historyLimit]
        });

        if (history && history[0] && history[0]?.result?.length > 0) {
            await util.downloadCSV(history[0].result, "history.csv", options.csvDelimiter);
        }

        return {
            success: true
        };
    }
}

async function call_download_history(baseDelay, historyLimit) {
    const MAX_RETRIES = 3;
    const MAX_DELAY = 5000;

    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function fetchWithRetry(url, retries = 0) {
        try {
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

    function extractDisplayInfo(article) {
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
    const parser = new DOMParser();

    const data = await fetchWithRetry('https://sozdik.kz/kk/dictionary/history/');
    const history = parser.parseFromString(data, "text/html").querySelectorAll("#dictionary_history_contents > a");

    const result = [];
    // Limit the number of words to fetch
    const allWords = Array.from(history).slice(0, historyLimit)
        .reverse();
    for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i];

        const wordText = word.querySelector("article > h2")?.textContent || '-';

        // Send a message to the popup
        await chrome.runtime.sendMessage({
            foreground: true,
            action: "update_history_progress",
            action_params: [`... ${wordText} - ${i + 1} (${allWords.length})`]
        });

        if(wordText === '-' || !word.href ) {
            await delay(baseDelay);
            continue;
        }
        const data = await fetchWithRetry(word.href);

        // Clean the innerHTML using the helper
        const article = parser.parseFromString(data, "text/html").querySelector("#dictionary_translate_article");
        if (!article) {
            debugger;
            console.warn(`Failed to extract content for word: ${wordText}`);
            continue;
        }

        const pureHTML = extractDisplayInfo(article);
        result.push([wordText, pureHTML]);
        await delay(baseDelay);
    }

    return result;
}

async function call_prompt_chatgpt(sentence, prompt_prefix) {
    function waitForSelector(selector, timeout = 7000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            setTimeout(() => {
                console.log(`Timeout: Selector ${selector} not found`)
                observer.disconnect();
                reject(new Error(`Timeout: Selector ${selector} not found`));
            }, timeout);
        });
    }

    // Replace the text inside the textarea with the selected text
    const textarea = await waitForSelector("textarea")

    const prompt = prompt_prefix + `\n\n ${sentence}`;
    textarea.value = prompt;

    // Dispatch events to notify React of the change
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));

    const sendPrompt = await waitForSelector("button[data-testid='send-button']")
    sendPrompt.click()
}