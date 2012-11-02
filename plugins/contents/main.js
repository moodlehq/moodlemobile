define(function () {
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
            var data = {
            "options[0][name]" : "",
            "options[0][value]" : ""
            };
            
            data.courseid = courseId;
            
            MM.moodleWSCall('core_course_get_contents', data, function(contents) {
                console.log(contents);    
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
                html: "<li></li>"
            }
        }
    }

    MM.registerPlugin(plugin);
});