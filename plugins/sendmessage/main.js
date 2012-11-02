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
            window.alert("send message" + userId);
        }
    }
    
    MM.registerPlugin(plugin);
});