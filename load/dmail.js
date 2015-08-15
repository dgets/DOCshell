/*
 * dmail.js
 * by: Damon Getsman
 * started: 10 Apr 15 (at least in a separate file)
 * beta: 2Aug15
 * finished:
 */

//this code makes d4m0 need: https://www.youtube.com/watch?v=BFxaDoyl-1s

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
         * return:
         *      Returns an array of applicable message indices
         */
    getMailScanPtr : function(mmBase) {
        var applicableMailList = new Array();
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
        /*for (var i = msg_area.sub[mmBase.code].last_read; i < mmBase.total_msgs;
             ++i) {*/
        for (var i = 0; i < mmBase.total_msgs; i++) {
          if (userSettings.debug.message_scan) {
            console.putmsg(red + (i + 1) + " ");
          }

          try {
            mHdr = mmBase.get_msg_header(true, i, true);
          } catch (e) {
            console.putmsg(red + high_intensity + "Error reading mail " +
                "headers!\n");
            throw new dDocException("readMail() exception",
                "Unable to read message header(s): " + e.message, 2);
          }

          if ((mHdr.to_ext == user.number) ||
              (mHdr.from_ext == user.number)) {
	    if (userSettings.debug.message_scan) {
		console.putmsg("Pushing " + (i + 1) + " to list\n");
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
     *  Method attempts to use the MSG_READ attribute in the header to find out
     *  where things are at for a current mail scan pointer
     * return:
     *  index into pointer array
     */
    getCurMailScanPtr : function(ptrArray, mmBase) {
        var mHdr;

        if (userSettings.debug.message_scan) {
            console.putmsg(blue + high_intensity +
                "Entered getCurMailScanPtr()\n");
        }

        for each (var cPtr in ptrArray) {
          try {
            mHdr = mmBase.get_msg_header(true, cPtr, true);
          } catch (e) {
              console.putmsg(magenta + "Unable to obtain header: " + cPtr +
                  "\n");
              throw new docIface.dDocException("getCurMailScanPtr() Exception",
                "Unable to obtain header: " + cPtr + " Msg: " + e.message , 1);
          }

          if (!(mHdr.attr & MSG_READ)) {
              if (userSettings.debug.message_scan) {
                  console.putmsg(blue + "Found unread message @ " + cPtr +
                      "\n");
              }
              return ptrArray.indexOf(cPtr);
          }
        }

        if (userSettings.debug.message_scan) {
            console.putmsg(blue + "Found no unread messages\n");
        }

        return null;
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
        var fuggit = false, displayed = true, increment = 1;
        var uChoice, mHdr, mBody, mailList, mNdx;

        try {
          mmBase.open();
        } catch (e) {
          console.putmsg(red + high_intensity + "Unable to open mmBase\n");
          throw new dDocException("readMail() exception",
            "The cave is too dark to read yr scroll", 1);
        }
        //fuck it, let's give the generic a chance here too; which didn't work.
        //we need to try to figure out why the fuck that is
        //msg_base.util.openNewMBase(mmBase.code);

        //so that mess should have gotten us the current message index scan
        //pointer (or pseudo-version thereof); now we can start
        mailList = this.getMailScanPtr(mmBase);
        if ((mNdx = this.getCurMailScanPtr(mailList, mmBase)) == null) {
            mNdx = 0;
            if (userSettings.debug.message_scan) {
                console.putmsg(magenta + high_intensity + "No unread found\n");
            }
        } else {
            if (userSettings.debug.message_scan) {
                console.putmsg(magenta + high_intensity + "First unread found" +
                    " at slot #" + mNdx + "\tMessage #" + mailList[mNdx] +
                    "\n");
            }
        }

	console.putmsg(yellow + high_intensity + "Mail> ");

        while (!fuggit) {
          //let's read da shit
          if (userSettings.debug.message_scan) {
              console.putmsg(yellow + "\nuChoice:\t" + high_intensity + 
                uChoice + "\n");
          }

          uChoice = docIface.getChoice();

          if (((uChoice == 'n') && (uChoice != ' ')) &&
	      (((mNdx >= mailList[mailList.length - 1]) && (increment == 1)) ||
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
                bbs.log_key("a");

		if (displayed) {
		  mNdx += (increment * -1);
		  displayed = false;
		}
            case 'n':	//next
                if (uChoice != 'a') {
                    bbs.log_key("n");
                }

            case ' ':	//also next
                if ((uChoice != 'a') && (uChoice != 'n')) {
                    bbs.log_key(" ");
                }

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
                    // Invalid message, skip
                }

                fHdr = "\n" + magenta + high_intensity + mHdr.date + green + 
                  " from " + cyan + mHdr.from + green + " to " + cyan +
                  mHdr.to + "\n" + green;

                if (userSettings.debug.message_scan) {
                    console.putmsg(magenta + "Dumping message:\n");
                }

                //if (breaks) {
            	console.putmsg(fHdr + mBody, P_WORDWRAP);   // add fHdr into
                // putmsg here so it gets included in the line count for
		// breaks

                if (userSettings.debug.message_scan) {
                    console.putmsg(red + high_intensity + "Attempting to " +
                        "mark " + (mNdx + 1) + " (true index value: " +
                        mailList[mNdx] + ") w/MSG_READ\n");
                }
                //mark the message read
                try {
                    mHdr.attr |= MSG_READ;
                    mmBase.put_msg_header(true, mailList[mNdx], mHdr);
                } catch (e) {
                    throw new dDocException("readMail() Exception",
                        "Wut: " + e.message, 4);
                }

                //display prompt
                msg_base.doMprompt(mmBase, mNdx);

		//get ready for next
		mNdx += increment; displayed = true;
            break;
	    case 'r':
                bbs.log_key("r");

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
                bbs.log_key("e");

		if (userSettings.debug.message_posting) {
		  console.putmsg("Attempting initial email in Mail>\n");
		}

		try {
		  this.sendMail(null, false);
		} catch (e) {
		  console.putmsg(yellow + "Unable to send email: " +
		    e.message + "\n");
		}

                msg_base.doMprompt(mmBase, mNdx);
	    break;
            case 'b':
                //switch direction
                bbs.log_key("b");

                increment *= -1;

                if (userSettings.debug.message_scan) {
                  console.putmsg("Changed increment to: " + increment + "\n");
                }

                msg_base.doMprompt(mmBase, mNdx);
            break;
            case 'd':
                //delete message
                bbs.log_key("d");

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
                msg_base.doMprompt(mmBase, mNdx);
                break;
            break;
            case 's':
                //stop reading Mail>
                bbs.log_key("s");

                console.putmsg(yellow + high_intensity + "Stop\n");
                fuggit = true;
            break;
            case 'l':
                bbs.log_key("l");

                if (!console.noyes("Logout?")) {
                  if (userSettings.debug.navigation) {
                    console.putmsg(red + "Throwing exception to request " +
                        "logout\n");
                  }
                  throw new docIface.dDocException("readMail() Exception",
                        "User requested logout", 5);    //god ouah
                }
            break;
            case 'j':
                bbs.log_key("j");

                fuggit = true;
                docIface.nav.jump();
            break;
            default:
                //wut
                console.putmsg(yellow + high_intensity + "You hear the " +
                    "howling of the Cwyn'ann\n\n");
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
		throw new docIface.dDocException("sendMail() Exception",
                    "User aborted email", 1);
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
            user.sent_email();
	  } catch (e) {
	    console.putmsg(red + "Unable to poast.mWrite Mail>: " + e.message +
		"\n");
	  }
	} else {
	  console.putmsg(red + high_intensity + "Not sending a null " +
	    "message!\n");
	  throw new docIface.dDocException("sendMail() Exception",
                "Refusing to send a null message", 2);
	}

    }
}

