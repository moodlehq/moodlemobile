define(function () {
    var plugin = {
        settings: {
            name: "addnote",
            type: "user",
            menuURL: "#note",
            lang: {
                component: "moodle"
            }
        },
        
        routes: [
            ["note/:userId", "note", "addNote"]
        ],
        
        addNote: function(userId) {
            MM.panels.show("center", "Not implemented");
        }
    }
    
    MM.registerPlugin(plugin);
});