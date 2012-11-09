/**
 * Moodle Mobile data base abstraction lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

MM.db = {
    get: function(collection, id) {
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return MM.collections[collection].get(id);
    },
    where: function(collection, conditions) {
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return  MM.collections[collection].where(conditions);
    },
    each: function(collection, fn) {
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        MM.collections[collection].each(fn);
    },
    insert: function(collection, model) {
        return MM.collections[collection].create(model);
    },
    "delete": function(collection, modelId) {
        var model = MM.db.get(collection, modelId);
        return model.destroy();
    }
};