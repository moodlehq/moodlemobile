var templates = [
    "root/externallib/text!root/plugins/settings/addSiteForm.html",
    "root/externallib/text!root/plugins/settings/showSites.html",
    "root/externallib/text!root/plugins/settings/showSync.html",
    "root/externallib/text!root/plugins/settings/showSite.html",
    "root/externallib/text!root/plugins/settings/main.html"
];

require(templates, function(addSiteForm, showSites, showSync, showSite, main) {
    var plugin = {
        settings:{
            name: "settings",
            type: "general",
            menuURL: "#settings",
            lang: {
                component: "core"
            },
            icon: ""
        },

        templates:{
            main:main,
            addSiteForm:addSiteForm,
            showSites:showSites,
            showSync:showSync,
            showSite:showSite
        },

        routes:[
            ['settings', 'settings', "display"],
            ['settings/:section/', 'settings_section', "showSection"],
            ['settings/sites/:siteid', 'settings_sites_show_site', "showSite"],
            ['settings/sites/add', 'settings_sites_add_site', "addSite"],
            ['settings/sites/delete/:siteid', 'settings_sites_delete_site', "deleteSite"],
            ['settings/general/purgecaches', 'settings_general_purgecaches', MM.cache.purge],
            ['settings/sync/lang', 'settings_sync_lang', function() { MM.lang.sync(true); }],
            ['settings/sync/css', 'settings_sync_css', function() { MM.sync.css(true); }],
            ['settings/development/log/:filter', 'settings_sync_css', MM.showLog]
        ],

        sizes: undefined,

        _getSizes: function() {
            var screenWidth = $(document).innerWidth();

            MM.plugins.settings.sizes = {
                withSideBar: {
                    left:MM.navigation.getWidth(),
                    center:(screenWidth - MM.navigation.getWidth())/2,
                    right:(screenWidth - MM.navigation.getWidth())/2
                },
                withoutSideBar: {
                    left:0,
                    center:(screenWidth)/2,
                    right:(screenWidth)/2
                }
            };
        },

        resize: function() {
            if (MM.plugins.settings.sizes == undefined) {
                MM.plugins.settings._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.settings.sizes.withSideBar.center,
                    'left':MM.plugins.settings.sizes.withSideBar.left,
                });
                $("#panel-right").css({
                    'width':MM.plugins.settings.sizes.withSideBar.right,
                    'left':MM.plugins.settings.sizes.withSideBar.left + MM.plugins.settings.sizes.withSideBar.center,
                    'display':'block'
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.settings.sizes.withoutSideBar.center,
                    'left':MM.plugins.settings.sizes.withoutSideBar.left
                });
                $("#panel-right").css({
                    'width':MM.plugins.settings.sizes.withoutSideBar.right,
                    'left':MM.plugins.settings.sizes.withoutSideBar.center,
                    'display':'block'
                });
            }
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").html("").hide();
        },

        showSection: function(section) {
            // We call the function dynamically.
            MM.plugins.settings[
                'show' + section.charAt(0).toUpperCase() + section.slice(1)
            ]();
            // Reset the base route.
            MM.Router.navigate("#settings");
        },

        showSite: function(siteId) {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var site = MM.db.get('sites', siteId);
            var options = {
                title: site.get('sitename'),
                buttons: {}
            };

            if (siteId != MM.config.current_site.id) {
                options.buttons[MM.lang.s('select')] = function() {
                    MM.widgets.dialogClose();
                    MM.loadSite(siteId);
                };
            }
            /*
            options.buttons[MM.lang.s("delete")] = function() {
                MM.Router.navigate("settings/sites/delete/" + siteId, {trigger: true, replace: true});
            };*/
            options.buttons[MM.lang.s('cancel')] = function() {
                MM.widgets.dialogClose();
                MM.Router.navigate('settings/sites/');
            };

            var text = MM.tpl.render(MM.plugins.settings.templates.showSite, {
                siteurllabel:MM.lang.s('siteurllabel'),
                siteurl:site.get('siteurl'),
                fullname:MM.lang.s('fullname')
            });
            MM.widgets.dialog(text, options);
        },

        addSite: function(e, setting) {
            var html = '';

            var options = {
                title: MM.lang.s('addsite'),
                buttons: {}
            };
            options.buttons[MM.lang.s('add')] = function() {
                var siteurl = $.trim($('#new-url').val());
                var username = $.trim($('#new-username').val());
                var password = $.trim($('#new-password').val());

                $('form span.error').css('display', 'block').html('');

                // Delete the last / if present.
                if (siteurl.charAt(siteurl.length - 1) == '/') {
                    siteurl = siteurl.substring(0, siteurl.length - 1);
                }

                // Convert siteurl to lower case for avoid validation problems. See MOBILE-294
                siteurl = siteurl.toLowerCase();

                var stop = false;

                if (siteurl.indexOf('http://localhost') == -1 && !MM.validateURL(siteurl)) {
                    stop = true;
                    $('#new-url').next().html(MM.lang.s('siteurlrequired'));
                }

                if (MM.db.get('sites', hex_md5(siteurl + username))) {
                    // We must allow overrride sites
                    //stop = true;
                    //$('#new-url').next().html(MM.lang.s('siteexists'));
                }

                if (!username) {
                    stop = true;
                    $('#new-username').next().html(MM.lang.s('usernamerequired'));
                }
                if (!password) {
                    stop = true;
                    $('#new-password').next().html(MM.lang.s('passwordrequired'));
                }

                if (!stop) {
                    MM.widgets.dialogClose();
                    MM.saveSite(username, password, siteurl);
                    if (MM.deviceType == 'phone') {
                        location.href = "index.html";
                    }
                }
            };
            options.buttons[MM.lang.s('cancel')] = MM.widgets.dialogClose;

            html = MM.tpl.render(MM.plugins.settings.templates.addSiteForm, {
                siteurl:MM.lang.s('siteurl'),
                username:MM.lang.s('username'),
                password:MM.lang.s('password')
            });

            MM.widgets.dialog(html, options);
            e.preventDefault();
        },

        deleteSite: function(siteId) {
            var site = MM.db.get('sites', siteId);
            MM.popConfirm(MM.lang.s('deletesite'), function() {
                var count = MM.db.length('sites');
                if (count == 1) {
                    MM.db.remove('sites', siteId);
                    setTimeout(function() {
                        MM.logoutUser();
                    }, 1000);
                } else {
                    MM.db.remove('sites', siteId);
                    setTimeout(function() {
                        MM.Router.navigate('settings/sites/');
                    }, 1000);
                }
            });
        },

        display: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            // Settings plugins.
            var plugins = [];
            for (var el in MM.plugins) {
                var plugin = MM.plugins[el];
                if (plugin.settings.type == 'setting') {
                    plugins.push(plugin.settings);
                }
            }

            var pageTitle = MM.lang.s("settings");
            var html = MM.tpl.render(
                MM.plugins.settings.templates.main,
                {plugins: plugins}
            );
            MM.panels.show('center', html, {title: pageTitle});
            if (MM.deviceType == 'tablet') {
                $("#panel-center li:eq(0)").addClass("selected-row");
                MM.plugins.settings.showSites();
                MM.Router.navigate("#settings");
            }
        },

        showSites: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var sites = [];

            MM.db.each('sites', function(el) {
                sites.push(el.toJSON());
            });

            MM.collections.sites.fetch();

            var html = MM.tpl.render(
                MM.plugins.settings.templates.showSites, {
                    sites: sites,
                    current_site: MM.config.current_site.id
                }
            );
            MM.panels.show(
                'right', html, {
                    title: MM.lang.s("settings") + " - " + MM.lang.s("sites")
                }
            );
        },

        resetApp: function() {
            MM.popConfirm(MM.lang.s('areyousurereset'), function() {
                // Delete all the entries in local storage
                for (var el in localStorage) {
                    localStorage.removeItem(el);
                }
                // Redirect to main page
                location.href = 'index.html';
            });
        },

        showSync: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var settings = [
                {
                    id: 'sync_ws_on',
                    type: 'checkbox',
                    label: MM.lang.s('enableautosyncws'),
                    checked: true,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'sync_lang_on',
                    type: 'checkbox',
                    label: MM.lang.s('enableautosynccss'),
                    checked: true,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'sync_css_on',
                    type: 'checkbox',
                    label: MM.lang.s('enableautosynclang'),
                    checked: true,
                    handler: MM.plugins.settings.checkboxHandler
                }
            ];

            // Load default values
            $.each(settings, function(index, setting) {
                if (setting.type == 'checkbox') {
                    if (typeof(MM.getConfig(setting.id)) != 'undefined') {
                        settings[index].checked = MM.getConfig(setting.id);
                    }
                }
            });

            // Render the settings as html.
            var html = MM.widgets.renderList(settings);

            var syncFilter = MM.db.where('sync', {siteid: MM.config.current_site.id});
            var syncTasks = [];

            $.each(syncFilter, function(index, el) {
                syncTasks.push(el.toJSON());
            });

            html += MM.tpl.render(
                MM.plugins.settings.templates.showSync, {tasks: syncTasks}
            );

            MM.panels.show('right', html, {
                title: MM.lang.s("settings") + " - " + MM.lang.s("synchronization")
            });
            // Once the html is rendered, we pretify the widgets.
            MM.widgets.enhance(settings);
            MM.widgets.addHandlers(settings);
        },

        showDevelopment: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var settingsC = [
                {
                    id: 'dev_debug',
                    type: 'checkbox',
                    label: MM.lang.s('enabledebugging'),
                    checked: false,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'dev_offline',
                    type: 'checkbox',
                    label: MM.lang.s('forceofflinemode'),
                    checked: false,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'dev_css3transitions',
                    type: 'checkbox',
                    label: MM.lang.s('enablecss3transitions'),
                    checked: false,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'cache_expiration_time',
                    type: 'spinner',
                    label: MM.lang.s('cacheexpirationtime'),
                    config: {
                        clickPlus: function() {
                            var el = $("#cache_expiration_time-text");
                            var val = parseInt(el.val()) + 25000;
                            el.val(val);
                            MM.setConfig("cache_expiration_time", val);
                        },
                        clickMinus: function() {
                            var el = $("#cache_expiration_time-text");
                            var val = parseInt(el.val()) - 25000;
                            if (val < 0) {
                                val = 0;
                            }
                            el.val(val);
                            MM.setConfig("cache_expiration_time", val);
                        }
                    }
                }
            ];

            // Load default values
            $.each(settingsC, function(index, setting) {
                if (setting.type == 'checkbox') {
                    if (typeof(MM.getConfig(setting.id)) != 'undefined') {
                        settingsC[index].checked = MM.getConfig(setting.id);
                    }
                }
            });

            var html = MM.widgets.renderList(settingsC);

            var settingsB = [
                {
                    id: 'dev_purgecaches',
                    type: 'button',
                    label: MM.lang.s('purgecaches'),
                    handler: MM.cache.purge
                },
                {
                    id: 'dev_deviceinfo',
                    type: 'button',
                    label: MM.lang.s('deviceinfo'),
                    handler: MM.plugins.settings.showDevice
                },
                //{id: 'dev_fakenotifications', type: 'button', label: MM.lang.s('addfakenotifications'), handler: MM.plugins.settings.addFakeNotifications},
                {
                    id: 'dev_showlog',
                    type: 'button',
                    label: MM.lang.s('showlog'),
                    handler: MM.showLog
                },
                {
                    id: 'dev_resetapp',
                    type: 'button',
                    label: MM.lang.s('resetapp'),
                    handler: MM.plugins.settings.resetApp
                }
            ];

            /*
            if (!MM.rdebugger.enabled) {
                settingsB.push({id: 'dev_rdebugging', type: 'button', label: MM.lang.s('enablerdebugger'), handler: MM.rdebugger.start});
            } else {
                settingsB.push({id: 'dev_rdebugging', type: 'button', label: MM.lang.s('disablerdebugger'), handler: MM.rdebugger.finish});
            }
            */

            // Render the settings as html.
            html += MM.widgets.render(settingsB);
            MM.panels.show(
                'right', html, {
                    title: MM.lang.s("settings") + " - " + MM.lang.s("development")
                }
            );

            // Once the html is rendered, we prettify the widgets.
            MM.widgets.enhance(settingsC);
            MM.widgets.addHandlers(settingsC);
            MM.widgets.enhance(settingsB);
            MM.widgets.addHandlers(settingsB);
        },

        checkboxHandler: function(e, setting) {
            setTimeout(function() {
                var val = false;
                if ($('#' + setting.id).is(':checked')) {
                    val = true;
                }

                MM.setConfig(setting.id, val);
            }, 500);
        },

        addFakeNotifications: function(e, setting) {
            var notification = {
                userfrom: 'Component or user from',
                date: 'yesterday',
                id: '123456',
                type: 'calendar',
                urlparams: 'additional data',
                aps: {alert: 'Fake notification'}
            };
            if (MM.plugins.notifications) {
                MM.plugins.notifications.saveAndDisplay({notification: notification})
            }
            // This is for preserving the Backbone hash navigation.
            e.preventDefault();
        },

        _getDeviceInfo: function() {

            var info = "";

            // Add the version name and version code.
            info += "<p><b>Version name:</b> " + MM.config.versionname + "</p>";
            info += "<p><b>Version code:</b> " + MM.config.versioncode + "</p>";

            // Navigator
            var data = ["userAgent", "platform", "appName", "appVersion", "language"];
            for (var i in data) {
                var el = data[i];
                if (typeof(navigator[el]) != "undefined") {
                    info += "<p><b>Navigator " + el + ":</b> " + navigator[el] + "</p>";
                }
            }

            info += "<p><b>location.href:</b> " + location.href + "</p>";

            // MM properties
            data = [
                "deviceReady", "deviceType", "deviceOS", "inComputer", "webApp",
                "clickType", "scrollType"
            ];
            for (var i in data) {
                el = data[i];
                if (typeof(MM[el]) != "undefined") {
                    if (typeof(MM[el]) == "boolean") {
                        var val = (MM[el])? "1" : "0";
                        info += "<p><b>MM." + el + ":</b> " + val + "</p>";
                    } else {
                        info += "<p><b>MM." + el + ":</b> " + MM[el] + "</p>";
                    }
                }
            }
            info += "<p><b>MM.lang.current:</b> " + MM.lang.current + "</p>";

            var status = "Offline";
            if (MM.deviceConnected()) {
                status = "Online";
            }
            info += "<p><b>Internet connection status</b> " + status + "</p>";

            if (MM.util.overflowScrollingSupported()) {
                info += "<p><b>Overflow Scrolling</b> Supported</p>";
            } else {
                info += "<p><b>Overflow Scrolling</b> Not supported</p>";
            }

            info += "<p><b>document.innerWidth</b> "+ $(document).innerWidth() +"</p>";
            info += "<p><b>document.innerHeight</b> "+ $(document).innerHeight() +"</p>";
            info += "<p><b>window.width</b> "+ $(window).width() +"</p>";
            info += "<p><b>window.height</b> "+ $(window).height() +"</p>";
            info += "<p><b>document.width</b> "+ $(document).width() +"</p>";
            info += "<p><b>document.height</b> "+ $(document).height() +"</p>";

            var svgsupport = "No";
            if ((!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect) ||
                 !!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
                svsupport = "Yes";
            }
            info += "<p><b>SVG support</b> "+ svgsupport +"</p>";

            if(typeof(window.device) != "undefined") {
                data = ["name", "phonegap", "cordova", "platform", "uuid", "version", "model"];
                for (var i in data) {
                    var el = data[i];
                    if (typeof(device[el]) != "undefined") {
                        info += "<p><b>Phonegap Device "+el+":</b> "+device[el]+"</p>";
                    }
                }
                info += "<p><b>Phonegap Device fileSystem root:</b><br /> " + MM.fs.getRoot() + "</p>";

                if (window.plugins) {
                    for (var el in window.plugins) {
                        info += "<p><b>Phonegap plugin loaded:</b> " + el + "</p>";
                    }
                } else {
                    info += "<p style=\"color: red\"><b>No plugins available for Phonegap/Cordova</b></p>";
                }

            } else {
                info += "<p style=\"color: red\"><b>Phonegap/Cordova not loaded</b></p>";
            }

            return info;
        },

        showDevice: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var info = MM.plugins.settings._getDeviceInfo();
            var mailBody = encodeURIComponent(info.replace(/<\/p>/ig,"\n").replace(/(<([^>]+)>)/ig,""))
            info += '<div class="centered"><a href="mailto:' + MM.config.current_site.username +'?subject=DeviceInfo&body=' + mailBody + '"><button>' + MM.lang.s("email") + '</button></a></div>';
            info += "<br /><br /><br />";

            MM.panels.html("right", '<div style="padding: 8px">' + info + '</div>');
        },

        showReportbug: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var info = MM.lang.s("reportbuginfo");

            // Some space for the user.
            var mailInfo = MM.lang.s("writeherethebug") + "\n\n\n\n";
            mailInfo += MM.plugins.settings._getDeviceInfo();
            mailInfo += "==========================\n\n";
            mailInfo += MM.getFormattedLog();

            mailInfo = encodeURIComponent(mailInfo.replace(/<\/p>/ig,"\n").replace(/(<([^>]+)>)/ig,""))
            info += '<div class="centered"><a href="mailto:' + MM.lang.s("reportbugmail") +'?subject=[[Mobile App Bug]]&body=' + mailInfo + '"><button>' + MM.lang.s("email") + '</button></a></div>';
            info += "<br /><br /><br />";

            MM.panels.show("right", '<div style="padding: 8px">' + info + '</div>', {title: MM.lang.s("settings") + " - " + MM.lang.s("reportabug")});
        }
    };

    MM.registerPlugin(plugin);
});