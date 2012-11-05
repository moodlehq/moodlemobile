var templates = [
    "root/lib/text!root/plugins/contents/contents.html"
];

define(templates,function (contentsTpl) {
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
                console.log(contents);
                var tpl = {
                    sections: contents,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }
                var html = _.template(MM.plugins.contents.templates.contents.html, tpl);
                MM.panels.show('center', html);
            });
        },

        viewContent: function(courseId, contentId) {
            window.alert("take");
        },
        
        templates: {
            "content": {
                model: "content",
                html: "<h1><%= content.title %></h1>"
            },
            "contents": {
                html: contentsTpl
            }
        }
    }

    MM.registerPlugin(plugin);
});