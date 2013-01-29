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
 * @fileOverview Main app library where is defined the global namespace "MM".
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */

/**
  * @namespace Holds all the MoodleMobile specific functionallity.
 */
var MM = {

    config: {},
    plugins: [],
    models: {},
    collections: {},
    deviceType: 'phone',
    deviceOS: '',
    logData: [],
    inComputer: false,

    /**
     * Initial setup of the app: device type detection, routes, models, settings.
     * This function is executed once the config.json file is loaded and previously to loading the app plugins.
     *
     * @this {MM}
     * @param {Object.<>} Settings loaded from /config.json.
     */
    init: function(config) {
        // Config.js settings.
        this.config = config;

        MM.log('MM: Initializating app');

        // Device type detection.
        if (matchMedia('only screen and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1)').matches) {
            this.deviceType = 'tablet';
            $('body').addClass('tablet');
        } else {
            this.deviceType = 'phone';
            $('body').addClass('phone');
        }

        //OS Detecting
        this.deviceOS = (navigator.userAgent.match(/iPad/i)) == 'iPad' ? 'ios' : (navigator.userAgent.match(/iPhone/i)) == 'iPhone' ? 'ios' : (navigator.userAgent.match(/Android/i)) == 'Android' ? 'android' : 'null';


        MM.inComputer = navigator.userAgent.indexOf('Chrome') >= 0 ||
                        navigator.userAgent.indexOf('Safari') >= 0 ||
                        navigator.userAgent.indexOf('MSIE') >= 0 ||
                        navigator.userAgent.indexOf('Firefox') >= 0;
        MM.inComputer = MM.inComputer && navigator.userAgent.indexOf('Mobile') == -1;

        // If we are testing in a computer, we load the Cordova emulating javascript.
        if (MM.inComputer) {
            MM.log('MM: Loading Cordova Emulator, we are in a ' + navigator.userAgent);
            MM.cordova.loadEmulator();
        }

        // Load the Backbone.Router for URL routing.
        var appRouter = Backbone.Router.extend();
        this.Router = new appRouter;

        // AJAX error handling.
        $.ajaxSetup({'error': function(xhr,textStatus, errorThrown) {
            var error = MM.lang.s('cannotconnect');
            if (xhr.status == 404) {
                error = MM.lang.s('invalidscheme');
            }
            MM.popErrorMessage(error);
        }});

        // Load Models.
        // Elements for the core storage model.
        var storage = {
            setting: {type: 'model', bbproperties: {initialize: function() { MM.config[this.get('name')] = this.get('value'); }}},
            settings: {type: 'collection', model: 'setting'},
            site: {type: 'model'},
            sites: {type: 'collection', model: 'site'},
            course: {type: 'model'},
            courses: {type: 'collection', model: 'course'},
            user: {type: 'model'},
            users: {type: 'collection', model: 'user'},
            cacheEl: {type: 'model'},
            cache: {type: 'collection', model: 'cacheEl'},
            syncEl: {type: 'model'},
            sync: {type: 'collection', model: 'syncEl'}
        };
        this.loadModels(storage);

        // Load core Routes.
        this.loadRoutes();

        // Load settings from database.
        MM.db.each('settings', function(e) {
            MM.config[e.get('name')] = e.get('value');
        });
    },

    /**
     * Checks if the device is connected to Internet
     * We use Cordova API for that, if the config setting "dev_offline" is set we return allways not connected.
     *
     * @return {boolean} True if the device is connected.
     */
    deviceConnected: function() {
        var connected = true;

        if (typeof(navigator.network) != 'undefined') {
            var networkState = navigator.network.connection.type;
            connected = (networkState != Connection.NONE && networkState != Connection.UNKNOWN);
            MM.log('Internet connection checked ' + connected);
        }

        var offline = MM.getConfig('dev_offline');
        if (typeof(offline) != 'undefined' && offline) {
            connected = false;
        }

        return connected;
    },

    /**
     * Loads the non site specific CSS layout of the app and handles orientation/state changes.
     */
    loadLayout: function() {

        MM.log('MM: Loading layout');
        var tpl = MM.tpl.render($('#add-site_template').html());
        $('#add-site').html(tpl);

        // Dom is ready!.
        Backbone.history.start();

        // Add site events.
        $('#add-site form').on('submit', this.addSite);

        if (typeof MM.config.presets.url != 'undefined') {
            $('#url').val(MM.config.presets.url);
        }
        if (typeof MM.config.presets.username != 'undefined') {
            $('#username').val(MM.config.presets.username);
        }

        // Panels size in pixels in three panels view
        var panelCenter = {
                left: $('#panel-center').css('left'),
                width: $('#panel-center').css('width')
            };
        var panelRight = {
                left: $('#panel-right').css('left'),
                width: $('#panel-right').css('width')
            };


        // Force the height of the panels to the screen height.
        $('#add-site, #main-wrapper, #panel-left').css('height', $(document).innerHeight());

        var headerHeight = $('.header-wrapper').height();
        $('#panel-center, #panel-right').css('height', $(document).innerHeight() - headerHeight);

        $(window).bind('orientationchange', function(e) {
            $('#main-wrapper, #panel-left').css('height', $(document).innerHeight());

            var dH = $(document).height();
            var wH = $(window).height();
            var diH = $(document).innerHeight();

            var newH = (dH < wH) ? dH : wH;
            newH = (diH < newH) ? diH : newH;

            headerHeight = $('.header-wrapper').height();
            $('#main-wrapper, #panel-left').css('height', newH);
            $('#panel-center, #panel-right').css('height', newH - headerHeight);

        });
        var mq = matchMedia('only screen and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1)');
        // We refresh if the mediaquery is triggered. As we are in local, this is a simple way for refreshing the viewport.
        mq.addListener(function(mq) {
            if (mq.matches && MM.deviceType == 'phone') {
                // We were in phone resolution view, now we are in tablet resolution view.
                location.reload();
            } else if (!mq.matches && MM.deviceType == 'tablet') {
                // We were in tablet resolution view, now we are in phone view.
                location.reload();
            }
        });

        if (mq.matches) {

            $('#mainmenu').on('click touchend', function(e) {
                MM.panels.menuShow();
                e.stopPropagation();
            });

            // Swipe detection.
            $('#main-wrapper').swipe({
                swipe: function(event, direction, distance, duration, fingerCount) {
                  if (direction != 'left' && direction != 'right')
                    return;
                  MM.panels.menuShow((direction == 'left') ? false : true);
                }
              });
        } else {

            $('#mainmenu').on('click', function(e) {
                MM.panels.goBack();
                e.stopPropagation();
            });
            $('#panel-center, #panel-right').swipe({
                swipeRight: function(event, direction, distance, duration, fingerCount) {
                  MM.log('Swipe: right');
                  MM.panels.goBack();
                }
              });
            $('#panel-left, #panel-center').swipe({
                swipeLeft: function(event, direction, distance, duration, fingerCount) {
                  MM.log('Swipe: left');
                  MM.panels.goFront();
                }
              });
        }

        // These lines makes the iPad scroll working (not momentum).
        touchScroll('panel-left');
        touchScroll('panel-center');
        touchScroll('panel-right');

        // Global events
        $('header.header-main').click(MM.showLog);

        // Display the add site screen if no sites added.
        var current_site = MM.getConfig('current_site');

        if (typeof current_site != 'undefined') {

            if (MM.db.get('sites', current_site.id)) {
                // We should wait for Phonegap/Cordova prior to start calling WS, etc..
                MM.loadSite(current_site.id);
                return;
            }
        }

        // Display the initial screen in first access.
        $('#add-site').css('display', 'block');

    },

    /**
     * Loads the HTML and CSS specific for a site.
     *
     * @param {string} siteId The site id.
     */
    loadSite: function(siteId) {
        MM.log('MM: Loading site');
        var site = MM.db.get('sites', siteId);

        MM.setConfig('current_token', site.get('token'));

        // Language stuff.
        MM.lang.setup();

        // Init sync processes.
        if (MM.inComputer) {
            MM.sync.init();
        } else {
            // We should wait to phonegap, if not, we get errors like:
            // http://rickluna.com/wp/2012/04/solving-the-connection-to-the-server-was-unsuccessful-error-in-androidphonegap/
            $(document).bind('deviceready', function() {
                MM.log('MM: Deviceready fired');
                MM.sync.init();
            });
        }

        // Load cached remote CSS
        var remoteCSS = MM.cache.getElement('css', true);
        if (remoteCSS) {
            $('#mobilecssurl').html(remoteCSS);
        } else {
            $('#mobilecssurl').html('');
        }

        // For loading a site, we need the list of courses.
        MM.moodleWSCall('moodle_enrol_get_users_courses', {userid: site.get('userid')}, function(courses) {

            var plugins = [];
            var coursePlugins = [];

            for (var el in MM.config.plugins) {
                var index = MM.config.plugins[el];
                var plugin = MM.plugins[index];
                if (typeof plugin == 'undefined') {
                    continue;
                }
                if (plugin.settings.type == 'general') {
                    plugins.push(plugin.settings);
                } else if (plugin.settings.type == 'course') {
                    coursePlugins.push(plugin.settings);
                }
            }

            // Prepare info for loading main menu.
            values = {
                user: {fullname: site.get('fullname'), profileimageurl: site.get('userpictureurl')},
                siteurl: site.get('siteurl'),
                coursePlugins: coursePlugins,
                courses: courses,
                plugins: plugins
            };

            // Load the main menu template.
            var output = MM.tpl.render($('#menu_template').html(), values);
            $('#panel-left').html(output);

            $('.submenu:not(:first)').hide();
            $('.submenu').hide();
            $('.toogler').click(function() {
                $(this).next().slideToggle(300);
                return false;
            });

            // Store the courses
            for (var el in courses) {
                // We clone the course object because we are going to modify it in a copy.
                var storedCourse = JSON.parse(JSON.stringify(courses[el]));
                storedCourse.courseid = storedCourse.id;
                // For avoid collising between sites.
                storedCourse.id = MM.config.current_site.id + '-' + storedCourse.courseid;
                var r = MM.db.insert('courses', storedCourse);
            }

            // Hide the Add Site panel.
            $('#add-site').css('display', 'none');
            // Display the main panels.
            $('#main-wrapper').css('display', 'block');

            if (MM.deviceType == 'tablet') {
                MM.plugins.notifications.showNotifications();
                MM.panels.menuShow(true, {animate: false});
                MM.panels.hide('right', '');
            }
        });
    },

    /**
     * Prepara a site to be stored in the database.
     *
     * @param {!Object} Javascript event.
     */
    addSite: function(e) {

        e.preventDefault();

        var siteurl = $.trim($('#url').val());
        var username = $.trim($('#username').val());
        var password = $.trim($('#password').val());

        // Delete the last / if present
        if (siteurl.charAt(siteurl.length - 1) == '/') {
            siteurl = siteurl.substring(0, siteurl.length - 1);
        }

        var stop = false;
        var msg = '';

        if (siteurl.indexOf('http://localhost') == -1 && ! /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(siteurl)) {
            msg += MM.lang.s('siteurlrequired') + '<br/>';
            stop = true;
        }

        if (!username) {
            msg += MM.lang.s('usernamerequired') + 'br/>';
            stop = true;
        }
        if (!password) {
            msg += MM.lang.s('passwordrequired');
            stop = true;
        }

        if (stop) {
            MM.popErrorMessage(msg);
            return;
        }
        MM.saveSite(username, password, siteurl);
    },

    /**
     * Saves a site in the database
     *
     * @param {string} username User name.
     * @param {string} password Password.
     * @param {string} siteurl The site url.
     * @return {boolean} Allways returns false
     */
    saveSite: function(username, password, siteurl) {

        var loginURL = siteurl + '/login/token.php';

        // Now, we try to get a valid token.
        $.getJSON(loginURL,
            {
                username: username,
                password: password,
                service: MM.config.wsservice
            }
            ,function(json) {
                if (typeof(json.token) != 'undefined') {
                    var mytoken = json.token;

                    MM.setConfig('current_token', mytoken);

                    var preSets = {
                        wstoken: mytoken,
                        siteurl: siteurl,
                        cache: 0
                    };

                    // We have a valid token, try to get the site info.
                    MM.moodleWSCall('moodle_webservice_get_siteinfo', {}, function(d) {
                        
                        // Now we check for the minimum required version.
                        // We check for WebServices present, not for Moodle version.
                        // This may allow some hacks like using local plugins for adding missin functions in previous versions.
                        var validMoodleVersion = false;
                        $.each(d.functions, function(index, el) {
                            // core_get_component_strings Since Moodle 2.4
                            if (el.name.indexOf("component_strings") > -1) {
                                validMoodleVersion = true;
                                return false;
                            }
                        });
                        
                        if (!validMoodleVersion) {
                            MM.popErrorMessage(MM.lang.s('invalidmoodleversion') + "2.4");
                            return false;
                        }
                        
                        d.id = hex_md5(d.siteurl + username);
                        d.token = mytoken;
                        var site = MM.db.insert('sites', d);
                        MM.setConfig('current_site', d);

                        MM.plugins.notifications.registerForPushNotification();

                        MM.loadSite(site.id);

                    }, preSets);
                }
                else {
                    var error = MM.lang.s('invalidaccount');
                    if (typeof(json.error) != 'undefined') {
                        error = json.error;
                    }
                    MM.popErrorMessage(error);
                }
            });
        return false;
    },

    /**
     * Register a plugin in the main Namespaces "MM"
     * This makes possible to access all the plugin functions and variables from the main namespace.
     * This function is called when a module is being loaded.
     *
     * @param {!Object} And object representing a plugin.
     */
    registerPlugin: function(plugin) {
        var pluginName = plugin.settings.name;

        if (! plugin.icon) {
            plugin.settings.icon = 'plugins/' + pluginName + '/icon.png';
        }

        // Load the plugin in the main Namespace.
        this.plugins[pluginName] = plugin;

        for (var el in plugin.routes) {
            var route = plugin.routes[el];
            // Route[0] URL to match, Route[1] id, Route[2] function to call on match.
            this.Router.route(route[0], route[1], this.plugins[pluginName][route[2]]);
        }
        this.loadModels(plugin.storage);

        // Load default strings.
        if (plugin.settings.lang.component != 'core') {
            MM.lang.loadPluginLang(pluginName, JSON.parse(plugin.settings.lang.strings));
        }

        // Sync hooks (like cron jobs)
        if (typeof(plugin.sync) != 'undefined') {
            MM.sync.registerHook(pluginName, plugin.sync);
        }
    },

    /**
     * Loads backbone Models
     *
     * @param {Array.<Object>} elements The models to be loades.
     */
    loadModels: function(elements) {

        for (var el in elements) {
            var obj = elements[el];

            // This allow plugins to load Backbone properties to models and collections.
            if (typeof obj.bbproperties == 'undefined') {
                obj.bbproperties = {};
            }

            if (obj.type == 'model') {
                this.models[el] = Backbone.Model.extend(obj.bbproperties);
            }
            else if (obj.type == 'collection') {
                obj.bbproperties.model = this.models[obj.model];
                obj.bbproperties.localStorage = new Store(el);
                var col = Backbone.Collection.extend(obj.bbproperties);
                // Now the instance.
                this.collections[el] = new col();
            }
        }
    },

    /**
     * Loads backbone routes.
     */
    loadRoutes: function() {
        var routes = [
            ['settings', 'settings', MM.settings.display],
            ['settings/:section/', 'settings_section', MM.settings.showSection],
            ['settings/sites/:siteid', 'settings_sites_show_site', MM.settings.showSite],
            ['settings/sites/add', 'settings_sites_add_site', MM.settings.addSite],
            ['settings/sites/delete/:siteid', 'settings_sites_delete_site', MM.settings.deleteSite],
            ['settings/general/purgecaches', 'settings_general_purgecaches', MM.cache.purge],
            ['settings/sync/lang', 'settings_sync_lang', MM.lang.sync],
            ['settings/sync/css', 'settings_sync_css', MM.sync.css]
        ];

        for (var el in routes) {
            var route = routes[el];
            this.Router.route(route[0], route[1], route[2]);
        }
    },

    /**
     * A wrapper function for a moodle WebService call.
     *
     * @param {string} method The WebService method to be called.
     * @param {Object} data Arguments to pass to the method.
     * @param {Object} callBack Function to be called in success.
     * @param {Object} preSets Extra settings
     *      cache For avoid using caching
     *      sync For indicate that is a call in a sync process
     *      silently For not raising errors.
     */
    moodleWSCall: function(method, data, callBack, preSets) {

        // Force data elements to be string.
        for (var el in data) {
            data[el] = data[el] + '';
        }

        if (typeof(preSets) == 'undefined') {
            preSets = {};
        }
        if (typeof(preSets.cache) == 'undefined') {
            preSets.cache = 1;
        }
        if (typeof(preSets.sync) == 'undefined') {
            preSets.sync = 0;
        }
        if (typeof(preSets.silently) == 'undefined') {
            preSets.silently = false;
        }

        if (typeof(preSets.wstoken) == 'undefined') {
            var mytoken = MM.config.current_token;
            if (!mytoken) {
                MM.popErrorMessage('Unexpected error. Please close and open again the application (mytoken)');
                return false;
            }
        }
        else {
            var mytoken = preSets.wstoken;
        }

        if (typeof(preSets.siteurl) == 'undefined') {
            var siteurl = MM.config.current_site.siteurl;
            if (!siteurl) {
                MM.popErrorMessage('Unexpected error. Please close and open again the application (siteurl)');
                return false;
            }
        }
        else {
            var siteurl = preSets.siteurl;
        }

        data.wsfunction = method;

        var ajaxURL = siteurl + '/webservice/rest/server.php?wstoken=' + mytoken + '&moodlewsrestformat=json';
        var ajaxData = data;

        // Check if the device is Online, if not add operation to quee.
        if (preSets.sync) {
            if (!MM.deviceConnected()) {
               var el = {
                id: hex_md5(ajaxURL + JSON.stringify(ajaxData)),
                url: ajaxURL,
                data: ajaxData,
                syncData: preSets.syncData,
                siteid: MM.config.current_site.id,
                type: 'ws'
               };
               MM.db.insert('sync', el);
               MM.popMessage(MM.lang.s('addedtoqueue'), {modal: true, title: preSets.syncData.name});
               return true;
            }
        }

        // Try to get the data from cache.
        if (preSets.cache) {
            var omitExpires = false;
            if (!MM.deviceConnected()) {
                // In case the device is not connected, we prefer expired cache than nothing.
                omitExpires = true;
            }

            var data = MM.cache.getWSCall(ajaxURL, ajaxData, omitExpires);

            if (data !== false) {
                callBack(data);
                return true;
            } else if (!MM.deviceConnected()) {
                MM.popErrorMessage(MM.lang.s('networkerrormsg'));
                return true;
            }
        }

        // If we arrive here, and we are not connected, thrown a network error message.
        if (!MM.deviceConnected()) {
            MM.popErrorMessage(MM.lang.s('networkerrormsg'));
            return true;
        }

        // Main jQuery Ajax call, returns in json format.
        $.ajax({
          type: 'POST',
          url: ajaxURL,
          data: ajaxData,
          dataType: 'json',
          success: function(data) {

            if (typeof(data.debuginfo) != 'undefined') {
                MM.popErrorMessage('Unexpected error. Please close and open again the application');
                return;
            }
            if (typeof(data.exception) != 'undefined') {
                MM.popErrorMessage('Error. ' + data.message);
                return;
            }

            MM.log('WS: Data received from WS '+ typeof(data));

            if (typeof(data) == 'object' && typeof(data.length) != 'undefined') {
                MM.log('WS: Data number of elements '+ data.length);
            }

            if (preSets.cache) {
                MM.cache.addWSCall(ajaxURL, ajaxData, data);
            }

            // We pass back a clone of the original object, this may prevent erros if in the callback the object is modified.
            callBack(JSON.parse(JSON.stringify(data)));
          },
          error: function(xhr, ajaxOptions, thrownError) {
            var error = MM.lang.s('cannotconnect');
            if (xhr.status == 404) {
                error = MM.lang.s('invalidscheme');
            }
            if (!preSets.silently) {
                MM.popErrorMessage(error);
            } else {
                MM.log('WS: error' + method + 'error: '+ error);
            }
          }
        });
    },

    /**
     * Uploads a file to Moodle using Cordova File API
     *
     * @param {Object} data Arguments to pass to the method.
     * @param {Object} fileOptions File settings.
     * @param {Object} successCallBack Function to be called on success.
     * @param {Object} errorCallBack Function to be called on error.
     * @param {Object} preSets Extra settings.
     */
    moodleUploadFile: function(data, fileOptions, successCallBack, errorCallBack, presets) {
        MM.log('Trying to upload file ('+ data.length + ' chars)');

        if (!MM.deviceConnected()) {
           var el = {
            id: hex_md5(MM.current_site.siteurl + JSON.stringify(fileOptions)),
            data: data,
            options: fileOptions,
            syncData: {
                    name: MM.lang.s('upload'),
                    description: fileOptions.fileName
                },
            siteid: MM.config.current_site.id,
            type: 'upload'
           };
           MM.db.insert('sync', el);
           MM.popMessage(MM.lang.s('addedtoqueue'), {modal: true, title: el.syncData.name});
           return true;
        }

        MM.log('Initilizating uploader');

        var options = new FileUploadOptions();
        options.fileKey = fileOptions.fileKey;
        options.fileName = fileOptions.fileName;
        options.mimeType = fileOptions.mimeType;

        var params = new Object();
        params.token = MM.config.current_token;

        options.params = params;

        MM.log('Uploading');

        MM.widgets.dialog('<img src="img/loading.gif">&nbsp;' + MM.lang.s('uploadingtoprivatefiles'), {modal: true});

        var ft = new FileTransfer();
        ft.upload(data, MM.config.current_site.siteurl + '/webservice/upload.php',
                  function() {
                                MM.widgets.dialogClose();
                                successCallBack();
                            },
                  function() {
                                MM.widgets.dialogClose();
                                errorCallBack();
                            },
                  options);
    },

    /**
     * Downloads a file from Moodle using Cordova File API
     *
     * @param {string} url Download url.
     * @param {string} path Local path to store the file.
     * @param {Object} successCallBack Function to be called on success.
     * @param {Object} errorCallBack Function to be called on error.
     */
    moodleDownloadFile: function(url, path, successCallBack, errorCallBack) {
        url = encodeURI(url);

        // Set the Root in the persistent file system.
        path = MM.fs.getRoot() + '/' + path;

        var ft = new FileTransfer();
        ft.download(url, path,
                  function() {
                                successCallBack();
                            },
                  function() {
                                errorCallBack();
                            }
        );
    },

    /**
     * Launches the WS sync process for operations done offline
     * There is a queue of tasks performed when the device was offline.
     */
    wsSync: function() {
        MM.log('Sync: Executing WS sync process');
        if (! MM.getConfig('sync_ws_on')) {
            MM.log('Sync: WS sync process is disabled');
        }
        if (MM.deviceConnected() && MM.getConfig('sync_ws_on')) {
            MM.db.each('sync', function(sync) {
                sync = sync.toJSON();
                // Generic call to a WS.
                if (sync.type == 'ws') {
                    MM.log('Sync: Executing WS sync operation:' + JSON.stringify(sync.syncData) + 'url:' + sync.url);
                    MM.moodleWSCall(sync.data.wsfunction, sync.data, function(d) {
                        MM.log('Sync: Executing WS sync operation FINISHED:' + sync.data.wsfunction);
                        MM.db.remove('sync', sync.id);
                    }, {cache: 0, silently: true});
                // File upload.
                } else if (sync.type == 'upload') {
                    MM.log('Sync: Starting upload');
                    var options = new FileUploadOptions();
                    options.fileKey = sync.options.fileKey;
                    options.fileName = sync.options.fileName;
                    options.mimeType = sync.options.mimeType;

                    var params = {};
                    params.token = MM.config.current_token;

                    options.params = params;

                    var ft = new FileTransfer();
                    ft.upload(sync.data, MM.config.current_site.siteurl + '/webservice/upload.php',
                              function() {
                                            MM.log('Sync: Execugin Upload sync operation FINISHED:' + sync.options.filename);
                                            MM.db.remove('sync', sync.id);
                                        },
                              function() {
                                            MM.log('Error uploading');
                                        },
                              options);
                // Download of contents.
                } else if (sync.type == 'content') {

                    // Only sync files of current site, mainly for performance.
                    if (sync.siteid == MM.config.current_site.id) {

                        // Append the token for safe download of files.
                        sync.url = sync.url + '&token=' + MM.config.current_token;

                        MM.log('Sync: Starting download of ' + sync.url + ' to ' + sync.newfile);
                        MM.fs.createDir(sync.path, function() {
                            MM.moodleDownloadFile(sync.url, sync.newfile,
                                                  function() {
                                                    MM.log('Sync: Download of content finished ' + sync.newfile + ' URL: ' + sync.url);

                                                    var content = MM.db.get('contents', sync.contentid).toJSON();
                                                    content.contents[sync.index].localpath = sync.newfile;
                                                    MM.log('Sync: Storing local path in content');
                                                    MM.db.insert('contents', content);

                                                    MM.db.remove('sync', sync.id);
                                                   },
                                                   function() {
                                                    MM.log('Sync: Error downloading ' + sync.newfile + ' URL: ' + sync.url);
                                                    });
                        });
                    }
                }
            });
        }
    },

    /**
     * Loads the settings panel
     */
    displaySettings: function() {

        // Settings plugins.
        var plugins = [];
        for (var el in MM.plugins) {
            var plugin = MM.plugins[el];
            if (plugin.settings.type == 'setting') {
                plugins.push(plugin.settings);
            }
        }

        var html = MM.tpl.render($('#settings_template').html(), {plugins: plugins});
        MM.panels.show('center', html);
    },

    /**
     * Generic function for getting config settings.
     */
    getConfig: function(name, optional) {
        if (typeof MM.config[name] != 'undefined') {
            return MM.config[name];
        }

        if (typeof optional != 'undefined') {
            return optional;
        }

        return;
    },

    /**
     * Generic function for setting config settings.
     */
    setConfig: function(name, value) {
        var setting = {
            id: name,
            name: name,
            value: value
        };
        MM.db.insert('settings', setting);
    },

    /**
     * @namespace Holds all the functionallity related to panels.
    */
    panels: {
        menuStatus: false,
        hideRight: false,

        /**
         * Inserts html in a penl
         * @param {string} position The panel where insert the html.
         * @param {string} html The html to be inserted.
         */
        html: function(position, html) {
            $('#panel-' + position).html(html);
        },

        /**
         * Show de loading icon in a panel
         * @param {string} position The panel where to show the loading icon.
         */
        showLoading: function(position) {
            MM.panels.html(position, '<div class="loading-icon"><img src="img/loading.gif"></div>');
        },

        /**
         * Hides a panel
         *
         * @param {string} position The panel to be hide.
         * @param {boolean} clear On tablet, when to clear the right panel.
         */
        hide: function(position, clear) {

            if (typeof(clear) == 'undefined') {
                clear = true;
            }

            if (MM.deviceType == 'tablet') {
                if (position == 'right') {
                    $('#panel-right').css('left', '100%');
                    var centerWidth = $('#panel-center').width();
                    $('#panel-center').width(centerWidth + $('#panel-right').width());
                }

                if (clear) {
                    $('#panel-right').html('');
                }
            }
        },

        /**
         * Shows a panel with some content
         *
         * @param {string} position The panel to be showed.
         * @param {string} content The content to be added to the panel.
         * @param {Object} settings Extra settings.
         */
        show: function(position, content, settings) {
            $('#panel-' + position).html(content);

            if (MM.deviceType == 'tablet') {

                MM.panels.hideRight = false;
                if (settings && settings.hideRight) {
                    MM.panels.hideRight = true;
                }

                MM.panels.menuShow(false, settings);
            } else {
                if (position == 'center') {
                    $('#panel-left').animate({
                        left: '-100%'
                      }, 300);
                    $('#panel-center').animate({
                        left: 0
                      }, 300);
                    $('.header-wrapper').animate({
                        left: 0
                      }, 300);
                } else if (position == 'right') {
                    $('#panel-center').animate({
                        left: '-100%'
                      }, 300);
                    $('#panel-right').animate({
                        left: 0
                      }, 300);
                }
            }
        },

        /**
         * Go back button and event
         * Implements the animation for going back.
         */
        goBack: function() {
            var hideHeader = false;
            
            // Clear modal panels.
            if (typeof(MM.plugins.contents.infoBox) != "undefined") {
                MM.plugins.contents.infoBox.remove();
            }

            if (parseInt($('#panel-center').css('left')) == 0) {
                hideHeader = true;
                hidePanel = '#panel-center';
                showPanel = '#panel-left';
            }
            else if (parseInt($('#panel-right').css('left')) == 0) {
                hidePanel = '#panel-right';
                showPanel = '#panel-center';
            }
            else {
                return;
            }

            $(hidePanel).animate({
                left: '100%'
              }, 300);
            $(showPanel).animate({
                left: 0
              }, 300);

            if (hideHeader) {
                $('.header-wrapper').animate({
                    left: '100%'
                  }, 300);
            }
        },

        /**
         * Go front button and event
         * Implements the animation for going front.
         */
        goFront: function() {
            
            // Clear modal panels.
            if (typeof(MM.plugins.contents.infoBox) != "undefined") {
                MM.plugins.contents.infoBox.remove();
            }

            if (parseInt($('#panel-left').css('left')) == 0) {
                hidePanel = '#panel-left';
                showPanel = '#panel-center';
            }
            else if (parseInt($('#panel-center').css('left')) == 0) {
                hidePanel = '#panel-center';
                showPanel = '#panel-right';
            }
            else {
                return;
            }

            $(hidePanel).animate({
                left: '-100%'
              }, 300);
            $(showPanel).animate({
                left: 0
              }, 300);

            $('.header-wrapper').animate({
                left: '0%'
              }, 300);

        },

        /**
         * Displays/hide the main left menu
         *
         * @param {boolean} show Show or hide.
         * @param {Object} settings Extra settngs.
         */
        menuShow: function(show, settings) {

            // Clear modal panels.
            if (typeof(MM.plugins.contents.infoBox) != "undefined") {
                MM.plugins.contents.infoBox.remove();
            }

            if (!settings) {
                settings = {
                    animate: true,
                    hideRight: false
                };
            }

            if (typeof(settings.animate) == 'undefined') {
                settings.animate = true;
            }

            if (MM.panels.hideRight) {
                settings.hideRight = true;
            }

            if (typeof show != 'undefined') {
                if (show && MM.panels.menuStatus) {
                    return;
                }
                if (!show && !MM.panels.menuStatus) {
                    return;
                }
            }

            if (!MM.panels.menuStatus) {

                var sizes = {
                    center: {
                        left: '30%',
                        width: '35%'
                    },
                    right: {
                        left: '65%',
                        width: '35%'
                    },
                    wrapper: {
                        left: '30%',
                        width: '70%'
                    }
                };

                if (settings.hideRight) {
                    sizes.right.left = '100%';
                    sizes.center.width = '70%';
                }

                if (!settings.animate) {
                    $('#panel-center').css('left', sizes.center.left).css('width', sizes.center.width).css('overflow', 'auto');
                    $('#panel-right').css('left', sizes.right.left).css('width', sizes.right.width).css('overflow', 'auto');
                    $('.header-wrapper').css('left', sizes.wrapper.left).css('width', sizes.wrapper.width);
                    MM.panels.menuStatus = true;
                    return;
                }

                $('#panel-center').animate({
                    left: sizes.center.left, width: sizes.center.width, avoidTransforms: true
                  }, 300, function() {
                        MM.panels.menuStatus = true;
                        $('#panel-center').css('overflow', 'auto');
                    }).css('overflow', 'auto');

                $('#panel-right').animate({
                    left: sizes.right.left, width: sizes.right.width, avoidTransforms: true
                  }, 300, function() {
                        $('#panel-right').css('overflow', 'auto');
                    }).css('overflow', 'auto');

                $('.header-wrapper').animate({
                    left: sizes.wrapper.left, width: sizes.wrapper.width, avoidTransforms: true
                  }, 300);

            } else {

                var sizes = {
                    center: {
                        left: '0px',
                        width: '35%'
                    },
                    right: {
                        left: '35%',
                        width: '65%'
                    },
                    wrapper: {
                        left: '0px',
                        width: '100%'
                    }
                };

                if (settings.hideRight) {
                    sizes.right.left = '100%';
                    sizes.center.width = '100%';
                }

                if (!settings.animate) {
                    $('#panel-center').css('left', sizes.center.left).css('width', sizes.center.width).css('overflow', 'auto');
                    $('#panel-right').css('left', sizes.right.left).css('width', sizes.right.width).css('overflow', 'auto');
                    $('.header-wrapper').css('left', sizes.wrapper.left).css('width', sizes.wrapper.width);
                    MM.panels.menuStatus = false;
                    return;
                }

                $('#panel-center').animate({
                    left: sizes.center.left, width: sizes.center.width, avoidTransforms: true
                  }, 300, function() {
                        MM.panels.menuStatus = false;
                        $('#panel-center').css('overflow', 'auto');
                    }).css('overflow', 'auto');

                $('#panel-right').animate({
                    left: sizes.right.left, width: sizes.right.width, avoidTransforms: true
                  }, 300, function() {
                        $('#panel-right').css('overflow', 'auto');
                    }).css('overflow', 'auto');

                $('.header-wrapper').animate({
                    left: sizes.wrapper.left, width: sizes.wrapper.width, avoidTransforms: true
                  }, 300);
            }
        }
    },

    /**
     * Generic function for adding the wstoken to Moodle urls and for pointing to the correct script.
     * For download remote files from Moodle we need to use the special /webservice/pluginfile passing the ws token as a get parameter.
     *
     * @param {string} url The url to be fixed.
     */
    fixPluginfile: function(url) {
        var token = MM.config.current_token;
        url += '?token=' + token;
        url = url.replace('/pluginfile', '/webservice/pluginfile');
        return url;
    },

    /**
     * Generic logging function
     *
     * @param {string} text The text to be logged.
     */
    log: function(text) {
        if (!MM.getConfig('dev_debug')) {
            return;
        }

        if (window.console) {
            console.log(text);
        }
        var length = MM.logData.unshift(text);

        if (length > MM.config.log_length) {
            MM.logData.pop();
        }
    },

    /**
     * Function for displaying the log in the mobile app
     */
    showLog: function() {

        if (!MM.getConfig('dev_debug')) {
            return;
        }

        var logInfo = '';
        for (var el in MM.logData) {
            logInfo += MM.logData[el];
        }

        if (!logInfo) {
            return;
        }

        var options = {
            modal: false,
            buttons: {},
            title: MM.lang.s('info')
        };
        options.buttons[MM.lang.s('cancel')] = function() { $(this).dialog('close'); };
        MM.widgets.dialog(logInfo, options);
    },

    /**
     * Generic function for displaying error messages in the app
     *
     * @this {MM}
     * @param {string} text The text to be displayed inside the popup.
     */
    popErrorMessage: function(text) {
        var options = {
                modal: true,
                resizable: false,
                hide: 'explode',
                title: MM.lang.s('error'),
                autoclose: 4000
            };
        this.popMessage(text, options);
    },

    /**
     * Generic function for displaying messages in the app
     *
     * @param {string} text The text to be displayed inside the popup.
     * @param {Object} options Extra options regarding the popup layout.
     */
    popMessage: function(text, options) {
        if (typeof options == 'undefined') {
            options = {
                modal: true,
                resizable: false,
                hide: 'explode',
                autoclose: 4000
            };
        }

        MM.widgets.dialog(text, options);
    },

    /**
     * Generic pop up confirm window
     *
     * @param {string} text The text to be displayed.
     * @param {object} callBack The function to be called when user confirms.
     */
    popConfirm: function(text, callBack) {
        var options = {
            modal: true,
            resizable: false,
            hide: 'explode',
            buttons: {}
        };
        options.buttons[MM.lang.s('yes')] = callBack;
        options.buttons[MM.lang.s('no')] = function() { $(this).dialog('close')};

        MM.popMessage(text, options);
    }
};
