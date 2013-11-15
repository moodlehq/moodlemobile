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
 * @fileoverview Moodle mobile database abstraction lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile database functionality.
 */
MM.db = {
    /**
     * Gets the model with the specified id from the specified collection.
     *
     * @param {String} collection The name of the collection to query
     * @param {int}    id         The id of the model to get
     *
     * @return undefined|{Object} If no object is found, then undefined.
     */
    get: function(collection, id) {
        MM.log('Get element from DB ' + collection + ' id> ' + id, 'DB');

        var response = undefined;

        var collection = MM.db._getCollection(collection);

        if (collection !== undefined) {
            collection.fetch();
            response = collection.get(id);
        }

        return response;
    },

    /**
     * Gets the specified collection, first looking for a site specific instance
     * and failing that, looking for a global instance.
     *
     * @param {String} collection The collection to return
     *
     * @return undefined|{Collection} The requested collection, or undefined if
     *                                none is found.
     */
    _getCollection: function(collection) {
        var response = undefined;

        if (MM.collections[MM.config.current_site.id] !== undefined &&
            MM.collections[MM.config.current_site.id][collection] !== undefined
        ) {
            response = MM.collection[MM.config.current_site.id];
        } else if (MM.collections[collection] !== undefined) {
            response = MM.collections[collection];
        }

        return response;
    },

    /**
     * Gets the models that match the specified conditions from the specified
     * collection.
     *
     * @param {String} collection The name of the collection to query
     * @param {Object} conditions The attributes returned objects must have.
     *
     * @return {Array} The array of objects whose attributes match the given
     *                 conditions.
     */
    where: function(collection, conditions) {
        MM.log('Get element from DB using conditions', 'DB');

        var collection = MM.db._getCollection(collection);
        var response = undefined;
        if (collection !== undefined) {
            collection.fetch();
            response = collection.where(conditions);
        }

        return response;
    },

    /**
     * Iterates over the collection, with each element being passed as the first
     * and only parameter of the supplied function.
     *
     * @param {String}   collection The name of the collection
     * @param {Function} func       The function to call on each element.
     *
     * @return void
     */
    each: function(collection, func) {
        MM.log('Get all elements from DB', 'DB');

        // Early return because the supplied function wasn't a function.
        if (typeof(func) !== "function") {
            return;
        }

        var collection = MM.db._getCollection(collection);
        if (collection !== undefined) {
            collection.fetch();
            collection.each(func);
        }
    },

    /**
     * Inserts the specified model into the specified collection.
     *
     * @param {String} collection The collection to insert into
     * @param {Object} model      The attributes of the model to create
     *
     * @return undefined|{Object} The newly created model or undefined if either
     *                            the collection didn't exist, or the model
     *                            failed to be created. There will be validation
     *                            errors if the latter.
     */
    insert: function(collection, model) {
        var collection = MM.db._getCollection(collection);
        var response = undefined;

        if (collection !== undefined) {
            MM.log('Insert element into DB collection: ' + collection, 'DB');
            response = collection.create(model);
        }

        return response;
    },

    /**
     * Removes the specified model id from the specified collection.
     * If the collection is global, this will remove the model from all sites
     * that require it.
     *
     * @param {String} collection The collection to remove data from
     * @param {int}    modelId    The model id to remove
     *
     * @return jqXHR|false jqXHR object normally, false on error
     */
    remove: function(collection, modelId) {
        MM.log('Remove element from DB collection: ' + collection + ' id: ' + modelId, 'DB');
        var model = MM.db.get(collection, modelId);
        return model.destroy();
    },

    /**
     * Returns the number of models within the specified collection
     *
     * @param {String} collection The collection to query
     *
     * @return undefined|{int} Undefined if the collection isn't found, the number
     *                         of elements otherwise.
     */
    length: function(collection) {
        var collection = MM.db._getCollection(collection);
        var length = undefined;
        if (collection !== undefined) {
            collection.fetch();
            length = collection.length;
        }

        return length;
    },

    /**
     * Returns whether the specified collection exists, either as a site specific
     * collection or globally.
     *
     * @param {String} collection The collection to check the existence of
     *
     * @return {Bool} TRUE if the collection exists, FALSE otherwise.
     */
    exists: function(collection) {
        return MM.db._getCollection(collection) !== undefined;
    },

    /**
     * Updates the element with the specified id, within the specified collection
     * with the specified updatedDetails.
     *
     * @param {String} collection     The collection to update
     * @param {int}    id             The id of the model to update
     * @param {Object} updatedDetails The attributes on the model to update.
     *
     * @return void
     */
    update: function(collection, id, updatedDetails) {
        var element = MM.db.get(collection, id);
        if (element !== undefined) {
            element.set(updatedDetails);
        }
    },

    /**
     * Gets the settings for the current site.
     *
     * @return {Object} The object representing site settings.
     */
    getSiteConfig: function() {
        var siteConfig = [];
        if (MM.config.current_site !== undefined) {
            siteConfig = MM.db.get('settings', MM.config.current_site.id);
        }

        return siteConfig;
    }
};