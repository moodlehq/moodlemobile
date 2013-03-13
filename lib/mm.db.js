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
  * @namespace Holds all the MoodleMobile db functionallity.
 */
MM.db = {
    get: function(collection, id) {
    	MM.log('Get element from DB ' + collection + ' id> ' + id, 'DB');
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return MM.collections[collection].get(id);
    },
    where: function(collection, conditions) {
    	MM.log('Get element from DB using conditiongs', 'DB');
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return MM.collections[collection].where(conditions);
    },
    each: function(collection, fn) {
    	MM.log('Get all elements from DB', 'DB');
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        MM.collections[collection].each(fn);
    },
    insert: function(collection, model) {
    	MM.log('Insert element into DB collection: ' + collection, 'DB');
        return MM.collections[collection].create(model);
    },
    remove: function(collection, modelId) {
    	MM.log('Remove element from DB collection: ' + collection + ' id: ' + modelId, 'DB');
        var model = MM.db.get(collection, modelId);
        return model.destroy();
    },
    length: function(collection) {
        MM.collections[collection].fetch();
        return MM.collections[collection].length; }
};
