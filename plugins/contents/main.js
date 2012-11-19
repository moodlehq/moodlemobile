var templates = [
    "root/lib/text!root/plugins/contents/contents.html",
    "root/lib/text!root/plugins/contents/content.html"
];

define(templates,function (contentsTpl, contentTpl) {
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
                var courseName = course.get("fullname");
                
                
                var firstContent = 0;
                
                $.each(JSON.parse(JSON.stringify(contents)), function(index, sections){
                    $.each(sections.modules, function(index, content){                        

                        content.contentid = content.id;
                        content.courseid = courseId;
                        content.id = MM.config.current_site.id + "-" + content.contentid;

                        if(!firstContent) {
                            firstContent = content.contentid;
                        }
                        
                        // This content is currently in the database.
                        if (MM.db.get("contents", content.id)) {
                            return true; // This is a continue;
                        }
                        
                        MM.db.insert("contents", content);
                        
                        // Sync content files.

                        if (typeof(content.contents) != "undefined") {
                            $.each(content.contents, function (index, file) {
                                var el = {
                                    id: hex_md5(MM.config.current_site.id + file.fileurl),
                                    url: file.fileurl,
                                    mod: {
                                        id: content.contentid,
                                        pos: index,
                                        name: content.modname,
                                        course: courseId
                                    },
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
                    sections: contents,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }
                var html = MM.tpl.render(MM.plugins.contents.templates.contents.html, tpl);
                MM.panels.show('center', html);

                if (MM.deviceType == "tablet" && contents.length > 0) {
                    MM.plugins.contents.viewContent(courseId, firstContent);
                }
            });
        },

        viewContent: function(courseId, contentId) {
            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();
            
            var html = MM.tpl.render(MM.plugins.contents.templates.content.html, {content: content});
            MM.panels.show('right', html);
            MM.widgets.enhance([{id: "modlink", type: "button"}]);
        },
        
        templates: {
            "content": {
                model: "content",
                html: contentTpl
            },
            "contents": {
                html: contentsTpl
            }
        }
    }

    MM.registerPlugin(plugin);
});