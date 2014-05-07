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
 * @fileoverview Moodle mobile settings lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile settings related functionality.
 */
MM.settings = {
    display: function() {

        // Settings plugins.
        var plugins = [];
        for (var el in MM.plugins) {
            var plugin = MM.plugins[el];
            if (plugin.settings.type == 'setting') {
                plugins.push(plugin.settings);
            }
        }

        var pageTitle = MM.lang.s("settings");
        var html = MM.tpl.render($('#settings_template').html(), {plugins: plugins});
        MM.panels.show('center', html, {title: pageTitle});
        if (MM.deviceType == 'tablet') {
			$("#panel-center li:eq(0)").addClass("selected-row");
            MM.settings.showSection('sites');
        }
    },

    showSection: function(section) {
        // We call dinamically the function.
        MM.settings['show' + section.charAt(0).toUpperCase() + section.slice(1)]();
        // Reset the base route.
        MM.Router.navigate("#settings");
    },

    showSites: function() {
        var sites = [];

        MM.db.each('sites', function(el) {
            sites.push(el.toJSON());
        });


        MM.collections.sites.fetch();

        var tpl = '\
            <div class="sites-list">\
            <ul class="nav nav-v">\
            <% _.each(sites, function(site){ %>\
            <li class="nav-item">\
                <div class="site-info">\
                    <a href="#settings/sites/<%= site.id %>"><div class="bd">\
                    <h3><%= MM.util.formatText(site.sitename) %> (<%= MM.util.formatText(site.fullname) %>)\
                    <% if (site.id == current_site) { print(" (*)"); }; %>\
                    </h3>\
                    <%= site.siteurl %> \
                    </div></a>\
                </div>\
                <div class="site-actions">\
                <a href="#settings/sites/delete/<%= site.id %>"><img src="img/delete.png" border="0"></a>\
                </div>\
            </li>\
            <% }); %>\
            </ul></div><br \>\
            <div class="centered"><a href="#settings/sites/add"><button><%= MM.lang.s("addsite") %></button></a></div>';

        var html = MM.tpl.render(tpl, {sites: sites, current_site: MM.config.current_site.id});
        MM.panels.show('right', html, {title: MM.lang.s("settings") + " - " + MM.lang.s("sites")});
    },

    showSite: function(siteId) {
        var site = MM.db.get('sites', siteId);
        var options = {
            title: site.get('sitename'),
            buttons: {}
        };

        var text = '\
        <p><strong>' + MM.lang.s('siteurllabel') + ':</strong> ' + site.get('siteurl') + '</p>\
        <p><strong>' + MM.lang.s('fullname') + ':</strong> ' + site.get('fullname') + '</p>\
        ';

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

        MM.widgets.dialog(text, options);
    },

    deleteSite: function(siteId) {
        var site = MM.db.get('sites', siteId);
        MM.popConfirm(MM.lang.s('deletesite'), function() {
            var count = MM.db.length('sites');
            if (count == 1) {
                MM.db.remove('sites', siteId);
                // Remove file directory.
                MM.fs.removeDirectory(siteId, function() {}, function() {});
                setTimeout(function() {
                    MM.logoutUser();
                }, 1000);
            } else {
                MM.db.remove('sites', siteId);
                MM.settings.deleteSiteFiles(siteId);
                setTimeout(function() {
                    MM.Router.navigate('settings/sites/');
                }, 1000);
            }
        });
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
        var settings = [
            {id: 'sync_ws_on', type: 'checkbox', label: MM.lang.s('enableautosyncws'), checked: true, handler: MM.settings.checkboxHandler},
            {id: 'sync_lang_on', type: 'checkbox', label: MM.lang.s('enableautosynccss'), checked: true, handler: MM.settings.checkboxHandler},
            {id: 'sync_css_on', type: 'checkbox', label: MM.lang.s('enableautosynclang'), checked: true, handler: MM.settings.checkboxHandler}
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

        var tpl = '\
            <h2 class="settings-section"><%= MM.lang.s("taskqueue") %></h2>\
            <% if (tasks.length == 0) { %>\
            <p><%= MM.lang.s("notaskstobesynchronized") %></p>\
            <% } %>\
            <ul class="nav nav-v">\
            <% _.each(tasks, function(task){ %>\
            <li class="nav-item">\
                <%= task.syncData.name %><br>\
                &nbsp;&nbsp;&nbsp;&nbsp;<i><%= task.syncData.description %></i>\
            </li>\
            <% }); %>\
            </ul><br />\
            <div class="centered">\
                <a href="#settings/sync/lang"><button><%= MM.lang.s("forcelangsync") %></button></a>\
            </div>\
            <div class="centered">\
                <a href="#settings/sync/css"><button><%= MM.lang.s("forcecsssync") %></button></a>\
                <div style="clear: both"></div>\
            </div>';

        html += MM.tpl.render(tpl, {tasks: syncTasks});

        MM.panels.show('right', html, {title: MM.lang.s("settings") + " - " + MM.lang.s("synchronization")});
        // Once the html is rendered, we pretify the widgets.
        MM.widgets.enhance(settings);
        MM.widgets.addHandlers(settings);
    },

    /**
     * Delete the downloaded files from a site
     *
     * @param  {string} siteId The site Id in the database.
     */
    deleteSiteFiles: function(siteId) {

        MM.popConfirm(MM.lang.s('deletesitefiles'), function() {
            MM.fs.removeDirectory(siteId, function() {
                //TODO - The content plugins should be noticed about this!
                MM.settings.showSpaceusage();
            },
            function() {
                MM.popErrorMessage(MM.lang.s("unexpectederror"));
            });
        });
        // In case the user "cancel" the confirm popup we have to reset the navigation router.
        MM.Router.navigate('');
    },

    /**
     * Display the space usage setting option
     *
     */
    showSpaceusage: function() {

        var tpl = '\
            <h2 class="settings-section"><%= MM.lang.s("spaceusage") %></h2>\
            <ul class="nav nav-v">\
            <% _.each(sites, function(site){ %>\
            <li class="nav-item">\
                <div class="table-row row-right">\
                    <span id="spacesite<%= site.id %>"><img src="img/loadingblack.gif"></span>\
                    <span id="spacedeletesite<%= site.id %>" style ="display: none"><a href="#settings/spaceusage/empty/<%= site.id %>">\
                    &nbsp;&nbsp;<img width="24" height="24" src="img/delete.png"></a></span>\
                </div>\
                <div class="table-row row-left">\
                    <%= MM.util.formatText(site.sitename) %> (<%= MM.util.formatText(site.fullname) %>)\
                </div>\
            </li>\
            <% }); %>\
            <li class="nav-item">\
                <div class="table-row row-right">\
                    <span id="spacesitetotal">--</span>\
                </div>\
                <div class="table-row row-left">\
                    <%= MM.lang.s("totalusage") %>\
                </div>\
            </li>\
            </ul><br />\
            <div class="centered">\
            <%= MM.lang.s("estimatedfreespace") %>: <strong id="spacefree"><img src="img/loadingblack.gif"></strong>\
            </div>';

        var sites = [];
        MM.db.each('sites', function(el) {
            sites.push(el.toJSON());
        });

        var data = MM.tpl.render(tpl, {sites: sites});

        MM.panels.show("right", data, {title: MM.lang.s("settings") + " - " + MM.lang.s("spaceusage")});

        var sizeTotal = {};
        _.each(sites, function(site){
            MM.fs.directorySize(site.id, function(data) {
                $("#spacesite" + site.id).html(MM.util.bytesToSize(data, 2));
                $("#spacedeletesite" + site.id).css('display', 'inline-block');
                sizeTotal[site.id] = data;

                var sTotal = 0;
                _.each(sizeTotal, function(siteBytes){
                    sTotal += siteBytes;
                    $("#spacesitetotal").html(MM.util.bytesToSize(sTotal, 2));
                });
            }, function(){
                $("#spacesite" + site.id).html(MM.util.bytesToSize(0, 2));
            });
        });

        MM.fs.calculateFreeSpace(function(size) {
            $("#spacefree").html(MM.util.bytesToSize(size, 2));
        }, function() {
            MM.log('Error calculating free space in the ssytem', 'FS')
        });

    },

    showDevelopment: function() {

        var settingsC = [
            {id: 'dev_debug', type: 'checkbox', label: MM.lang.s('enabledebugging'), checked: false,
                handler: function(e, setting) {
                    MM.settings.checkboxHandler(e, setting);
                    // Upgrade the global flag debugging state, we need a second because settings uses also a 500ms timeout.
                    setTimeout(function() {
                        MM.debugging = MM.getConfig('dev_debug');
                    }, 1000);
                }
            },
            {id: 'dev_offline', type: 'checkbox', label: MM.lang.s('forceofflinemode'), checked: false, handler: MM.settings.checkboxHandler},
            {id: 'dev_css3transitions', type: 'checkbox', label: MM.lang.s('enablecss3transitions'), checked: false, handler: MM.settings.checkboxHandler},
            {id: 'cache_expiration_time', type: 'spinner', label: MM.lang.s('cacheexpirationtime'), config: {
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
            {id: 'dev_purgecaches', type: 'button', label: MM.lang.s('purgecaches'), handler: MM.cache.purge},
            {id: 'dev_deviceinfo', type: 'button', label: MM.lang.s('deviceinfo'), handler: MM.settings.showDevice},
            {id: 'dev_fakenotifications', type: 'button', label: MM.lang.s('addfakenotifications'), handler: MM.settings.addFakeNotifications},
            {id: 'dev_showlog', type: 'button', label: MM.lang.s('showlog'), handler: MM.showLog},
            {id: 'dev_resetapp', type: 'button', label: MM.lang.s('resetapp'), handler: MM.settings.resetApp}
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
        MM.panels.show('right', html, {title: MM.lang.s("settings") + " - " + MM.lang.s("development")});

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
        var date = MM.util.timestamp();
        var data = {
            alert: "<b>Fake notification</b>",
            date: date,
            type: 'local_test',
            userfrom: 'Test user',
            foreground: '0',
            site: hex_md5(MM.config.current_site.siteurl + MM.config.current_site.username)
        };
        if (MM.plugins.notifications) {
            setTimeout(function() {
                MM.plugins.notifications.APNSsaveAndDisplay(data);
            }, 5000);
        }
        // This is for preserving the Backbone hash navigation.
        e.preventDefault();
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

            if (siteurl.indexOf('http://localhost') == -1 && ! /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(siteurl)) {
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

                var originalProtocol = "http://";
                if (siteurl.indexOf('https://') === 0) {
                    originalProtocol = "https://";
                } else {
                    siteurl = siteurl.replace("http://", "https://");
                }

                MM.saveSite(username, password, siteurl, originalProtocol);
                if (MM.deviceType == 'phone') {
                    location.href = "index.html";
                }
            }
        };
        options.buttons[MM.lang.s('cancel')] = MM.widgets.dialogClose;

        html = '\
        <form>\
            <p>\
                <input type="url" id="new-url" placeholder="' + MM.lang.s('siteurl') + '">\
                <span class="error"></div>\
            </p>\
            <p>\
                <input type="text" id="new-username" autocapitalize="off" autocorrect="off" placeholder="' + MM.lang.s('username') + '">\
                <span class="error"></div>\
            </p>\
            <p>\
                <input type="password" id="new-password" placeholder="' + MM.lang.s('password') + '">\
                <span class="error"></div>\
            </p>\
        </form>\
        ';

        MM.widgets.dialog(html, options);

        if (typeof(e) !== "undefined") {
            e.preventDefault();
        }
    },

    getDeviceInfo: function() {

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
            "deviceReady", "deviceType", "deviceOS", "inComputer", "inNodeWK", "webApp",
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

            info += "<p><b>Phonegap locale:</b> " + MM.lang.locale + "</p>";

        } else {
            info += "<p style=\"color: red\"><b>Phonegap/Cordova not loaded</b></p>";
        }

        // Node and node-webkit information.
        if (MM.inNodeWK) {
            data = ["version", "platform", "arch"];
            for (var i in data) {
                var el = data[i];
                if (typeof(process[el]) != "undefined") {
                    info += "<p><b>Node "+el+":</b> "+process[el]+"</p>";
                }
            }
            info += "<p><b>Node-webkit version:</b> "+process.versions["node-webkit"]+"</p>";

            var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

            info += "<p><b>Node User Home:</b> <a id=\"nodehomedirectory\" href=\"#\" data-path=\" " + home + "\">"+ home +"</a></p>";
        }

        return info;
    },

    showDevice: function() {

        var info = MM.settings.getDeviceInfo();
        var mailBody = encodeURIComponent(info.replace(/<\/p>/ig,"\n").replace(/(<([^>]+)>)/ig,""))
        info += '<div class="centered"><a href="mailto:' + MM.config.current_site.username +'?subject=DeviceInfo&body=' + mailBody + '"><button>' + MM.lang.s("email") + '</button></a></div>';
        info += "<br /><br /><br />";

        MM.panels.html("right", '<div style="padding: 8px">' + info + '</div>');

        $("#nodehomedirectory").on(MM.quickClick, function(e) {
            var gui = require('nw.gui');
            gui.Shell.showItemInFolder($(this).data("path"));
            e.preventDefault();
            e.stopPropagation();
        });

    },

    showReportbug: function() {

        var info = MM.lang.s("reportbuginfo");

        // Some space for the user.
        var mailInfo = MM.lang.s("writeherethebug") + "\n\n\n\n";
        mailInfo += MM.settings.getDeviceInfo();
        mailInfo += "==========================\n\n";
        mailInfo += MM.getFormattedLog();

        mailInfo = encodeURIComponent(mailInfo.replace(/<\/p>/ig,"\n").replace(/(<([^>]+)>)/ig,""))
        info += '<div class="centered"><a href="mailto:' + MM.lang.s("reportbugmail") +'?subject=[[Mobile App Bug]]&body=' + mailInfo + '"><button>' + MM.lang.s("email") + '</button></a></div>';
        info += "<br /><br /><br />";

        MM.panels.show("right", '<div style="padding: 8px">' + info + '</div>', {title: MM.lang.s("settings") + " - " + MM.lang.s("reportabug")});
    },

    showAbout: function() {
        $.getJSON("about.json", function(data) {
            data.version = MM.config.versionname;
            var info = "\
                <h2><%= data.name %> <%= data.version %></h2>\
                <p><strong>License:</strong> <%= data.license.name %> <%= data.license.link %></p>\
                \
                <p><strong>Credits:</strong><br />\
                <table border='0' cellspacing='6' width='100%'>\
                <% _.each(data.credits, function(person) { %>\
                    <tr><td><%= person.fullname %> </td><td><%= person.company %></td><td> <%= person.contribution %></td></tr>\
                <% }); %>\
                </table></p>\
                \
                <p><strong>Libraries:</strong><br />\
                <table border='0' cellspacing='3' width='100%'>\
                <% _.each(data.thirdpartylibs, function(lib) { %>\
                    <tr><td><%= lib.name %></td><td> <%= lib.version %> </td><td> <%= lib.license %> license</td></tr>\
                <% }); %>\
                </table></p>\
            ";
            MM.panels.show("right", MM.tpl.render(info, {data: data}), {title: MM.lang.s("settings") + " - " + MM.lang.s("about")});
        });
    },

    languageSelected: function(e, setting) {
        var newLang = $("#" + setting.id).val();
        MM.setConfig("lang", newLang);
        $.getJSON('lang/' + newLang + '.json', function(langFile) {
            MM.lang.loadLang('core', newLang, langFile);
            // Refresh site to load new language.
            MM.refresh();
            // Go back two times if we are in Mobile to reach the home page
            // (and avoid displaying the center panel that is cached).
            MM.panels.goBack(MM.panels.goBack);
        });
    },

    showGeneral: function() {
        var settings = [
            {
                id: 'lang',
                type: 'select',
                label: MM.lang.s('language'),
                options: MM.config.languages,
                selected: MM.lang.current,
                handler: MM.settings.languageSelected
            }
        ];

        // Render the settings as html.
        var html = MM.widgets.render(settings);
        MM.panels.show('right', html, {title: MM.lang.s("settings") + " - " + MM.lang.s("general")});

        // Once the html is rendered, we prettify the widgets.
        MM.widgets.enhance(settings);
        MM.widgets.addHandlers(settings);
    }
};
