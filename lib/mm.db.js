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
    get: function(collection, id) {
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return MM.collections[collection].get(id);
    },
    where: function(collection, conditions) {
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        return MM.collections[collection].where(conditions);
    },
    each: function(collection, fn) {
        // Fetch all the elements from the collection.
        MM.collections[collection].fetch();
        MM.collections[collection].each(fn);
    },
    insert: function(collection, model) {
        // Insert allways the current site identifier.
        if (typeof model.site == "undefined" &&
                MM.config &&
                MM.config.current_site &&
                MM.config.current_site.id) {

            model.site = MM.config.current_site.id;
        }
        return MM.collections[collection].create(model);
    },
    remove: function(collection, modelId) {
        var model = MM.db.get(collection, modelId);
        if (model) {
            return model.destroy();
        } else {
            return false;
        }
    },
    length: function(collection) {
        MM.collections[collection].fetch();
        return MM.collections[collection].length;
    }
};