/**
 * Moodle mobile settings lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.displaySettings =  function() {
    
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
};
    
MM.showSettingSection = function(section) {
    // We call dinamically the function.
    MM["showSettings" + section.charAt(0).toUpperCase() + section.slice(1)]();
}

MM.showSettingsSites = function() {
    window.alert('a');
}