define(function () {
    var plugin = {
        settings: {
            name: "addcontact",
            type: "user",
            menuURL: "#contact",
            lang: {
                component: "moodle"
            }
        },
        
        routes: [
            ["contact/:userId", "contact", "addContact"]
        ],
        
        addContact: function(userId) {
            window.alert("add contact" + userId);
        }
    }
    
    MM.registerPlugin(plugin);
});