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
            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
            });
        },

        takeMedia: function() {
            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI
            });
        },
        
        recordAudio: function() {
            navigator.device.capture.captureAudio(MM.plugins.upload.recordAudioSuccess, MM.plugins.upload.recordAudioFails, {limit: 1});
        },
        
        photoSuccess: function(uri) {
            var html = '\
                <div id="camera-image" style="background-size:100%;min-height:250px"></div>\
                <button id="bupload" type="button">' + MM.lang.s("upload") + '</button>\
            ';
            MM.panels.show("center", html);
            
            $('#camera-image').css({
                'background-image': 'url('+uri+')',
                'background-size':  '100%'
            });

            $("#bupload").click(function(){
                var d = new Date();
                
                var options = {};
                options.fileKey="file";
                options.fileName="image_"+d.getTime()+".jpg";
                options.mimeType="image/jpeg";
                
                MM.moodleUploadFile(uri, options,
                                    function(){ MM.popMessage(MM.lang.s("fileuploaded")); },
                                    function(){ MM.popErrorMessage(MM.lang.s("erroruploading")) }
                );       
            });            
        },
        
        photoFails: function() {
            MM.popErrorMessage(MM.lang.s("errorcamera"));
        },
        
        recordAudioSuccess: function(mediaFiles) {
            var i, len;
            for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                var options = {};
                options.fileKey = null;
                options.fileName = mediaFiles[i].name;
                options.mimeType = null;
                
                MM.moodleUploadFile(mediaFiles[i].fullPath, options,
                                    function(){ MM.popMessage(MM.lang.s("fileuploaded")); },
                                    function(){ MM.popErrorMessage(MM.lang.s("erroruploading")) }
                ); 
            } 
        },
        
        recordAudioFails: function() {
            MM.popErrorMessage(MM.lang.s("audionotavailable"));
        }
    }
    
    MM.registerPlugin(plugin);
});