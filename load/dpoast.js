/*
 * dpoast.js
 * by Damon Getsman
 * 
 * started: 6 Nov 14
 * beta: 10 Mar 15
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
                nao.toString() + green + " from " +
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
        var uc, done;

        do {
          done = false;
          console.putmsg(docIface.sprompt);
          uc = console.getkey(K_UPPER);

          switch (uc) {
            case 'A':   //abort
		console.putmsg(green + high_intensity + "Abort\n");
                console.putmsg(red + high_intensity + "Abort: ");
                done = console.yesno("Are you sure? ");
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
	 *	Modularizes the text snagging routine (w/optional maximum
	 *	number of lines); note that the 'X' optihttps://github.com/dgets/DOCshellon still needs to be
         *	implemented here to enable Xpress messages to be sent (not sure
         *	if they're set up for asynchronous receive or not at this point;
         *	I guess I'd assume that they aren't)
	 * maxLines:
	 *	Maximum number of lines (or null)
	 * return:
	 *	Text array or null (not sure what the null may be signifying;
         *	probably need to check calling code to see what this is all
         *	about (strike that it looks like it's for abort, and thus should
         *	be throwing an exception)
	 */
    getTextBlob : function(maxLines) {
      var mTxt = new Array();
      var uchoice;
      var done = false, cntr = 0, lNdx = 0;

      if (maxLines == null) {
	maxLines = 5000;
      }

      do {
          mTxt[lNdx] = console.getstr("", 79, K_WRAP);
	  if (userSettings.debug.message_posting) {
	    console.putmsg(red + "Just got: " + mTxt[lNdx] + "\nAt index: " +
	      lNdx + "\n");
	  }

          if (((mTxt[lNdx++] == "\03") && (upload)) ||
              ((mTxt[lNdx - 1] == "") || (mTxt[lNdx - 1] == "\r") ||
	       (mTxt[lNdx - 1] == "\n")) ||
	      (cntr++ == maxLines)) {

            //end of message
	    if (cntr >= maxLines) {
		console.putmsg(red + high_intensity + "\nYou hit the " +
		  "maximum message length\n");
	    }
            uchoice = this.dispSaveMsgPrompt().toUpperCase();

            switch (uchoice) {
                /* note, abort is not checked for when this function
                 * exits, and I'm pretty sure there are other little
                 * bugs hiding out in here, as well */
                case 'A':       //abort
                  return null;
                  break;
                case 'C':       //continue
                  lNdx--; cntr--;
                  break;
                case 'P':
                  this.dispNewMsgHdr();
                  for each (var derp in mTxt) {
                    console.putmsg(green + high_intensity + derp);
                  }
                  //fall through to continue w/entry here, too
                  break;
                case 'S':
		  if (userSettings.debug.message_posting) {
		    console.putmsg(red + "mTxt: " + mTxt.toString() +
		      "\nlength: " + mTxt.length + "\nBeing returned\n");
		  }

                  return mTxt;
                  break;
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
	 *	Method gathers the text for a posting/mail
	 * upload:
	 *	Boolean describing whether or not this is uploaded and
	 *	ended with ^D (not implemented yet)
	 * base:
	 *	MsgBase
	 * recip:
	 *	recipient, though this should not be necessary once
	 *	functionality is broken up properly instead of so much
	 *	cuntpaste right now
	 */
    getMsgBody : function(/*upload,*/ base, recip) {
	var mTxt = new Array();

        //going to use a generic subject for now; ignoring it from the
        //ddoc interface completely to see how it goes
	mTxt = this.getTextBlob(null);
	if ((userSettings.debug.message_posting) && (mTxt != null)) {
	  console.putmsg(red + "Got mTxt array of length: " +
		mTxt.length + " back from getTextBlob()\n");
	}

	if (mTxt != null) {
                  try {
                        this.mWrite(mTxt, base, recip);
                        console.putmsg(green + high_intensity
                              + "Message saved\n");
                  } catch (e) {
                        bbs.log_str("Err writing to " + base.name);
                        console.putmsg(red + "There was a problem " +
                                       "writing to " + base.name +
                                       "\nSorry; error is logged.\n");
                  }
	} else {
            throw new docIface.dDocException("getMsgBody() Exception",
                "Null message/aborted", 1);
        }
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

	//turn off instant messages coming in while posting BITWISE DEBAUCHERY
	bbs.sys_status |= SS_MOFF;

        //var debugging = false;        //only for local here
	if (userSettings.debug.message_posting) {
	  console.putmsg(red + "addMsg: base.subnum: " + base.subnum + 
	    "\tu/l: " + upload + "\trecip:" + recip + "\n");
	  console.putmsg(red + "base.is_open: " + base.is_open + "\n");
	}

        this.dispNewMsgHdr();

        //going to use a generic subject for now; ignoring it from the
        //ddoc interface completely to see how it goes
	this.getMsgBody(/*upload,*/ base, recip);

	//turn instant messages back on
	bbs.sys_status |= SS_MOFF;
    },
        /*
         * summary:
         *      Writes appropriate message header & body data to the
         *      database; note that this is a monolith that needs to be severely
         *      dismembered and strung back together in a medival fashion like
         *      something out of H.P. Lovecraft
         * txtArray: Array of String
         *      An array of textual strings making up the body of the
         *      message to be added to the base
         * mBase: MsgBase Object
         *      Current MsgBase to be written to
         * return:
         *      Utterly horrifying; throw some fucking exceptions-- actually
         *      upon further examination it looks like most of this has been
         *      implemented, though it's still throwing 0 for success
         *      0 for success
         *      -1 if unable to open the MsgBase
         *      -2 if unable to complete MsgBase.save_msg()
         *      -3 if unable to close the MsgBase
         */
    mWrite : function(txtArray, mBase, recipient) {
	if (userSettings.debug.message_posting) {
	  console.putmsg(red + "Given txtArray[] of length: " +
	    txtArray.length + "\n");
	}

        //create the message for writing
        var mHdr = {
                'from'          :       user.alias,
                //'to'            :       "All",  
                'subject'       :       "dDOC Posting"  //cheat for now
        }
	if ((recipient != null) && 
	      (recipient.toString().toUpperCase() != "ALL")) {
		if (recipient !== 1) {
		  var tmpUser = new User(recipient);
		  mHdr['to'] = tmpUser.alias;
		} else {
		  var sysop = new User(recipient);
		  mHdr['to'] = sysop.alias;
		}
	} else {
		mHdr['to'] = "All";
	}

	if (userSettings.debug.message_posting) {
	    //debug dump requested by echicken (?) in order to help find
	    //out what is causing mail sent to the 'mail' sub board is
	    //ending up in 'all mail' but never a personal account, and
	    //also (I believe) triggering networked processing
	    console.putmsg(red + "DEBUGGING:\nmHdr values:\n" +
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
		mHdr["to_ext"] = recipient;
		mHdr["from_ext"] = user.number;
		if (recipient == 1) {
		  mHdr["subject"] = "<Y>ell mail to SysOp";
		  //this should be handled better
		} else {
		  mHdr["subject"] = "dDoc Mail>";
                }

                docIface.setNodeAction(NODE_PMSG);
	} else {
          	var dMB = new MsgBase(mBase.cfg.code);

                docIface.setNodeAction(NODE_SMAL);
	}

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

	//need to move this out into separate code - not going to do that until
        //I figure out how I've been repeatedly breaking it doing so with
        //msg_base.util.openNewMBase(), though
        try {
            dMB.open();
        } catch (e) {
            console.putmsg(red + "Error opening: " + high_intensity +
                mBase.subnum + normal + "\n");
            log("dDOC err opening: " + mBase.subnum + "; " + e.message);
	    throw new docIface.dDocException("mWriteException",
			e.message, e.number);
        }

	if (userSettings.debug.message_posting) {
	    console.putmsg(red + "Received mBase.subnum:\t" + dMB.subnum + 
		"\t(in call to mWrite())\n");
	    console.putmsg(red + "\nNext debugging output is text " +
		"concatenation for message body.\n\n");
	}

        var catMTxt = new String();
        for each (var ouah in txtArray) {
            if (userSettings.debug.message_posting) {
                console.putmsg(red + "ouah: " + ouah + "\n" + normal);
            }
            catMTxt += (ouah + "\n");
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
        return 0;   //get rid of this once calling code is modified
    },
	/*
	 * summary:
	 *	Takes a message with the message handling routines and
	 *	sends it in private mail to the sysop, marked as
	 *	important/urgent, if possible.  Strict emulation as
	 *	possible.  Takes no arguments, gives no return status,
	 *	though this might be good for error checking later on.
         *
         * NOTE: Okay so it wasn't SUPPOSED to be giving an return statuses;
         *       I've found that this isn't quite accurate, there's a -1 that is
         *       returned for an error code so, despite just doing a
         *       documentation pass, I'm going to go ahead and change that to a
         *       throw exception
	 */
    yell : function() {
        if (console.noyes("Send Yell to SysOp")) {
            console.putmsg(yellow + high_intensity + "Aborting Yell to " +
                "SysOp\n");
            return;
        }

	var mb = new MsgBase('mail');
	if (userSettings.debug.message_posting) {
	  console.putmsg(red + "God ouah (MsgBase('mail') status):\t" +
	    mb.file + "\n");
	}

	docIface.log_str_n_char("YELL to SysOp", 'y');

	//proceed to send the yell
	//doing this by user number now, since lookup by user number and
	//other methods to determine the sysop's alias seem lobotimized,
	//non-existant, or otherwise retarded
	try {
          poast.addMsg(mb, false, 1);
        } catch (e) {
            console.putmsg(green + high_intensity + "Message aborted: " +
                e.message + "\n");
            return;
        }

        if (userSettings.debug.message_posting) {
	  console.putmsg(green + high_intensity + "If you didn't see " +
            "anything foreboding above, your message will be read by " +
            "system user #1 upon next login.\n");
        }
    }
}

