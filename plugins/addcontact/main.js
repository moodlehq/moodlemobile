define(function () {
    var plugin = {
        settings: {
            name: "addcontact",
            type: "user",
            menuURL: "#contact",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["contact/:courseId/:userId", "contact", "addContact"]
        ],

        addContact: function(courseId, userId) {

            MM.log("Adding a contact");

            var currentUser = MM.db.get("users", MM.config.current_site.id + "-" + userId);
            currentUser = currentUser.toJSON();

            var myContact = navigator.contacts.create();
            myContact.displayName = currentUser.fullname;
            myContact.nickname = currentUser.fullname;

            var name = new ContactName();
            name.givenName = currentUser.fullname;
            name.familyName = "";
            myContact.name = name;

            var emails = [1];
            emails[0] = new ContactField('work', currentUser.email, true);
            myContact.emails = emails;

            var photos = [1];
            photos[0] = new ContactField('url', currentUser.profileimageurl, true);
            myContact.photos = photos;

            MM.log("Saving contact ("+myContact.displayName+"  "+myContact.nickname+"), calling phonegap");
            myContact.save(
                function(contact){ MM.popMessage(MM.lang.s("contactadd")); },
                function(contactError){ MM.popErrorMessage(MM.lang.s("error") + " " + contactError.code); }
            );
            MM.log("End of saving contact, phonegap called");
        }
    }

    MM.registerPlugin(plugin);
});