define(function () {
    var plugin = {
        settings: {
            name: "upload",
            type: "general",
            subMenus: [
                {name: "browsephotoalbums", menuURL: "#upload/browse"},
                {name: "takepicture", menuURL: "#upload/take"},
                {name: "recordaudio", menuURL: "#upload/record"}
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