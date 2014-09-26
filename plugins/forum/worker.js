self.onmessage = function(e) {
    var forums = e.data.forums;
    var that = self;

    function getForumDiscussions() {
        if (forums.length < 1) {
            return;
        }
        var forumId = forums.pop();
        // Ensure strings not numbers, we generate a unique id for the request based on the data.
        var data = {
            "forumid": forumId + "",        // Forum module instance id.
            "sortby":  "timemodified",
            "sortdirection":  "DESC",
            "page": "0",
            "perpage": e.data.perPage + "",
            "wsfunction": e.data.wsPrefix + "mod_forum_get_forum_discussions",
            "wstoken": e.data.token
        };
        var url = e.data.siteurl + "/webservice/rest/server.php?moodlewsrestformat=json";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var resp = JSON.parse(xhr.responseText);
                that.postMessage({xhrData: data, data: resp, url: url});
            }
            getForumDiscussions();
        };
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        xhr.send(query.join('&'));
    }

    getForumDiscussions();

};