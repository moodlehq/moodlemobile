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
    clickType: 'click',
    quickClick: 'click',
    deviceReady: false,
    deviceOS: '',
    logData: [],
    inComputer: false,
    inNodeWK: false,
    inMMSimulator: false,
    touchMoving: false,
    scrollType: '',
    debugging: true,
    mq: 'only screen and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1)',
    currentService: "",
    webWorker: null,
    blobWorker: null,

    /**
     * Initial setup of the app: device type detection, routes, models, settings.
     * This function is executed once the config.json file is loaded and previously to loading the app plugins.
     *
     * @this {MM}
     * @param {Object.<>} Settings loaded from /config.json.
     */
    init: function(config) {
        MM.log('Initializating app');
        this.config = config;
        this.setEventTypes();
        this.setDeviceType();
        this.setDeviceOS();
        this.setInComputerState();
        this.setInNodeWKState();
        this.setInMMSimulatorState();
        this.loadCordova();
        this.loadBackboneRouter();
        this.checkAjax();
        this.loadCoreModels();
        this.loadRoutes();
        this.loadSettings();
    },

    /**
     * Set which events we should bind interaction handlers to.
     */
    setEventTypes: function() {
        if (MM.util.isTouchDevice()) {
            MM.clickType = 'touchend';
            MM.quickClick = 'touchstart';
        } else {
            MM.clickType = 'click';
            MM.quickClick = 'click';
        }
    },

    /**
     * Detect the current device type (tablet or phone).
     */
    setDeviceType: function() {
        if (matchMedia(MM.mq).matches) {
            this.deviceType = 'tablet';
            $('body').addClass('tablet');
        } else {
            this.deviceType = 'phone';
            $('body').addClass('phone');
        }
    },

    /**
     * Required to test against different user agents
     * @return string The userAgent in lowercase.
     */
    _getUserAgent: function() {
        return navigator.userAgent.toLowerCase();
    },

    /**
     * Set the current device OS, based on the userAgent string.
     */
    setDeviceOS: function() {
        this.deviceOS = 'null';
        var userAgent = MM._getUserAgent();
        if (userAgent.indexOf('ipad') !== -1) {
            this.deviceOS = 'ios';
        } else if (userAgent.indexOf('iphone') !== -1) {
            this.deviceOS = 'ios';
        } else if (userAgent.indexOf('android') !== -1) {
            this.deviceOS = 'android';
        }
    },

    /**
     * Set the inComputer flag if the app is running in a computer (as opposed to
     * a mobile device).
     */
    setInComputerState: function() {
        MM.inComputer = navigator.userAgent.indexOf('Chrome') >= 0 ||
                        navigator.userAgent.indexOf('Safari') >= 0 ||
                        navigator.userAgent.indexOf('MSIE') >= 0 ||
                        navigator.userAgent.indexOf('Firefox') >= 0;
        MM.inComputer = MM.inComputer && navigator.userAgent.indexOf('Mobile') == -1;
        // Check deviceOs
        MM.inComputer = MM.deviceOS != "ios" && MM.deviceOS != "android";
        // Check if Phonegap Javascript is loaded.
        MM.inComputer = MM.inComputer && typeof(window.device) == "undefined";
        MM.inComputer = MM.inComputer && !MM.deviceReady;

        MM.webApp = location.href.indexOf('http') == 0;
    },

    /**
     * Set the inNodeWK flag if the app is running using Node Webkit
     * on a computer.
     */
    setInNodeWKState: function() {
        MM.inNodeWK = typeof(process) !== "undefined";
    },

    /**
     * Set the inMMSimulator flag if the app is running using Moodle Mobile simulator
     * on a computer.
     */
    setInMMSimulatorState: function() {
        if(parent && parent.MOODLE_MOBILE_SIMULATOR && parent.MOODLE_MOBILE_SIMULATOR === 1) {
            MM.inMMSimulator = true;
        } else {
            MM.inMMSimulator = false;
        }
    },


    /**
     * Load the cordova emulator if necessary (if the app isn't running on a
     * mobile device).
     */
    loadCordova: function() {
        // If we are testing in a computer, we load the Cordova emulating javascript, waiting a few seconds.
        // If meanwhile Phonegap is loaded, the loadEmulator will do nothing.
        if (MM.inComputer || MM.webApp) {
            // If we are running node-webkit, load the emulator immediately.
            var seconds = (MM.inNodeWK)? 100 : 4000;
            setTimeout(function() {
                MM.log('MM: Loading Cordova Emulator, we are in a ' + navigator.userAgent);
                MM.cordova.loadEmulator();
            }, seconds);
        }
    },

    /**
     * Load the Backbone URL router.
     */
    loadBackboneRouter: function() {
        var appRouter = Backbone.Router.extend();
        MM.Router = new appRouter;
    },

    /**
     * Set default values for future ajax requests.
     * Even jQuery say this isn't recommended.
     * TODO: Remove.
     */
    checkAjax: function() {
        $.ajaxSetup({'error': MM._defaultErrorFunction});
    },

    /**
     * The default error function as set in MM.checkAjax
     * Moved outside of checkAjax for ease of testing.
     */
    _defaultErrorFunction: function(xhr, textStatus, errorThrown) {
        var error = MM.lang.s('cannotconnect');
        if (xhr.status == 404) {
            error = MM.lang.s('invalidscheme');
        }
        MM.popErrorMessage(error);
        MM.log("XHR Error: " + textStatus);
        MM.log("XHR Error: " + errorThrown);
    },

    /**
     * Load the core models.
     * @param {integer} myParam Description
     * @return {boolean} Description
     */
    loadCoreModels: function() {
        // Load Models.
        // Elements for the core storage model.
        var storage = {
            setting: {
                type: 'model',
                bbproperties: {
                    initialize: function() {
                        MM.config[this.get('name')] = this.get('value');
                   }
                }
            },
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
            sync: {type: 'collection', model: 'syncEl'},
            service: {type: 'model'},
            services: {type: 'collection', model: 'service'}
        };
        this.loadModels(storage);
    },

    /**
     * Loads the settings from the database, putting each name value pair
     * in the config.
     * @return {void}
     */
    loadSettings: function() {
        // Load settings from database.
        MM.db.each('settings', function(e) {
            MM.config[e.get('name')] = e.get('value');
        });
        // Init global flag for debugging.
        MM.debugging = MM.config.dev_debug;
    },

    /**
     * Used to test the deviceConnected function as Jasmine can't mock
     * the navigator object.
     *
     * @return {Object} The network object if one exists.
     */
    _getNetwork: function() {
        return navigator.network;
    },

    /**
     * Checks if the device is connected to Internet
     * We use Cordova API for that, if the config setting "dev_offline" is set we return allways not connected.
     *
     * @return {boolean} True if the device is connected.
     */
    deviceConnected: function() {
        var connected = true;

        var network = MM._getNetwork();
        if (typeof(network) != 'undefined') {
            var networkState = network.connection.type;
            connected = (networkState != Connection.NONE && networkState != Connection.UNKNOWN);
            MM.log('Internet connection checked ' + connected);
        }

        var offline = MM.getConfig('dev_offline');
        if (typeof(offline) != 'undefined' && offline) {
            // Ugly hack for only emulate offline if we are logged in the app.
            var displayed = $('#main-wrapper').css('display');
            if (displayed == 'block') {
                MM.log('Returning not connected (forced by settings)');
                connected = false;
            }
        }
        return connected;
    },

    _renderManageAccounts: function(sites) {
        if (!sites) {
            sites = [];
            MM.db.each('sites', function(el) {
                sites.push(el.toJSON());
            });
        }
        var tpl = MM.tpl.render($('#manage-accounts_template').html(), {sites: sites});
        $('#manage-accounts').html(tpl);
    },

    /**
     * Loads the non site specific CSS layout of the app and handles orientation/state changes.
     */
    loadLayout: function() {
        MM.log('Loading layout');

        var tpl = MM.tpl.render($('#add-site_template').html());
        $('#add-site').html(tpl);

        var sites = [];
        MM.db.each('sites', function(el) {
            sites.push(el.toJSON());
        });

        MM._renderManageAccounts(sites);

        // Dom is ready!.
        Backbone.history.start();

        // Add site events.
        $('#add-site form').on('submit', this.checkSite);

        if (typeof MM.config.presets.url != 'undefined') {
            $('#url').val(MM.config.presets.url);
        }
        if (typeof MM.config.presets.username != 'undefined') {
            $('#username').val(MM.config.presets.username);
        }

        $(window).bind('orientationchange', MM.orientationChangeHandler);

        var mq = matchMedia(MM.mq);
        mq.addListener(MM.mediaQueryChangeHandler);
        if (mq.matches) {
            MM.setUpTabletModeLayout();
        } else {
            MM.setUpPhoneModeLayout();
        }

        // Make the background color fill all the screen for the add site page.
        $('#add-site, #manage-accounts').css('height', $(document).innerHeight());

        $("#panel-left, #panel-center, #panel-right").addClass("overflow-scroll");

        // First we try to use native scrolling for overflow divs.
        if (MM.util.isTouchDevice() && MM.util.overflowScrollingSupported()){
            MM.setUpOverflowScrolling();
        } else {
            if (MM.deviceType == "phone" && !MM.util.overflowScrollingSupported()) {
                MM.setUpNativeScrolling();
            } else {
                MM.setUpJavascriptScrolling();
            }
        }

        // Display the add site screen if no sites added.
        var current_site = MM.getConfig('current_site');

        if (typeof(current_site) != 'undefined' && current_site && current_site.id) {
            if (MM.db.get('sites', current_site.id)) {
                // We should wait for Phonegap/Cordova prior to start calling WS, etc..
                MM.loadSite(current_site.id);
                // Load additional Js files, see MOBILE-239
                MM.loadExtraJs();
                return;
            }
        }

        // Display the initial screen in first access.
        if (sites.length > 0) {
            MM._displayManageAccounts();
        } else {
            MM._displayAddSite();
        }
        // Load additional Js files, see MOBILE-239
        MM.loadExtraJs();
    },

    _displayAddSite: function() {
        $('#manage-accounts').css('display', 'none');
        $('#add-site').css('display', 'block');
        $('#url').focus();
        // Dealy needed because of the splash screen.
        setTimeout(MM.util.showKeyboard, 1000);
    },

    _displayManageAccounts: function() {
        $('#manage-accounts').css('display', 'block');
        $('#add-site').css('display', 'none');
    },

    _showMainAppPanels: function() {
        // Hide the Add Site panel.
        $('#add-site').css('display', 'none');
        // Hide manage accounts.
        $('#manage-accounts').css('display', 'none');
        // Display the main panels.
        $('#main-wrapper').css('display', 'block');
    },

    /**
     * Handle device orientation change events.
     * @param {object} e The event object.
     */
    orientationChangeHandler: function(e) {
        MM.log("MM: orientationchange fired, old width old height " + $(document).innerHeight());
        $('#main-wrapper, #panel-left').css('height', $(document).innerHeight());

        var dH = $(document).height();
        var wH = $(window).height();
        var diH = $(document).innerHeight();

        var newH = (dH > wH) ? dH : wH;
        newH = (diH > newH) ? diH : newH;

        headerHeight = $('.header-wrapper').height();
        $('#main-wrapper, #panel-left').css('height', newH);
        $('#panel-center, #panel-right').css('height', newH - headerHeight);

        if (MM.deviceType == 'phone') {
            $('#panel-right').css("width", $(document).innerWidth() + 50);
            $("#panel-right .content-index").css("width", $(document).innerWidth());
        } else {
            MM.panels.resizePanels();
        }

        MM.log("MM: orientation change fired, new height " + newH);
    },

    /**
     * Handle media query change events, refresh the viewport.
     * @param {object} mq The media query object.
     */
    mediaQueryChangeHandler: function(mq) {
        MM.log('media queries match');
        if (mq.matches && MM.deviceType == 'phone') {
            // We were in phone resolution view, now we are in tablet resolution view. Reload all the layout.
            location.href = "index.html";
        } else if (!mq.matches && MM.deviceType == 'tablet') {
            // We were in tablet resolution view, now we are in phone view. Reload all the layout
            location.href = "index.html";
        }
    },

    /**
     * Set up tablet mode layout.
     */
    setUpTabletModeLayout: function() {
        MM.panels.calculatePanelsSizes();
        MM.panels.fixPanelsSize();

        $('#mainmenu').bind(MM.quickClick, function(e) {
            MM.panels.menuShow();
            e.preventDefault();
            e.stopPropagation();
        });

        // Swipe detection.
        $('#panel-center, #panel-right').swipe({
            swipeLeft: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe' + direction + ' fingers ' + fingerCount);
                MM.panels.menuShow(false);
            },
            swipeRight: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe' + direction + ' fingers ' + fingerCount);
                MM.panels.menuShow(true);
            },
            click: function(event, direction, distance, duration, fingerCount) {
            },
            threshold: 50,
            excludedElements: "button, input, select, textarea, .noSwipe"
        });
    },

    /**
     * Set up phone mode layout.
     */
    setUpPhoneModeLayout: function() {
        $('#mainmenu').bind(MM.quickClick, function(e) {
            MM.panels.goBack();
            e.preventDefault();
        });

        var excludedElements = "button, input, select, textarea, .noSwipe";
        if (MM.deviceOS == 'android') {
            excludedElements += ", a";
        }

        $('#panel-center, #panel-right').swipe({
            swipeRight: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe right');
                MM.panels.goBack();
            },
            swipeLeft: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe left');
                MM.panels.goFront();
            },
            click: function(event, direction, distance, duration, fingerCount) {
            },
            threshold: 50,
            excludedElements: excludedElements
        });
    },

    /**
     * Set up overflow scrolling.
     */
    setUpOverflowScrolling: function() {
        MM.log('Overflow supported');
        MM.scrollType = "Native overflow scrolling touch";
        MM.util.setPanelsScreenHeight();
        $("#panel-left, #panel-center, #panel-right").addClass("touch-overflow-scroll");
        // We must detect that are touch moving for avoid opening links fired by javascript events...
        $("#panel-left, #panel-center, #panel-right").bind('touchmove', function(event) {
            MM.touchMoving = true;
        });
        $("#panel-left, #panel-center, #panel-right").bind('touchend', function(event) {
            MM.touchMoving = false;
        });
    },

    /**
     * Set up native scrolling.
     */
    setUpNativeScrolling: function() {
        MM.log("Omitting using overflow scroll");
        MM.scrollType = "Native scrolling";
        MM.util.setPanelsMinScreenHeight();
        $("#main-wrapper").css("overflow", "visible");
        $("#panel-left, #panel-center, #panel-right").addClass("no-overflow");
        $(".header-wrapper").addClass("header-fixed");
        MM.util.avoidHorizontalScrolling();
    },

    /**
     * Set up javascript scrolling.
     */
    setUpJavascriptScrolling: function() {
        MM.scrollType = "Javascript scrolling";
        MM.util.setPanelsScreenHeight();
        // These lines makes the iPad scroll working (not momentum).
        MM.util.touchScroll('left');
        MM.util.touchScroll('center');
        MM.util.touchScroll('right');
    },

    /**
     * Loads the HTML and CSS specific for a site.
     *
     * @param {string} siteId The site id.
     */
    loadSite: function(siteId, force) {
        MM.log('Loading site');
        MM.site = MM.db.get('sites', siteId);
        MM.sync.init();
        MM.setUpConfig();
        MM.loadCachedRemoteCSS();
        MM.setUpLanguages();

        var settings = {omitExpires: true};
        if (typeof(force) != "undefined") {
            settings = {};
        }

        // For loading a site, we need the list of courses.
        MM.moodleWSCall(
            method          = 'moodle_enrol_get_users_courses',
            data            = {userid: MM.site.get('userid')},
            callBack        = MM.loadCourses,
            preSets         = settings,
            errorCallBack   = MM._displayAddSite
        );
    },

    /**
     * Set up config.
     */
    setUpConfig: function() {
        MM.setConfig('current_site', MM.site.toJSON());
        MM.setConfig('current_token', MM.site.get('token'));
    },

    /**
     * Set up languages.
     */
    setUpLanguages: function() {
        MM.lang.setup();
        for (var el in MM.config.plugins) {
            var index = MM.config.plugins[el];
            var plugin = MM.plugins[index];
            if (typeof plugin == 'undefined') {
                continue;
            }
            if (plugin.settings.lang.component != "core") {
                MM.lang.setup(plugin.settings.name);
            }
        }
    },

    /**
     * Load cached remote CSS.
     */
    loadCachedRemoteCSS: function() {

        // Load cached remote CSS
        var remoteCSS = MM.cache.getElement('css', true);
        if (remoteCSS) {
            $('#mobilecssurl').html(remoteCSS);
        } else {
            $('#mobilecssurl').html('');
        }

        // Forces sync CSS.
        MM.sync.css();
    },

    /**
     * Load courses.
     */
    loadCourses: function(courses) {
        var plugins = [];
        var coursePlugins = [];

        for (var el in MM.config.plugins) {
            var index = MM.config.plugins[el];
            var plugin = MM.plugins[index];
            if (typeof plugin == 'undefined') {
                continue;
            }
            // Check if the plugin is Visible.
            // If the iPluginVisible function is undefined, we assume the plugin is visible without additional checks.
            if (typeof(plugin.isPluginVisible) == 'function' && !plugin.isPluginVisible()) {
                continue;
            }
            if (plugin.settings.type == 'general') {
                plugins.push(plugin.settings);
            } else if (plugin.settings.type == 'course') {
                coursePlugins.push(plugin.settings);
            }
        }

        // Determine docs URL.
        var docsurl = MM.lang.s("docsurl");
        var release = MM.site.get("release");
        if (release) {
            // Only two digits.
            release = release.substr(0, 3).replace(".", "");

            // Check is a valid number.
            if (parseInt(release) >= 24) {
                // Append release number.
                docsurl = docsurl.replace("http://docs.moodle.org/", "http://docs.moodle.org/" + release + "/");
            }
        }

        // Prepare info for loading main menu.
        values = {
            user: {
                fullname: MM.site.get('fullname'),
                profileimageurl: MM.site.get('userpictureurl')
            },
            siteurl: MM.site.get('siteurl'),
            coursePlugins: coursePlugins,
            courses: courses,
            plugins: plugins,
            docsurl: docsurl
        };

        // Load the main menu template.
        var output = MM.tpl.render($('#menu_template').html(), values);
        MM.panels.html('left', output);

        $('.submenu').hide();
        $('.toogler').bind(MM.clickType, function(e) {
            // This prevents open the toogler when we are scrolling.
            if (MM.touchMoving) {
                MM.touchMoving = false;
            } else {
                e.preventDefault();
                // Hide expanded (accordion effect).
                $(".nav.submenu .toogler.collapse").not($(this)).toggleClass("collapse expand").next().slideToggle(150);

                $(this).toggleClass("collapse expand");
                $(this).next().slideToggle(300);
            }
        });

        // Store the courses
        for (var el in courses) {
            // We clone the course object because we are going to modify it in a copy.
            var storedCourse = JSON.parse(JSON.stringify(courses[el]));
            storedCourse.courseid = storedCourse.id;
            storedCourse.siteid = MM.config.current_site.id;
            // For avoid collising between sites.
            storedCourse.id = MM.config.current_site.id + '-' + storedCourse.courseid;
            var r = MM.db.insert('courses', storedCourse);
        }

        MM._showMainAppPanels();

        if (MM.deviceType == 'tablet') {
            MM.panels.html('center', '<div class="welcome">' + MM.lang.s("welcome") + '</div>');
            MM.panels.menuShow(true, {animate: false});
            MM.panels.hide('right', '');
        }
    },

    getClickType: function() {
        return MM.clickType;
    },

    getTouchMoving: function() {
        return MM.touchMoving;
    },

    /**
     * Function for determine with service we should be use (default or extended plugin)
     *
     * @param  {string} siteURL The site URL
     * @return {string}         The service shortname
     */
    _determineService: function(siteURL) {
        // We need to try siteURL in both https or http (due to loginhttps setting).

        // First http://
        siteURL = siteURL.replace("https://", "http://");
        var id = hex_md5(siteURL);
        var service = MM.db.get('services', id);
        if (service) {
            MM.currentService = service.get('service');
            return MM.currentService;
        }

        // Now https://
        siteURL = siteURL.replace("http://", "https://");
        id = hex_md5(siteURL);
        service = MM.db.get('services', id);
        if (service) {
            MM.currentService = service.get('service');
            return MM.currentService;
        }

        MM.currentService = MM.config.wsservice;
        // Return default service.
        return MM.config.wsservice;
    },

    /**
     * Check if the local_mobile plugin is installed in the Moodle site
     * This plugin provide extended services
     * @param  {string} siteURL         The Moodle SiteURL
     * @param  {Object} successCallBack Success callback
     * @param  {Object} errorCallback   Error callback
     */
    _checkMobileLocalPlugin: function(siteURL, successCallBack, errorCallback) {
        // First check if is disabled by config.
        if (!MM.config.wsextservice) {
            errorCallback();
            return;
        }
        $.ajax({
            url: siteURL + "/local/mobile/check.php",
            type:'POST',
            data:{
                service: MM.config.wsextservice
            },
            dataType: "json",
            success:  successCallBack,
            error:    errorCallback
        });
    },

    /**
     * Reset the add site form
     */
    _resetAddSiteForm: function() {
        $('#username').val("");
        $('#password').val("");
        $("#url").removeAttr("disabled");
        $('#add-site form').unbind('submit');
        $('#add-site form').off('submit', MM.addSite);
        $('#add-site form').on('submit', MM.checkSite);
        $("#login-credentials").css("display", "none");
        $("#login-details").animate({paddingTop: "40px"});
        $("#resetsitebutton").css("display", "none");
        $('#username').focus();
        MM.util.showKeyboard();
    },

    /**
     * Expand the add site form with the username and password fields
     */
    _expandAddSiteForm: function() {
        $("#url").attr('disabled','disabled');
        $("#login-details").animate({paddingTop: "0px"});
        $("#login-credentials").css("display", "block");
        $("#resetsitebutton").css("display", "inline");
        $('#add-site form').off('submit', MM.checkSite);
        $('#add-site form').on('submit', MM.addSite);
        $("#resetsitebutton").on(MM.clickType, function() {
            MM._resetAddSiteForm();
        });
        $('#username').focus();
        MM.util.showKeyboard();
    },

    _appLaunchedByURL: function(url) {

        // We have to wait until the app is initialized.
        if (typeof(MM.config.launchSiteURL) == "undefined") {
            setTimeout(function() {
                MM._appLaunchedByURL(url);
            }, 1000);
            return;
        }
        MM.showModalLoading(MM.lang.s("authenticating"));
        MM.log("App launched by URL");

        // Delete the URL scheme from the URL.
        url = url.replace("moodlemobile://token=", "");
        // Decode from base64.
        url = atob(url);

        // Split signature:::token
        var params = url.split(":::");

        launchSiteURL = MM.getConfig("launchSiteURL");
        passport = MM.getConfig("launchPassport");

        // Reset temporary values.
        MM.setConfig("launchSiteURL",  null);
        MM.setConfig("launchPassport", null);

        if (!launchSiteURL || !passport) {
            // Something very strange happens, maybe a relaunch / refresh in the browser?
            return;
        }

        // Validate the signature.
        // We need to check both http and https.
        var signature = hex_md5(launchSiteURL + passport);
        if (signature != params[0]) {
            if (launchSiteURL.indexOf("https://") != -1) {
                launchSiteURL = launchSiteURL.replace("https://", "http://");
            } else {
                launchSiteURL = launchSiteURL.replace("http://", "https://");
            }
            signature = hex_md5(launchSiteURL + passport);
        }

        if (signature == params[0]) {
            MM.log("Signature validated");
            MM.siteurl = launchSiteURL;
            MM._saveToken(params[1]);
        } else {
            MM.popErrorMessage(MM.lang.s("unexpectederror"));
            MM.log("Inalid signature in the URL request yours: " + params[0] + " mine: " + signature + "for passport " + passport);
        }
    },


    /**
     * Check if a site is valid and if it has specifics settings for authentication
     * (like force to log in using the browser)
     *
     * @param {!Object} Javascript event.
     * @param {string} protocol The procol entered in the url.
     */

    checkSite: function(e, protocol) {
        if (e) {
            e.preventDefault();
        }
        MM.log("Checking remote site");

        var siteurl = $('#url').val();
        var demoSite = false;

        // Check for keywords for demo sites
        $.each(MM.config.demo_sites, function (index, site) {
            if (siteurl == site.key) {
                siteurl = site.url;
                username = site.username;
                password = site.password;
                demoSite = true;
                return false; // break
            }
        });

        // Load a demo site and exits this checking function.
        if (demoSite) {
            MM.saveSite(username, password, siteurl);
            return;
        }

        // Check if we are requesting the local emulated site (for testing the app without connection a server).
        if (siteurl == "mmtest") {
            MM.siteurl = siteurl;
            MM._saveToken("mmtesttoken");
            return;
        }

        $("#url").addClass("url-loading");

        // formatURL adds the protocol if is missing.
        siteurl = MM.util.formatURL($('#url').val());
        if (siteurl.indexOf('http://localhost') == -1 && !MM.validateURL(siteurl)) {
            msg = MM.lang.s('siteurlrequired') + '<br/>';
            MM.popErrorMessage(msg);
            $("#url").removeClass("url-loading");
            return;
        }

        // First we try to connect using https but only if the user has entered a URL starting by http://
        // We need a timeout because some sites that doesn't have https configured can not close the connection for a long time.
        var timeout = 15000;

        if (typeof(protocol) == "undefined") {
            protocol = "https://";
        }

        // Now, replace the siteurl with the protocol.
        siteurl = siteurl.replace(/^http(s)?\:\/\//i, protocol);

        // First, check that the site exists.
        $.ajax({
            url:  siteurl + "/login/token.php",
            type: 'HEAD',
            timeout: timeout,
            success:function() {

                // First of all, replace the url field with the normalized/validated one.
                $("#url").val(siteurl);

                // Now, check if the mobile local plugin is configured.
                // We need to check if we are going to use extended services and also if SSO is configured.
                MM._checkMobileLocalPlugin(siteurl,
                    // Success.
                    function(response) {
                        if (typeof(response.code) == "undefined") {
                            MM.popErrorMessage(MM.lang.s("unexpectederror"));
                            return;
                        }
                        MM.log("Checking site: local_mobile plugin installed");

                        var code = parseInt(response.code, 10);
                        if (response.error) {
                            MM.log("Checking site: Error returned: " + code);
                            switch (code) {
                                case 1:
                                    // Site in maintenance mode.
                                    msg = MM.lang.s("siteinmaintenance");
                                    MM.popErrorMessage(msg);
                                    break;
                                case 2:
                                    // Web services not enabled.
                                    msg = MM.lang.s("webservicesnotenabled");
                                    MM.popErrorMessage(msg);
                                    break;
                                case 3:
                                    // Extended service not enabled, but the official is enabled.
                                    MM._expandAddSiteForm();
                                    break;
                                case 4:
                                    // Neither extended or official services enabled.
                                    msg = MM.lang.s("mobileservicesnotenabled");
                                    MM.popErrorMessage(msg);
                                    break;
                                default:
                                    msg = MM.lang.s("unexpectederror");
                                    MM.popErrorMessage(msg);
                            }
                            return;
                        } else {
                            // Now we store here the service used by this site.
                            var service = {
                                id: hex_md5(siteurl),
                                siteurl: siteurl,
                                service: MM.config.wsextservice
                            };
                            MM.db.insert("services", service);

                            MM.log("Checking site: Extended service enabled, code: " + code);

                            switch (code) {
                                case 1:
                                    // Normal login.
                                    MM._expandAddSiteForm();
                                    break;
                                case 2:
                                    MM.popConfirm(MM.lang.s('logininsiterequired'), function() {
                                        var passport = Math.random() * 1000;
                                        var url = siteurl + "/local/mobile/launch.php?service=" + MM.config.wsextservice;
                                        url += "&passport=" + passport;

                                        MM.setConfig("launchSiteURL",  siteurl);
                                        MM.setConfig("launchPassport", passport);
                                        window.open(url, "_system");
                                        if (navigator.app) {
                                            navigator.app.exitApp();
                                        }
                                    });
                                    break;
                                default:
                                    MM._expandAddSiteForm();
                            }
                        }
                    },
                    // Error. The plugin is not installed.
                    // We are going to perform then a normal login process.
                    function() {
                        MM.log("Checking site: local_mobile plugin is not installed");
                        MM._expandAddSiteForm();
                    }
                );
            },
            error:function(xhr, textStatus, errorThrown) {
                var error = MM.lang.s('cannotconnect');

                if (siteurl.indexOf("https://") === 0) {
                    MM.checkSite(null, "http://");
                    return;
                }
                else if (xhr.status == 404) {
                    error = MM.lang.s('invalidscheme');
                }
                MM.popErrorMessage(error);
            },
            complete: function() {
                $("#url").removeClass("url-loading");
            }
        });

    },

    /**
     * Prepare a site to be stored in the database.
     *
     * @param {!Object} Javascript event.
     */
    addSite: function(e) {

        e.preventDefault();

        var siteurl = MM.util.formatURL($('#url').val());
        var username = $.trim($('#username').val());
        var password = $('#password').val();

        var stop = false;
        var msg = '';

        // We first try to fix the site url
        // We are not going to do this anymore see https://tracker.moodle.org/browse/MOBILE-453.

        if (siteurl.indexOf('http://localhost') == -1 && !MM.validateURL(siteurl)) {
            msg += MM.lang.s('siteurlrequired') + '<br/>';
            stop = true;
        }

        if (!username) {
            msg += MM.lang.s('usernamerequired') + '<br/>';
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
     * Validates a URL for a specific pattern.
     * @param {String} url The url to test against the pattern
     * @return {bool} TRUE if the url matches the expected pattern.
     *                FALSE otherwise.
     */
    validateURL: function(url) {
        return /^http(s)?\:\/\/.*/i.test(url)
    },

    /**
     * Save the token retrieved and load the full siteinfo object.
     * @param  {str} token    The user token
     * @param  {str} username Username
     * @return {[type]}          [description]
     */
    _saveToken: function(token) {

        MM.setConfig('current_token', token);
        MM.config.current_token = token;
        var preSets = {
            wstoken: token,
            siteurl: MM.siteurl,
            silently: true,
            getFromCache: false,
            saveToCache: true
        };

        // We have a valid token, try to get the site info.
        MM.moodleWSCall('moodle_webservice_get_siteinfo', {}, function(site) {
            // Now we check for the minimum required version.
            // We check for WebServices present, not for Moodle version.
            // This may allow some hacks like using local plugins for adding missin functions in previous versions.
            var validMoodleVersion = false;
            $.each(site.functions, function(index, el) {
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
            site.id = hex_md5(site.siteurl + site.username);
            site.token = token;
            var newSite = MM.db.insert('sites', site);
            MM.setConfig('current_site', site);
            MM.loadSite(newSite.id);
            MM.closeModalLoading();
        }, preSets);

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
        MM.showModalLoading(MM.lang.s("authenticating"));
        var loginURL = siteurl + '/login/token.php';
        MM.siteurl = siteurl;

        var service = MM._determineService(siteurl);
        // Now, we try to get a valid token.
        $.ajax({
            url:loginURL,
            type:'POST',
            data:{
                username: username,
                password: password,
                service:  service
            },
            dataType:"json",
            success:function(json) {
                if (typeof(json.token) != 'undefined') {
                    // Save the token, and load the site.
                    MM._saveToken(json.token);
                } else {
                    var error = MM.lang.s('invalidaccount');

                    if (typeof(json.error) != 'undefined') {
                        error = json.error;
                    }
                    MM.popErrorMessage(error);
                }
            },
            error:function(xhr, textStatus, errorThrown) {
                var error = MM.lang.s('cannotconnect');

                if (xhr.status == 404) {
                    error = MM.lang.s('invalidscheme');
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

        // Load the plugin in the main Namespace.
        this.plugins[pluginName] = plugin;

        for (var el in plugin.routes) {
            var route = plugin.routes[el];
            // Route[0] URL to match, Route[1] id, Route[2] function to call on match.
            this.Router.route(route[0], route[1], this.plugins[pluginName][route[2]]);
        }
        this.loadModels(plugin.storage);

        // Sync hooks (like cron jobs)
        if (typeof(plugin.sync) != 'undefined') {
            MM.sync.registerHook(pluginName, plugin.sync);
        }

        // Load default strings.
        if (plugin.settings.lang.component != 'core') {
            MM.lang.loadPluginLang(pluginName, JSON.parse(plugin.settings.lang.strings));
        }
    },

    /**
     * Creates a new store for the specified model name.
     *
     * @param {String} The model name to make a store in respect of.
     *
     * @return {Store} A store object for the model.
     */
    _createNewStore: function(modelName) {
        return new Store(modelName);
    },

    /**
     * Loads backbone Models
     *
     * @param {Array.<Object>} elements The models to be loaded.
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
                obj.bbproperties.localStorage = MM._createNewStore(el);
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
            ['helpmelogin', 'helpmelogin', MM.util.helpMeLogin],
            ['settings', 'settings', MM.settings.display],
            ['logout', 'logout', MM.logoutUser],
            ['refresh', 'refresh', MM.refresh],
            ['settings/:section/', 'settings_section', MM.settings.showSection],
            ['settings/sites/add', 'settings_sites_add_site', MM.settings.addSite],
            ['settings/sites/delete/:siteid', 'settings_sites_delete_site', MM.settings.deleteSite],
            ['settings/general/purgecaches', 'settings_general_purgecaches', MM.cache.purge],
            ['settings/sync/css', 'settings_sync_css', function() { MM.sync.css(true); }],
            ['settings/spaceusage/empty/:siteid', 'settings_spaceusage_empty_site', MM.settings.deleteSiteFiles],
            ['settings/development/log/:filter', 'settings_sync_css', MM.showLog],
            ['add-site', 'add_site', MM._displayAddSite],
            ['manage-accounts', 'manage_accounts', MM._displayManageAccounts],
        ];

        for (var el in routes) {
            var route = routes[el];
            MM.Router.route(route[0], route[1], route[2]);
        }
    },

    /**
     * Verifies the presets, setting them to default values in the event
     * they don't exist.
     * @param {Object} preSets The presets to check
     * @return {Object} The completed list of presets.
     */
    _verifyPresets: function(preSets) {
        if (typeof(preSets) == 'undefined' || preSets == null) {
            preSets = {};
        }
        if (typeof(preSets.getFromCache) == 'undefined') {
            preSets.getFromCache = 1;
        }
        if (typeof(preSets.saveToCache) == 'undefined') {
            preSets.saveToCache = 1;
        }
        if (typeof(preSets.sync) == 'undefined') {
            preSets.sync = 0;
        }
        if (typeof(preSets.silently) == 'undefined') {
            preSets.silently = false;
        }
        if (typeof(preSets.omitExpires) == 'undefined') {
            preSets.omitExpires = false;
        }

        if (typeof(preSets.wstoken) == 'undefined') {
            preSets.wstoken = MM.config.current_token;
            if (!preSets.wstoken) {
                MM.popErrorMessage(MM.lang.s("unexpectederror"));
                return false;
            }
        }

        if (typeof(preSets.siteurl) == 'undefined') {
            preSets.siteurl = MM.config.current_site.siteurl;
            if (!preSets.siteurl) {
                MM.popErrorMessage(MM.lang.s("unexpectederror"));
                return false;
            }
        }

        return preSets;
    },

    /**
     * Gets the data from the cache if the presets have opted we can use
     * the cache.
     * @param {Object}   preSets       Preset values for this call.
     * @param {Object}   ajaxData      The data to send with the ajax call
     * @param {Function} callBack      The callback to use in the event of success
     * @param {Function} errorCallBack The callback to use in the event of failure.
     * @return {void}
     */
    _getDataFromCache: function(preSets, ajaxData, callBack, errorCallBack) {
        // Try to get the data from cache.
        if (preSets.getFromCache || (preSets.saveToCache && !MM.deviceConnected())) {
            // In case the device is not connected, we prefer expired cache than nothing.
            var omitExpires = !MM.deviceConnected() || preSets.omitExpires;

            var data = MM.cache.getWSCall(preSets.siteurl, ajaxData, omitExpires);

            if (data !== false) {
                callBack(data);
                return true;
            } else if (!MM.deviceConnected()) {
                if (errorCallBack) {
                    errorCallBack(MM.lang.s("errornoconnectednocache"));
                } else {
                    MM.popErrorMessage(MM.lang.s('errornoconnectednocache'));
                }
                return true;
            }
        }

        return false;
    },

    /**
     * Converts an objects values to strings where appropriate.
     * Arrays (associative or otherwise) will be maintained.
     *
     * @param {Object} data The data that needs all the non-object values set
     *                      to strings.
     *
     * @return {Object} The cleaned object, with multilevel array and objects
     *                  preserved.
     */
    _convertValuesToString: function(data) {
        var result = [];
        if (!_.isArray(data) && _.isObject(data)) {
            result = {};
        }
        for (var el in data) {
            if (_.isObject(data[el])) {
                result[el] = MM._convertValuesToString(data[el])
            } else {
                result[el] = data[el] + '';
            }
        }
        return result;
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
     *      silently For not raising erronors.
     */
    moodleWSCall: function(method, data, callBack, preSets, errorCallBack) {

        data = MM._convertValuesToString(data);
        preSets = MM._verifyPresets(preSets);

        // First check if we are using the "emulated" site feature (not connecting to a server).
        if (MM.util.inEmulatedSite()) {
            // Load the WS emulated response.
            $.getJSON("emulator/" + method + ".json", function(data) {
                setTimeout(function() {
                    callBack(data);
                }, 100);
            });
            return;
        }


        data.wsfunction = method;
        data.wstoken = preSets.wstoken;

        preSets.siteurl += '/webservice/rest/server.php?moodlewsrestformat=json';
        var ajaxData = data;

        // Check if the device is Online, if not add operation to queue.
        if (preSets.sync) {
            if (!MM.deviceConnected()) {
                var el = {
                    id: hex_md5(preSets.siteurl + JSON.stringify(ajaxData)),
                    url: preSets.siteurl,
                    data: ajaxData,
                    syncData: preSets.syncData,
                    siteid: MM.config.current_site.id,
                    type: 'ws',
                    timecreated: MM.util.timestamp(),
                    lastattempt: 0,
                    syncattempts: 0
                };
                MM.db.insert('sync', el);
                MM.popMessage(MM.lang.s('addedtoqueue'), {title: preSets.syncData.name});
                return true;
            }
        }

        if (MM._getDataFromCache(preSets, ajaxData, callBack, errorCallBack)) {
            return true;
        }

        // If we arrive here, and we are not connected, thrown a network error message.
        if (!MM.deviceConnected()) {
            if (typeof(errorCallBack) === "function"){
                errorCallBack(MM.lang.s('networkerrormsg'));
            } else {
                MM.popErrorMessage(MM.lang.s('networkerrormsg'));
            }
            return true;
        }

        if (!preSets.silently && preSets.showModalLoading) {
            MM.showModalLoading(MM.lang.s("loading"));
        }

        // Main jQuery Ajax call, returns in json format.
        $.ajax({
            type: 'POST',
            url: preSets.siteurl,
            data: ajaxData,
            dataType: 'json',

            success: function(data) {
                // Some moodle web services return null.
                // If the responseExpected value is set then so long as no data
                // is returned, we create a blank object.
                if (!data && !preSets.responseExpected) {
                    data = {};
                }

                if (!data) {
                    if (errorCallBack) {
                        errorCallBack();
                    } else {
                        MM.popErrorMessage(MM.lang.s("cannotconnect"));
                    }
                    return;
                }

                if (typeof(data.exception) != 'undefined') {
                    MM.closeModalLoading();
                    if (data.errorcode == "invalidtoken" || data.errorcode == "accessexception") {

                        if (!preSets.silently) {
                            MM.popMessage(MM.lang.s("lostconnection"));
                        }
                        MM.log("Critical error: " + JSON.stringify(data));

                        // TODO: Rewrite setTimeout to work off an event call instead.
                        setTimeout(function(){
                            MM.setConfig("current_site", null);
                            location.href = "index.html";
                        }, 10000); // 10 seconds later - redirect.
                        return;
                    } else {
                        if (errorCallBack) {
                            errorCallBack(data.message);
                        } else {
                            if (!preSets.silently) {
                                MM.popErrorMessage(data.message);
                            }
                        }
                        return;
                    }
                }

                if (typeof(data.debuginfo) != 'undefined') {
                    MM.closeModalLoading();
                    if (errorCallBack) {
                        errorCallBack('Error. ' + data.message);
                    } else {
                        if (!preSets.silently) {
                            MM.popErrorMessage('Error. ' + data.message);
                        }
                    }
                    return;
                }

                MM.log('WS: Data received from WS '+ typeof(data));

                if (typeof(data) == 'object' && typeof(data.length) != 'undefined') {
                    MM.log('WS: Data number of elements '+ data.length);
                }

                if (preSets.saveToCache) {
                    MM.cache.addWSCall(preSets.siteurl, ajaxData, data);
                }

                MM.closeModalLoading();
                // We pass back a clone of the original object, this may
                // prevent errors if in the callback the object is modified.
                callBack(JSON.parse(JSON.stringify(data)));
            },
            error: function(xhr, ajaxOptions, thrownError) {

                MM.closeModalLoading();

                var error = MM.lang.s('cannotconnect');
                if (xhr.status == 404) {
                    error = MM.lang.s('invalidscheme');
                }
                if (!preSets.silently) {
                    MM.popErrorMessage(error);
                } else {
                    MM.log('WS: error on ' + method + ' error: ' + error);
                }
                if (errorCallBack) {
                    errorCallBack(error);
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
        MM.log('Trying to upload file ('+ data.length + ' chars)', 'Sync');
        if (!MM.deviceConnected()) MM.handleDisconnectedFileUpload(data, fileOptions);

        MM.log('Initializing uploader');
        var options = MM._wsGetFileUploadOptions();
        options.fileKey = fileOptions.fileKey;
        options.fileName = fileOptions.fileName;
        options.mimeType = fileOptions.mimeType;
        options.params = {
            token:MM.config.current_token
        };
        options.chunkedMode = false;
        options.headers = {
          Connection: "close"
        };

        MM.log('Uploading');
        MM.showModalLoading(MM.lang.s("uploading"), MM.lang.s('uploadingtoprivatefiles'));
        var ft = MM._wsGetFileTransfer();
        ft.upload(
            data,
            MM.config.current_site.siteurl + '/webservice/upload.php',
            function() {
                MM.closeModalLoading();
                successCallBack();
            },
            function() {
                MM.closeModalLoading();
                errorCallBack();
            },
            options
        );
    },

    /**
     * Handle disconnected file uploads (user tries to upload while device is
     * disconnected). Log the sync attempt, and pop up a message for theuser.
     * @param {object} json The JSON response.
     */
    handleDisconnectedFileUpload: function(data, fileOptions) {
        var el = {
            id: hex_md5(MM.config.current_site.siteurl + JSON.stringify(fileOptions)),
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
        MM.popMessage(MM.lang.s('addedtoqueue'), {title: el.syncData.name});
        return true;
    },

    /**
     * Downloads a file from Moodle using Cordova File API
     *
     * @param {string} url Download url.
     * @param {string} path Local path to store the file.
     * @param {Object} successCallBack Function to be called on success.
     * @param {Object} errorCallBack Function to be called on error.
     */
    moodleDownloadFile: function(url, path, successCallBack, errorCallBack, background) {

        // Background download. Check if we are using the external service that supports CORS download.
        // We check for the local_mobile_mod_forum_get_forums_by_courses since the version including that funciton supports CORS.
        if (background &&
                MM.util.WebWorkersSupported &&
                MM.util.wsAvailable('local_mobile_mod_forum_get_forums_by_courses')) {

            // Phonegap/Cordova is not thread safe, it canno runt inside a Worker. We will use a standard XHR binary download.
            // Create dinamically a Worker script. Workers from file:// are not supported.
            if (!MM.blobWorker) {
                MM.blobWorker = new Blob([MM.webWorker]);
            }

            var worker = new Worker(window.URL.createObjectURL(MM.blobWorker));
            worker.onmessage = function(e) {
                // Cache the results of the XHR call.
                if (e.data && e.data.status == "success") {
                    // Emulator support.
                    path = path.replace("filesystem:file:///persistent/", "");

                    MM.fs.fileSystemRoot.getFile(path, {create: true}, function(fileEntry) {
                        fileEntry.createWriter(
                            function(writer) {
                                writer.onerror = function(e) {
                                    errorCallback(path);
                                };
                                writer.write(e.data.fileContents);
                                successCallBack(path);
                            },
                            function(e) {
                                errorCallBack(path);
                            });
                    }, function(e) {
                        errorCallBack(path);
                    });
                } else {
                    errorCallBack(path);
                }
            };

            url = url.replace("webservice/pluginfile.php", "local/mobile/pluginfile.php");
            var data = {
                type: "download",
                url: url
            };
            MM.log("Starting file download via Web Workers");
            worker.postMessage(data);

        } else {
            MM.fs.fileSystemRoot.getFile(path, {create: true},
                function(fileEntry) {
                    var ft = MM._wsGetFileTransfer();
                    ft.download(url, fileEntry.toURL(),
                        function(fileDownloaded) {
                            successCallBack(fileDownloaded.toURL());
                        },
                        function() {
                            errorCallBack(path);
                        }
                    );
                },
                function() {
                    errorCallBack(path);
                }
            );
        }
    },

    /**
     * Launches the WS sync process for operations done offline
     * There is a queue of tasks performed when the device was offline.
     */
    wsSync: function() {
        MM.log('Executing WS sync process', 'Sync');
        var syncWsOn = MM.getConfig('sync_ws_on');
        if (!syncWsOn) {
            MM.log('WS sync process is disabled', 'Sync');
        }
        if (MM.deviceConnected() && syncWsOn) {
            MM.db.each('sync', MM._wsSyncType);
        }
    },

    /**
     * Function called from MM.wsSync, called for each possible sync type
     * Separated for ease of testing.
     * @param {Object} Backbone Object specifying what to sync based on type of
     *                 the underlying object
     */
    _wsSyncType: function(sync, silently) {
        sync = sync.toJSON();
        sync.lastattempt = MM.util.timestamp();
        sync.syncattempts++;
        MM.db.insert("sync", sync);

        switch (sync.type) {
            case 'ws':
                MM.wsSyncWebService(sync, silently);
                break;
            case 'upload':
                MM.wsSyncUpload(sync, silently);
                break;
            case 'content':
                MM.wsSyncDownload(sync, silently);
                break;
        }
    },

    /**
     * Performs a web service sync.
     */
    wsSyncWebService: function(sync, silently) {
        if (typeof(silently) === "undefined") {
            silently = true;
        }
        MM.log('Executing WS sync operation:' + JSON.stringify(sync.syncData) + ' url:' + sync.url, 'Sync');
        MM.moodleWSCall(sync.data.wsfunction, sync.data, function(d) {
                MM.log('Executing WS sync operation FINISHED:' + sync.data.wsfunction, 'Sync');
                MM.db.remove('sync', sync.id);
                if (!silently) {
                    MM.popMessage(MM.lang.s("webservicesuccessfullyexecuted"));
                }
            },
            {
                getFromCache: false,
                saveToCache: false,
                silently: silently
            }
        );
    },

    /**
     * Returns a FileTransfer object used by wsSyncUpload
     * Function created for ease of testing.
     * @return {Object} FileTransfer Object
     */
    _wsGetFileTransfer: function() {
        return new FileTransfer();
    },

    /**
     * Returns a FileUploadOptions object used by wsSyncUpload
     * Function created for ease of testing.
     * @return {Object} FileUploadOptions Object
     */
    _wsGetFileUploadOptions: function() {
        return new FileUploadOptions();
    },

    /*
     * Performs a file upload sync.
     */
    wsSyncUpload: function(sync, silently) {
        if (typeof(silently) === "undefined") {
            silently = true;
        }
        MM.log('Starting upload', 'Sync');
        var ft = MM._wsGetFileTransfer();
        var params = {token: MM.config.current_token};
        var options = MM._wsGetFileUploadOptions();
        options.fileKey = sync.options.fileKey;
        options.fileName = sync.options.fileName;
        options.mimeType = sync.options.mimeType;
        options.params = params;
        ft.upload(
            sync.data,
            MM.config.current_site.siteurl + '/webservice/upload.php',
            function() {
                MM.log('Executing Upload sync operation FINISHED:' + sync.options.filename, 'Sync');
                MM.db.remove('sync', sync.id);
                if (!silently) {
                    MM.popMessage(MM.lang.s("fileuploaded"));
                }
            },
            function() {
                if (!silently) {
                    MM.popMessage(MM.lang.s("errordownloading"));
                }
                MM.log('Error uploading', 'Sync');
            },
            options
        );
    },

    /*
     * Performs a file download sync.
     */
    wsSyncDownload: function(sync, silently) {
        if (typeof(silently) === "undefined") {
            silently = true;
        }
        // Only sync files of current site, mainly for performance.
        if (sync.siteid == MM.config.current_site.id) {
            // Append the token for safe download of files.
            sync.url = sync.url + '&token=' + MM.config.current_token;
            MM.log('Sync: Starting download of ' + sync.url + ' to ' + sync.newfile);
            MM.fs.createDir(sync.path, function() {
                MM.moodleDownloadFile(sync.url, sync.newfile, function(fullpath) {
                    MM.log('Download of content finished ' + sync.newfile + ' URL: ' + sync.url, 'Sync');
                    var content = MM.db.get('contents', sync.contentid).toJSON();
                    content.contents[sync.index].localpath = sync.newfile;
                    MM.log('Storing local path in content', 'Sync');
                    MM.db.insert('contents', content);
                    MM.db.remove('sync', sync.id);
                    if (!silently) {
                        MM.popMessage(MM.lang.s("filedownloaded"));
                    }
                }, function(fullpath) {
                    if (!silently) {
                        MM.popMessage(MM.lang.s("erroruploading"));
                    }
                    MM.log('Error downloading ' + sync.newfile + ' URL: ' + sync.url, 'Sync');
                });
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
                if (typeof(plugin.isPluginVisible) == 'function' && !plugin.isPluginVisible()) {
                    continue;
                }
                plugins.push(plugin.settings);
            }
        }

        var html = MM.tpl.render($('#settings_template').html(), {plugins: plugins});
        MM.panels.show('center', html);
    },

    /**
     * Generic function for getting config settings.
     * Config sites can be global (default) or by site (you need to specify the flag site then)
     *
     * @param {string} name Name of the setting
     * @param {string} optional Optional value if the config doesn't exists
     * @param {boolean} site Is the config site specific?
     */
    getConfig: function(name, optional, site) {

        if (site && MM.config.current_site) {
            name = MM.config.current_site.id + '-' + name;
        }

        if (typeof MM.config[name] != 'undefined') {
            return MM.config[name];
        }

        // Maybe the app isn't init already so we need to get settings directly from the database.
        var setting = MM.db.get("settings", name);
        if (setting) {
            return setting.get('value');
        }

        if (typeof optional != 'undefined') {
            return optional;
        }

        return;
    },

    /**
     * Generic function for setting config settings.
     * Config sites can be global (default) or by site (you need to specify the flag site then)
     */
    setConfig: function(name, value, site) {
        var setting = {
            id: name,
            name: name,
            value: value
        };

        if (site && MM.config.current_site) {
            setting.id = MM.config.current_site.id + '-' + name;
            setting.name = setting.id;
        }

        MM.db.insert('settings', setting);
    },


    /**
     * Generic function for adding the wstoken to Moodle urls and for pointing to the correct script.
     * For download remote files from Moodle we need to use the special /webservice/pluginfile passing the ws token as a get parameter.
     *
     * @param {string} url The url to be fixed.
     */
    fixPluginfile: function(url, token) {

        // This function is used in regexp callbacks, better not to risk!!
        if (!url) {
            return '';
        }

        if (!token) {
            token = MM.config.current_token;
        }

        // First check if we need to fix this url or is already fixed.
        if (url.indexOf('token=') != -1) {
            return url;
        }

        // Check if is a valid URL (contains the pluginfile endpoint).
        if (url.indexOf('pluginfile') == -1) {
            return url;
        }

        // In which way the server is serving the files? Are we using slash parameters?
        if (url.indexOf('?file=') != -1) {
            url += '&';
        } else {
            url += '?';
        }
        url += 'token=' + token;

        // Some webservices returns directly the correct download url, others not.
        if (url.indexOf('/webservice/pluginfile') == -1) {
            url = url.replace('/pluginfile', '/webservice/pluginfile');
        }
        return url;
    },

    /**
     * Generic logging function which is only active if dev_debug is true
     *
     * @param {string} text      The text to be logged.
     * @param {string} component The component the text is relevant to.
     */
    log: function(text, component) {
        if (!MM.debugging) {
            return;
        }
        if (!component) {
            component = 'Core';
        }

        var d = new Date();
        text = d.toLocaleString() + ' ' + component + ': ' + text;

        if (window.console) {
            console.log(text);
        }
        var length = MM.logData.unshift(text);

        if (length > MM.config.log_length) {
            MM.logData.pop();
        }
    },

    /**
     * Error logging function which is only active if dev_debug is true.
     * Gives the text and a stack trace for each error.
     * Does not save the details to logData.
     *
     * @param {string} text      The text to be logged
     * @param {string} component The component the text is relevant to.
     */
    errorLog: function(text, component) {
        if (!MM.getConfig('dev_debug')) {
            return;
        }
        var d = new Date();
        text = d.toLocaleString() + ' ' + component + ': ' + text;

        if (typeof(window.console.trace) == 'function') {
            console.trace(text);
        } else {
            console.log(text);
        }
    },

    getFormattedLog: function(filter) {
        if (!MM.getConfig('dev_debug')) {
            return "";
        }

        if (typeof(filter) != 'string') {
            filter = "";
        }

        var logInfo = '';
        var last = '';

        for (var el in MM.logData) {
            if(filter && MM.logData[el].indexOf(filter) == -1) {
                continue;
            }

            var info = MM.logData[el].split(": ");

            if (last.indexOf(info[1]) == -1) {
                logInfo += MM.logData[el] + "<br />";
            }
            last = MM.logData[el];
        }

        return logInfo;
    },

    /**
     * Function for displaying the log in the mobile app
     */
    showLog: function(filter) {

        var logInfo = MM.getFormattedLog(filter);

        var mailBody = encodeURIComponent(logInfo.replace(/<br \/>/ig,"\n").replace(/(<([^>]+)>)/ig,""))
        logInfo += '<div class="centered"><a href="mailto:' + MM.config.current_site.username +'?subject=MMLog&body=' + mailBody + '"><button>' + MM.lang.s("email") + '</button></a></div>';

        logInfo = '<input id="logfilter" type="text" placeholder="Filter"> <a href="javascript: MM.showLog()">Clear</a><br/><br/>' + logInfo;

        MM.panels.html('right', logInfo);

        $("#logfilter").keyup(function(e) {
            if(e.keyCode == 13) {
                MM.showLog($("#logfilter").val());
            }
        });
    },

    /**
     * Generic function for displaying error messages in the app
     *
     * @this {MM}
     * @param {string} text The text to be displayed inside the popup.
     */
    popErrorMessage: function(text) {

        if(!text) {
            return;
        }
        // Reset routing to avoid leave the user stuck, see MOBILE-307
        MM.Router.navigate("");

        var options = {
                title: MM.lang.s('error'),
                autoclose: 5000
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
            buttons: {}
        };
        options.buttons[MM.lang.s('yes')] = function() {
            MM.widgets.dialogClose();
            callBack();
        };
        options.buttons[MM.lang.s('no')] = MM.widgets.dialogClose;

        MM.popMessage(text, options);
        // Reset router so the Confirm dialog can be displayed again if the user click in the same link.
        MM.Router.navigate("")
    },

    /**
     * Function for opening external links in a new browser
     *
     * @param {string} selector A selector for handling the links
     */
    handleExternalLinks: function(selector) {
        MM.setExternalLinksHREF(selector);
        $(selector).bind(MM.clickType, MM.externalLinkClickHandler);
    },

    /**
     * This is an ugly hack for preventing in any case opening the link using the default action.
     * We store the actual link in a data-link attribute and replace the href with a #
     * Using # prevents opening any page in the webview browser
     *
     * @param {string} selector Selector for the links
     */
    setExternalLinksHREF: function(selector) {
        if (MM.clickType != 'click') {
            $(selector).bind('click touchstart', function(e) {
                // This is an ugly hack for preventing in any case opening the link using the default action.
                // This prevent also problems related to bubbling an stopping the propagation on touch move events
                // We store the actual link in a data-link attribute and replace the href with a #
                // Using # prevents opening any page in the webview browser
                var href = $(this).attr('href');
                if (href != "#") {
                    MM.Router.navigate("");
                    $(this).attr('data-link', href);
                    $(this).attr('href', '#');
                    $(this).attr('target', '_self');
                }
            });
        }
    },

    /**
     * Returns whether the current window supports child browsers.
     * Created for ease of testing
     * @return {Bool} TRUE if window.plugins && window.plugins.childBrowser
     *                FALSE otherwise
     */
    _canUseChildBrowser: function() {
        return window.plugins && window.plugins.childBrowser;
    },

    /**
     * Handle external link click events
     *
     * @param {object} e The event
     */
    externalLinkClickHandler: function(e) {
        e.preventDefault();
        // This prevents open the link when we are scrolling.
        if (MM.touchMoving) {
            MM.touchMoving = false;
        } else {
            var link = ($(this).attr('href') == '#')? $(this).attr('data-link') : $(this).attr('href');
            if (MM._canUseChildBrowser()) {
                MM.log('Launching childBrowser');
                try {
                    window.plugins.childBrowser.showWebPage(
                        link,
                        {
                            showLocationBar: true ,
                            showAddress: false
                        }
                    );
                } catch(e) {
                    MM.log('Launching childBrowser failed!, opening as standard link');
                    window.open(link, '_blank');
                }
            }
            else if(typeof(navigator.app) != "undefined" && typeof(navigator.app.loadUrl) != "undefined") {
                MM.log('Opening external link using navigator.app');
                navigator.app.loadUrl(link, { openExternal:true } );
            } else {
                MM.log('Opening external link using window.open');
                window.open(link, '_blank');
            }
        }
        if (typeof(MM.plugins.contents.infoBox) != "undefined") {
            MM.plugins.contents.infoBox.remove();
        }
    },

    /**
     * Function for opening external files.
     *
     * @param {string} selector A selector for handling the links to files
     */
    handleFiles: function(selector) {
        MM.setFileLinksHREF(selector);
        $(selector).on(MM.clickType, MM.fileLinkClickHandler);
    },

    /**
     * This is an ugly hack for preventing in any case opening the link using the default action.
     * This prevent also problems related to bubbling an stopping the propagation on touch move events
     * We store the actual link in a data-link attribute and replace the href with a #
     * Using # prevents opening any page in the webview browser
     *
     * @param {string} selector Selector for the links
     */
    setFileLinksHREF: function(selector) {
        if (MM.clickType != 'click') {
            $(selector).bind('click touchstart', function(e) {
                // This is an ugly hack for preventing in any case opening the link using the default action.
                // This prevent also problems related to bubbling an stopping the propagation on touch move events
                // We store the actual link in a data-link attribute and replace the href with a #
                // Using # prevents opening any page in the webview browser
                var href = $(this).attr('href');
                if (href != "#") {
                    MM.Router.navigate("");
                    $(this).attr('data-link', href);
                    $(this).attr('href', '#');
                    $(this).attr('target', '_self');
                }
            });
        }
    },

    /**
     * Handle file link click events
     *
     * @param {object} e The event
     */
    fileLinkClickHandler: function(e) {
        e.preventDefault();
        e.stopPropagation();

        MM.setFileLinksHREF(e.currentTarget);
        // This prevents open the link when we are scrolling.
        if (MM.touchMoving) {
            MM.touchMoving = false;
        } else {
            var link = ($(this).attr('href') == '#')? $(this).attr('data-link') : $(this).attr('href');
            // Open the file using the platform specific method.
            MM._openFile(link);
        }
        if (typeof(MM.plugins.contents.infoBox) != "undefined") {
            MM.plugins.contents.infoBox.remove();
        }
    },

    /**
     * Open a file using platform specific method
     * node-webkit: Using the default application configured.
     * Android: Using the WebIntent plugin
     * iOs: Using the window.open method
     *
     * @param  {string} link The local path of the file to be open
     * @return {[type]}      [description]
     */
    _openFile: function(link) {

        if (MM.inNodeWK) {
            // Link is the file path in the file system.
            // We use the node-webkit shell for open the file (pdf, doc) using the default application configured in the os.
            var gui = require('nw.gui');
            gui.Shell.openItem(link);
        } else if(window.plugins) {
            var extension = MM.util.getFileExtension(link);
            var mimetype = '';
            if (typeof(MM.plugins.contents.templates.mimetypes[extension])!= "undefined") {
                mimetype = MM.plugins.contents.templates.mimetypes[extension];
            }
            if (MM.deviceOS == 'android' && window.plugins.webintent) {
                var iParams = {
                    action: "android.intent.action.VIEW",
                    url: link,
                    type: mimetype['type']};

                window.plugins.webintent.startActivity(
                    iParams,
                    function() {
                        MM.log('Intent launched');
                    },
                    function() {
                        MM.log('Intent launching failed');
                        MM.log('action: ' + iParams.action);
                        MM.log('url: ' + iParams.url);
                        MM.log('type: ' + iParams.type);
                        // This may work in cordova 2.4 and onwards
                        window.open(link, '_system');
                    }
                );
            } else if (MM._canUseChildBrowser()) {
                MM.log('Launching childBrowser');
                try {
                    window.plugins.childBrowser.showWebPage(
                        link,
                        {
                            showLocationBar: true ,
                            showAddress: false
                        }
                    );
                } catch(e) {
                    MM.log('Launching childBrowser failed!, opening as standard link');
                    window.open(link, '_blank');
                }
            } else {
                // Changing _blank for _system may work in cordova 2.4 and onwards
                MM.log('Open external file using window.open');
                window.open(link, '_blank');
            }
        } else {
            // Changing _blank for _system may work in cordova 2.4 and onwards
            MM.log('Open external file using window.open');
            window.open(link, '_blank');
        }
    },

    /**
     * Loads additional JS files presents in the config.json file
     * See MOBILE-239
     *
     */
    loadExtraJs: function() {
        if (MM.deviceConnected()) {
            if (MM.config.extra_js && MM.config.extra_js.length > 0) {
                $.each(MM.config.extra_js, function(index, fileurl) {
                    MM.log("MM: Loading additional javascript file " + fileurl);
                    $.ajax({
                        url: fileurl,
                        dataType: "script",
                        timeout: "10000",
                        success: function() {
                            MM.log("MM: Loaded additional javascript file " + fileurl);
                        }
                    });
                });
            }
        }
    },

    /**
     * Detects the current device OS at runtime.
     *
     * @returns {string} The device OS name in lower case
     */
    getOS: function() {
        var os = MM.deviceOS;
        // We rely on phonegap information.
        // TODO - Check in Kindle
        if (window.device && window.device.platform) {
            os = window.device.platform;
        }
        return os.toLowerCase();
    },

    /**
     * Displays a loading modal window
     *
     * @param {string} title The title of the modal window
     * @param {string} title The text of the modal window
     */
    showModalLoading: function (title, text) {
        if (!title) {
            title = '';
        }
        if (!text) {
            text = '';
        }

        var options = {
            title: title
        };
        var body = '<div class="centered"><img src="img/loadingblack.gif"><br />' +text+ '</div>';

        MM.widgets.dialog(body, options);
    },

    /**
     * Close a modal loading window
     */
    closeModalLoading: function() {
        MM.widgets.dialogClose();
    },

    /**
     * Refresh the curren site, purging all WS caches and reloading the app basic layout
     */
    refresh: function() {
        if (MM.deviceConnected()) {
            MM.Router.navigate("");
            MM.cache.invalidate();
            MM.moodleWSCall('moodle_webservice_get_siteinfo', {}, function(site) {
                if (!site) {
                    return;
                }
                MM.popMessage(MM.lang.s('allcachesinvalidated'));

                site.id = hex_md5(site.siteurl + site.username);
                site.token = MM.config.current_token;
                MM.db.insert('sites', site);
                MM.setConfig('current_site', site);

                MM.cache.invalidate();
                MM.loadSite(site.id, true);
            },
            {
                getFromCache: false,
                saveToCache: true
            }
            );

        } else {
            MM.popMessage(MM.lang.s('norefreshdisconnected'));
        }
    },

    /**
     * Log outs current user
     *
     */
    logoutUser: function() {
        MM.setConfig("current_site", null);
        MM.setConfig("current_token", null);
        MM.config.current_site = null;
        MM.config.current_token = null;
        MM.site = null;
        location.href = "index.html";
    },

    /**
     * This plugin checks if a plugin type is mod and if it's visible
     * @param  {String} name        Moodle mod name
     * @return {Boolean|String}     False if the plugin is not available, the plugin name otherwise.
     */
    checkModPlugin: function(name) {
        for (var pluginName in MM.plugins) {
            var plugin = MM.plugins[pluginName];

            if (plugin.settings.type == 'mod' &&
                    typeof plugin.settings.component != "undefined" &&
                    (plugin.settings.component == name || plugin.settings.component == "mod_" + name )) {

                if (typeof(plugin.isPluginVisible) == 'function' && !plugin.isPluginVisible()) {
                    return false;
                }
                return pluginName;
            }
        }
        return false;
    }

};
