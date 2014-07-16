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
 * @fileoverview Library for cache related functionallities.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile cache functionality.
 */
MM.cache = {

    /**
     * Retrieves an element from the cache
     *
     * @param {string} id The unique id for the cached element.
     * @param {boolean} omitExpires If true, we retrieve the element even if the cache is expired.
     */
    getElement: function(id, omitExpires) {

        MM.log(' Trying to get a cached element, id: ' + id, 'Cache');

        // Cache requires a site defined.
		if (typeof(MM.config) == "undefined" || typeof(MM.config.current_site) == "undefined") {
			return false;
		}

        if (typeof omitExpires == 'undefined') {
            omitExpires = false;
        }

        // Cache elements has a prefix indicating the current site.
        id = MM.config.current_site.id + '-' + id;
        cache = MM.db.get('cache', id);

        if (typeof cache == 'undefined' || !cache) {
            MM.log(' Cached element not found, id: ' + id, 'Cache');
            return false;
        }

        cache = cache.toJSON();

        var d = new Date();
        var now = d.getTime();

        if (!omitExpires) {
            if (now > cache.mmcacheexpirationtime) {
                return false;
            }
        }

        if (typeof cache.data != 'undefined') {
            var expires = (cache.mmcacheexpirationtime - now) / 1000;
            MM.log('Cached element found, id: ' + id + ' expires in ' + expires + ' seconds', 'Cache');
            return cache.data;
        }
        return false;
    },

    /**
     * Add an element to the cache
     *
     * @param {string} id The unique id for the element.
     * @param {object} el The element to be added to the cache.
     * @param {string} type The type of element, general, ws, etc..
     */
    addElement: function(id, el, type) {
        MM.log(' Adding element to cache: ' + id, 'Cache');

        if (typeof(type) == 'undefined') {
            type = 'general';
        }

        // Cache requires a site defined.
        if (typeof(MM.config) == "undefined" || typeof(MM.config.current_site) == "undefined" || !MM.config.current_site) {
            return false;
        }

        id = MM.config.current_site.id + '-' + id;

        var cachedEl = {
            id: id,
            data: el,
            type: type,
            mmcacheexpirationtime: 0
        };

        var d = new Date();
        cachedEl.mmcacheexpirationtime = d.getTime() + MM.getConfig('cache_expiration_time', 0);

        MM.db.insert('cache', cachedEl);
        return true;
    },

    /**
     * Remove an element from the cache
     *
     * @param {string} id The unique id for the element.
     */
    removeElement: function(id) {
        MM.log(' Removing element from cache: ' + id, 'Cache');

        // Cache requires a site defined.
        if (typeof(MM.config) == "undefined" || typeof(MM.config.current_site) == "undefined" || !MM.config.current_site) {
            return false;
        }

        id = MM.config.current_site.id + '-' + id;

        MM.db.remove('cache', id);
        return true;
    },

    /**
     * Add a WS call to the cache
     *
     * @param {string} url WS url.
     * @param {object} data WS parameters,.
     * @param {object} res Result of the WS call.
     */
    addWSCall: function(url, data, res) {
        MM.log('Adding a WS cached call: ' + data.wsfunction, 'Cache');

        var key = hex_md5(url + JSON.stringify(data));
        MM.cache.addElement(key, res, 'ws');
        return true;
    },

    /**
     * Retrieves a WS call from the cache
     *
     * @param {string} url WS url.
     * @param {object} data WS parameters.
     * @param {boolean} omitExpires If true, we retrieve the element even if the cache is expired.
     */
    getWSCall: function(url, data, omitExpires) {

        MM.log(' Trying to get a WS cached call: ' + data.wsfunction, 'Cache');

        // Unique hash.
        var key = hex_md5(url + JSON.stringify(data));
        var el = MM.cache.getElement(key, omitExpires);
        return el;
    },

    /**
     * Purge all WS cache
     */
    purge: function() {
        MM.log('purge all caches', 'Cache');
        var els = MM.db.where('cache', {'type': 'ws'});
        _.each(els, function(el) {
            MM.db.remove('cache', el.get('id'));
        });
    },

    /**
     * Invalidate the cache modifing the expiration time
     */
    invalidate: function() {
        MM.log('Invalidate WS caches', 'Cache');
        var els = MM.db.where('cache', {'type': 'ws'});
        _.each(els, function(el) {
            el = el.toJSON();
            el.mmcacheexpirationtime = 0;
            MM.db.insert('cache', el);
        });
    }

};
