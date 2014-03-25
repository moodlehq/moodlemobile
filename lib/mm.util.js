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
 * @fileoverview Moodle mobile generic utils lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile extra utilities functionality.
 */
MM.util = {

    SECONDS_DAY: 86400,

    scrollStartPos: 0,

    /**
     * Detects if the device supports touch events
     *
     * @returns {boolean} True if supports touch events
     */
    isTouchDevice: function() {
        if ('ontouchstart' in window || document.ontouchstart || window.ontouchstart) {
            return true;
        }

        try {
            document.createEvent('TouchEvent');
            return true;
        } catch (e) {
            return false;
        }

        return false;
    },

    /**
     * Detects if the device supports native scrolling on overflows div
     *
     * @returns {Boolean} True if supported
     */
    overflowScrollingSupported: function() {
        return ('WebkitOverflowScrolling' in document.body.style
            || 'webkitOverflowScrolling' in document.body.style
            || 'webkitOverflowScrolling' in document.documentElement.style
            || 'WebkitOverflowScrolling' in document.documentElement.style);
    },

    /**
     * Makes an old device supports a fake touch scrolling on overflows div
     *
     * @param {string} id Element DOM id
     */
    touchScroll: function(id) {
        id = 'panel-' + id;
        var el = document.getElementById(id);

        document.getElementById(id).addEventListener('touchstart', function(event) {
            MM.scrollStartPos = this.scrollTop + event.touches[0].pageY;
        }, false);

        document.getElementById(id).addEventListener('touchmove', function(event) {
            MM.touchMoving = true;
            this.scrollTop = MM.scrollStartPos - event.touches[0].pageY;
            // Ugly Hack for fix horizontal scrolling
            if (MM.panels.currentPanel == "right") {
                $(this).scrollLeft(0);
            }
        }, false);

        document.getElementById(id).addEventListener('touchend', function(event) {
            MM.touchMoving = false;
        });
    },

    setPanelsScreenHeight: function() {
        // Force the height of the panels to the screen height.
        $('#add-site, #main-wrapper, #panel-left').css('height', $(document).innerHeight());

        var headerHeight = $('.header-wrapper').height();
        $('#panel-center, #panel-right').css('height', $(document).innerHeight() - headerHeight);
    },

    setPanelsMinScreenHeight: function() {
        // Force the height of the panels to the screen height.
        $('#add-site, #main-wrapper').css('min-height', $(document).innerHeight());
        $('#panel-left').css('min-height', $(document).innerHeight() + 100);

        var headerHeight = $('.header-wrapper').height();
        $('#panel-center, #panel-right').css('min-height', $(document).innerHeight() - headerHeight);
    },

    /**
     * When performing animations on panels, sometimes overflow properties are lost
     *
     */
    applyOverflow: function(position) {
        $('#panel-' + position).css('overflow', 'scroll');
        if (MM.util.isTouchDevice() && MM.util.overflowScrollingSupported()) {
            $('#panel-' + position).css({webkitOverflowScrolling: 'touch'});
        }
    },

    /**
     * For avoid horizontal scrolling in old devices
     * We apply this hack only on modern Android devices (Android 4 and above)
     * See https://tracker.moodle.org/browse/MOBILE-487
     */
    avoidHorizontalScrolling: function() {

        $(window).scroll(function () {
            if (MM.panels.currentPanel == "right" &&
                MM.deviceOS == 'android' &&
                window.device &&
                parseInt(window.device.version.charAt(0)) >= 4) {

                $(this).scrollLeft(0);
                $('#panel-' + MM.panels.currentPanel).css('left', '0px');
            }
        });
    },

    /**
     * This function should be applied to any piece of text to be displayed in the application
     *
     * @param {string} text The text to be formatted
     */
    formatText: function (text) {
        // Links should open in new browser.
        text = text.replace(/<a([^>]+)>/g,"<a target=\"_blank\" $1>");;

        // Multilang tags
        // Match the current language
        var re = new RegExp('<(?:lang|span)[^>]+lang="' + MM.lang.current + '"[^>]*>(.*?)<\/(?:lang|span)>',"g");
        text = text.replace(re, "$1");
        // Delete the rest of languages
        text = text.replace(/<(?:lang|span)[^>]+lang="([a-zA-Z0-9_-]+)"[^>]*>(.*?)<\/(?:lang|span)>/g,"");

        // Replace the pluginfile donwload links with the correct ones.

        // Escape the special chars in the site URL (we use the site url as part of the pattern).
        var url = MM.config.current_site.siteurl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

        // Add the missing part of the reg. expr. We replace src/links like "http://..." or 'http://...'
        var expr = new RegExp(url + "[^\"']*", "gi")
        text = text.replace(expr, MM.fixPluginfile);

        return text;
    },

    /**
     * Function for clean HTML tags
     * @param  {str} text The text to be cleaned
     * @return {str}      Text cleaned
     */
    cleanTags: function(text) {
        // First, we use a regexpr.
        text = text.replace(/(<([^>]+)>)/ig,"");
        // Then, we rely on the browser. We need to wrap the text to be sure is HTML.
        return $("<p>" + text + "</p>").text();
    },

    /**
     * Display the help me login popup dialog in the login screen
     */
    helpMeLogin: function () {
        MM.widgets.dialog(MM.lang.s("helpmelogin"), {title: MM.lang.s("help"), marginTop: "10%"});
        $("#app-dialog .modalContent").css("text-align", "left");
        MM.handleExternalLinks('#app-dialog .modalContent a[target="_blank"]');
        MM.Router.navigate("");
    },

    /**
     * Returns the file name part of an url
     *
     * @param  {string} url The full file name
     * @return {string}     The file name without extra get params
     */
    getFileNameFromURL: function (url) {
        var paramsPart = url.lastIndexOf("?");
        if (paramsPart) {
            url = url.substring(0, paramsPart);
        }
        return url.substr(url.lastIndexOf("/") + 1);
    },

    /**
     * Returns the file extension of a file (.xxx)
     * @param  {string} filename The file name
     * @return {string}          The extension
     */
    getFileExtension: function (filename) {
        return filename.substr(filename.lastIndexOf(".") + 1);
    },

    /**
     * This function gets the path of a Moodle file looking online or offline
     * if the Mobile is not connected to the Internet
     * @param  {string} file The file path (usually a url)
     * @return {string}      A local or URL path
     */
    getMoodleFilePath: function (fileurl, courseId) {

        if (!courseId) {
            courseId = 1;
        }

        var downloadURL = MM.fixPluginfile(fileurl);

        var filename = hex_md5(fileurl);

        // TODO:
        // Object for the sake of it?
        // Either split into two variables (recommended)
        // Or make a new class type and pass that around.
        var path = {
            directory: MM.config.current_site.id + "/" + courseId,
            file: MM.config.current_site.id + "/" + courseId + "/" + filename
        };

        // We download the file asynchronously
        MM.fs.init(function() {
            MM.log("Starting download of Moodle file: " + downloadURL);
            // All the functions are asynchronous, like createDir.
            MM.fs.createDir(path.directory, function() {
                MM.log("Downloading Moodle file to " + path.file + " from URL: " + downloadURL);

                MM.moodleDownloadFile(downloadURL, path.file,
                    function(fullpath) {
                        MM.log("Download of content finished " + fullpath + " URL: " + downloadURL);
                    },
                    function(fullpath) {
                       MM.log("Error downloading " + fullpath + " URL: " + downloadURL);
                    }
                );
            });
        });

        var moodleFilePath = "";
        if (MM.deviceConnected()) {
            moodleFilePath = MM.fixPluginfile(fileurl);
        } else if (MM.fs.loaded()) {
            var root = MM.fs.getRoot();
            moodleFilePath = root + "/" + path.file;
        }

        return moodleFilePath;
    },

    /**
     * Convert size in bytes into human readable format
     * http://codeaid.net/javascript/convert-size-in-bytes-to-human-readable-format-(javascript)
     *
     * @param {integer} bytes     Number of bytes to convert
     * @param {integer} precision Number of digits after the decimal separator
     * @return {string}
     */
    bytesToSize: function(bytes, precision) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        var posttxt = 0;
        if (bytes === 0) {
            return 'n/a';
        }
        if (bytes < 1024) {
                return Number(bytes) + " " + sizes[posttxt];
        }
        while( bytes >= 1024 ) {
                posttxt++;
                bytes = bytes / 1024;
        }
        return Math.round(bytes, precision) + " " + sizes[posttxt];
    },

    /**
     * Check if a web service if available in the remote Moodle site.
     *
     * @return {bool} True if the web service exists (depends on Moodle version)
     */
    wsAvailable: function(wsName) {
        var available = false;
        _.each(MM.config.current_site.functions, function(f) {
            if (f.name == wsName) {
                available = true;
            }
        });
        return available;
    },

    /**
     * Return the current timestamp (UNIX format, seconds)
     * @return {int} The current timestamp in seconds
     */
    timestamp: function() {
        return Math.round(new Date().getTime() / 1000);
    },

    /**
     * Returns a UNIX timestamp (seconds) in human readable format
     *
     * @param  {integer} timestamp UNIX timestamp
     * @return {string}           Human readable data
     */
    timestampToUserDate: function(timestamp) {
        // Javascript timestamps are in milliseconds.
        var d = new Date(timestamp * 1000);
        return d.toLocaleString();
    },

    /**
     * Returns hours, minutes and seconds in a human readable format
     *
     * @param  {integer} seconds A number of seconds
     * @return {string}         Human readable seconds formatted
     */
    formatSeconds: function(seconds) {
        var SECS_PER_MIN = 60;
        var SECS_PER_HOUR = 3600;

        var hours =  Math.floor(seconds / SECS_PER_HOUR);
        var minutes = seconds / SECS_PER_MIN;
        var minsLeft = Math.floor(minutes % SECS_PER_MIN);
        var secsLeft =  Math.floor(seconds % SECS_PER_MIN);

        if (hours < 10) {
          hours = "0" + hours;
        }
        if (minsLeft < 10) {
          minsLeft = "0" + minsLeft;
        }
        if (secsLeft < 10) {
          secsLeft = "0" + secsLeft;
        }

        var time = hours + ':' + minsLeft + ':' + secsLeft;
        return time;
    },

    /**
     * Shorten a text, truncating at the last word if possible.
     *
     * @param  {str} text   The text to be shortened
     * @param  {int} length Maximum length allowed
     * @return {str}        The text shortened
     */
    shortenText: function(text, length) {
        if (text.length > length) {
            text = text.substr(0, length - 1);

            // Now, truncate at the last word boundary (if exists).
            var lastWordPos = text.lastIndexOf(' ');
            if (lastWordPos > 0) {
                text = text.substr(0, lastWordPos);
            }
            text += '&hellip;';
        }
        return text;
    }
};
