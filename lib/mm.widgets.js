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
 * @fileoverview Moodle mobile html widgets lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile html widgets functionallity.
 */
MM.widgets = {
    
    eventsRegistered: {},
    
    render: function(elements) {
        var settings = [];
        var output = "";
        
        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }
        
        $.each(settings, function(index, setting) {
            var renderer = "render" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[renderer] != "undefined") {
                output += "<div class=\"mm-setting\">" + MM.widgets[renderer](setting) + "</div>";
            }
        });
        return output;
    },

    renderList: function(elements) {
        var settings = [];
        var output = '<ul class="nav nav-v">';
        
        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }
        
        $.each(settings, function(index, setting) {
            var renderer = "render" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[renderer] != "undefined") {
                output += '<li class="nav-item">' + MM.widgets[renderer](setting) + '</li>';
            }
        });
        
        output += "</ul>";
        
        return output;
    },
    
    renderCheckbox: function(el) {
        if (el.checked) {
            el.checked = 'checked = "checked"';
        } else {
            el.checked = '';
        }
        var tpl = '<div class="checkbox-setting-s"><div class="checkbox-label-s"> <%= label %></div><div class="checkbox-tic-s"><input type="checkbox" id="<%= id %>" <%= checked %>/>\
                   <label for="<%= id %>"></label></div></div>';
        return MM.tpl.render(tpl, el);
    },

    renderButton: function(el) {
        if (typeof el.url == "undefined") {
            el.url = "";
        }
        var tpl = '<a href="#<%= url %>" id="<%= id %>"><button><%= label %></button></a>';
        return MM.tpl.render(tpl, el);
    },
    
    renderSlider: function(el) {
        var tpl = '\
        <p><label for="<%= id %>-text"><%= label %></label>\
        <input type="text" id="<%= id %>-text" style="border: 0; color: #f6931f; font-weight: bold;" />\
        </p><div id="<%= id %>" class=".noSwipe"></div>';
        return MM.tpl.render(tpl, el);
    },

    enhanceButton: function(id) {
        //$("#" + id).button();
    },

    enhanceCheckbox: function(id) {
        //$("#" + id).parent().addClass("checkbox-tic");
    },
    
    enhanceSlider: function(id, config) {
        $( "#" + id ).slider(config);
        $( "#" + id + "-text" ).val( config.value );        
    },
    
    enhance: function(elements) {
        var settings = [];
        var output = "";
        
        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }
        
        $.each(settings, function(index, setting) {
            var enhancer = "enhance" + setting.type.charAt(0).toUpperCase() + setting.type.slice(1);
            if (typeof MM.widgets[enhancer] != "undefined") {
                if (setting.config) {
                    MM.widgets[enhancer](setting.id, setting.config);
                } else {
                    MM.widgets[enhancer](setting.id);
                }
            }
        });
        //MM.widgets.improveCheckbox();
    },

    addHandlers: function(elements) {
        var settings = [];
        var output = "";

        if($.isArray(elements)) {
            settings = elements;
        } else {
            settings.push(elements);
        }
        
        $.each(settings, function(index, setting) {
            if (typeof setting.handler != "undefined") {
                var fn = setting.handler;
                var eHandler = function(e){
                    fn(e, setting);
                };
                $("#" + setting.id).bind(MM.clickType, eHandler);
                MM.widgets.eventsRegistered["#" + setting.id] = eHandler;
            }
        });
    },
    
    dialog: function(text, options) {
        var dialog = $("#app-dialog");
        // MOBILE-245
        if (!options.title) {
            options.title = "";
        }
        if (!options.buttons) {
            options.buttons = {};
        }

        if (options.hideCloseButton) {
            options.dialogClass = 'dialog-no-close';
        } else {
            options.dialogClass = 'dialog-close';
        }

        dialog.html(text).dialog(options);

        if (options && options.autoclose) {
            setTimeout(function() {
                try {
                    dialog.dialog("close");
                } catch(e) {
                    MM.log('Error closing dialog', 'Widgets');
                }
            }, options.autoclose);
        }
    },
    
    dialogClose: function() {
        var dialog = $("#app-dialog");
        
        try {
            dialog.dialog("close");
            dialog.dialog("destroy");
        } catch(e) {
            MM.log('Error closing dialog', 'Widgets');
        }
    },
    
    improveCheckbox: function() {
        var onClass = "ui-icon-circle-check", offClass = "ui-icon-circle-close";
        
        $( "input:checked[type=checkbox] " ).button({ icons: {primary: onClass} });
        $( "input[type=checkbox]:not(:checked)" ).button({ icons: {primary: offClass} });
        
        $( "input[type=checkbox]" ).bind(MM.clickType, function(){

            var swap = function(me, toAdd, toRemove) {
                // find the LABEL for the checkbox
                // ... which should be _immediately_ before or after the checkbox
                var node = me.next();

                // and swap
                node.children(".ui-button-icon-primary")
                    .addClass(toAdd)
                    .removeClass(toRemove);
                ;
            };
        
            var me = $(this);
            if (me.is(':checked')) {
                swap($(this), onClass, offClass);
            } else {
                swap($(this), offClass, onClass);
            }
        });        
    }
}