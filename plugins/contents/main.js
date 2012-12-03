var templates = [
    "root/externallib/text!root/plugins/contents/sections.html",
    "root/externallib/text!root/plugins/contents/contents.html",
    "root/externallib/text!root/plugins/contents/content.html"
];

define(templates,function (sectionsTpl, contentsTpl, contentTpl) {
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
            ["course/contents/:courseid/view/:contentid", "course_contents_view", "viewContent"]
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
					contentsStored.push(el);
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


        viewContent: function(courseId, contentId) {
            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();

            var html = MM.tpl.render(MM.plugins.contents.templates.content.html, {content: content});
            MM.panels.show('right', html);
            MM.widgets.enhance([{id: "modlink", type: "button"}]);
        },
        
        
        getLocalPaths: function(courseId, modId, file) {

            var filename = file.fileurl.replace("?forcedownload=1", "");
            filename = filename.substr(filename.lastIndexOf("/") + 1);
            // We store in the sdcard the contents in site/course/modname/id/contentIndex/filename
            var path = MM.fs.getRoot() + "/" + MM.config.current_site.id + "/" + courseId + "/" + modId;

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
            "contents": {
                html: contentsTpl
            },
            "sections": {
                html: sectionsTpl
            }
        }
    }

    MM.registerPlugin(plugin);
});