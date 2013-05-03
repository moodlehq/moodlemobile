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
 * @fileOverview This is the js file that loads all the dependencies and init the application.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */

// Base path for all the files required.
require.config({
    paths: {
        root: '..'
    }
});

// Requeriments for launch the app, the function is not executed until both files are fully loaded.
// We need at least the config.json file with all the settings and the language file.
require(['root/externallib/text!root/config.json', 'root/externallib/text!root/lang/en.json'],
function(config, lang) {

    config = JSON.parse(config);
    // Init the app.
    MM.init(config);
    MM.lang.base = JSON.parse(lang);

    // Once the config and base lang are loaded, we load all the plugins defined in the config.json file.
    require.config({
        baseUrl: 'plugins',
        packages: config.plugins
    });

    // We load extra languages if are present in the config file.
    var extraLang = 'root/externallib/text!root/lang/' + config.default_lang + '.json';
    config.plugins.unshift(extraLang);

    require(config.plugins,
        function(extraLang) {
            MM.lang.loadLang('core', config.default_lang, JSON.parse(extraLang));
            $(document).ready(function() {
                // Load the base layout of the app.
                MM.loadLayout();
            });
        }
    );
});
