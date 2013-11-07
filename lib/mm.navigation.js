/**
 * Thin wrapper around plugins dealing with navigation.
 * Allows different menu types to be dynamically loaded in allowing
 * context sensitive menus.
 * All menu plugins should implement the functions listed here.
 */
MM.navigation = {
    current:undefined,

    visible:false,

    init:function(type) {
        if (type !== undefined &&
            MM.plugins[type] !== undefined &&
            MM.plugins[type].settings.type == 'menu'
        ) {
            MM.navigation.current = MM.plugins[type];
        } else {
            MM.navigation.current = MM.plugins['default_navigation'];
        }
        MM.navigation.current.init();
    },

    populate: function() {
        MM.navigation.current.populate();
    },

    show:function() {
        MM.navigation.visible = true;
        MM.navigation.current.show();
    },

    hide:function() {
        MM.navigation.visible = false;
        MM.navigation.current.hide();
    },

    toggle: function() {
        if (MM.navigation.visible === true) {
            MM.navigation.hide();
        } else {
            MM.navigation.show();
        }

        return MM.navigation.visible;
    },

    getWidth: function() {
        return MM.navigation.current.menuWidth;
    }
}