/**
 * Moodle mobile templates lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.tpl = {
    render: function(text, data, settings) {
    	MM.log("Tol: Rendering template");
        return _.template(text, data, settings);
    }
}