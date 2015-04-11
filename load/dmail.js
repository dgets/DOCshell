/*
 * dmail.js
 * by: Damon Getsman
 * started: 10 Apr 15 (at least in a separate file)
 * finished:
 */

/*
 * summary:
 *    Sub-object holds all of the components to deal with Mail> properly
 */
uMail = {
    //mailPrompt : yellow + high_intensity + "Mail> ",
        /*
         * summary:
         *      Method finds the current pseudo-scan_ptr for the mail 
         *      pseudo-sub
         * return:
         *      Returns an array of applicable message indices, or -1
         */
    getMailScanPtr : function(mmBase, prevNdx) {
        var applicableMailList = new Array();
        var mNdx = prevNdx;
        var mHdr;

        if (userSettings.debug.message_scan) {
          console.putmsg(yellow + "total_msgs: " + mmBase.total_msgs +
                "\n");
          console.putmsg(yellow + "Scanning for messages to " + user.number +
		" . . .  ");
        }

        //there will have to be more elegant handling of the present/prevNdx
        //message pointer at some point in the future here; just trying to
        //get this working for now
        for (var i = prevNdx; i < mmBase.total_msgs; ++i) {
          if (userSettings.debug.message_scan) {
            console.putmsg(red + i + " ");
          }

          try {
            mHdr = mmBase.get_msg_header(true, i, true);
          } catch (e) {
            console.putmsg(red + high_intensity + "Error reading mail " +
                "headers!\n");
            throw new dDocException("readMail() exception",
                "Unable to read message header(s): " + e.message, 2);
          }

          if (userSettings.debug.message_scan) {
            //in-depth debugging for message attributes
	    console.putmsg(" to_ext: " + mHdr.to_ext + " to: " + mHdr.to +
		"; ");

            if ((mHdr.to == user.name) || (mHdr.to == user.alias)) {
                console.putmsg("Message to " + user.number + " found.");
            }
            if ((mHdr.attr & MSG_READ) == MSG_READ) {
                console.putmsg("MSG_READ ");
            } else { 
		console.putmsg(" "); 
	    }
          }

          if (mHdr.to_ext == user.number) {
	    if (userSettings.debug.message_scan) {
		console.putmsg("Pushing " + i + " to list\n");
	    }
            applicableMailList.push(i);
          }

        }
        console.putmsg("\n");

        if (userSettings.debug.message_scan) {
          console.putmsg("\nReturning: " + applicableMailList.toString() +
		"\n");
        }

        return applicableMailList;
    },
        /*
         * summary:
         *      Method exists to read mail, pump it into the DOC format,
         *      and display it to the end user
         * return:
         *      Returns nothing, unless signalling to primary code flow that
         *      a logout has been requested (-1 value)
         */
    readMail : function() {
        var mmBase = new MsgBase("mail");
        var fuggit = false, increment = 1, mNdx = 0;
        var uChoice, mHdr, mBody, mailList;

        try {
          mmBase.open();
        } catch (e) {
          console.putmsg(red + high_intensity + "Unable to open mmBase\n");
          throw new dDocException("readMail() exception",
            "The cave is too dark to read yr scroll", 1);
        }

        //so that mess should have gotten us the current message index scan
        //pointer (or pseudo-version thereof); now we can start
        mailList = this.getMailScanPtr(mmBase, mNdx);

	if (userSettings.debug.message_scan) {
	  console.putmsg("Got back mailList: " + mailList.toString() + "\n");
	}

        while (!fuggit) {
          //let's read da shit
          console.putmsg(yellow + high_intensity + "Mail> ");//this.mailPrompt);
          uChoice = console.getkey();   //NOTE: this will have to be replaced
                                        //w/one checking for Xes

          /* if (userSettings.debug.message_scan) {
            //should probably add a 'mail' option to the debugging opts
            console.putmsg(yellow + "Working with mNdx: " + mNdx + "\n");
          } */

          switch (uChoice) {
            case 'n':
            case ' ':
                //display, if exists, otherwise exit
                try {
                  mHdr = mmBase.get_msg_header(true, mailList[mNdx]);
                  mBody = mmBase.get_msg_body(true, mailList[mNdx]);
                } catch (e) {
                  console.putmsg(red + high_intensity + "Unable to read " +
                    "mail header|body\n");
                  throw new dDocException("readMail() exception",
                    "Unable to fetch this mail's header|body: " + e.message,
                    3);
                }

		if (userSettings.debug.message_scan) {
		  console.putmsg("Made it to be displaying Mail>\n");
		}

                //display message
                msg_base.dispMsg(mmBase, mailList[mNdx], false);

                //display prompt
                msg_base.doMprompt(mmBase, mNdx);

		//get ready for next
		mNdx += increment;
            break;
            case 'b':
                //switch direction
                increment *= -1;

                if (userSettings.debug.message_scan) {
                  console.putmsg("Changed increment to: " + increment + "\n");
                }
            break;
            case 'd':
                //delete message
                try {
                  mmBase.remove_msg(mailList[mNdx]);
                } catch (e) {
                  console.putmsg(red + high_intensity + "Unable to delete " +
                    "mail due to " + e.message + "\n");
                  throw new dDocException("readMail() exception",
                    "Unable to delete message: " + e.message, 4);
                }

                console.putmsg(yellow + high_intensity + "Mail message " +
                        "baleeted . . .\n");
                break;
            break;
            case 's':
                //stop reading Mail>
                console.putmsg(yellow + high_intensity + "Stop\n");
                fuggit = true;
            break;
            case 'l':
                if (!console.noyes("Logout?")) {
                  if (userSettings.debug.navigation) {
                    console.putmsg(red + "Sending -1 to request logout\n");
                  }
                  return -1;    //god ouah
                }
            break;
            default:
                //wut
                console.putmsg(yellow + high_intensity + "Wut?\n\n");
            break;

          }

          if (((mNdx == (mailList.length - 1)) && (increment == 1)) ||
              ((mNdx == 0) && (increment == -1))) {
            if (userSettings.debug.message_scan) {
                  console.putmsg("End of messages detected\n");
            }

            console.putmsg(green + high_intensity + "Goto\n");
            fuggit = true;        //which way are we handling this?
            return;       /* there should probably be a different
                             exit from this for reverse reading, in the
                             future :P */
          }


        }
    }
}

