define(function () {
    var plugin = {
        settings: {
            name: "upload",
            type: "general",
            subMenus: [
                {name: "browse", menuURL: "#upload/browse"},
                {name: "take", menuURL: "#upload/take"},
                {name: "record", menuURL: "#upload/record"}
            ]
        },
        
        routes: [
            ["upload/browse", "upload_browse", "browseAlbums"],
            ["upload/take", "upload_take", "takeMedia"],
            ["upload/record", "upload_record", "recordAudio"],
        ],
        
        browseAlbums: function() {
            window.alert("browse");
        },

        takeMedia: function() {
            window.alert("take");
        },
        
        recordAudio: function() {
            window.alert("record");
        }
    }
    
    MM.registerPlugin(plugin);
});