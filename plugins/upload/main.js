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
            MM.log("Upload: Trying to get a image frr albums");
            MM.panels.show("center", "", {hideRight: true});
            
            // iPad popOver, see https://tracker.moodle.org/browse/MOBILE-208
            var popover = new CameraPopoverOptions(10, 10, $('#panel-center').width() - 50, $('#panel-center').height() - 50, Camera.PopoverArrowDirection.ARROW_ANY);
            
            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                popoverOptions : popover
            });
        },

        takeMedia: function() {
            MM.log("Upload: Trying to get a image from camera");
            MM.panels.show("center", "", {hideRight: true});
            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI
            });
        },
        
        recordAudio: function() {
            MM.log("Upload: Trying to record and Audio");
            MM.panels.show("center", "", {hideRight: true});
            navigator.device.capture.captureAudio(MM.plugins.upload.recordAudioSuccess, MM.plugins.upload.recordAudioFails, {limit: 1});
        },
        
        photoSuccess: function(uri) {
            MM.log("Upload: Photo adquired");
            var html = '\
                <div id="camera-image" style="background-size:100%;min-height:250px"></div>\
                <div class="centered">\
                <button id="bupload" type="button">' + MM.lang.s("upload") + '</button>\
                </div>\
            ';
            MM.panels.html("center", html);
            
            $('#camera-image').css({
                'background-image': 'url('+uri+')',
                'background-size':  '100%'
            });

            $("#bupload").bind(MM.clickType,function(){
                var d = new Date();
                
                MM.log("Upload: Uploading an image to Moodle");
                
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
        
        photoFails: function(message) {
            MM.log("Upload: Error trying getting a photo");
            MM.popErrorMessage(message);
        },
        
        recordAudioSuccess: function(mediaFiles) {
            
            MM.log("Upload: Auddio sucesfully recorded");
            
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
            MM.popErrorMessage(MM.lang.s("errorcapturingaudio"));
        }
    }
    
    MM.registerPlugin(plugin);

});