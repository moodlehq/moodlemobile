/**
 * Moodle Mobile data base abstraction lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

MM.db = {
    get: function(collection, id) {
    	MM.log("DB: Get element from DB " + collection + " id> " + id);
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return MM.collections[collection].get(id);
    },
    where: function(collection, conditions) {
    	MM.log("DB: Get element from DB using conditiongs");
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return  MM.collections[collection].where(conditions);
    },
    each: function(collection, fn) {
    	MM.log("DB: Get all elements from DB");
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        MM.collections[collection].each(fn);
    },
    insert: function(collection, model) {
    	MM.log("DB: Insert element into DB collection: " + collection);
        return MM.collections[collection].create(model);
    },
    remove: function(collection, modelId) {
    	MM.log("DB: Remove element from DB collection: " + collection + " id: " + modelId);
        var model = MM.db.get(collection, modelId);
        return model.destroy();
    },
    length: function(collection) {
        MM.collections[collection].fetch()
        return MM.collections[collection].length;    }
};