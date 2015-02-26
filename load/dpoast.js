/*
 * dpoast.js
 * by Damon Getsman
 * 
 * started: 6 Nov 14
 * beta:
 * finished:
 *
 * Moving the routines for a new poasting out of dmbase.js into their
 * own separate file here; obviously object method calls are going to
 * have to be fixed throughout the code to fix this movement
 */

load("sbbsdefs.js");

poast = {
	//		---+++***===METHODS===***+++---

        /*
         * summary:
         *      Displays initial header when starting to enter a new
         *      message for posting
         */
    dispNewMsgHdr : function() {
        //obviously date is only showing the day # (easy fix)
        var nao = new Date();

        console.putmsg("\n" + magenta + high_intensity +
                nao.getDate().toString() + green + " from " +
                cyan + user.alias + "\n" + green);
    },  
        /*
         * summary:
         *      Displays the save message menu & prompt
         * return:
         *      Returns the letter code of the valid menu option
         *      selected
         */
    dispSaveMsgPrompt : function() {
        //kind of self-explanatory, don't you think?
        var uc, done;

        do {
          done = false;
          console.putmsg(docIface.sprompt);
          uc = console.getkey(K_UPPER);

          switch (uc) {
            case 'A':   //abort
                console.putmsg(red + high_intensity + "Abort: ");
                done = console.yesno("are you sure? ");
                break;
            case 'C':   //continue
                console.putmsg(green + high_intensity +
				"Continue...\n");
                break;
            case 'P':   //print
                console.putmsg(green + high_intensity + "Print " +
                                "formatted...\n");
                break;
            case 'S':   //save
                console.putmsg(green + high_intensity + "Save...\n");
		done = true;
                break;
            case 'X':   //message express
                console.putmsg(red + "Implementing Xpress here " +
                                "later\n");
                done = false;
                break;
	    default:
		console.putmsg(yellow + high_intensity +
			"Invalid choice\n");
		break;
          }
        } while ((!done) || 
		 ((uc != 'A') && (uc != 'C') && (uc != 'P') &&
                  (uc != 'S') /* && (uc != 'X')*/ ));

        return uc;
    },  
        /*
         * summary:
         *      Primary method for text entry for a message into the
         *      active message base via DOCesque interface
         * base: MsgBase object
         *      Currently open MsgBase
         * upload: Boolean
         *      true if doing an 'ascii upload'
	 * recip: String
	 *	if to anybody other than 'All'
         */
    addMsg : function(base, upload, recip) {
        /*
         * NOTE: This method is way too big and needs to be chopped the
         * fuck up in order to make this more readable and more reusable
         */
        var mTxt = new Array();
        var lNdx = 0, done = false;
        var uchoice;

        //var debugging = false;        //only for local here
	if (localdebug.message_posting) {
	  console.putmsg(red + "Passed to addMsg(base, upload, " +
	    "recip):\n");
	  console.putmsg(red + "base.subnum:\t" + base.subnum + 
	    "\nu/l:\t" + upload + "\nrecip:\t" + recip + "\n");
	}

        this.dispNewMsgHdr();

        //going to use a generic subject for now; ignoring it from the
        //ddoc interface completely to see how it goes
        do {
          mTxt[lNdx] = console.getstr("", 79, K_WRAP);
          if (((mTxt[lNdx++] == "\03") && (upload)) ||
              ((mTxt[lNdx - 1] == "") || (mTxt[lNdx - 1] == "\r"))) {
            //end of message
            uchoice = this.dispSaveMsgPrompt();

            switch (uchoice) {
		/* note, abort is not checked for when this function
 		 * exits, and I'm pretty sure there are other little
 		 * bugs hiding out in here, as well */
                case 'A':       //abort
                  done = true;
                  break;
                case 'C':       //continue
                  lNdx--;
                  break;
                case 'P':
                  this.dispNewMsgHdr();
                  for each (var derp in mTxt) {
                    console.putmsg(green + high_intensity + derp);
                  }
                  //fall through to continue w/entry here, too
                  break;
                case 'S':
		  //screw those old error codes
		  try {
			this.mWrite(mTxt, base, recip);
		  } catch (e) {
			bbs.log_str("Err writing to " + base.name);
                        console.putmsg(red + "There was a problem " +
                                       "writing to " + base.name +
                                       "\nSorry; error is logged.\n");
			done = true;
		  }
		  break;
		  /*
                  if (this.mWrite(mTxt, base, recip) < 0) {
                    console.putmsg(red + "There was a problem " +
                                   "writing to " + base.name +
                                   "\nSorry; error is logged.\n");
                    //put it some code to cuntpaste it back to the
                    //screen or something of the sort so that the user
                    //has a chance to salvage what they wrote, maybe?
                    log(LOG_WARN, "Err writing to " + base.name);
                  } else {
                    console.putmsg(cyan + high_intensity +
                                   "Message saved successfully\n");
                  }
		  done = true;
                  break;
		  */
                /* case 'X':
                 * just skipping this right now since I'm impatient
                 * about losing all of the recoding this morning and
                 * feeling much more that time is of the essence :| */
                default:
                  console.putmsg(red + "I have no idea what just " +
                                 "happened; event logged.\n");
                  bbs.log_str("Unknown error in addMsg()");
                  break;
            }
          }
        } while (!done);
    }, 
	/*
	 * summary:
	 *	method exists for returning exception from mWrite()
	 */
        /*
         * summary:
         *      Writes appropriate message header & body data to the
         *      database
         * txtArray: Array of String
         *      An array of textual strings making up the body of the
         *      message to be added to the base
         * mBase: MsgBase Object
         *      Current MsgBase to be written to
         * return:
         *      0 for success
         *      -1 if unable to open the MsgBase
         *      -2 if unable to complete MsgBase.save_msg()
         *      -3 if unable to close the MsgBase
         */
    mWrite : function(txtArray, mBase, recipient) {
          //create the message for writing
          var mHdr = {
                'from'          :       user.alias,
                //'to'            :       "All",  
                'subject'       :       "dDOC Posting"  //cheat for now
          }
	  if ((recipient != null) && 
	      (recipient.toString().toUpperCase() != "ALL")) {
		if (recipient !== 1) {
		  mHdr['to'] = recipient;
		} else {
		  var sysop = new User(recipient);
		  mHdr['to'] = sysop.alias;
		}
	  } else {
		mHdr['to'] = "All";
	  }

	  if (localdebug.message_posting) {
	    //debug dump requested by echicken (?) in order to help find
	    //out what is causing mail sent to the 'mail' sub board is
	    //ending up in 'all mail' but never a personal account, and
	    //also (I believe) triggering networked processing
	    console.putmsg(red + "DEBUGGING\nmHdr values:\n" +
		"from\t:\t" + mHdr['from'] + " (user.alias)\n" +
		"to\t:\t" + mHdr['to'] + " selected by code as " +
		"sysop.alias or recipient name passed (null=ALL)\n" +
		"subject\t:\t" + mHdr['subject'] + " static\n\n");
	  }

	  /*
	   * This is really kind of nasty, but I'm not functioning well
	   * enough right now to get down to the bottom of how it's
	   * being handled differently for the mail sub as opposed to
	   * the standards.  :P  Whatever, it'll go into a later
	   * refactor.
	   */
	  if (mBase.subnum == -1) {
		var dMB = new MsgBase('mail');
		mHdr["to_ext"] = 1;
		mHdr["from_ext"] = user.number;
		mHdr["subject"] = "<Y>ell mail to SysOp";
	  } else {
          	var dMB = new MsgBase(mBase.code);
	  }
          //var debugging = false;        //locally, of course

	  /*
	   * Here, because of being sent to sub['mail'] does not seem to
	   * be working, we're going to try implementing the bbs.email()
	   * function which, I believes, has the option granularity to
	   * be able to make certain that email is manually set or not
	   * as far as going to the network.  To this point, logs seem
	   * to indicate that previous messages sent to the 'mail' sub
	   * have ended up looking for a way out on the network, and not
	   * at local users.
	   */

	  //need to move this out into separate code
          try {
            dMB.open();
          } catch (e) {
            console.putmsg(red + "Error opening: " + high_intensity +
                mBase.subnum + normal + "\n");
            log("dDOC err opening: " + mBase.subnum + "; " + e.message);
	    throw new docIface.dDocException("mWriteException",
			e.message, e.number);
          }

	  if (localdebug.message_posting) {
	    console.putmsg(red + "Received mBase.subnum:\t" + dMB.subnum + 
		"\t(in call to mWrite())\n");
	    //console.putmsg(red + "Group:\t" + dMB.grp_name +
	    //	"\nSub-board:\t" + dMB.name + "\n");
	    console.putmsg(red + "\nNext debugging output is text " +
		"concatenation for message body.\n\n");
	  }

          var catMTxt = new String();
          for each (var ouah in txtArray) {
            if (localdebug.message_posting) {
                console.putmsg(red + "ouah: " + ouah + "\n" + normal);
            }
            catMTxt += ouah;
          }

          try {
            dMB.save_msg(mHdr, catMTxt);
          } catch (e) {
            console.putmsg(red + "Error saving to: " + high_intensity +
                mBase.subnum + normal + "\n");
            log("dDOC err saving msg to: " + mBase.subnum + "; " 
		+ e.message);
	    throw new docIface.dDocException("mWriteException", e.message,
			e.number);
          }

          try {
            dMB.close();
          } catch (e) {
            console.putmsg(red + "Error closing: " + high_intensity +
                mBase.subnum + normal + "\n");
            log("dDOC err closing: " + mBase.subnum + "; " + e.message);
	    throw new docIface.dDocException("mWriteException", e.message,
			e.number);
          }
          return 0;
    },
	/*
	 * summary:
	 *	Takes a message with the message handling routines and
	 *	sends it in private mail to the sysop, marked as
	 *	important/urgent, if possible.  Strict emulation as
	 *	possible.  Takes no arguments, gives no return status,
	 *	though this might be good for error checking later on.
	 */
    yell : function() {
	console.putmsg(green + high_intensity + "\nPress 'y' to send" +
	  " a yell to the Sysop(s).\n\nEnter your choice -> ");
	if (console.getkey().toUpperCase() != 'Y') {
	  return -1;
	}

	var mb = new MsgBase('mail');
	if (localdebug.message_posting) {
	  console.putmsg(red + "God ouah (MsgBase('mail') status):\t" +
	    mb.file + "\n");
	}

	docIface.log_str_n_char("YELL to SysOp", 'y');

	//proceed to send the yell
	//doing this by user number now, since lookup by user number and
	//other methods to determine the sysop's alias seem lobotimized,
	//non-existant, or otherwise retarded
	poast.addMsg(mb, false, 1);

	console.putmsg(green + high_intensity + "If you didn't see " +
	  "anything foreboding above, your message will be read by " +
	  "system user #1 upon next login.\n");
    }

}

