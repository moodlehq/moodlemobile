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
    },
    
    showSection: function(section) {
        // We call dinamically the function.
        MM.settings["show" + section.charAt(0).toUpperCase() + section.slice(1)]();
    },
    
    showSites: function() {
        window.alert('a');
    },

    showSync: function() {
        window.alert('a');
    },
    
    showDevelopment: function() {

        var settings = [
            {id: "dev_debug", type: "checkbox", label: MM.lang.s("enabledebugging"), checked: false, handler: MM.settings.checkboxHandler},
            {id: "dev_offline", type: "checkbox", label: MM.lang.s("forceofflinemode"), checked: false, handler: MM.settings.checkboxHandler},
            {id: "dev_fakenotifications", type: "button", label: MM.lang.s("addfakenotifications"), handler: MM.settings.addFakeNotifications}
        ];

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