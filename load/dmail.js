/*
 * dmail.js
 * by: Damon Getsman
 * started: 10 Apr 15 (at least in a separate file)
 * beta:
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
         *      pseudo-sub; throws appropriate exception if errors arise
         * mmBase:
         *      MsgBase("mail") object
         * prevNdx:
         *      integer index into the array of mail listing; for now it's
         *      just a 0 passed (where to start the scan?)
         * return:
         *      Returns an array of applicable message indices
         */
    getMailScanPtr : function(mmBase, prevNdx) {
        var applicableMailList = new Array();
        //var mNdx = prevNdx;
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
          //not sure if the preincrement operator in the loop above is right
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

          //added messages FROM this user to the list now, as well
          if ((mHdr.to_ext == user.number) || (mHdr.from_ext == user.number)) {
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
         *      a logout has been requested (-1 value); note that this is
         *      definitely not the optimal way to be handling this and there
         *      really should be a better flow implemented.  An exception would
         *      not be out of line for this kind of issue
         * NOTE:
         *      Returning values should just be abolished for this
         */
    readMail : function() {
        var mmBase = new MsgBase("mail");
        var fuggit = false, displayed = true, increment = 1, mNdx = 0;
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
        //NOTE: This is not actually happening yet; we need to search through
        //the pointers, checking the header, for the most recent read one
        mailList = this.getMailScanPtr(mmBase, mNdx);

        try {
            //headers = mmBase.get_all_msg_headers();
            for each(var cNdx in mailList) {
                hdr = mmBase.get_msg_header(cNdx);  //probably want to try/catch
                if ((hdr.attr & MSG_READ) || (hdr.attr & MSG_KILLREAD) ||
                    (hdr.attr & MSG_DELETE)) {
                        mNdx++;
                    } else {
                        break;
                    }
            }
        } catch (e) {
            console.putmsg(cyan + high_intensity + "Unable to pull mmBase " +
                "headers for scanning purposes\n");
            throw new dDocException("readMail() exception",
                "Unable to pull headers to determine current mail message", 5);
            //leave mNdx at 0; comment out the preceding exception if that's ok
        }

	if (userSettings.debug.message_scan) {
	  console.putmsg("Got back mailList: " + mailList.toString() + "\n");

	}

	console.putmsg(yellow + high_intensity + "Mail> ");

        while (!fuggit) {
          //let's read da shit
          uChoice = console.getkey();   //NOTE: this will have to be replaced
                                        //w/one checking for Xes

          if (((uChoice == 'n') && (uChoice != ' ')) &&
	      (((mNdx >= mailList.length) && (increment == 1)) ||
              ((mNdx == 0) && (increment == -1)))) {
            if (userSettings.debug.message_scan) {
                  console.putmsg("End of messages detected\n");
            }

            console.putmsg(green + high_intensity + "Goto\n");
            fuggit = true;        //which way are we handling this?
            return;       /* there should probably be a different
                             exit from this for reverse reading, in the
                             future :P */
          }


          switch (uChoice) {
	    case 'a':	//again
		if (displayed) {
		  mNdx += (increment * -1);
		  displayed = false;
		}
            case 'n':	//next
            case ' ':	//also next
                //display, if exists, otherwise exit
		//the 'otherwise exit' part being currently not completed
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
		  console.putmsg("Calling dispMsg() w/mmBase: " + 
		    mmBase.subnum + "\tindex: " + mailList[mNdx] + 
		    "\tbreaks: true\n");
		  console.putmsg("Pulling mHdr from dmail.js is landing: " +
		    mHdr.subject + "\n");
		}

		if (mHdr === null) {
            		if (userSettings.debug.message_scan) {
                	  console.putmsg(red + "Invalid message? base.subnum: "
                          + base.subnum + " ptr: " + ptr + "\n");
            		}
            	//return;     // Invalid message, skip
                }

                fHdr = "\n" + magenta + high_intensity + mHdr.date + green + 
                  " from " + cyan + mHdr.from + "\n" + green;

                //if (breaks) {
            	  console.putmsg(fHdr + mBody, P_WORDWRAP);   // add fHdr into
                  // putmsg here so it gets included in the line count for
		  // breaks
                /*} else {
            	    if (userSettings.debug.message_scan) {
                	console.putmsg("Putting out message next:\n");
                    }

                    console.putmsg(fHdr + mBody, (P_NOPAUSE | P_WORDWRAP));
                } */

                //display prompt
                msg_base.doMprompt(mmBase, mNdx);

		//get ready for next
		mNdx += increment; displayed = true;
            break;
	    case 'r':
		if (userSettings.debug.message_posting) {
		  console.putmsg("Attempting email reply in Mail>\n" +
		    "Utilizing from_ext: " + mHdr.from_ext + "\n");
		}

		try {
		  this.sendMail(mHdr.from_ext, false);
		} catch (e) {
		  console.putmsg(yellow + "Unable to send email reply: " 
		    + e.message + "\n");
		}
	    break;
	    case 'e':
		if (userSettings.debug.message_posting) {
		  console.putmsg("Attempting initial email in Mail>\n");
		}

		try {
		  this.sendMail(null, false);
		} catch (e) {
		  console.putmsg(yellow + "Unable to send email: " +
		    e.message + "\n");
		}
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
                console.putmsg(yellow + high_intensity + "Mail> ");
            break;
          }

        }
    },
	/*
	 * summary:
	 * 	Method displays a new header for a mail message utilizing the
	 *	lookup for the appropriate username
	 * recip:
	 *	User number for the recipient
	 */
    dispNewMailHdr : function(recip) {
	var nao = new Date();

	if (userSettings.debug.message_posting) {
	  console.putmsg(red + "system.username(" + recip + ") is turning up " 
	    + system.username(recip) + "\n");
	}

	console.putmsg("\n" + magenta + high_intensity + nao.toString() +
		green + " from " + cyan + user.alias + green + " to " +
		system.username(recip) + "\n");
    },
	/*
	 * summary:
	 *	Method handles sending mail to a user from within the Mail>
	 *	sub/room
	 * recip:
	 *	Alias of the recipient; trying to add support for straight-up
	 *	user number to be parsed here, as well
	 * upload:
	 *	Boolean value for whether or not the message is handled as
	 *	uploaded text
	 * return:
	 *	-1 for recipient not found/successfully prompted for, -2 for
	 *	trying to send a null message; this bullshit needs to change
         * NOTE:
         *      Once again the return codes are bogus and it would be a really
         *      great idea to actually use some of the exceptions that we like
         *      to do together anymore
	 */
    sendMail : function(recip, upload) {
	var uNum;
	var mailTxt = new Array();

	if (userSettings.debug.message_posting) {
	  console.putmsg("Entered sendMail()\n");
	}

	if (recip == null) {
	  console.putmsg(green + high_intensity + "Recipient: ");
	  recip = console.getstr("", 40);

	  while ((uNum = system.matchuser(recip)) == 0) {
	    console.putmsg(yellow + high_intensity + "User: " + recip + 
	      " not found!\n" + green + high_intensity + "Recipient (or " +
	      "'quit' to abort email): ");
	    recip = console.getstr("", 40);

	    if (recip == "quit") {
		console.putmsg(yellow + high_intensity + "Abort\n");
		return -1;	//user abort
	    }
	  }
	} else {
	  if (!isNaN(parseInt(recip))) {
	    uNum = recip;
	  } else {
	    uNum = system.matchuser(recip);	//add error testing here
	  }
	}

	/*
	 * Are we going to do anything in the future hear to deal with the
	 * subjects that we have available to us?
	 */
	this.dispNewMailHdr(uNum);
	mailTxt = poast.getTextBlob(null);

	if (mailTxt != null) {
	  try {
	    poast.mWrite(mailTxt, new MsgBase('mail'), uNum);
	  } catch (e) {
	    console.putmsg(red + "Unable to poast.mWrite Mail>: " + e.message +
		"\n");
	  }
	} else {
	  console.putmsg(red + high_intensity + "Not sending a null " +
	    "message!\n");
	  return -2;
	}

    }
}

