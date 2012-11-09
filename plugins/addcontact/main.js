define(function () {
    var plugin = {
        settings: {
            name: "addcontact",
            type: "user",
            menuURL: "#contact",
            lang: {
                component: "core"
            }
        },
        
        routes: [
            ["contact/:userId", "contact", "addContact"]
        ],
        
        addContact: function(userId) {
            MM.panels.show("center", "Not implemented");
        }
    }
    
    MM.registerPlugin(plugin);
});