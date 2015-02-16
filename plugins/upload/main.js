var requires = [
    "root/externallib/text!root/plugins/upload/uploadfile.html"
];

define(requires, function (uploadFileTpl) {

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
                {name: "video", menuURL: "#upload/video", icon: ""},
                {name: "file", menuURL: "#upload/file", icon: ""}
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
            ["upload/video", "upload_video", "uploadVideo"],
            ["upload/file", "upload_file", "chooseFile"]
        ],

        templates: {
            "uploadfile": {
                html: uploadFileTpl
            }
        },

        storage: {
            sharedfile: {type: "model"},
            sharedfiles: {type: "collection", model: "sharedfile"}
        },

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
        },

        /**
         * Show a page with a button to open the file chooser.
         */
        chooseFile: function() {
            var html = MM.tpl.render(MM.plugins.upload.templates.uploadfile.html, {});
            MM.panels.show('center', html, {hideRight: true, title: MM.lang.s("uploadfile")});
            $('#uploadFileChooser').on('change', function(e) {
                e.preventDefault();
                var file = this.files[0];
                $(this).val('');
                if(file) {
                    MM.plugins.upload.showUploadConfirmIfNeeded(file);
                }
            });
        },

        /**
         * Shows a confirm message before uploading the file. The message is shown when:
         *     -The device has not a Wifi Connection.
         *      OR
         *     -The file size is above 5MB.
         * @param  {Object} file File to upload.
         */
        showUploadConfirmIfNeeded: function(file) {
            var message = '';
            if(MM.deviceWifiConnected()) {
                if(file.size >= 5242880) {
                    message = MM.lang.s("confirmuploadfile", "core", MM.util.bytesToSize(file.size, 2));
                }
            } else {
                message = MM.lang.s("confirmuploadfile", "core", MM.util.bytesToSize(file.size, 2));
            }

            if(message != '') {
                MM.popConfirm(message, function() {
                    MM.plugins.upload.uploadChosenFile(file);
                });
            } else {
                MM.plugins.upload.uploadChosenFile(file);
            }
        },

        /**
         * Uploads the chosen file.
         * @param  {Object} file File to upload.
         */
        uploadChosenFile: function(file) {
            MM.showModalLoading(MM.lang.s("uploading"), MM.lang.s('readingfile'));

            MM.fs.readFileAsArrayBuffer(file, function(data) {

                var fileextension = file.name.substr(file.name.lastIndexOf('.'));
                var filename = 'tmpfileupload'+fileextension;
                MM.fs.getFileAndWriteInIt(filename, data,
                    function(fileURL) {
                        var options = {};
                        options.fileKey = null;
                        options.fileName = file.name;
                        options.mimeType = file.type;

                        MM.moodleUploadFile(fileURL, options,
                                            function(){
                                                MM.popMessage(MM.lang.s("fileuploaded"));
                                                MM.fs.removeFile(filename);
                                            },
                                            function(){
                                                MM.popErrorMessage(MM.lang.s("erroruploading"));
                                                MM.fs.removeFile(filename);
                                            }
                        );
                    }, function(error) {
                        MM.log('Error creating tmp file', 'Upload');
                        MM.popErrorMessage(MM.lang.s('erroruploading'));
                    }
                );
            }, function() {
                MM.log('Error reading file', 'Upload');
                MM.popErrorMessage(MM.lang.s('errorreadingfile', 'core', file.name));
            });
        },

        /**
         * Checks if there is a file to be uploaded in iOS. If there is, starts the upload process.
         * It also deletes files shared previously but not sent.
         */
        checkIOSNewFiles: function() {
            MM.fs.getDirectoryContents('Inbox', function(entries) {

                if(entries.length > 0) {

                    var entryToSend = undefined;
                    var treated = 0, total = entries.length;
                    $.each(entries, function(index, entry) {
                        var stored = MM.db.get('sharedfiles', hex_md5( entry.name ));
                        if(stored) {
                            // File was shared previously but not sent. Delete the file and its LocalStorage entries.
                            MM.log('Found file '+entry.name+' left in Inbox. It will be deleted.', 'Upload');
                            entry.remove(function() {
                                stored.destroy();
                            }, function() {
                                MM.log('Error deleting file in Inbox.', 'Upload');
                            });
                        } else {
                            // File wasn't shared previously. Try to send it now.
                            MM.log('Found file '+entry.name+' ready to be sent.', 'Upload');
                            entryToSend = entry;
                        }
                    });

                    if(typeof(entryToSend) != 'undefined') {
                        var fileURL = MM.fs.entryURL(entryToSend);
                        var model = {
                            id: hex_md5(entryToSend.name),
                            name: entryToSend.name // We store the name just for debugging purposes.
                        };
                        MM.db.insert('sharedfiles', model);

                        plugin.checkSiteToUploadTo(fileURL, true);
                    }
                }
            }, function() {
                // Folder doesn't exist.
            });
        },

        /**
         * Check to which site should a file be uploaded to.
         *
         * @param {String} fileURL                  File's full path.
         * @param {Boolean} deleteFileAfterUpload   True if the file should be deleted after being uploaded.
         */
        checkSiteToUploadTo: function(fileURL, deleteFileAfterUpload){

            // Wait for lang to be initialized
            if( MM.lang.current == '' ){
                MM.log("Current lang hasn't been initialized yet.", 'Upload');
                setTimeout(function() {
                    plugin.checkSiteToUploadTo(fileURL, deleteFileAfterUpload);
                }, 50);
                return;
            }

            MM.log('Check site to upload to. File URL: ' + fileURL, 'Upload');

            var sites = [];
            MM.db.each('sites', function(el) {
                sites.push(el.toJSON());
            });

            if( sites.length == 0 ) {
                MM.log('There are no sites to upload the file to.', 'Upload');
                MM.popErrorMessage( MM.lang.s("errorreceivefilenosites") );
                if(deleteFileAfterUpload) {
                    plugin.deleteFile(fileURL);
                }
            }
            else if( sites.length == 1 ) {
                MM.log('There is ONE site registered to upload the file to.', 'Upload');
                // Confirm that the user wants to upload the file to this site.
                MM.popConfirm( MM.lang.s("confirmuploadfile", "core", sites[0].sitename),
                    function() {
                        MM.log('User confirmed. Send the file.', 'Upload');
                        if( ! MM.config.current_site ){
                            // Lets authenticate the user
                            MM.site = MM.db.get('sites', sites[0].site);
                            MM.setUpConfig();
                        }
                        plugin.uploadFileToSite( fileURL, deleteFileAfterUpload );
                    },
                    function() {
                        MM.log('User cancelled.', 'Upload');
                        if(deleteFileAfterUpload) {
                            plugin.deleteFile(fileURL);
                        }

                        if (navigator.app && navigator.app.exitApp) {
                            navigator.app.exitApp();
                        }
                    }
                );
            }
            else {
                MM.log('There is several sites registered to upload the file to.', 'Upload');

                // Render all sites so the user can choose which one he wants to upload the file to.
                var tpl = MM.tpl.render($('#choose-account-upload_template').html(),
                        {sites: sites, fileURI: fileURL, deleteFileAfterUpload: deleteFileAfterUpload});
                $("#app-dialog").addClass('full-screen-dialog choose-account');
                MM.popMessage(tpl, {autoclose: 0, buttons: []});

                // We handle the clicks using jquery instead of onclick to prevent having to propagate
                // fileURL and deleteFileAfterUpload.

                $('#app-dialog .account-details').on('click', function(e) {
                    e.preventDefault();

                    // Set chosen site as current site.
                    var siteid = $(this).data('siteid');
                    MM.site = MM.db.get('sites', siteid);
                    MM.setUpConfig();
                    MM.log('User chose the site '+siteid, 'Upload');

                    $("#app-dialog").removeClass('choose-account');

                    plugin.uploadFileToSite(fileURL, deleteFileAfterUpload);
                });

                $('#btn-cancel-upload').on('click', function(e) {
                    e.preventDefault();
                    MM.log('User cancelled.', 'Upload');

                    if(deleteFileAfterUpload) {
                        plugin.deleteFile(fileURL);
                    }

                    if (navigator.app && navigator.app.exitApp) {
                        navigator.app.exitApp();
                    } else {
                        MM.widgets.dialogClose();
                        $("#app-dialog").removeClass('full-screen-dialog choose-account');
                    }
                });

            }
        },

        /**
         * Retrieves and deletes a file.
         * @param  {String} fileURL Path of the file to delete.
         */
        deleteFile: function(fileURL) {
            MM.log('Trying to delete file to upload', 'Upload');
            MM.fs.getExternalFile(fileURL, function(fileEntry) {
                fileEntry.remove(function() {
                    MM.log('File successfully deleted', 'Upload');
                    if(MM.getOS() == 'ios') {
                        var stored = MM.db.get('sharedfiles', hex_md5( fileEntry.name ));
                        if(stored) {
                            stored.destroy();
                        }
                    }
                }, function(error) {
                    MM.log('Error deleting file: '+error.code+'. It might have an unusual char in its name.', 'Upload');
                });
            }, function(error) {
                MM.log("File not deleted because it wasn't found", 'Upload');
            });
        },

        /**
         * Upload the file to the current site.
         *
         * @param {String} fileURL                  File's full path.
         * @param {Boolean} deleteFileAfterUpload   True if the file should be deleted after being uploaded.
         */
        uploadFileToSite: function(fileURL, deleteFileAfterUpload) {

            MM.fs.getExternalFile(fileURL, function(fileEntry) {
                MM.log('File to upload retrieved. Name: '+fileEntry.name, 'Upload');
                var path = MM.fs.entryURL(fileEntry);
                var filename = MM.util.addDateToFilename( path.substr(path.lastIndexOf("/") + 1) );

                var options = {};
                options.fileKey = null;
                options.fileName = filename;
                options.mimeType = null;
                MM.moodleUploadFile(path, options,
                    function(){
                        // File uploaded. Show a popup with a close button to close the app.
                        MM.log('File successfully uploaded.', 'Upload');

                        if(deleteFileAfterUpload) {
                            plugin.deleteFile(fileURL);
                        }

                        var options = {
                            buttons: {}
                        };
                        options.buttons[MM.lang.s('close')] = function() {
                            if (navigator.app && navigator.app.exitApp) {
                                navigator.app.exitApp();
                            } else {
                                MM.widgets.dialogClose();
                                $("#app-dialog").removeClass('full-screen-dialog');
                            }
                        };
                        MM.popMessage(MM.lang.s('fileuploadedwithname', 'core', filename), options);
                    },
                    function(){
                        MM.log('Error uploading file.', 'Upload');
                        MM.popErrorMessage(MM.lang.s("erroruploading"));
                    }
                );

            }, function(error) {
                MM.log('Error getting external file', 'Upload');
            });
        }
    }

    if(MM.inNodeWK || MM.getOS() != 'android') {
        // Remove the not supported upload file.
        plugin.settings.subMenus.pop();
    }

    if (MM.inNodeWK) {
        // Remove the not supported upload video.
        plugin.settings.subMenus.pop();
    }

    MM.registerPlugin(plugin);

    if(MM.getOS() == 'ios') {
        /**
         * Receive files in iOS.
         */
        document.addEventListener("resume", plugin.checkIOSNewFiles, false);
        plugin.checkIOSNewFiles();
    }

});
