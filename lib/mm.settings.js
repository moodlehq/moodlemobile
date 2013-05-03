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
  * @namespace Holds all the MoodleMobile settings related functionallity.
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
                    <h3><%= MM.util.formatText(site.sitename) %>\
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
            modal: true,
            resizable: false,
            buttons: {}
        };

        var text = '\
        <h4>' + site.get('sitename') + '</h4>\
        <p><strong>' + MM.lang.s('siteurllabel') + ':</strong> ' + site.get('siteurl') + '</p>\
        <p><strong>' + MM.lang.s('fullname') + ':</strong> ' + site.get('fullname') + '</p>\
        ';

        if (siteId != MM.config.current_site.id) {
            options.buttons[MM.lang.s('select')] = function() {
                $(this).dialog('close');
                MM.loadSite(siteId);
            };
        }
        /*
        options.buttons[MM.lang.s("delete")] = function() {
            MM.Router.navigate("settings/sites/delete/" + siteId, {trigger: true, replace: true});
        };*/
        options.buttons[MM.lang.s('cancel')] = function() {
            $(this).dialog('close');
            MM.Router.navigate('settings/sites/');
        };

        MM.widgets.dialog(text, options);
    },

    deleteSite: function(siteId) {
        var site = MM.db.get('sites', siteId);
        MM.popConfirm(MM.lang.s('deletesite'), function() {
            var count = MM.db.length('sites');
            if (count == 1) {
                MM.widgets.dialogClose();
                MM.popErrorMessage(MM.lang.s('donotdeletesite'));
            } else {
                MM.db.remove('sites', siteId);
            }
        });
    },

    resetApp: function() {
        MM.popConfirm(MM.lang.s('areyousurereset'), function() {
            // Delete all the entries in local storage
            for (var el in localStorage) {
                localStorage.removeItem(el);
            }
            // Redirect to maing page
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

    showDevelopment: function() {

        var settingsC = [
            {id: 'dev_debug', type: 'checkbox', label: MM.lang.s('enabledebugging'), checked: false, handler: MM.settings.checkboxHandler},
            {id: 'dev_offline', type: 'checkbox', label: MM.lang.s('forceofflinemode'), checked: false, handler: MM.settings.checkboxHandler},
            {id: 'dev_css3transitions', type: 'checkbox', label: MM.lang.s('enablecss3transitions'), checked: false, handler: MM.settings.checkboxHandler},
            {id: 'cache_expiration_time', type: 'slider',
                config: {
                    range: 'max',
                    min: 0,
                    max: 600,
                    value: MM.config.cache_expiration_time / 1000,
                    slide: function(event, ui ) {
                        $('#cache_expiration_time-text').val(ui.value);
                        MM.setConfig('cache_expiration_time', parseInt(ui.value + '') * 1000);
                    }
                },
                label: MM.lang.s('cacheexpirationtime')
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
            {id: 'dev_fakenotifications', type: 'button', label: MM.lang.s('addfakenotifications'), handler: MM.settings.addFakeNotifications},
            {id: 'dev_resetapp', type: 'button', label: MM.lang.s('resetapp'), handler: MM.settings.resetApp},
            {id: 'dev_showlog', type: 'button', label: MM.lang.s('showlog'), handler: MM.showLog},
            {id: 'dev_deviceinfo', type: 'button', label: MM.lang.s('deviceinfo'), handler: MM.settings.showDevice},
            {id: 'dev_purgecaches', type: 'button', label: MM.lang.s('purgecaches'), handler: MM.cache.purge}
        ];
        
        if (!MM.rdebugger.enabled) {
            settingsB.push({id: 'dev_rdebugging', type: 'button', label: MM.lang.s('enablerdebugger'), handler: MM.rdebugger.start});
        } else {
            settingsB.push({id: 'dev_rdebugging', type: 'button', label: MM.lang.s('disablerdebugger'), handler: MM.rdebugger.finish});
        }

        // Render the settings as html.
        html += MM.widgets.render(settingsB);

        // Add the Database manager.


        MM.panels.show('right', html, {title: MM.lang.s("settings") + " - " + MM.lang.s("development")});
        // Once the html is rendered, we pretify the widgets.
        MM.widgets.enhance(settingsC);
        MM.widgets.addHandlers(settingsC);
        MM.widgets.enhance(settingsB);
        MM.widgets.addHandlers(settingsB);
    },

    showGeneral: function() {

        var settings = [
            {
                id: 'cache_expiration_time',
                type: 'slider',
                config: {
                    range: 'max',
                    min: 0,
                    max: 600,
                    value: MM.config.cache_expiration_time / 1000,
                    slide: function(event, ui ) {
                        $('#cache_expiration_time-text').val(ui.value);
                        MM.setConfig('cache_expiration_time', parseInt(ui.value + '') * 1000);
                    }
                },
                label: MM.lang.s('cacheexpirationtime')
            }
        ];

        // Render the settings as html.
        var html = MM.widgets.render(settings);
        html += '<br /><div class="centered"><a href="#settings/general/purgecaches"><button> ' + MM.lang.s('purgecaches') + '</button></a></div>';

        MM.panels.show('right', html, {title: MM.lang.s("settings") + " - " + MM.lang.s("general")});
        // Once the html is rendered, we pretify the widgets.
        MM.widgets.enhance(settings);
        MM.widgets.addHandlers(settings);
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

    addSite: function(e, setting) {

        var html = '';

        var options = {
            title: MM.lang.s('addsite'),
            modal: true,
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

            // We first try to fix the site url
            if (siteurl.indexOf('http://') !== 0 && siteurl.indexOf('https://') !== 0) {
                // First we try https
                siteurl = "https://" + siteurl;
            }

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
                $(this).dialog('close');
                MM.saveSite(username, password, siteurl);
                if (MM.deviceType == 'phone') {
                    location.href = "index.html";
                }
            }
        };
        options.buttons[MM.lang.s('cancel')] = function() {
            $(this).dialog('close');
        };

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
        e.preventDefault();
    },
    
    getDeviceInfo: function() {

        var info = "";

        // Add the version name and version code.
        info += "<p><b>Version name:</b> "+MM.config.versionname+"</p>";
        info += "<p><b>Version code:</b> "+MM.config.versioncode+"</p>";

        // Navigator
        var data = ["userAgent", "platform", "appName", "appVersion", "language"];
        for (var i in data) {
            var el = data[i];
            if (typeof(navigator[el]) != "undefined") {
                info += "<p><b>Navigator "+el+":</b> "+navigator[el]+"</p>";
            }
        }
        
        info += "<p><b>location.href:</b> " + location.href + "</p>";
        
        // MM properties
        data = ["deviceReady", "deviceType", "deviceOS", "inComputer", "webApp", "clickType", "scrollType"];
        for (var i in data) {
            el = data[i];
            if (typeof(MM[el]) != "undefined") {
                if (typeof(MM[el]) == "boolean") {
                    var val = (MM[el])? "1" : "0";
                    info += "<p><b>MM."+el+":</b> "+val+"</p>";
                } else {
                    info += "<p><b>MM."+el+":</b> "+MM[el]+"</p>";
                }
            }
        }
        info += "<p><b>MM.lang.current:</b> "+MM.lang.current+"</p>";
        
        var status = "Offline";
        if (MM.deviceConnected()) {
            status = "Online";
        }
        info += "<p><b>Internet connection status</b> " + status + "</p>";

        if ( MM.util.overflowScrollingSupported() ) {
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

        var info = MM.settings.getDeviceInfo();
        var mailBody = encodeURIComponent(info.replace(/<\/p>/ig,"\n").replace(/(<([^>]+)>)/ig,""))
        info += '<div class="centered"><a href="mailto:' + MM.config.current_site.username +'?subject=DeviceInfo&body=' + mailBody + '"><button>' + MM.lang.s("email") + '</button></a></div>';
        info += "<br /><br /><br />";

        MM.panels.html("right", '<div style="padding: 8px">' + info + '</div>');
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
    }
};
