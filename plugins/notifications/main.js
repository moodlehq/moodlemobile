define(function () {
    var plugin = {
        settings: {
            name: "notifications",
            type: "general",
            menuURL: "#notifications"
        },
        
        routes: [
            ["notifications", "notifications", "showNotifications"],
            ["notification/:id", "notification_id", "showNotification"]
        ],
        
        showNotifications: function() {
            window.alert("showNotifications");
        },
        
        showNotification: function(id) {
            return true;
        }
    }
    
    MM.registerPlugin(plugin);
});