define(function () {
    var plugin = {
        settings: {
            name: "contents",
            type: "course",
            menuURL: "#course/contents/",
            lang: {
                component: "moodle",
                file: "mobile"
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
            window.alert("browse");
        },

        viewContent: function(courseId, contentId) {
            window.alert("take");
        },
        
        templates: {
            "content": {
                model: content,
                html: "<h1><%= content.title %></h1>"
            },
            "contents": {
                html: "<li></li>"
            }
        }
    }

    MM.registerPlugin(plugin);
});