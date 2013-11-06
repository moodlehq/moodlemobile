/**
 * Thin wrapper around plugins dealing with navigation.
 * Allows different menu types to be dynamically loaded in allowing
 * context sensitive menus.
 * All menu plugins should implement the functions listed here.
 */
MM.navigation = {
    current:undefined,

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

    show:function() {
        MM.navigation.current.show();
    },

    hide:function() {
        MM.navigation.current.hide();
    }
}