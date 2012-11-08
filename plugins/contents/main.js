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
                component: "moodle"
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
                var course = MM.collections.courses.get(MM.config.current_site.id + "-" + courseId);
                
                var firstContent = 0;
                
                $.each(JSON.parse(JSON.stringify(contents)), function(index, sections){
                    $.each(sections.modules, function(index, content){
                        content.contentid = content.id;
                        content.courseid = courseId;
                        content.id = MM.config.current_site.id + "-" + content.contentid;
                        MM.collections.contents.create(content);
                        if(!firstContent) {
                            firstContent = content.contentid;
                        }
                    });
                });

                var tpl = {
                    sections: contents,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }
                var html = _.template(MM.plugins.contents.templates.contents.html, tpl);
                MM.panels.show('center', html);

                if (MM.deviceType == "tablet" && contents.length > 0) {
                    MM.plugins.contents.viewContent(courseId, firstContent);
                }
            });
        },

        viewContent: function(courseId, contentId) {
            MM.collections.contents.fetch();
            //console.log(MM.config.current_site.id + "-" + contentId);
            var content = MM.collections.contents.get(MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();
            
            var html = _.template(MM.plugins.contents.templates.content.html, {content: content});
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