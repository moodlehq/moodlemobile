/**
 * Moodle mobile settings lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.settings = {
    display:  function() {
        
        // Settings plugins.
        var plugins = [];
        for (var el in MM.plugins) {
            var plugin = MM.plugins[el];
            if (plugin.settings.type == "setting") {
                plugins.push(plugin.settings);
            }
        }
        
        var html = _.template($("#settings_template").html(), {plugins: plugins});
        MM.panels.show("center", html);
        MM.settings.showSection("sites");
    },
    
    showSection: function(section) {
        // We call dinamically the function.
        MM.settings["show" + section.charAt(0).toUpperCase() + section.slice(1)]();
    },
    
    showSites: function() {

        var settings = [
            {id: "add_site", type: "button", label: MM.lang.s("addsite"), url: "settings/sites/add"}
        ];
        
        // Render the settings as html.
        var html = MM.widgets.render(settings);

        MM.collections.sites.fetch();
        var sites = [];
        
        MM.collections.sites.each(function(el) {
            sites.push(el.toJSON());
        });
        
        var tpl = '\
            <div class="sites-list">\
            <ul class="nav nav-v">\
            <% _.each(sites, function(site){ %>\
            <li class="nav-item">\
                <div class="bd">\
                <h3><%= site.sitename %></h3>\
                &nbsp;&nbsp;&nbsp;&nbsp;<i><%= site.siteurl %></i>\
                </div>\
            </li>\
            <% }); %>\
            </ul></div>';
        
        html += _.template(tpl, {sites: sites});
        MM.panels.show("right", html);
        // Once the html is rendered, we pretify the widgets.
        MM.widgets.enhance(settings);
        MM.widgets.addHandlers(settings);

    },

    showSync: function() {
        var settings = [
            {id: "sync_on", type: "checkbox", label: MM.lang.s("enableautosync"), checked: false, handler: MM.settings.checkboxHandler}
        ];

        // Load default values
        $.each(settings, function(index, setting) {
            if (setting.type == "checkbox") {
                if (typeof(MM.getConfig(setting.id)) != "undefined") {
                    settings[index].checked = MM.getConfig(setting.id);
                }
            }
        });
        
        // Render the settings as html.
        var html = MM.widgets.render(settings);

        MM.collections.sync.fetch();
        var syncFilter = MM.collections.sync.where({siteid: MM.config.current_site.id});
        var syncTasks = [];
        
        $.each(syncFilter, function(index, el) {
            syncTasks.push(el.toJSON());
        });
        
        var tpl = '\
            <ul class="nav nav-v">\
            <% _.each(tasks, function(task){ %>\
            <li class="nav-item">\
                <%= task.syncData.name %><br>\
                &nbsp;&nbsp;&nbsp;&nbsp;<i><%= task.syncData.description %></i>\
            </li>\
            <% }); %>\
            </ul>';
        
        html += _.template(tpl, {tasks: syncTasks});

        MM.panels.show("right", html);
        // Once the html is rendered, we pretify the widgets.
        MM.widgets.enhance(settings);
        MM.widgets.addHandlers(settings);
    },
    
    showDevelopment: function() {

        var settings = [
            {id: "dev_debug", type: "checkbox", label: MM.lang.s("enabledebugging"), checked: false, handler: MM.settings.checkboxHandler},
            {id: "dev_offline", type: "checkbox", label: MM.lang.s("forceofflinemode"), checked: false, handler: MM.settings.checkboxHandler},
            {id: "dev_fakenotifications", type: "button", label: MM.lang.s("addfakenotifications"), handler: MM.settings.addFakeNotifications}
        ];

        // Load default values
        $.each(settings, function(index, setting) {
            if (setting.type == "checkbox") {
                if (typeof(MM.getConfig(setting.id)) != "undefined") {
                    settings[index].checked = MM.getConfig(setting.id);
                }
            }
        });
        
        // Render the settings as html.
        var html = MM.widgets.render(settings);
        MM.panels.show("right", html);
        // Once the html is rendered, we pretify the widgets.
        MM.widgets.enhance(settings);
        MM.widgets.addHandlers(settings);
    },
    
    checkboxHandler: function(e, setting) {
        var config = MM.collections.settings;
        
        var val = false;
        if ($("#" + setting.id).is(':checked')) {
            val = true;
        }

        console.log(val);
        console.log(setting);
        config.create({
            id: setting.id,
            name: setting.id,
            value: val
        });
    },
    
    addFakeNotifications: function(e, setting) {
        var notifications = MM.collections.notifications;

        for (var i=0; i < 5 ; i++) {
            notifications.create({
                siteid: MM.config.current_site.id,
                subject: "Notification " + i,
                date: "23 Dec 2012",
                fullmessage: "Full message of the notification, here we have the full text for this notification. This notification is random created"
            });
        }
        // This is for preserving the Backbone hash navigation.
        e.preventDefault();
    }
}