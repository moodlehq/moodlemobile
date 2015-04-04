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
 * @fileoverview Ifaa Campus generic utils lib.
 * @author <a href="mailto:mail@ifaaonline.com">Tech Team</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the ifaacampus extra utilities functionality.
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
        return ('WebkitOverflowScrolling' in document.body.style ||
            'webkitOverflowScrolling' in document.body.style ||
            'webkitOverflowScrolling' in document.documentElement.style ||
            'WebkitOverflowScrolling' in document.documentElement.style);
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

    filterTextImgURL: function(full, text) {
        if (!text) {
            return "";
        }
        var md5 = hex_md5(text);
        return '<img src="' + MM.config.current_site.siteurl + "/filter/tex/pix.php/" + md5 + '">';
    },

    /**
     * This function should be applied to any piece of text to be displayed in the application
     *
     * @param {string} text The text to be formatted
     */
    formatText: function (text, clean, courseId) {
        if (!text) {
            return "";
        }
        // Links should open in new browser.
        text = text.replace(/<a([^>]+)>/g,"<a target=\"_blank\" $1>");

        // Multilang tags
        // Match the current language
        var re = new RegExp('<(?:lang|span)[^>]+lang="' + MM.lang.current + '"[^>]*>(.*?)<\/(?:lang|span)>',"g");
        text = text.replace(re, "$1");
        // Delete the rest of languages
        text = text.replace(/<(?:lang|span)[^>]+lang="([a-zA-Z0-9_-]+)"[^>]*>(.*?)<\/(?:lang|span)>/g,"");

        // TeX filter. (Special case for labels mainly).
        var ft = text.match(/\$\$(.+?)\$\$/);
        if (ft) {
            text = text.replace(/\$\$(.+?)\$\$/g, MM.util.filterTextImgURL);
        }

        // Replace the pluginfile donwload links with the correct ones.

        if (!MM.config.current_site) {
            return text;
        }
        // Escape the special chars in the site URL (we use the site url as part of the pattern).
        var url = MM.config.current_site.siteurl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

        // Add the missing part of the reg. expr. We replace src/links like "http://..." or 'http://...'
        var expr = new RegExp(url + "[^\"']*", "gi");
        text = text.replace(expr, function(match) {
            if (!courseId) {
                courseId = 1;
            }
            return MM.util.getMoodleFilePath(match, courseId);
        });

        if (clean) {
            return MM.util.cleanTags(text);
        } else {
            return text;
        }
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
        text = $("<p>" + text + "</p>").text();
        // Recover new lines.
        text = text.replace(/(?:\r\n|\r|\n)/g, '<br />');
        return text;
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

    getDirectoryAndFile: function(path) {
        var file = path.substr(path.lastIndexOf("/") + 1);
        var directory = path.substr(0, path.lastIndexOf("/"));

        return {'file': file, 'directory': directory};
    },

    /**
     * Returns the file extension of a file (.xxx)
     * @param  {string} filename The file name
     * @return {string}          The extension
     */
    getFileExtension: function (filename) {
        return filename.substr(filename.lastIndexOf(".") + 1);
    },

    replaceFile: function(oldSrc, newSrc) {
        var oldFile = $("img[src$='"+ oldSrc +"']");
        if (oldFile) {
            oldFile.attr("src", newSrc);
            MM.log("Replaced " + oldSrc + " by cached " + newSrc);
        }
    },

    /**
     * This function downloads a file from Moodle if the file is already downloaded the function replaces the www reference with
     * the internal file system reference
     *
     * @param  {string} file The file path (usually a url)
     * @return {string}      A local or URL path
     */
    getMoodleFilePath: function (fileurl, courseId, siteId, token) {

        // This function is used in regexp callbacks, better not to risk!!
        if (!fileurl) {
            return '';
        }

        if (!courseId) {
            courseId = 1;
        }

        if (!siteId) {
            siteId = MM.config.current_site.id;
        }

        if (!token) {
            var site = MM.db.get('sites', siteId);
            token = site.get('token');
        }

        var downloadURL = MM.fixPluginfile(fileurl, token);
        var extension = "." + fileurl.split('.').pop();
        if (extension.indexOf(".php") === 0) {
            extension = "";
        }

        var filename = hex_md5(fileurl) + extension;

        var path = {
            directory: siteId + "/" + courseId,
            file:      siteId + "/" + courseId + "/" + filename
        };

        // We download the file asynchronously because this function must to be sync.
        MM.fs.init(function() {
            MM.fs.fileExists(path.file,
            function(path) {
                MM.util.replaceFile(downloadURL, path);
            },
            function() {});

            if (MM.deviceConnected()) {
                MM.log("Starting download of Moodle file: " + downloadURL);
                // All the functions are asynchronous, like createDir.
                MM.fs.createDir(path.directory, function() {
                    MM.log("Downloading Moodle file to " + path.file + " from URL: " + downloadURL);

                    MM.moodleDownloadFile(downloadURL, path.file,
                        function(fullpath) {
                            MM.util.replaceFile(downloadURL, fullpath);
                            MM.log("Download of content finished " + fullpath + " URL: " + downloadURL);
                        },
                        function(fullpath) {
                           MM.log("Error downloading " + fullpath + " URL: " + downloadURL);
                        }
                    );
                });
            }
        });

        return downloadURL;
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
    wsAvailable: function(wsName, site) {
        site = site || null;

        if (!site && (!MM.config || !MM.config.current_site)) {
            return false;
        }
        var available = false;

        var functions = [];
        if (site) {
            functions = site.get("functions");
        } else {
            functions = MM.config.current_site.functions;
        }

        _.each(functions, function(f) {
            if (f.name == wsName) {
                available = true;
            }
        });
        return available;
    },

    /**
     * Check WS Version.
     *
     * @return {str} The WS version, 0 none
     */
    wsVersion: function(wsName) {
        var version = "0";
        _.each(MM.config.current_site.functions, function(f) {
            if (f.name == wsName) {
                version = f.version;
            }
        });
        return version;
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
    },

    /**
     * Formats a URL, trim, lowercase, etc...
     *
     * @param  {str} url The url to be formatted
     * @return {str}     The url formatted
     */
    formatURL: function(url) {

        url = $.trim(url);

        // Check if the URL starts by http or https.
        if (! /^http(s)?\:\/\/.*/i.test(url)) {
            // Test first allways https.
            url = "https://" + url;
        }

        // http allways in lowercase.
        url = url.replace(/^http/i, 'http');
        url = url.replace(/^https/i, 'https');

        // Replace last slash.
        url = url.replace(/\/$/, "");

        return url;
    },

    createLinks: function(text) {
        replacePattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        return text.replace(replacePattern, '<a href="#" onclick="window.open(\'$1\', \'_system\');">$1</a>');
    },

    dataURItoBlob: function(dataURI) {
        // convert base64 to raw binary data held in a string
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var arrayBuffer = new ArrayBuffer(byteString.length);
        var _ia = new Uint8Array(arrayBuffer);
        for (var i = 0; i < byteString.length; i++) {
            _ia[i] = byteString.charCodeAt(i);
        }

        var dataView = new DataView(arrayBuffer);
        var blob = new Blob([dataView], { type: mimeString });
        return blob;
    },

    /**
     * Format nicely time "X day month year.. ago"
     * Credits: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
     *
     * @param  {Number} date UNIX timestamp (in seconds)
     * @return {String}      The time nicely formatted
     */
    printTimeAgo: function(date) {
        // Convert to javascript timestamp (millisecs)
        date *= 1000;
        var seconds = Math.floor((new Date() - date) / 1000);

        var intervalType;

        var interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            intervalType = 'years';
        } else {
            interval = Math.floor(seconds / 2592000);
            if (interval >= 1) {
                intervalType = 'months';
            } else {
                interval = Math.floor(seconds / 86400);
                if (interval >= 1) {
                    intervalType = 'days';
                } else {
                    interval = Math.floor(seconds / 3600);
                    if (interval >= 1) {
                        intervalType = "hours";
                    } else {
                        interval = Math.floor(seconds / 60);
                        if (interval >= 1) {
                            intervalType = "minutes";
                        } else {
                            interval = seconds;
                            intervalType = "seconds";
                        }
                    }
                }
            }
        }

        return interval + " " + MM.lang.s(intervalType).toLowerCase();
    },

    pagingBar: function(count, page, perPage, baseURL, pageVar) {
        var pageLinks = [];
        var firstLink, lastLink, nextLink, link, previousLink, currPage;

        // Force integer numbers.
        count = parseInt(count, 10);
        page = parseInt(page, 10);
        perPage = parseInt(perPage, 10);

        // Max number of links to be displayed.
        var maxDisplay = 10;
        if (MM.deviceType == 'tablet') {
            maxDisplay = 18;
        }

        if (count > perPage) {
            var pageNum = page - 1;

            if (page > 0) {
                link = baseURL.replace(pageVar, pageNum);
                previousLink = '<a href="' + link + '" class="previous">' + MM.lang.s("previous") + '</a>';
            }

            if (perPage > 0) {
                lastPage = Math.ceil(count / perPage);
            } else {
                lastPage = 1;
            }

            if (page > Math.round((maxDisplay/3)*2)) {
                currPage = page - Math.round(maxDisplay/3);
                link = baseURL.replace(pageVar, 0);
                firstLink = '<a href="' + link + '" class="first">1</a>';
            } else {
                currPage = 0;
            }

            var displayCount = 0;
            var displayPage = 0;

            while (displayCount < maxDisplay && currPage < lastPage) {
                displayPage = currPage + 1;

                if (page == currPage) {
                    pageLinks.push('<span class="current">' + displayPage + '</span>');
                } else {
                    link = baseURL.replace(pageVar, currPage);
                    pageLinks.push('<a href="' + link + '">' + displayPage + '</a>');
                }

                displayCount++;
                currPage++;
            }

            if (currPage < lastPage) {
                var lastPageActual = lastPage - 1;
                link = baseURL.replace(pageVar, lastPageActual);
                lastLink = '<a href="' + link + '" class="last">' + lastPage + '</a>';
            }

            pageNum = page + 1;

            if (pageNum != displayPage) {
                link = baseURL.replace(pageVar, pageNum);
                nextLink = '<a href="' + link + '" class="next">' + MM.lang.s("next") + '</a>';
            }

            var html = '<div class="paging-bar">';

            if (previousLink) {
                html += previousLink;
            }

            if (firstLink) {
                html += firstLink + '...';
            }

            _.each(pageLinks, function(link) {
                html += link;
            });

            if (lastLink) {
                html += '...' + lastLink;
            }

            if (nextLink) {
                html += nextLink;
            }

            html += '</div>';
            return html;
        }
    },

    inEmulatedSite: function() {
        if (MM.siteurl == "mmtest" ||
                (MM.config.current_site && MM.config.current_site.siteurl.indexOf("emulator/index.html") > -1)) {
            return true;
        }
        return false;
    },

    /**
     * Detects if the device support WebWorkers
     * @return {Boolean} True if the device supports it
     */
    WebWorkersSupported: function() {
        // The build-in test site doesn't support WebWorkers.
        if (MM.util.inEmulatedSite()) {
            return false;
        }

        // WebWorkers needs CORS enabled at the Moodle site, only the plugin local_mobile currently support it.
        // We check if the local_mobile plugin installed at the Modole site supports CORS checking this funciton.
        if (!MM.util.wsAvailable('local_mobile_mod_forum_get_forum_discussions_paginated')) {
            return false;
        }

        return !!window.Worker && !!window.URL;
    },

    /**
     * Display the keyboard if the device supports it
     *
     */
    showKeyboard: function() {
        if (typeof cordova != "undefined" &&
            cordova.plugins &&
            cordova.plugins.Keyboard &&
            typeof cordova.plugins.Keyboard.show == "function") {

            cordova.plugins.Keyboard.show();
        }
    },

    /**
     * Adds a leading zero to the parameter if needed. Usually used to format dates.
     * @param {Number} number Number to format.
     */
    addLeadingZero: function(number) {
        if (number < 10) {
          return "0" + number;
        } else {
            return number;
        }
    },

    /**
     * Gets a date with the YYYYMMDDHHMMSS format.
     * @param  {Number} timestamp Date to format. If undefined, current time will be used.
     * @return {String}           Formatted date.
     */
    getDateYYYYMMDDHHMMSS: function(timestamp) {

        if(!timestamp) {
            timestamp = new Date().getTime();
        }

        var d = new Date(timestamp);

        return d.getFullYear() +
               this.addLeadingZero(d.getMonth() + 1) +
               this.addLeadingZero(d.getDate()) +
               this.addLeadingZero(d.getHours()) +
               this.addLeadingZero(d.getMinutes()) +
               this.addLeadingZero(d.getSeconds());
    },

    /**
     * Adds the current date in YYYYMMDDHHMMSS format to the filename.
     * @param {String} filename File name.
     * @return {String}         Filename with date added.
     */
    addDateToFilename: function(filename) {
        var extension = this.getFileExtension(filename);
        var filenameWithoutExtension = filename.substr(0, filename.lastIndexOf('.'));
        return filenameWithoutExtension + '_' + MM.util.getDateYYYYMMDDHHMMSS() + '.' + extension;
    },

    // See MOBILE-936.
    toLocaleTimeString: function(d, lang, format) {
        try {
            time = d.toLocaleTimeString(lang, format);
        } catch(err) {
            time = d.toLocaleTimeString('en', format);
            MM.log("Error formatting date/time string");
        }
        return time;
    },

    toLocaleDateString: function(d, lang, format) {
        try {
            time = d.toLocaleDateString(lang, format);
        } catch(err) {
            time = d.toLocaleDateString('en', format);
            MM.log("Error formatting date/time string");
        }
        return time;
    }


};
