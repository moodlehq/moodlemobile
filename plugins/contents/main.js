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
            ["course/contents/:courseid/view/:contentid", "course_contents_view", "viewContent"],
            ["course/contents/:courseid/view/:contentid/file/:fileIndex", "course_contents_view_file", "viewContent"]
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
				$.each(JSON.parse(JSON.stringify(contents)), function(index, sections){

                    // Skip sections deleting contents..
                    if (sectionId > -1 && sectionId != index) {
                        // This is a continue.
                        return true;
                    }
                    
                    finalContents.push(sections);
                    
                    $.each(sections.modules, function(index, content){                        

                        content.contentid = content.id;
                        content.courseid = courseId;
                        content.id = MM.config.current_site.id + "-" + content.contentid;

                        if(!firstContent) {
                            firstContent = content.contentid;
                        }
                        
                        // This content is currently in the database.
                        if (contentsStored.indexOf(content.id) > -1) {
                            return true; // This is a continue;
                        }
                        
                        MM.db.insert("contents", content);
                        
                        // Sync content files.

                        if (typeof(content.contents) != "undefined") {
                            $.each(content.contents, function (index, file) {
                                
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
                                    index: index,
                                    syncData: {
                                        name: MM.lang.s("content") + ": " + courseName + ": " + content.name,
                                        description: file.fileurl
                                    },
                                    siteid: MM.config.current_site.id,
                                    type: "content"
                                   };
                                MM.log("Sync: Adding content: " + el.syncData.name + ": " + el.url);
                                MM.db.insert("sync", el);
                            });
                        }
                    });
                });

                var tpl = {
                    sections: finalContents,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }
                var html = MM.tpl.render(MM.plugins.contents.templates.contents.html, tpl);
                MM.panels.show('right', html);

            });
        },


        viewContent: function(courseId, contentId, fileIndex) {
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
                contentId: contentId,
                backLink: "#course/contents/" + courseId
            };
            var tpl = MM.plugins.contents.templates.content.html;

            // Now we detect the type of content, for displaying the correct template.            
            if (typeof(content.contents) != "undefined") {
                
                if (content.contents.length == 1) {
                    element.type == "singlefile";
                    element.file = content.contents[0];
                    element.file.download = element.file.fileurl + "&token=" + MM.config.current_token;
                    
                    if(typeof(element.file.localpath) != "undefined") {
                        element.file.localpath = MM.fs.getRoot() + element.file.localpath;
                    }
                    
                    var extension = element.file.fileurl.replace("?forcedownload=1", "");
                    extension = extension.substr(extension.lastIndexOf(".") + 1);

                    if (typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                        element.file.objectData = element.file.localpath;
                        element.file.objectType = MM.plugins.contents.templates.mimetypes[extension];
                        element.file.objectHeight = $(document).innerHeight() - 200;
                    }

                    tpl = MM.plugins.contents.templates.file.html;
                    
                    if (typeof(fileIndex) != "undefined") {
                        element.backLink = "#course/contents/" + courseId + "/view/" + contentId;
                    }
                    
                } else {
                    element.type = "multiplefiles";
                }
            } 

            var html = MM.tpl.render(tpl, element);
            
            MM.panels.show('right', html);
            MM.widgets.enhance([{id: "modlink", type: "button"}, {id: "backbutton", type: "button"}]);
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