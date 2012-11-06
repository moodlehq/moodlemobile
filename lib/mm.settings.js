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
    
    showDevelopment: function() {

        var settings = [
            {id: "dev_debug", type: "checkbox", label: MM.lang.s("enabledebugging"), checked: false},
            {id: "dev_offline", type: "checkbox", label: MM.lang.s("forceofflinemode"), checked: false},
            {id: "dev_fakenotifications", type: "button", label: MM.lang.s("addfakenotifications"), link: "#settings/development/addfakenotifications/"}
        ];
        
        // Render the settings as html.
        var html = MM.widgets.render(settings);
        MM.panels.show("right", html);
        // Once renderer, we pretify the widgets.
        MM.widgets.enhance(settings);
    }
}