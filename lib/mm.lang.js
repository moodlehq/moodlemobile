// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

/**
 * @fileoverview Moodle mobile lang lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile language functionality.
 */
MM.lang = {

    strings: [],
    current: '',
    locale:  '',

    /**
     * Determine the language for the app.
     * We check first if the user has selected by configuration a language..
     * then the Mobile device locale (but we have to check that we have a language file for that locale)
     * then the remote site lang (if the remote site is loaded, we can be at the login screen)
     * finally, the language in the config.json file (default language)
     *
     * @return {string} Language id (en, es, etc...)
     */
    determine: function() {
        // User preferences.
        var lang = MM.getConfig('lang');
        if (typeof(lang) != 'undefined') {
            return lang;
        }

        // Locale
        // MM.lang.locale is loaded by Phonegap.
        if (MM.lang.locale) {
            lang = MM.lang.locale.toLowerCase().replace("-", "_");
            if (typeof(MM.config.languages[lang]) != "undefined") {
                return lang;
            } else if(lang.length > 2) {
                // Try without the region/country.
                lang = lang.substr(0, 2);
                if (typeof(MM.config.languages[lang]) != "undefined") {
                    return lang;
                }
            }
        }

        // Browser language. RFC 4646.
        var browserLang = window.navigator.userLanguage || window.navigator.language;
        // Normalize i.e: pt-BR to pt_br.
        browserLang = browserLang.toLowerCase().replace("-", "_");
        if (typeof(MM.config.languages[browserLang]) != "undefined") {
            return browserLang;
        } else if(browserLang.length > 2) {
            // Try without the region/country.
            browserLang = browserLang.substr(0, 2);
            if (typeof(MM.config.languages[browserLang]) != "undefined") {
                return browserLang;
            }
        }

        // Default site lang.
        if (typeof(MM.config.current_site) != 'undefined' &&
            MM.config.current_site &&
            typeof(MM.config.current_site.lang) != 'undefined' &&
            typeof(MM.config.languages[MM.config.current_site.lang]) != "undefined") {
            return MM.config.current_site.lang;
        }

        // Default language.
        return MM.config.default_lang;
    },

    setup: function(component) {
		MM.log('Strings: Lang setup for ' + component);
		var cacheEl = "";
        if (typeof(component) == 'undefined') {
            component = 'core';
			cacheEl = 'core';
        }

		if (component != 'core') {
			cacheEl = MM.plugins[component].settings.lang.component;
		}

        var lang = MM.lang.determine();

        // Try to find in cache the language strings.
        // Languages are automatically sync and stored in cache, forcing to not expire.
        // Check if we are inside a site first, because languages can be set up in the login screen.

        if (typeof(MM.config.current_site) != "undefined" && MM.config.current_site) {
            var langStrings = MM.cache.getElement('lang-' + cacheEl + '-' + lang, true);
            if (langStrings) {
                MM.lang.loadLang(component, lang, langStrings);
                MM.log('Strings loaded from cache (remote syte)', 'Strings');
            }
        }
    },

    loadLang: function(component, lang, strings) {
        MM.log('Strings: Loading lang ' + lang + ' for component ' + component);
        MM.lang.current = lang;
        if (typeof(MM.lang.strings[lang]) == 'undefined') {
            MM.lang.strings[lang] = [];
        }

        if (strings && Object.keys(strings).length > 0) {
            MM.lang.strings[lang][component] = strings;
        }
    },

    loadPluginLang: function(component, strings) {
        MM.log('Strings: Loading plugin lang ' + component);
        if (!MM.lang.current) {
            MM.lang.current = 'en';
            MM.lang.strings['en'] = [];
        }

        // Try to find in cache the language strings.
        // Languages are automatically sync and stored in cache, forcing to not expire.
        var cacheStrings = MM.cache.getElement('lang-' + component + '-' + MM.lang.current, true);
        if (cacheStrings) {
            strings = cacheStrings;
            MM.log('Strings: Plugin '+component+' Strings loaded from cache (remote syte)');
        }

        MM.lang.strings[MM.lang.current][component] = strings;
        if (MM.lang.current != 'en') {
            MM.lang.strings['en'][component] = strings;
        }
    },

    pluginName: function(plugin) {

        if (MM.plugins[plugin].settings.lang.component != 'core') {
            return MM.lang.s('plugin' + plugin + 'name', plugin);
        }

        return MM.lang.s(plugin);
    },

    /**
     * Main function for translating strings
     *
     * @this {MM.lang}
     * @param {string} id The unique id of the string to be translated.
     * @param {string} component Core for regular strings or pluginname for plugins.
     */
    s: function(id, component) {

        if (typeof(component) == 'undefined') {
            component = 'core';
        }

        var translated = '';
        // First we check if we find the string in the current language.
        if (typeof(MM.lang.strings[MM.lang.current][component]) != 'undefined' &&
            typeof(MM.lang.strings[MM.lang.current][component][id]) !== 'undefined'
        ) {
            translated = MM.lang.strings[MM.lang.current][component][id];
        }
        // If not, we look for the string in the default language "english"
        else if (typeof(MM.lang.strings['en']) != 'undefined' &&
                typeof(MM.lang.strings['en'][component]) !== 'undefined' &&
                typeof(MM.lang.strings['en'][component][id]) !== 'undefined') {
            translated = MM.lang.strings['en'][component][id];
        }

        // If not found yet, we look for the string in the base language file (lang/en.json)
        if (!translated && component == 'core' && MM.lang.base[id]) {
            translated = MM.lang.base[id];
        }

        // If not found yet (for plugins only) we look for the string in the base lang also (plugin/lang/en.json).
        if (!translated && component != "core" &&
            MM.plugins[component].settings.lang.strings &&
            MM.plugins[component].settings.lang.strings[id] !== 'undefined') {

            translated = MM.plugins[component].settings.lang.strings[id];
        }

        // For missing strings, we use the [string] notation.
        if (!translated) {
            translated = '[[' + id + ']]';
        }
        return translated;
    },
};
