self.onmessage = function(e) {
    var forums = e.data.forums;
    var that = self;
    var posts = [];

    function getForumPosts() {
        if (posts.length < 1) {
            return;
        }
        var discussionId = posts.pop();

        // Ensure strings not numbers, we generate a unique id for the request based on the data.
        var data = {
            "discussionid": discussionId + "",
            "wsfunction": e.data.wsPrefix + "mod_forum_get_forum_discussion_posts",
            "wstoken": e.data.token
        };
        var url = e.data.siteurl + "/webservice/rest/server.php?moodlewsrestformat=json";
        // CORS enabled server.
        var corsURL = e.data.siteurl + "/local/mobile/server.php?moodlewsrestformat=json";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", corsURL, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var resp = JSON.parse(xhr.responseText);
                if (resp.posts) {
                    that.postMessage({xhrData: data, data: resp, url: url});
                }
            }
            getForumPosts();
        };
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        xhr.send(query.join('&'));
    }

    function getForumDiscussions() {
        if (forums.length < 1) {
            // Once the discussions are sync, start with posts.
            getForumPosts();
            return;
        }
        var forumId = forums.pop();
        // Ensure strings not numbers, we generate a unique id for the request based on the data.
        var data = {
            "forumid": forumId + "",        // Forum module instance id.
            "sortby":  "timemodified",
            "sortdirection":  "DESC",
            "page": e.data.page + "",
            "perpage": e.data.perPage + "",
            "wsfunction": e.data.wsPrefix + "mod_forum_get_forum_discussions_paginated",
            "wstoken": e.data.token
        };
        var url = e.data.siteurl + "/webservice/rest/server.php?moodlewsrestformat=json";
        // CORS enabled server.
        var corsURL = e.data.siteurl + "/local/mobile/server.php?moodlewsrestformat=json";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", corsURL, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var resp = JSON.parse(xhr.responseText);
                if (resp.discussions) {
                    that.postMessage({xhrData: data, data: resp, url: url});
                    for (var el in resp.discussions) {
                        var d = resp.discussions[el];
                        posts.push(d.discussion);
                    }
                }
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