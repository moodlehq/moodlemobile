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
  * @namespace Holds all the MoodleMobile extra utilities functionallity.
 */
MM.util = {
    
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
        }catch (e) {
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
        if (   'WebkitOverflowScrolling' in document.body.style
            || 'webkitOverflowScrolling' in document.body.style
            || 'webkitOverflowScrolling' in document.documentElement.style
            || 'WebkitOverflowScrolling' in document.documentElement.style) {
            return true;
        }
        return false;
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
        },false);

        document.getElementById(id).addEventListener('touchmove', function(event) {
            MM.touchMoving = true;
            this.scrollTop = MM.scrollStartPos - event.touches[0].pageY;
            // Ugly Hack for fix horizontal scrolling
            if (MM.panels.currentPanel == "right") {
                $(this).scrollLeft(0);
            }
        },false);
        
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
     */
    avoidHorizontalScrolling: function() {
        $(window).scroll(function () {
            if (MM.panels.currentPanel == "right") {
                $(this).scrollLeft(0);
                $('#panel-' + MM.panels.currentPanel).css('left', '0px');
            }
        });
    },
    
    /**
     * This function should be applied to any piece of  text to be displayed in the app
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

        return text;
    }

};
