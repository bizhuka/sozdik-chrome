export const languages = [
    {
        description: "Қазақ сөзін іздеу",
        prefix: "kk/ru",
        latin: false,
        rule: (value) => !value || /^[а-яА-ЯёЁӘәҒғІіҢңӨөҰұүҮҚқһ\s-]+$/.test(value) || "Қате қазақ әріптері табылған!",
    },
    {
        description: "Qazaq sözın ızdeu",
        prefix: "kk-Latn/ru",
        latin: true,
        rule: (value) => !value || /^[a-zA-ZÄäĞğIıİiÑñÖöŞşŪūÜü\s-]+$/.test(value) || "Qate qazaq áripteri tabylǵan!",
    },
    {
        description: "Поиск слова на русском",
        prefix: "ru/kk",
        latin: false,
        rule: (value) => !value || /^[а-яА-ЯёЁ\s-]+$/.test(value) || "Недопустимые русские кириллические символы!",
    },
    {
        description: "Поиск слова на русском",
        prefix: "ru/kk-Latn",
        latin: true,
        rule: (value) => !value || /^[а-яА-ЯёЁ\s-]+$/.test(value) || "Недопустимые русские кириллические символы!",
    }
];

export const util = {
    options: {
        lightTheme: false,
        useLatin: false,
        inRussian: false,
        morphology: false,
        languages_order: [],
        csvDelimiter: ';',
        baseDelay: 1500,
        historyLimit: 10
    },

    cyrillicToLatin2021(text) {
        if (!text) return '';
        
        const cyrillicToLatinMap = {
            'А': 'A', 'а': 'a',
            'Ә': 'Ä', 'ә': 'ä',
            'Б': 'B', 'б': 'b',
            'В': 'V', 'в': 'v',
            'Г': 'G', 'г': 'g',
            'Ғ': 'Ğ', 'ғ': 'ğ',
            'Д': 'D', 'д': 'd',
            'Е': 'E', 'е': 'e',
            'Ё': 'E', 'ё': 'e',
            'Ж': 'J', 'ж': 'j',
            'З': 'Z', 'з': 'z',
            'И': 'İ', 'и': 'i',
            'Й': 'İ', 'й': 'i',
            'К': 'K', 'к': 'k',
            'Қ': 'Q', 'қ': 'q',
            'Л': 'L', 'л': 'l',
            'М': 'M', 'м': 'm',
            'Н': 'N', 'н': 'n',
            'Ң': 'Ñ', 'ң': 'ñ',
            'О': 'O', 'о': 'o',
            'Ө': 'Ö', 'ө': 'ö',
            'П': 'P', 'п': 'p',
            'Р': 'R', 'р': 'r',
            'С': 'S', 'с': 's',
            'Т': 'T', 'т': 't',
            'У': 'U', 'у': 'u',
            'Ұ': 'Ū', 'ұ': 'ū',
            'Ү': 'Ü', 'ү': 'ü',
            'Ф': 'F', 'ф': 'f',
            'Х': 'H', 'х': 'h',
            'Һ': 'H', 'һ': 'h',
            'Ц': 'Ts', 'ц': 'ts',
            'Ч': 'Ch', 'ч': 'ch',
            'Ш': 'Ş', 'ш': 'ş',
            'Щ': 'Şş', 'щ': 'şş',
            'Ъ': '', 'ъ': '',
            'Ы': 'Y', 'ы': 'y',
            'І': 'I', 'і': 'ı',
            'Ь': '', 'ь': '',
            'Э': 'E', 'э': 'e',
            'Ю': 'İu', 'ю': 'iu',
            'Я': 'İa', 'я': 'ia'
        };

        return text.split('').map(char => cyrillicToLatinMap[char] || char).join('');
    },

    getText(key) {
        const pair = {
            'Language': [ 'Қазақша', 'Русский' ],
            'Light': [ 'Ақшыл', 'Светлая' ],
            'Dark': [ 'Қара', 'Темная' ],
            'Latin': [ 'Латынша', 'Латинница' ],
            'Cyrillic': [ 'Кириллица', 'Кириллица' ],
            'Morphology': [ 'Морфологиялық талдау жасау', 'Морфологический разбор' ],
            'Translate': [ 'Аудару', 'Перевод' ],
            'Do Morphology': [ 'Морфологиялық талдау', 'Морфологический разбор' ],
            'Do Translate': [ 'Орысшадан қазақшаға немесе қазақшадан орысшаға аудар', 'Перевести с русского на казахский или с казахского на русский' ],
            'Text': ['Мәтін', 'Текст'],
            'History Limit': ['Жүктелген сөздер лимиті', 'Лимит слов на скачивание'],
            'Request Delay (ms)': ['Кідіріс ұзақтығы (мс)', 'Задержка запроса (мс)'],
            'CSV Delimiter': ['CSV бөлгіш таңбасы', 'CSV разделитель'],
            'Download': ['Жүктеу', 'Скачать'],
            'Sozdik.kz About': ['Sozdik.kz', 'Sozdik.kz'],
            'Plugin About': ['Қосымша туралы', 'О расширении'], 
        }[key];

        if(this.options.inRussian)
            return pair[1];
        return !this.options.useLatin ? pair[0] : this.cyrillicToLatin2021(pair[0]);
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

    search_in_sozdik(prefix, word) {
        chrome.tabs.create({
            url: `https://sozdik.kz/kk/dictionary/translate/${prefix}/${encodeURIComponent(word)}/`,
            active: true,
        });
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

    async downloadCSV(csvRows, filename, delimiter) {
        if (!csvRows || !Array.isArray(csvRows) || csvRows.length === 0)
            return;

        const as_line = csvRows.map((obj) =>
            Object.values(obj)
                .map((value) => `"${value.toString().replace(/"/g, '""')}"`)
                .join(delimiter)
        );
        const csvContent = "\uFEFF" + as_line.join("\n");
        const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

        try {
            await chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: false,
            }, () => {
                console.log("Downloaded", filename);
            });
        } catch (error) {
            console.error("Error in downloadBlob:", error);
            throw error;
        }
    },
}