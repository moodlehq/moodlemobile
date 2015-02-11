define(function () {

    var photoIsNew = false; // Used to determine if an image file should be deleted after being uploaded.

    var plugin = {
        settings: {
            name: "upload",
            type: "general",
            icon: "plugins/upload/icon.png",
            subMenus: [
                {name: "browsephotoalbums", menuURL: "#upload/browse", icon: ""},
                {name: "takepicture", menuURL: "#upload/take", icon: ""},
                {name: "recordaudio", menuURL: "#upload/record", icon: ""},
                {name: "video", menuURL: "#upload/video", icon: ""}
            ],
            lang: {
                component: "core"
            },
            toogler: true
        },

        routes: [
            ["upload/browse", "upload_browse", "browseAlbums"],
            ["upload/take", "upload_take", "takeMedia"],
            ["upload/record", "upload_record", "recordAudio"],
            ["upload/video", "upload_video", "uploadVideo"]
        ],

        /**
         * Determines is the plugin is visible.
         * It may check Moodle remote site version, device OS, device type, etc...
         * This function is called when a alink to a plugin functinality is going to be rendered.
         *
         * @return {bool} True if the plugin is visible for the site and device
         */
        isPluginVisible: function() {
            if (MM.config && MM.config.current_site &&
                typeof(MM.config.current_site.uploadfiles) != "undefined" &&
                MM.config.current_site.uploadfiles === 0) {

                return false;
            }
            return true;
        },

        browseAlbums: function() {
            MM.log('Trying to get a image from albums', 'Upload');
            MM.Router.navigate("");

            var width  =  $(document).innerWidth()  - 200;
            var height =  $(document).innerHeight() - 200;

            // iPad popOver, see https://tracker.moodle.org/browse/MOBILE-208
            var popover = new CameraPopoverOptions(10, 10, width, height, Camera.PopoverArrowDirection.ARROW_ANY);

            photoIsNew = false;

            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                popoverOptions : popover
            });
        },

        takeMedia: function() {
            MM.log('Trying to get a image from camera', 'Upload');
            MM.Router.navigate("");

            photoIsNew = true;

            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI
            });
        },

        recordAudio: function() {
            MM.Router.navigate("");
            MM.log('Trying to record and Audio', 'Upload');
            navigator.device.capture.captureAudio(MM.plugins.upload.recordAudioSuccess, MM.plugins.upload.recordAudioFails, {limit: 1});
        },

        uploadVideo: function() {
            MM.Router.navigate("");
            MM.log('Trying to record a video', 'Upload');
            navigator.device.capture.captureVideo(
                MM.plugins.upload.uploadVideoSuccess,
                MM.plugins.upload.uploadVideoFails,
                {limit: 1});
        },

        photoSuccess: function(uri) {

            if(typeof(uri) == 'undefined' || uri == ''){
                // In Node-Webkit, if you successfully upload a picture and then you open the file picker again
                // and cancel, this function is called with an empty uri. Let's filter it.
                return;
            }

            MM.log('Uploading an image to Moodle', 'Upload');
            var d = new Date();

            var options = {};
            options.fileKey="file";

            // Check if we are in desktop or mobile.
            if (MM.inNodeWK) {
                options.fileName = uri.lastIndexOf("/") + 1;
            } else {
                options.fileName = "image_" + d.getTime() + ".jpg";
            }

            options.mimeType="image/jpeg";

            // Delete image after upload in iOS (always copies the image to the tmp folder)
            // or if the photo is taken with the camera, not browsed.
            var deleteAfterUpload = MM.getOS() == 'ios' || photoIsNew;

            MM.moodleUploadFile(uri, options,
                                function(){
                                    MM.popMessage(MM.lang.s("imagestored"));
                                    if(deleteAfterUpload) {
                                        // Use set timeout, otherwise in Node-Webkit the upload throws an error.
                                        setTimeout(function(){
                                            MM.fs.removeExternalFile(uri);
                                        }, 500);
                                    }
                                },
                                function(){
                                    MM.popErrorMessage(MM.lang.s("erroruploading"));
                                    if(deleteAfterUpload) {
                                        // Use set timeout, otherwise in Node-Webkit the upload throws an error.
                                        setTimeout(function(){
                                            MM.fs.removeExternalFile(uri);
                                        }, 500);
                                    }
                                }
            );

        },

        photoFails: function(message) {
            MM.log('Error trying getting a photo', 'Upload');
            if (message) {
                MM.log('Error message: ' + JSON.stringify(message));

                if (message.toLowerCase().indexOf("error") > -1 || message.toLowerCase().indexOf("unable") > -1) {
                    MM.popErrorMessage(message);
                }
            }
        },

        recordAudioSuccess: function(mediaFiles) {

            MM.log('Auddio sucesfully recorded', 'Upload');

            $.each(mediaFiles, function(index, mediaFile) {
                var options = {};
                options.fileKey = null;
                options.fileName = mediaFile.name;
                options.mimeType = null;

                MM.moodleUploadFile(mediaFile.fullPath, options,
                                    function(){
                                        MM.popMessage(MM.lang.s("recordstored"));
                                        // Use set timeout, otherwise in Node-Webkit the upload throws an error.
                                        setTimeout(function(){
                                            MM.fs.removeExternalFile(mediaFile.localURL);
                                        }, 5000);
                                    },
                                    function(){
                                        MM.popErrorMessage(MM.lang.s("erroruploading"));
                                        // Use set timeout, otherwise in Node-Webkit the upload throws an error.
                                        setTimeout(function(){
                                            MM.fs.removeExternalFile(mediaFile.localURL);
                                        }, 5000);
                                    }
                );
            });
        },

        recordAudioFails: function(error) {
            if (!error) {
                error = { code: 0};
            }

            if (typeof error.code == "undefined") {
                MM.log("Unexpected error trying to record an audio", "Upload");
                return;
            }

            MM.log('Error trying recording an audio ' + error.code, 'Upload');
            if (error.code != CaptureError.CAPTURE_NO_MEDIA_FILES) {
                MM.popErrorMessage(MM.lang.s("errorcapturingaudio"));
            }
        },

        uploadVideoSuccess: function(mediaFiles) {

            MM.log('Video sucesfully recorded', 'Upload');

            $.each(mediaFiles, function(index, mediaFile) {
                var options = {};
                options.fileKey = null;
                options.fileName = mediaFile.name;
                options.mimeType = null;

                MM.moodleUploadFile(mediaFile.fullPath, options,
                                    function(){
                                        MM.popMessage(MM.lang.s("recordstored"));
                                        MM.fs.removeExternalFile(mediaFile.localURL);
                                    },
                                    function(){
                                        MM.popErrorMessage(MM.lang.s("erroruploading"));
                                        MM.fs.removeExternalFile(mediaFile.localURL);
                                    }
                );
            });
        },

        uploadVideoFails: function(error) {
            if (!error) {
                error = { code: 0};
            }

            MM.log('Error trying recording a video ' + error.code, 'Upload');
            if (error.code != CaptureError.CAPTURE_NO_MEDIA_FILES) {
                MM.popErrorMessage(MM.lang.s("errorcapturingvideo"));
            }
        }
    }

    if (MM.inNodeWK) {
        // Remove the not supported upload video.
        plugin.settings.subMenus.pop();
    }

    MM.registerPlugin(plugin);

});