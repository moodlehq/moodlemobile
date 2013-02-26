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
 * @fileoverview Moodle mobile sync lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile sync functionallity.
 */
MM.sync = {
    interval: 0,
    hooks: {},

    init: function() {

        MM.sync.hooks = {
            'ws': {
                handler: MM.wsSync,
                time: MM.config.sync_ws
            },
            'lang': {
                handler: MM.lang.sync,
                time: MM.config.sync_lang
            },
            'css': {
                handler: MM.sync.css,
                time: MM.config.sync_css
            }
        };

        MM.sync.interval = parseInt(MM.config.sync_cron + '');
        MM.log('Sync: process starting in...' + MM.config.sync_cron + ' milliseconds');
        // If we get a integer setting as a string, we force to string allways and parses to int
        setTimeout(function() { MM.sync.syncProcess()}, MM.sync.interval);
    },

    syncProcess: function() {
        var newInterval = 0;
        var nextExecution = 0;
        var d = new Date();
        var call = false;

        MM.log('Sync: process executing, current time: ' + d.getTime());

        for (var el in MM.sync.hooks) {
            call = false;
            var lastExecution = MM.db.get('settings', 'last_sync' + el);

            if (!lastExecution) {
                call = true;
            } else {
                MM.log('Sync: ' + el + ' last execution: ' + lastExecution.get('value') + ', Time: ' + MM.sync.hooks[el].time);
                nextExecution = parseInt(lastExecution.get('value') + '') + MM.sync.hooks[el].time;
                MM.log('Sync: ' + el + ' current time ' + d.getTime() + ', next execution time :' + nextExecution);
                if (d.getTime() > nextExecution) {
                    call = true;
                }
            }

            if (call) {
                MM.sync.callHandler(el, MM.sync.hooks[el]);
                newInterval = (newInterval && newInterval > MM.sync.hooks[el].time) ? MM.sync.hooks[el].time : newInterval;
            } else if (lastExecution) {
                if (lastExecution.get('value') + newInterval > lastExecution.get('value') + MM.sync.hooks[el].time) {
                    newInterval = MM.sync.hooks[el].time;
                }
            }
        }

        newInterval = (!newInterval) ? MM.sync.interval : newInterval;
        MM.log('Sync: new Interval for sync process: ' + newInterval);
        setTimeout(function() { MM.sync.syncProcess()}, newInterval);
    },

    callHandler: function(el, hook) {
        MM.log('Sync: calling hooks for: ' + el);
        var d = new Date();
        var newTime = d.getTime();
        MM.setConfig('last_sync' + el, newTime);
        MM.log('Sync: '+ el + ' setting new execution time: ' + newTime);
        MM.sync.hooks[el].handler();
    },

    /**
     * Function for register hooks from plugins.
     */
    registerHook: function(name, hook) {
        MM.sync.hooks[name] = hook;
    },

    css: function() {
        MM.log('Executing css sync function');
        if (MM.deviceConnected()
                && typeof(MM.config.current_site.mobilecssurl) != 'undefined'
                && MM.config.current_site.mobilecssurl
                && MM.getConfig('sync_css_on')) {

            var cssURL = MM.config.current_site.mobilecssurl;
            $.ajax({
                url: cssURL,
                success: function(data) {
                    MM.cache.addElement('css', data, 'css');
                    $('#mobilecssurl').html(data);
                },
                error: function(xhr, ajaxOptions, thrownError) {
                  var error = MM.lang.s('cannotconnect');
                  if (xhr.status == 404) {
                      error = MM.lang.s('invalidscheme');
                  }
                  MM.log('Sync; Error downloading CSS' + error);
                }
            });
        }
    }
};
