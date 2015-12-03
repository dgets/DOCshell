/*
 * dmbase.js
 *
 * by: Damon Getsman
 * contributing/refactoring also by: @Ntwitch (github.com)
 * alpha phase: 25oct14
 * beta phase: 2aug15
 * started: 21sept14
 * finished:
 *
 * All routines for accessing the message base are ending up here.  I did 
 * try to break it up a bit, but it's still got some monoliths forming in
 * the structures, so there'll be another pass to break it down more once
 * I get it through and into active beta testing. 
 */

//directives for JSLint
/*global red, cyan, blue, green, magenta, high_intensity, white, normal,
	  yellow, base, ndx, userSettings, console, bbs, load, K_NOECHO */
/*jslint devel: true, node: true, sloppy: true, vars: true, white: true */

//message base primary object
msg_base = {
        //properties
	/*
	 * summary:
	 *	String to prepend before a key is hit and logged to
	 *	signify that it was at this menu
	 */
  log_header : "dDOC Read menu command: ",
        /*
         * summary:
         *      Sub-object representing the message read command menu
         *      properties and methods
         */
  read_cmd : {
        //property
        /*
         * summary:
         *      String containing the entirety of the read command menu
         */
        rcMenu : "\n" + green + high_intensity +
          "<?> help         <a>gain           <A>gain (no More prompt)\n" +
          "<b>ack           <D>elete msg      <e>nter msg\n" +
          "<E>nter (upload) <h>elp            <i>nfo (forum)\n" +
          "<n>ext           <p>rofile author  <s>top\n" +
          "<w>ho's online   <x>press msg      <X>press on/off\n\n" +
	  "<I> change room info\n",
        /*
         * summary:
         *      Reads choice for valid selection; note that this monolith should
         *      really be broken up.  The switch makes that highly improbable,
         *      but refactoring this along with gmorehouse might be a good idea
         * base: MsgBase object 
         *      currently in use; originally this was to be opened when passed
         *      to the method, however I'm not sure that state for this is
         *      always preserved.  I've added code to check and cope in some of
         *      the different areas that this branches out to; if there are any
         *      others where it isn't handled this should be added.  I don't
         *      want the message base being open to be a requirement
         * ndx: Integer
         *      index of the current message; potential spot to look for in
         *      issues #140 and #141 on Github
         * return:
         *      (isn't there a better way to handle this? -- ask gmorehouse)
         *      1 to stop
         *      2 to change direction
         *      0 for message entered successfully or next msg also
         */
        rcChoice : function(base, ndx) {
          var uchoice;
          var valid = false;
          var hollaBack = 0;    //can be used to switch dir, etc

	  if (base === undefined) {
	    throw new docIface.dDocException("base not defined to rcChoice()");
	  }

	  if (userSettings.debug.message_posting) {
	    console.putmsg(red + "rcChoice() called w/base: " + base.cfg.code +
		"\tndx: " + ndx + "\n");
	  }

          while (!valid) {
	    msg_base.doMprompt(base, ndx);
            uchoice = "";
            docIface.setNodeAction(NODE_RMSG);

            do {
        	bbs.nodesync();       //check for xpress messages
        	uchoice = console.inkey(K_NOECHO, 1000);
            } while (uchoice === "");

            switch (uchoice) {
                case '?':
		  bbs.log_key("?");
                case 'h':	//see menu
		  if (uchoice == "h") {
		    bbs.log_key("h");
		  }
                  console.putmsg(this.rcMenu);
                  break;
                case 'a':	//see message again
		  bbs.log_key("a");
		  console.putmsg(green + high_intensity + "Again\n");
		  msg_base.dispMsg(base, ndx, true);
		  break;
                case 'A':	//see message again
				//NOTE: not implemented properly
		  bbs.log_key("A");
		  console.putmsg(green + high_intensity + 
			"Again (no breaks)\n");
		  msg_base.dispMsg(base, ndx, false);
		  break;
                case 'b':	//change scan direction
		  bbs.log_key("b");
                  valid = true; hollaBack = 2;
		  docIface.log_str_n_char(this.log_header, 'b');
                  console.putmsg(green + high_intensity + "Back (change " +
                        "direction)...\n");
                  break;
                //case 'D':
                case 'i':	//display room info
		  bbs.log_key("i");
		  roomSettings.roomSettingsUX.displayRoomInfo();
		  break;
		case 'I':	//prompt for room info
		  //change room info
		  //bbs.log_key("I");
                  docIface.logStatusChange("I", "Changing Info for " +
                                           user.cursub_code, NODE_PMSG);
		  roomData.roomSettingsUX.promptUserForRoomInfo();
		  break;
                case 'p':
		  bbs.log_key("p");
                case 'w':	//long wholist
		  if (uchoice == "w") {
		    bbs.log_key("w");
		  }
		  wholist.list_long(wholist.populate);
                  break;
                case 'E':	//enter (upload) message
		  bbs.log_key("E");
                  console.putmsg(red + "\nI'm too dumb yet, just " +
				 "wait\n");
                  break;
                case 's':	//stop scan
		  bbs.log_key("s");
                  valid = true; hollaBack = 1;
		  docIface.log_str_n_char(this.log_header, 's');
                  console.putmsg(yellow + high_intensity + "Stop\n");
                  break;
                case 'e':	//enter message
		  bbs.log_key("e");
                  console.putmsg(green + high_intensity +
                        "Enter message\n");
		  if (userSettings.debug.message_posting) {
			console.putmsg(red + "Adding message via " +
			  "poast.addMsg() where base: " +
			  base.cfg.name + "\n");
		  }

		  try {
                    poast.addMsg(base, false, 'All');  //not an upload
                    user.posted_message();
		  } catch (e) {
		    console.putmsg(red + high_intensity + "Error " +
			"in poast.addMsg(): " + e.message + "\n");
		  }

                  break;
		case ' ':
		  bbs.log_key(" ");
		case 'n':	//next message
		  if (uchoice == "n") {
		    bbs.log_key("n");
		  }
		  valid = true; hollaBack = 0;
		  docIface.log_str_n_char(this.log_header, 'n');
		  console.putmsg(green + high_intensity + "Next\n");
		  break;
		case 'l':	//logout
		  bbs.log_key("l");
		  //docIface.util.quitDdoc();
                  //let's see if this'll just work from here

                  if (userSettings.debug.flow_control) {
                      console.putmsg(red + "\nRestoring bbs.* properties:\n" +
                            " bbs.cursub: " + docIface.util.preSubBoard + "\n" +
                            " bbs.curgrp: " + docIface.util.preMsgGroup + "\n" +
                            " bbs.curdir: " + docIface.util.preFileDir + "\n");
                      console.putmsg(red + "\nRestoring user.settings . . .\n");
                  }

                  //restore initial settings prior to exit
                  bbs.cursub = docIface.util.preSubBoard;
                  user.cursub = bbs.cursub_code;
                  bbs.curgrp = docIface.util.preMsgGroup;
                  bbs.curdir = docIface.util.preFileDir;
                  user.settings = docIface.util.preUserSettings;

                  //something in the next bit toggling is fucking up all kinds
                  //of shit :|
                  //disable H exemption in case they go back to usual shell so
                  //that we can handle events, etc
                  user.security.exemptions &= ~UFLAG_H;
                  //restore asynchronous message status (if necessary)
                  bbs.sys_status ^= SS_MOFF;

                  console.putmsg(blue + high_intensity + "\n\nHope to see you "
                       + "again soon!\n\nPeace out!\n");

                  bbs.logoff(); //this works, but does not reset settings;
                                //I hate to dupe code, but it's the only work-
                                //around that I know of at this point :P
		  break;
		case 'x':	//send X
		  bbs.log_key("x");
		case 'X':
		  if (uchoice == "X") {
		    bbs.log_key("X");
		  }
		  express.sendX();
		  break;
		case 'd':	//delete message
		  bbs.log_key("d");
		  try {
		    msg_base.util.deleteMsg(base, ndx);
		  } catch (e) {
		    console.putmsg(red + "Got: " + e.message + ", errno: " +
			e.number + " back.  :(\n");
		  }
		  break;
                case '%':
                  //add a bit here so that a user w/level greater than 80 can
                  //reset pointers for other users, as well (if we keep the
                  //kludge)
                  if (user.security.level >= 80) {
                    var board = msg_area.sub[bbs.cursub_code];
                    console.putmsg(yellow + "Resetting scan_ptr for: " +
                       base.cfg.code + "\n");

                    board.scan_ptr = 1;
                  } else {
                    console.putmsg(red + "Unable to reset scan_ptr for: " +
                      base.cfg.code + " for " + user.alias + " due to " +
                      "security level restrictions.");
                  }
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':   //we're going to read message by number here
                  //there will, of course, have to be some error checking for
                  //trying to hit out of bounds messages if dispMsg() doesn't
                  //already have it
                  console.putmsg(green + high_intensity + "Go to message #> ");
                  console.ungetstr(uchoice);    //put it back on the input stack
                  try {
                    if (userSettings.debug.message_scan) {
                        console.putmsg("Entered dispMsg()'s try/catch\n");
                    }
                    msg_base.dispMsg(new MsgBase(bbs.cursub_code),
                                   console.getnum(base.last_msg), false);
                  } catch (e) {
                      if (userSettings.debug.message_scan) {
                          console.putmsg(cyan + "Did we even fuckin get here?");
                      }
                      
                      if (e.number == 3) {
                          console.putmsg(yellow + "Invalid message #!\n");
                      } else {
                          console.putmsg(red +
                              "Something is not normal here\n");
                          throw new docIface.dDocException(
                            "Numeric read exception",
                            "Unknown error trying to select message to read by"
                            + " number", 1);
                      }
                  }
                  break;
                default:
                  console.putmsg(normal + yellow + "Invalid choice\n");
                  break;
            }
          }

        return hollaBack;
        },
        /*
	 * summary:
	 *	Read any new messages in the current room, then call findNew to
	 *	move to the next room with unread messages
         * startNum:
         *      Optional parameter to start at a certain number for when reading
         *      is initiated via jump to a specific message #
	 */
        readNew : function(startNum) {
          docIface.setNodeAction(NODE_RMSG);
          
          if (userSettings.debug.message_scan) {
              console.putmsg(green + "openNewMBase(" + high_intensity +
                  bbs.cursub_code + normal + green + ");\nWorking with " +
                  "user.cursub: " + user.cursub + "\n");
          }
	  var mBase = msg_base.util.openNewMBase(bbs.cursub_code);

          if (userSettings.debug.message_scan) {
              console.putmsg("Made it past openNewMBase();\nstartNum: " +
                  startNum + "\n");
          }

          if (startNum !== undefined) {
              msg_area.sub[bbs.cursub_code].scan_ptr = startNum;

              msg_base.scanSub(msg_area.sub[bbs.cursub_code],
                               msg_base.util.remap_message_indices(mBase),
                               true);
          } else {
              if (userSettings.debug.message_scan) {
                  console.putmsg(yellow + "Made it into readNew() w/undef\n");
              }

          //this next one could be fairly important; leaving this commented code
          //in:
	  //if (!roomData.tieIns.isZapped(msg_area.sub[bbs.cursub_code].index)) {
	    if (msg_area.sub[bbs.cursub_code].scan_ptr < mBase.last_msg) {
	      msg_base.scanSub(msg_area.sub[bbs.cursub_code],
                               msg_base.util.remap_message_indices(mBase),
                               true);
	    }
          }

	  mBase.close();
          docIface.nav.findNew();
	  return;
        }
  },
  /*
   * summary:
   *	Sub-object created for deleteMsg() and any other methods/properties
   *	that may need to exist that don't exactly fall under reading
   *	messages
   */
  util : {
      /*
       * summary:
       *	Opens a new message base (modularizing); doesn't use proper 
       *	exception throwing
       * mb:
       *	Code of the new message base to open
       * return:
       *	new message base object (already open), or 'null' for error
       * NOTE:
       *    this needs to be changed to throw an exception for error, let's get
       *    away from the error code passing shit through returns
       */
    openNewMBase : function(mb) {
          mBase = new MsgBase(mb);
	  try {
            mBase.open();
          } catch (e) {
              console.putmsg(red + "Ername: " + e.name + "mBase.error: " +
                  e.message + "\n");
              throw new dDocException("openNewMBase() Error", e.message, 1);
          }

          if (userSettings.debug.message_scan) {
            console.putmsg(red + "Opened: " + mb +
        	           " allegedly . . .\n");
          }

	return mBase;
    },
        /*
         * summary:
         *      Method determines whether or not there are any messages
         *      remaining to be read in a sub that are not deleted, etc
         * mBase:
         *      Base to be tested for unread messages
         * return:
         *      Boolean regarding whether or not valid unread messages still
         *      exist for this room
         */
    hasUnread : function(mBase) {
        var mb = this.openNewMBase(mBase);
        var mHdr;

        if (mb == null) {
            throw new dDocException("hasUnread() Error",
                "Error getting valid open base back from openNewMBase()", 1);
        }

        var tmpPtr = msg_area.sub[mb.code].scan_ptr;

        if (tmpPtr == mb.last_msg) {
            return false;
        }

        while (tmpPtr <= mb.last_msg) {
            if (((mHdr = mb.get_msg_header(tmpPtr)) == null) ||
                (mHdr.attr & MSG_DELETE)) {
                tmpPtr++;
            } else {
                return true;
            }
        }

        return false;
    },
        /*
         * summary:
         *      Method remaps message start through finish for a room/sub-board
         *      into an array that skips deleted message slots and gives us a
         *      set of indices that are more easily utilized at base 1
         * mBase:
         *      Base that we are currently working with
         * return:
         *      Array of valid messages
         *
         * NOTE: We might have to configure this to pass back a valid new
         *       'current' index since we're remapping the whole lot of 'em
         */
    remap_message_indices : function(mBase) {
        var msgMap = new Array(), curHdr = new Object();
        var curPtr = 0;

        mBase = this.openNewMBase(mBase.cfg.code);

        if (userSettings.debug.message_scan) {
            console.putmsg(yellow + "Remapping:\n");
        }

        for (var ndx = mBase.first_msg; ndx <= mBase.last_msg; ndx++) {
            if (userSettings.debug.message_scan) {
                console.clearline();
            }

            try {
                curHdr = mBase.get_msg_header(ndx);
            } catch (e) {
                console.putmsg("Exception getting header: " + e.message +
                    "\n");
                mBase.close();
                throw new docIface.dDocException("remap_message_indices" +
                    "() Exception", e.message, 2);
            }

            if ((curHdr == null) || (curHdr.attr & MSG_DELETE)) {
                continue;   //skip this shit, we don't want this indexed
            } else {
              if (userSettings.debug.message_scan) {
                console.putmsg(yellow + high_intensity + ndx + " to " +
                  curPtr);
              }
              msgMap[curPtr++] = ndx;
            }
        }

        if (msgMap.length == 0) {
            console.putmsg(red + "No messages found for mapping\n");
            throw new docIface.dDocException("remap_message_indices()" +
                " Exception", "No messages in " + mBase.cfg.name +
                " for mapping!", 3);
        }

        if (userSettings.debug.message_scan) {
            console.putmsg(green + "Returning message mapping: " + msgMap +
                "\nFor base: " + mBase.cfg.name + "\n");
        }

        mBase.close();
        return msgMap;
    },
	/*
	 * summary:
	 *	Deletes the message (if appropriate permissions) at the current
	 *	message
	 * mBase:
	 *	The open message base object for the current room/sub; again we
         *	should try to make it so that the message base object doesn't
         *	need to be opened already.  At least this one throws an
         *	exception if things aren't already opened
	 * ndx:
	 *	Index to try to delete
	 */
    deleteMsg : function(mBase, ndx) {
	var mHdr;

	if ((!mBase.is_open) || (mBase == null)) {
	  throw new dDocException("deleteMsg() exception",
	    "You cannot consume the cockatrice egg!", 1);
	}

	try {
	  mHdr = mBase.get_msg_header(ndx);
	} catch (e) {
	  console.putmsg(yellow + "Unable to delete message, sysop " +
		"has been notified\n");
	  throw new dDocException("deleteMsg() exception",
	    "Unable to snag message header: " + e.message, 2);
	}

	if ((mHdr.from_ext == user.number) || (mHdr.from == user.alias) ||
	    (mHdr.from == user.name) || (user.security.level >= 80)) {
	  //we are go for trying to delete this message
	  try {
	    mBase.remove_msg(ndx);
            bbs.log_str("Deleted message " + ndx + " from " + bbs.cursub_code);
	  } catch (e) {
	    console.putmsg(yellow + "Unable to delete message, sysop " +
		"has been notified\n");
	    throw new dDocException("deleteMsg() exception",
	      "Unable to remove_msg(" + ndx + "):" + e.message, 3);
	  }

          console.putmsg(red + high_intensity + "Message baleeted . . .\n");
	} else {
            console.putmsg(red + high_intensity + "Unable to baleet message " +
                           ". . .\n");
        }
    }
  },
  /*
   * summary:
   *	Sub-object for methods utilized when dropping through from the
   *	main-menuing system.  I think that these methods might also be
   *	utilized from rcChoice, also, which kind of puts my OO structure
   *	into question here...  Need to look at that at some point, or
   *	else place improper methods somewhere more appropriate.
   *
   *	Summary of that summary: go over this with gmorehouse
   */
  entry_level : {
        /*
         * summary:
         *      Forward command to the appropriate methods for entry
         *      into the message reading routines in general
         * choice: char
         *      Code for the menu choice
         */
    handler : function(choice) {
	var base = null;

	docIface.setNodeAction(NODE_RMSG);

	docIface.log_str_n_char(msg_base.log_header, choice);

        //which way do we go with this?
        switch (choice) {
          //purely message related functionality
          case 'n':     //read new
	    console.putmsg(green + high_intensity + "Read new\n");
	    try {
		msg_base.read_cmd.readNew();
	    } catch (e) {
		console.putmsg(yellow + "Exception reading new: " +
		      e.toString() + "\n");
	    }
            break;
	  case 'b':	// scan backwards
	    console.putmsg(green + high_intensity + "Read backward\n");
	    try {
                base = msg_base.util.openNewMBase(user.cursub);
	        msg_base.scanSub(msg_area.sub[bbs.cursub_code],
                                 msg_base.util.remap_message_indices(base),
                                 false);
	    } catch (e) {
		console.putmsg(yellow + "Exception reading backwards: " +
		      e.toString() + "\n");
	    }
	    break;
          case 'k':     //list scanned bases
	    console.putmsg(green + high_intensity + "Known rooms list\n");
            this.listKnown();
            break;
          case 'e':     //enter a normal message
	    console.putmsg(green + high_intensity + "Enter message\n");

	    base = msg_base.util.openNewMBase(user.cursub);
	    if (base === null) {
		console.putmsg(yellow + "Could not open MsgBase: "
		      + user.cursub + "\n");
		break;
	    }
	    try {
		docIface.setNodeAction(NODE_PMSG);
		poast.addMsg(base, false, 'All');
	    } catch (e) {
		console.putmsg(red + high_intensity + "Error " +
		      "in poast.addMsg(): " + e.message + "\n");
	    }
            break;
          //other functionality tie-ins
          case 'w':
            //normal wholist
            wholist.list_long(wholist.populate());
            break;
          case 'W':     //short wholist
            wholist.list_short(wholist.populate());
           break;
          case 'x':     //express msg
            express.sendX();
            break;
	  case 'l':	//logout
	    docIface.util.quitDdoc();
	    break;
          case '%':     //reset message pointers
            var board = msg_area.sub[bbs.cursub_code];
            board.scan_ptr = 0;
            break;
          default:
            if (userSettings.debug.navigation) {
              console.putmsg("\nNot handled yet . . .\n\n");
	    }
            break;
        }
    },
        /*
         * summary:
         *      Checks to make sure that a message is in bounds, when jumping
         *      by message number, before handing off to dispMsg(); this to
         *      avoid catastrophic failure a la issue #193 (github)
         * bufNum:
         *      Number already in the input buffer signaling that we are jumping
         *      to message by number
         */
    gotoMessageByNum : function(bufNum) {
        var mBase = new MsgBase(bbs.cursub_code);
        var msgMap = msg_base.util.remap_message_indices(mBase);
        var success = false;
        var msgNum;

        console.putmsg(green + high_intensity + "Go to message #> ");
        console.ungetstr(bufNum);    //put it back on the input stack
        msgNum = console.getnum(maxMsgs);    //is this defined here?

        mBase = msg_base.util.openNewMBase(mBase.cfg.code);

        if (msgNum >= mBase.last_msg) {
            throw new docIface.dDocException("gotoMessageByNum() Exception",
                "msgNum > last message base message", 1);
        }

        //we need to code this separately at some point, to make a
        //findNewMsgIdx() method or something of the sort; no doubt it'll be
        //useful elsewhere

        if (msgMap.indexOf(msgNum) == -1) {
            //scroll ahead to the next valid message or end of the room
            for (; msgNum <= msgMap[msgMap.length - 1]; msgNum++) {
                if (userSettings.debug.message_scan) {
                    console.putmsg(green + "Looking for " + msgNum + " in " +
                        msgMap + "\n");
                }
                if (msgMap.indexOf(msgNum) != -1) {
                    //we've got a valid message
                    if (userSettings.debug.message_scan) {
                        console.putmsg(green + high_intensity + "Found it\n");
                    }
                    success = true;
                    break;
                }
            }
        } else {
            success = true;
        }

        if (success) {
            if (userSettings.debug.message_scan) {
                console.putmsg(cyan + "Executing msg_base.read_cmd.readNew(" +
                    msgNum + ")\n");
            }
            bbs.log_str("Went to message # " + msgNum + " in " +
                        bbs.cursub_code);
            msg_base.read_cmd.readNew(msgNum);

        } else {
            throw new docIface.dDocException("gotoMessageByNum() Exception",
                "msg_base.read_cmd.readNew(" + msgNum + ") failed", 2);
        }
    },
        /*
         * summary:
         *      Lists all known message sub-boards (broken down by
         *      message base group, optionally); note that all of the code that
         *      isn't run within the 'confined' version has not been tested at
         *      this point (and probably won't be for quite some time)
         */
    listKnown : function() {
        console.putmsg("\n" + green + high_intensity);

        //we can fuck with multi-columns later
        if (!userSettings.confined) {
         for each (uMsgGrp in msg_area.grp_list) {
          if (userSettings.debug.navigation) {
                console.putmsg(uMsgGrp.description + "\n\n");
          }
          for each (uGrpSub in uMsgGrp.sub_list) {
		if (userSettings.debug.navigation) {
		  console.putmsg(red + uGrpSub.index + ": zapped : " +
		    roomData.tieIns.isZapped(uGrpSub.index));
		}
		if (!roomData.tieIns.isZapped(uGrpSub.index)) {
                  console.putmsg(green + high_intensity + "\t" + uMsgGrp.name +
                    ": " + uGrpSub.description + "\n");
		} else if (userSettings.debug.navigation) {
		  console.putmsg("\n");
		}
          }
         }
        } else {
         //uMsgGrp = msg_area.grp_list[topebaseno].sub_list
         for each (uGrpSub in msg_area.grp_list[topebaseno].sub_list) {
                if (userSettings.debug.navigation) {
                  console.putmsg(red + uGrpSub.index + ": zapped : " +
                    roomData.tieIns.isZapped(uGrpSub.index));
                }
		if (!roomData.tieIns.isZapped(uGrpSub.index)) {
                  console.putmsg(green + high_intensity + "\t" + 
		    uGrpSub.description + "\n");
		} else if (userSettings.debug.navigation) {
		  console.putmsg("\n");
		}
         }
        }
        console.putmsg("\n");
    }


  },
  //msg_base properties
  //these may not be determined dynamically (pretty sure), so this
  //will be a bug that needs to be fixed inline on a per-message read
  //basis
  /*
   * summary:
   *    Read command menu; wasn't this already defined above?
   */
  menu : green + high_intensity + "\n\n<?> help\t\t" +
         "<a>gain\t\t<A>gain (no More prompt)\n<b>ack\t\t<D>" +
         "elete msg\t<e>nter msg\n<E>nter (upload)\t<h>elp\t\t\t" +
         "<i>nfo (forum)\n<n>ext\t\t<p>rofile author\t<s>top\n" +
         "<w>ho's online\t<x>press msg\t<X>press on/off\n\n",

  //---+++***===msg_base methods follow===***+++---
	/*
	 * summary:
	 *	Displays the read menu with room name, message number,
	 *	and remaining messages.  Ntwitch added the wonderful feature
         *	that will probably be useful elsewhere where the code will close
         *	and re-open the message base to check for updates to pointers
	 * base:
	 *	The active and open MsgBase object
	 * ndx:
	 *	Index of the current message
	 * NOTE: I chose to make the message number 1-based for
	 *	display purposes only.
	 */
  doMprompt : function(base, ndx) {
	docIface.setNodeAction(NODE_RMSG);

	base.close();  // Refresh base for any new messages
	base.open();
	if (base.subnum != -1) {
	  if (userSettings.debug.message_scan) {
	    console.putmsg(red + "Reopened " + base.cfg.code
		  + " to check for updates\n");
	  }
	  console.putmsg(yellow + high_intensity + "\n[" + base.cfg.name +
	      "> msg #" + (ndx + 1) + " (" + (mBase.total_msgs - ndx) +
	      " remaining)] " + cyan + "Read cmd -> ");
	} else {
	  console.putmsg(yellow + high_intensity + "\n[Mail> msg #" + 
	    (ndx + 1) + " (unknown remaining)] " + cyan + "Read cmd -> ");
	}
  },
        /*
	 * summary:
	 *	Displays message with or without pauses
	 * base: MsgBase object
	 *	Open message base object currently being read; again we need to
         *	try to make sure that we can get away from this requirement of
         *	the message base already being opened if that is at all
         *	possible
	 * ptr: Integer
	 *	Current message index #; also a potential source or good
         *	variable to watch for debugging in Github issues #140 & #141
	 * breaks: Boolean
	 *	Default: true
	 *	true for screen pauses
	 */
  dispMsg : function(base, ptr, breaks) {
	var mHdr, mIdx, mBody, fHdr;

	if (breaks != false) { 
	    breaks = true;
	}

	if (userSettings.debug.message_scan) {
	  console.putmsg("Received base: " + base + "\tptr: " + ptr + 
	    "\tbreaks: " + breaks + "\n");
	}

        //this should be swapped out for proper message base open validation
	/*if (!base.is_open) {
	  //let's give this a shotjoin
	  if (userSettings.debug.message_scan) {
	    console.putmsg(yellow + "base was closed; reopening\n");
	  }

          //actually this should probably be swapped out for the right openbase
          //functionality, I'm just not sure what's up with the message about
          //'Mail' down there; I think that's just spurious, but I don't know
          //for sure, so that will wait for more research
	  try {
	    base.open();
	  } catch (e) {
	    console.putmsg(red + "Unable to open Mail> sub:\t" + e.message +
		"\n");
	    throw new docIface.dDocException("dispMsg() Error",
		"Unable to open mail sub: " + e.message, 2);
	  }
	}*/
        base = msg_base.util.openNewMBase(user.cursub);

        //let's try and find out if the message we're going to go looking for
        //is bogus before we waste time with this, especially since the mHdr
        //===null tested block doesn't seem to keep horrible things from
        //happening with a ptr passed that's way out of range
        if (ptr < 1) {
            //shit's out of range, man
            throw new docIface.dDocException("dispMsg() error",
                "Invalid message slot", 3);
        } else if (ptr > base.last_msg) {
            console.putmsg(yellow + "Your message # was over the top; " +
              "pointing you at the last message\n");
            ptr = base.last_msg;
        }

        //try/catch this
	try {
          mHdr = base.get_msg_header(ptr);
          mIdx = base.get_msg_index(ptr);
          mBody = base.get_msg_body(ptr);
	} catch (e) {
	  console.putmsg(red + "Error fetching mHdr & mBody\nName: " + e.name +
	    "\tNumber: " + e.number + "\nMessage: " + e.message + "\n");
	  throw new docIface.dDocException("dispMsg() Error",
		"Unable to fetch message header/body", 1);
	}

	if (userSettings.debug.message_scan) {
	    console.putmsg(red + "ptr: " + ptr + "\tbase.last_msg: "
		+ base.last_msg + "\n");
	}

	if (mHdr === null) {
	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "Invalid message? base.subnum: "
		      + base.subnum + " ptr: " + ptr + "\n");
	    }
	    throw new docIface.dDocException("dispMsg() error",
		"Invalid message slot", 3);	// Invalid message, skip
	}

	fHdr = "\n" + magenta + high_intensity + mHdr.date + green + " from "
	      + cyan + mHdr.from + "\n" + green;

        if (mIdx.attr & MSG_DELETE) {
            console.putmsg(red + "Message Deleted (awaiting purge)\n");
        } else {
	  if (breaks) {
	    console.putmsg(fHdr + mBody, P_WORDWRAP);   //add fHdr into the
		//putmsg here so it gets included in the line count for breaks
          } else {
	    if (userSettings.debug.message_scan) {
		console.putmsg("Putting out message next:\n");
	    }

	    console.putmsg(fHdr + mBody, (P_NOPAUSE | P_WORDWRAP));
	  }
        }

        return null;
  },
	/*
	 * summary:
	 *	Sequentially scans for new messages within one
	 *	particular sub-board; don't forget to add the support
	 *	for whether confined or not after this is beta working; needs
         *	to be using exception handling instead of passing error codes
	 * sBoard: String
	 *	Synchronet Sub-board object
         * indices: Array
         *      Freshly remapped array indices conveniently skipping any deleted
         *      messages or other crap that we don't need to worry about
	 * forward: Boolean
	 *	true for forward read & converse
	 * return:
	 *	null/negative for errors; 1 to move on to the next sub, 
	 *	still working on further shite -- fix this for exceptions!
         * NOTE:
         *      Once again in this method we need to run through things and
         *      make sure that we're not using return for error codes; a proper
         *      exception throwing model really needs to be adhered to
	 */
  scanSub : function(sBoard, indices, forward) {
	var tmpPtr, inc, choice = 0;

	if (userSettings.debug.message_scan) {
	  console.putmsg("Entered scanSub(); forward = " + forward +
	    "  user.cursub: " + user.cursub + "\nsBoard.code: " +
	    sBoard.code + "\tindices size: " + indices.length + "\n");
	}

	mBase = msg_base.util.openNewMBase(sBoard.code);
	if (mBase === null) {
	    if (userSettings.debug.message_scan) {
		console.putmsg("Error (null) in openNewMBase()\n");
	    }
	    throw new docIface.dDocException("scanSubException",
		  "Error (null) in openNewMBase()", 1);
	}

        if ((tmpPtr = indices.indexOf(sBoard.scan_ptr)) == -1) {
            tmpPtr = 0;     //start from the beginning of these indices
        }

	if (userSettings.debug.message_scan) {
          console.putmsg(cyan + "-=-=-=-=-=-=-=-=-=-\n");
	  console.putmsg("sBoard.scan_ptr = " + sBoard.scan_ptr + "\n");
          console.putmsg("sBoard.ptridx = " + sBoard.ptridx + "\n");
          console.putmsg("tmpPtr = " + tmpPtr + "\n");
          console.putmsg("indices[tmpPtr] = " + indices[tmpPtr] + "\n");
          console.putmsg("mBase.cfg.ptridx = " + mBase.cfg.ptridx + "\n");
	  console.putmsg("mBase.first_msg = " + mBase.first_msg + "\n");
	  console.putmsg("mBase.total_msgs = " + mBase.total_msgs + "\n");
	  console.putmsg("mBase.last_msg = " + mBase.last_msg + "\n");
          console.putmsg(yellow + "scan_ptr:\t" + sBoard.scan_ptr + 
                         "\tindices[tmpPtr]:\t" + indices[tmpPtr] + 
                         "\tmBase.last_msg:\t" + mBase.last_msg + "\n");
          console.putmsg(cyan + "-=-=-=-=-=-=-=-=-=-\n");
	}
	
	if (forward) {
            inc = 1;
        } else {
            inc = -1;
        }
	
	// if starting in reverse from the room prompt, unskip one message
	if (!forward) {
            tmpPtr += 1;  // so we start with the most recently read
                          // message.  In all other cases we want to skip one.
        }
	
	if (userSettings.debug.message_scan) {
	  console.putmsg("Inc: " + inc + "\tbased on forward\n");
	}

	//primary message scan loop
	while (true) {  // a bit shady, but we exit from within the switch/case
	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "In main scanSub() loop\ttmpPtr: "
		      + tmpPtr + " total_msgs: " + mBase.total_msgs
		      + " is_open: " + (mBase.is_open ? "yes" : "no") + "\n");
	    }

	    switch (choice) {
		case 1:		// Stop scan
		    if (userSettings.debug.message_scan) {
			console.putmsg("DEBUG: Stopping scan\n");
		    }
		    mBase.close();
		    return null;
		case 2:		// Reverse scan direction
		    if (userSettings.debug.message_scan) {
			console.putmsg(red + "DEBUG: Reversing direction\n");
		    }
		    inc *= -1;
		    //Fall through to read message
		    //break;
		case 0:		// Next message
		    if (userSettings.debug.message_scan) {
                        console.putmsg(high_intensity + "tmpPtr: " + normal +
                            tmpPtr + "\t" + high_intensity + "indices.length: "
                            + normal + indices.length + "\t" + high_intensity +
                            "indices[tmpPtr]: " + normal + indices[tmpPtr] +
                            "\n");
		    }

		    if ((tmpPtr = 0) && (inc == -1)) {
			mBase.close();
			throw new docIface.dDocException("scanSub() Exception",
                            "Reverse scan hit message 0", 2);
		    } else if ((tmpPtr > indices.length) && (inc == 1)) {

                        this.dispMsg(user.cursub, indices[tmpPtr], true);

			mBase.close();
                        if (userSettings.debug.message_scan) {
                            console.putmsg(red + high_intensity + "tmpPtr out" +
                                " of bounds\n");
                        }
			return 1;   // skip to next room
		    }

		    tmpPtr += inc;
                    try {
                      //here's the main message display loop
		      if ((tmpPtr >= 0) && (tmpPtr < indices.length)) {
			while (this.dispMsg(user.cursub, indices[tmpPtr], true)
                                == null) {
			  tmpPtr += inc;
			  if ((tmpPtr == 0) || (tmpPtr = (indices.length-1))) {
			    break;
			  }
			}

			if (inc == 1) { //do we want this if only going forward?
                            sBoard.scan_ptr = indices[tmpPtr];
                        }
		      }
                    } catch (e) {
                        console.putmsg(yellow + "Uncaught exception from " +
                            "dispMsg(): " + e.message + "\n");
                    }
		    break;
		default:
		    console.putmsg(red + "\nUnexpected value from rcChoice: "
			  + choice + "\n");
		    return null;
	    }

	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "End of scanSub() main loop\n"
		      + "tmpPtr: " + tmpPtr + "\tinc: " + inc + "\n");
	    }
	    choice = this.read_cmd.rcChoice(mBase, indices[tmpPtr]);
	}

	mBase.close();
	if (userSettings.debug.message_scan) {
	  console.putmsg(red + "Closed mBase: " + sBoard.code + "\n");
	}
    }
}
