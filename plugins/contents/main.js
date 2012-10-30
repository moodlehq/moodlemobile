define(function () {
    var plugin = {
        settings: {
            name: "contents",
            type: "course",
            menuURL: "#course/contents/"
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
        }
    }

    MM.registerPlugin(plugin);
});