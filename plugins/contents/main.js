var templates = [
    "root/externallib/text!root/plugins/contents/sections.html",
    "root/externallib/text!root/plugins/contents/contents.html",
    "root/externallib/text!root/plugins/contents/content.html",
    "root/externallib/text!root/plugins/contents/file.html",
    "root/externallib/text!root/plugins/contents/mimetypes.json"
];

define(templates,function (sectionsTpl, contentsTpl, contentTpl, fileTpl, mimeTypes) {
    var plugin = {
        settings: {
            name: "contents",
            type: "course",
            menuURL: "#course/contents/",
            lang: {
                component: "core"
            }
        },

        storage: {
            content: {type: "model"},
            contents: {type: "collection", model: "content"}
        },

        routes: [
            ["course/contents/:courseid", "course_contents", "viewCourseContents"],
            ["course/contents/:courseid/section/:sectionId", "course_contents_section", "viewCourseContentsSection"],
            ["course/contents/:courseid/section/:sectionId/view/:contentid", "course_contents_view", "viewContent"],
            ["course/contents/:courseid/section/:sectionId/download/:contentid", "course_contents_download", "downloadContent"],
            ["course/contents/:courseid/section/:sectionId/info/:contentid", "course_contents_info", "infoContent"],
            ["course/contents/:courseid/section/:sectionId/view/:contentid/file/:fileIndex", "course_contents_view_file", "viewContent"]
        ],

        viewCourseContents: function(courseId) {

            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }

            var data = {
            "options[0][name]" : "",
            "options[0][value]" : ""
            };            
            data.courseid = courseId;
            
            MM.moodleWSCall('core_course_get_contents', data, function(contents) {
                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);

                var tpl = {
                    sections: contents,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }
                var html = MM.tpl.render(MM.plugins.contents.templates.sections.html, tpl);
                MM.panels.show("center", html);
                if (MM.deviceType == "tablet" && contents.length > 0) {
                    // First section.
                    MM.plugins.contents.viewCourseContentsSection(courseId, 0);
                }
            });
        },


        viewCourseContentsSection: function(courseId, sectionId) {

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }

            var data = {
            "options[0][name]" : "",
            "options[0][value]" : ""
            };            
            data.courseid = courseId;
            
            MM.moodleWSCall('core_course_get_contents', data, function(contents) {
                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                var courseName = course.get("fullname");
                
                var firstContent = 0;
                
				var contentsStored = [];
				MM.db.each("contents", function(el){
					contentsStored.push(el.get("id"));
				});
				
                var finalContents = [];
				$.each(JSON.parse(JSON.stringify(contents)), function(index1, sections){

                    // Skip sections deleting contents..
                    if (sectionId > -1 && sectionId != index1) {
                        // This is a continue.
                        return true;
                    }
                    
                    $.each(sections.modules, function(index2, content){                        

                        content.contentid = content.id;
                        content.courseid = courseId;
                        content.id = MM.config.current_site.id + "-" + content.contentid;

                        if(!firstContent) {
                            firstContent = content.contentid;
                        }

                        // This content is currently in the database.
                        if (contentsStored.indexOf(content.id) > -1) {
                            var c = MM.db.get("contents", content.id);
                            c = c.toJSON();
                            sections.modules[index2].mainExtension = c.mainExtension;
                            sections.modules[index2].webOnly = c.webOnly;
                            
                            if (!sections.modules[index2].webOnly) {
                                var downloaded = false;
                                if (content.modname != "folder") {
                                    downloaded = typeof(c.contents[0].localpath) != "undefined";
                                } else {
                                    downloaded = true;
                                    $.each(c.contents, function (index5, filep) {
                                        if (typeof(filep.localpath) == "undefined") {
                                            downloaded = false;
                                        }
                                    });
                                }
                                sections.modules[index2].downloaded = downloaded;
                            }
                            
                            return true; // This is a continue;
                        }
                        
                        // The mod url also exports contents but are external contents not downloadable by the app.
                        var modContents = ["folder","page","resource"];

                        if (modContents.indexOf(content.modname) == -1) {
                            content.webOnly = true;
                        } else {
                            content.webOnly = false;
                        }
                        sections.modules[index2].webOnly = content.webOnly;

                        MM.db.insert("contents", content);

                        // Sync content files.

                        if (typeof(content.contents) != "undefined") {
                            $.each(content.contents, function (index3, file) {

                                if (file.fileurl.indexOf(MM.config.current_site.siteurl) == -1) {
                                	return true;
                                }

                                var paths = MM.plugins.contents.getLocalPaths(courseId, content.contentid, file);

                                var el = {
                                    id: hex_md5(MM.config.current_site.id + file.fileurl),
                                    url: file.fileurl,
                                    path: paths.directory,
                                    newfile: paths.file,
                                    contentid: content.id,
                                    index: index3,
                                    syncData: {
                                        name: MM.lang.s("content") + ": " + courseName + ": " + content.name,
                                        description: file.fileurl
                                    },
                                    siteid: MM.config.current_site.id,
                                    type: "content"
                                   };
                                
                                // Disabled auto sync temporaly
                                //MM.log("Sync: Adding content: " + el.syncData.name + ": " + el.url);
                                //MM.db.insert("sync", el);

                                var extension = file.filename.substr(file.filename.lastIndexOf(".") + 1);

                                // Exception for folder type, we use the resource icon.
                                if (content.modname != "folder" && typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                                    sections.modules[index2].mainExtension = MM.plugins.contents.templates.mimetypes[extension]["icon"];
                                    content.mainExtension = sections.modules[index2].mainExtension;
                                    MM.db.insert("contents", content);
                                }
                            });
                        }
                    });
                    
                    finalContents.push(sections);
                    
                });

                var tpl = {
                    sections: finalContents,
                    sectionId: sectionId,
                    courseId: courseId,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }
                var html = MM.tpl.render(MM.plugins.contents.templates.contents.html, tpl);
                MM.panels.show('right', html);

            });
        },


        viewContent: function(courseId, sectionId, contentId, fileIndex) {
            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();
            
            // We are looking only for a specific file, we should delete the rest of elements.
            if (typeof(fileIndex) != "undefined") {
                var oldContents = content.contents;
                content.contents = [content.contents[fileIndex]];
            }

            var element = {
                content: content,
                type: "notavailable",
                courseId: courseId,
                sectionId: sectionId,
                contentId: contentId,
                backLink: "#course/contents/" + courseId + "/section/" + sectionId
            };
            var tpl = MM.plugins.contents.templates.content.html;

            // Now we detect the type of content, for displaying the correct template.            
            if (typeof(content.contents) != "undefined") {                
                if (content.contents.length == 1) {
                    MM.plugins.contents.viewFile(courseId, sectionId, contentId, fileIndex, content, element);
                    return true;                    
                } else {
                    element.type = "multiplefiles";
                }
            } 

            var html = MM.tpl.render(tpl, element);
            
            MM.panels.html('right', html);
            $("#panel-right").scrollTop(0);
            MM.widgets.enhance([{id: "modlink", type: "button"}, {id: "backbutton", type: "button"}]);
        },
        
        viewFile: function(courseId, sectionId, contentId, fileIndex, content, element) {
            MM.panels.showLoading("right");
            // We are going to execute the code inside the function in sync or async way, this is the reason we need to encapsulate it in a function.
            function renderFileView() {
                element.file.localpath = MM.fs.getRoot() + "/" + element.file.localpath;
                
                var extension = element.file.filename.substr(element.file.filename.lastIndexOf(".") + 1);
                
                if (typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                    element.file.objectData = element.file.localpath;
                    element.file.objectType = MM.plugins.contents.templates.mimetypes[extension]["type"];
                    element.file.objectHeight = $(document).innerHeight() - 250;
                }
                
                if (typeof(fileIndex) != "undefined") {
                    element.backLink = "#course/contents/" + courseId + "/section/" + sectionId + "/view/" + contentId;
                }
                
                var html = MM.tpl.render(tpl, element);
                
                MM.panels.html('right', html);
                $("#panel-right").scrollTop(0);
                MM.widgets.enhance([{id: "modlink", type: "button"}, {id: "backbutton", type: "button"}]);
            }
            
            var tpl = MM.plugins.contents.templates.file.html;
            
            element.type == "singlefile";
            element.file = content.contents[0];
            element.file.download = element.file.fileurl + "&token=" + MM.config.current_token;
            
            // We check if the file is yet downloaded (the localpath is set only in downloaded files).
            if(typeof(element.file.localpath) != "undefined") {
                renderFileView();
            } else {
                // Now, we need to download the file.
                // First we load the file system (is not loaded yet).
                MM.fs.init(function() {
                    var fileurl = element.file.fileurl + "&token=" + MM.config.current_token;
                    var path = MM.plugins.contents.getLocalPaths(courseId, content.contentid, element.file);
                    MM.log("Content: Starting download of file: " + fileurl);
                    // All the functions are async, like create dir.
                    MM.fs.createDir(path.directory, function() {
                        MM.log("Content: Downloading content to " + path.file + " from URL: " + fileurl);
                        MM.moodleDownloadFile(fileurl, path.file,
                            function() {
                                MM.log("Content: Download of content finished " + path.file + " URL: " + fileurl);
                                
                                content = MM.db.get("contents", content.id).toJSON();
                                var index = 0;
                                if (typeof(fileIndex) != "undefined") {
                                    index = fileIndex;
                                }                                                
                                content.contents[index].localpath = path.file;
                                MM.db.insert("contents", content);
                                renderFileView();
                            },
                            function() {
                               MM.log("Content: Error downloading " + path.file + " URL: " + fileurl);
                             });
                    }); 
                });
            }
        },

        downloadContent: function(courseId, sectionId, contentId) {

            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();
            
            var file = content.contents[0];
            var downloadURL = file.fileurl + "&token=" + MM.config.current_token;
            
            // Now, we need to download the file.
            // First we load the file system (is not loaded yet).
            MM.fs.init(function() {
                var path = MM.plugins.contents.getLocalPaths(courseId, contentId, file);
                MM.log("Content: Starting download of file: " + downloadURL);
                // All the functions are async, like create dir.
                MM.fs.createDir(path.directory, function() {
                    MM.log("Content: Downloading content to " + path.file + " from URL: " + downloadURL);
                    $("#download-" + contentId).attr("src", "img/loading.gif");
                    MM.moodleDownloadFile(downloadURL, path.file,
                        function() {
                            MM.log("Content: Download of content finished " + path.file + " URL: " + downloadURL);                                              
                            content.contents[0].localpath = path.file;
                            MM.db.insert("contents", content);
                            $("#download-" + contentId).remove();
                            $("#link-" + contentId).attr("href", MM.fs.getRoot() + "/" + path.file);
                        },
                        function() {
                           MM.log("Content: Error downloading " + path.file + " URL: " + fileurl);
                           $("#download-" + contentId).attr("src", "img/download.png");
                         });
                }); 
            });
        },

        infoContent: function(courseId, sectionId, contentId) {

            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();
            
            if (typeof(MM.plugins.contents.infoBox) != "undefined") {
                MM.plugins.contents.infoBox.remove();
            }
            
            var i = $("#info-" + contentId).offset();
            
            var information = '<p><strong>'+content.name+'</strong></p>';
            if (typeof(content.description) != "undefined") {
                information += '<p>'+content.description+'</p>';
            }
            
            information += MM.lang.s("viewableonthisapp") + ': ';
            
            if (content.webOnly) {
                information += MM.lang.s("no");
            } else {
                information += MM.lang.s("yes");
            }
            
            information += '<p><a href="'+content.url+'" target="_blank" rel="external">'+content.url+'</a></p>';
            
            MM.plugins.contents.infoBox = $('<div id="infobox-'+contentId+'">'+information+'</div>').addClass("arrow_box");
            $('body').append(MM.plugins.contents.infoBox);
            
            var width = $("#panel-right").width() / 2;
            
            $('#infobox-'+contentId).css("top", i.top - 8).css("left", i.left - width - 16).width(width);
            
        },
        
        getLocalPaths: function(courseId, modId, file) {

            var filename = file.fileurl.replace("?forcedownload=1", "");
            filename = filename.substr(filename.lastIndexOf("/") + 1);
            // We store in the sdcard the contents in site/course/modname/id/contentIndex/filename
            var path = MM.config.current_site.id + "/" + courseId + "/" + modId;

            var newfile = path + "/" + filename;
            
            return {
                directory: path,
                file: newfile
            }
        },
        
        templates: {
            "content": {
                model: "content",
                html: contentTpl
            },
            "file": {
                html: fileTpl
            },
            "contents": {
                html: contentsTpl
            },
            "sections": {
                html: sectionsTpl
            },
            "mimetypes": JSON.parse(mimeTypes)
        }
    }

    MM.registerPlugin(plugin);
});