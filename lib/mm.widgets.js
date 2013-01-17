/**
 * Moodle mobile settings lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.widgets = {
        
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
    
    renderCheckbox: function(el) {
        if (el.checked) {
            el.checked = 'checked = "checked"';
        }
        var tpl = '<input type="checkbox" id="<%= id %>" <%= checked %>/>\
                   <label for="<%= id %>"><%= label %></label>';
        return MM.tpl.render(tpl, el);
    },

    renderButton: function(el) {
        if (typeof el.url == "undefined") {
            el.url = "";
        }
        var tpl = '<a href="#<%= url %>" id="<%= id %>"><%= label %></a>';
        return MM.tpl.render(tpl, el);
    },
    
    renderSlider: function(el) {
        var tpl = '\
        <p><label for="<%= id %>-text"><%= label %></label>\
        <input type="text" id="<%= id %>-text" style="border: 0; color: #f6931f; font-weight: bold;" />\
        </p><div id="<%= id %>"></div>';
        return MM.tpl.render(tpl, el);
    },

    enhanceButton: function(id) {
        $("#" + id).button();
    },

    enhanceCheckbox: function(id) {
        //MM.widgets.enhanceButton(id);
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
                $("#" + setting.id).click(function(e){
                    fn(e, setting);
                });
            }
        });
    },
    
    dialog: function(text, options) {
        var dialog = $("#app-dialog");
        dialog.html(text).dialog(options);
        if (options && options.autoclose) {
            setTimeout(function() { dialog.dialog("close");}, options.autoclose);
        }
    },
    
    dialogClose: function() {
        var dialog = $("#app-dialog");
        dialog.dialog("close");
        dialog.dialog("destroy");
    },
    
    improveCheckbox: function() {
        var onClass = "ui-icon-circle-check", offClass = "ui-icon-circle-close";
        
        $( "input:checked[type=checkbox] " ).button({ icons: {primary: onClass} });
        $( "input[type=checkbox]:not(:checked)" ).button({ icons: {primary: offClass} });
        
        $( "input[type=checkbox]" ).click(function(){

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