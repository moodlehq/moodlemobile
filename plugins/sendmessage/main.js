define(function () {
    var plugin = {
        settings: {
            name: "sendmessage",
            type: "user",
            menuURL: "#message",
            lang: {
                component: "moodle"
            }
        },
        
        routes: [
            ["message/:userId", "message", "sendMessage"]
        ],
        
        sendMessage: function(userId) {
            MM.panels.show("center", "Not implemented");
        }
    }
    
    MM.registerPlugin(plugin);
});