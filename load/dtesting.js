/*
 * dtesting.js
 * by Damon Getsman
 *
 * started: 26 Apr 16
 * beta:
 * finished:
 *
 * Just a collection of helpful features that I need in order to try to debug
 * some issues, primarily in the message base functionality.  This will
 * probably grow to hold some other useful bits for sysop actions on the BBS.
 */

testing = {
    //methods

    createTestMsgs : function() {
        //testing for multiple rooms or just the one?
        var num;

        console.putmsg(blue + high_intensity + "<ENTER> to create 3 test" +
            " messages in the current room,\n" + "<#> of consecutive rooms to" +
            "populate with messages,\n" + "or <NONE> to escape: ");
        num = console.getstr();

        if (num == "NONE") {
            throw new docIface.dDocException("createTestMsgs() Exception",
                "User exit", 1);
        } else {
            try {
                num = Number.parseInt(num, 10);
            } catch (e) {
                throw new docIface.dDocException("createTestMsgs() Exception",
                    "parseInt fail: " + e.message, 2);
            }
        }

        //if we made it to here we should be good to use it as a number
        if (num <= 0) {
            throw new docIface.dDocException("createTestMsgs() Exception",
                "Invalid number entered", 3);
        }

        for (var cntr = 0; cntr < num; cntr++) {
            //post messages for this room
            var mBase = new MsgBase(bbs.cursub_code);

            for (var cntr2 = 0; cntr2 < 3; cntr2++) {
                //the above loop may be modified to take variable # of posts
                var msgHdr = {
                    subject : "Testing message post # " + (cntr2 + 1),
                    to : "All",
                    from : user.alias
                }

                try {
                    mBase.save_msg(msgHdr, "Post #" + (cntr2 + 1) + "\n\nOuah");
                } catch (e) {
                    throw new docIface.dDocException("createTestMsgs() " +
                        "Exception", "Error saving message", 4);
                }
            }

            //skip to the next sub and do this shite again, unless it's last
            //we'll need to put in some error handling for loops that are
            //larger than the length of the # of rooms remaining at some point
            //and shit, too
            //
            //NOTE: docIface.util.skip() is not set up correctly in this branch
            //of the code
            
        }
    }
}