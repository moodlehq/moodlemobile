define(function () {
    var plugin = {
        settings: {
            name: "upload",
            type: "general",
            subMenus: [
                {name: "browsephotoalbums", menuURL: "#upload/browse", icon: "plugins/upload/browse.png"},
                {name: "takepicture", menuURL: "#upload/take", icon: "plugins/upload/take.png"},
                {name: "recordaudio", menuURL: "#upload/record", icon: "plugins/upload/record.png"}
            ],
            lang: {
                component: "core"
            }
        },
        
        routes: [
            ["upload/browse", "upload_browse", "browseAlbums"],
            ["upload/take", "upload_take", "takeMedia"],
            ["upload/record", "upload_record", "recordAudio"],
        ],
        
        browseAlbums: function() {
            MM.panels.show("center", "Not implemented");
        },

        takeMedia: function() {
            MM.panels.show("center", "Not implemented");
        },
        
        recordAudio: function() {
            MM.panels.show("center", "Not implemented");
        }
    }
    
    MM.registerPlugin(plugin);
});