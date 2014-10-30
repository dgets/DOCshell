/*
 * dmbase.js
 *
 * by: Damon Getsman
 * alpha phase: 25oct14
 * beta phase: 
 * started: 21sept14
 * finished:
 * 
 * Moving this to its own file as it's started becoming one hell of a
 * monolith.  It looks like I might've overlooked some functionality in
 * the Synchronet ssjs libraries that might be able to fix up some code
 * that'll now be redundant, like the word-wrap bit.  Need to look
 * through that a bit more.  Other than that, this is just a very
 * lobotomized text entry system, and the much simpler subsystems like a
 * newscan and shit.
 */

load("sbbsdefs.js");

//message base menu
msg_base = {
    //msg_base properties
    menu : green + high_intensity + "\n\n<?> help\t\t" +
         "<a>gain\t\t<A>gain (no More prompt)\n<b>ack\t\t<D>" +
         "elete msg\t<e>nter msg\n<E>nter (upload)\t<h>elp\t\t\t" +
         "<i>nfo (forum)\n<n>ext\t\t<p>rofile author\t<s>top\n" +
         "<w>ho's online\t<x>press msg\t<X>press on/off\n\n",
    mprompt : yellow + high_intensity + user.cursub + "> msg #" +
         msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].scan_ptr +
         " (" +
         (msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].max_msgs -
         msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].scan_ptr)
         + " remaining)] " + green + high_intensity + "Read cmd -> ",
    sprompt: high_intensity + yellow + "<A>" + green + "bort " +
	 yellow + "<C>" + green + "ontinue " + yellow + "<P>" + 
	 green + "rint " + yellow + "<S>" + green + "ave " + yellow +
	 "<X>" + green + "press -> ",
    //msg_base methods
    handler : function(choice, confined) {
        //which way do we go with this?
        switch (choice) {
	  //purely message related functionality
          case 'n':     //read new
            this.newScan(confined);
            //console.getkey();
            break;
          case 'k':     //list scanned bases
            this.listKnown(confined);
            break;
          case 'e':     //enter a normal message
            this.addMsg(user.cursub, false);
            break;
	  //other functionality tie-ins
	  case 'w':	//normal wholist
	    wholist.list_long();
	    break;
	  case 'W':	//short wholist
	    wholist.list_short(wholist.populate());
	    break;
	  case 'x':	//express msg
	    express.sendX();
	    break;
          default:
            if (debugging)
              console.putmsg("\nNot handled yet . . .\n\n");
            break;
        }

    },
    listKnown : function(confined) {
        console.putmsg("\n\n" + green + high_intensity);

        //we can fuck with multi-columns later
	if (!confined) {
         for each (uMsgGrp in msg_area.grp_list) {
          if (debugging) {
		console.putmsg(uMsgGrp.description + "\n\n");
	  }
          for each (uGrpSub in uMsgGrp.sub_list) {
                console.putmsg("\t" + uMsgGrp.name + ": " +
                  uGrpSub.description + "\n");
          }
         }
	} else {
	 //uMsgGrp = msg_area.grp_list[topebaseno].sub_list
	 for each (uGrpSub in msg_area.grp_list[topebaseno].sub_list) {
	 	console.putmsg("\t" + uGrpSub.description + "\n");
	 }
	}

        console.putmsg("\n");
    },
    dispMsg : function(base, ptr, breaks) {
	var debugging = false;	//we're good here

        if (breaks != false) { 
	  breaks = true;
	}

	if (debugging) {
	  console.putmsg(red + "base: " + base.grp_name + "\nptr: " + ptr +
			 "\nbreaks: " + breaks + "\n");
	}

        //try/catch this
        var mHdr = base.get_msg_header(ptr);
        var mBody = base.get_msg_body(ptr);

        if (breaks) {
          console.putmsg(magenta + high_intensity + mHdr.date +
                green + " from " + cyan + mHdr.from + "\n" +
                green);
          console.putmsg(mBody);  //this may need to have formatting
                                  //fixes for vdoc emulation
          console.putmsg(yellow + high_intensity + "\n[" +
                uGrpSub.name + "> msg #" + ptr + " (" +
                (base.last_msg - ptr) + " remaining)] " +
                cyan + "Read cmd -> ");
        }
    },
    dispNewMsgHdr : function() {
	//obviously date is only showing the day # (easy fix)
	var nao = new Date();

	console.putmsg("\n" + magenta + high_intensity +
		nao.getDate().toString() + green + " from " +
		cyan + user.alias + "\n" + green);
    },
    dispSaveMsgPrompt : function() {
	//kind of self-explanatory, don't you think?
	var uc, done;

	do {
	  done = true;
	  console.putmsg("\n" + sprompt);
	  uc = console.getkey(K_UPPER);

	  switch (uc) {
	    case 'A':	//abort
		console.putmsg(red + high_intensity + "Abort: ");
		done = console.yesno("are you sure? ");
		break;
	    case 'C':	//continue
		console.putmsg(green + high_intensity + "Continue...\n");
		break;
	    case 'P':	//print
		console.putmsg(green + high_intensity + "Print " +
				"formatted...\n");
		break;
	    case 'S':	//save
		console.putmsg(green + high_intensity + "Save...\n");
		break;
	    case 'X':	//message express
		console.putmsg(red + "Implementing Xpress here " +
				"later\n");
		done = false;
		break;
	  }
        } while ((!done) || ((uc != 'A') && (uc != 'C') && (uc != 'P') &&
                 (uc != 'S') /* && (uc != 'X')*/ ));

	return uc;
    },
    addMsg : function(base, upload) {
	/*
	 * NOTE: This method is way too big and needs to be chopped the
	 * fuck up in order to make this more readable and more reusable
	 */
        var mTxt = new Array();
        var lNdx = 0, done = false;
	var uchoice;

	//var debugging = false;	//only for local here

	this.dispNewMsgHdr();

        //going to use a generic subject for now; ignoring it from the
        //ddoc interface completely to see how it goes

	do {
	  mTxt[lNdx] = console.getstr("", 79, K_WRAP);
	  if (((mTxt[lNdx++] == "\03") && (upload)) ||
	      ((mTxt[lNdx - 1] == "") || (mTxt[lNdx - 1] == "\r"))) {
	    //end of message
	    uchoice = dispSaveMsgPrompt();

	    switch (uchoice) {
		case 'A':	//abort
		  done = true;
		  break;
		case 'C':	//continue
		  //fall through, basically
		  break;
		case 'P':
		  this.dispNewMsgHdr();
		  for each (var derp in mTxt) {
		    console.putmsg(green + high_intensity + derp);
		  }
		  //fall through to continue w/entry here, too
		  break;
		case 'S':
		  if (this.mWrite(mTxt, base) < 0) {
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
		  break;
		/* case 'X':
		 * just skipping this right now since I'm impatient
		 * about losing all of the recoding this morning and
		 * feeling much more that time is of the essence :| */
		default:
		  console.putmsg(red + "I have no idea what just " +
				 "happened; event logged.\n");
		  log(LOG_WARN, "Unknown error in addMsg()");
		  break;
	    }
	  }
	} while (!done);

	/* I do believe this is all moot; I'll cut it after committing
 	 * to version control and testing it.  Too damn scared after the
 	 * data loss of today to take any more chances with shit like
 	 * that.  :| 
	//menu for saving, printing, continuing, etc

	//save
	if (this.mWrite(mTxt, base) != 0) {
	    console.putmsg(red + "Error writing message in mWrite()" +
		green + "\n");
	}
	*/
    },
    mWrite : function(txtArray, mBase) {
          //create the message for writing
          var mHdr = {
                'from'          :       user.alias,
                'to'            :       "All",  //cheat for now
                'subject'       :       "dDOC Posting"  //cheat for now
          }
          var dMB = new MsgBase(mBase);
	  var debugging = false;	//locally, of course

          try {
            dMB.open();
          } catch (e) {
            console.putmsg(red + "Error opening: " + high_intensity +
                base + normal + "\n");
            log("dDOC err opening: " + base + "; " + e.message);
            return -1;
          }

          var catMTxt = new String(); 
          for each (var ouah in txtArray) {
            if (debugging) {
                console.putmsg(red + "ouah: " + ouah + "\n" + normal);
            }
            catMTxt += ouah;
          }

          try {
            dMB.save_msg(mHdr, catMTxt);
          } catch (e) {
            console.putmsg(red + "Error saving to: " + high_intensity +
                base + normal + "\n");
            log("dDOC err saving msg to: " + base + "; " + e.message);
            return -2;
          }

          try {
            dMB.close();
          } catch (e) {
            console.putmsg(red + "Error closing: " + high_intensity +
                base + normal + "\n");
            log("dDOC err closing: " + base + "; " + e.message);
            return -3;
          }
	  return 0;
    },
    newScan : function(confined) {
        console.putmsg(yellow + high_intensity + " Goto . . .\n");
        //don't forget to finish off this vestigial functionality

        //let us reinvent the fucking wheel
	if (!confined) {
	 var anyhits = false;

         for each (uMsgGrp in msg_area.grp_list) {
          for each (uGrpSub in uMsgGrp.sub_list) {
            /*
             * read the new and on to the fuggin' next
             * what does need to still be implemented, after basic
             * functionality is done, is starting at the current
             * location (grp & sub), instead of always starting at
             * the beginning as per proper vdoc emulation
             */
            var mBase = new MsgBase(uGrpSub.code);

            /* if (debugging) {
		console.putmsg("Opening " + uGrpSub.name + "\n");
	    }
	    console.putmsg(green + uGrpSub.name + yellow + ">\n"); */

            try {
                mBase.open();
            } catch (e) {
                console.putmsg("\nUnable to open " +
                  uGrpSub.name + ": " + e.message + "\n");
                //we really need to find the appropriate way to fail
                //here
                return -1;
            }

            if (debugging) {
                console.putmsg("scan_ptr: " + uGrpSub.scan_ptr +
                  "\t\tlast: " + mBase.last_msg + "\n");
	    }

	    if (uGrpSub.scan_ptr < mBase.last_msg) {
		bbs.cursub = uGrpSub.index;
		console.putmsg(green + uGrpSub.name + yellow + ">\n");

		while (uGrpSub.scan_ptr < mBase.last_msg) {
                  //commence the jigglin'
                  var tmpPtr = uGrpSub.scan_ptr, done = false;

                  this.dispMsg(mBase, ++tmpPtr, true);
		  this.read_cmd.rcChoice(mBase, tmpPtr);
		  anyhits = true;

		  return; //and yeah here this does wut again?
		}
	    }

            try {
                mBase.close();
            } catch (e) {
                console.putmsg("\nUnable to close " + uGrpSub.name +
                  ": " + e.message + "\n");
                //again, make this not yuck
                return -2;
            }
          }
         }
	} else { //confined
	 for each (uGrpSub in msg_area.grp_list[topebaseno].sub_list) {
	  //read the new and on to the next; same caveats as the
	  //above; this will also need to be modularized further :P  Too
	  //much code repeating at this point, but I'm in a hurry to get
	  //this done

	  var mBase = new MsgBase(uGrpSub.code);
	  //var debugging = false;	//change this locally; we're
					//good

	  /* if (debugging) {
		console.putmsg("Opening " + uGrpSub.name + "\n");
	  }
	  console.putmsg(green + uGrpSub.name + yellow + ">\n"); */

          try {
                mBase.open();
          } catch (e) {
                console.putmsg("\nUnable to open " +
                  uGrpSub.name + ": " + e.message + "\n");
	  	//same as above, a more legit way to fail would be nice
	  }

	  if (debugging) {
	    console.putmsg("scan_ptr: " + uGrpSub.scan_ptr +
		"\t\tlast: " + mBase.last_msg + "\n");
	  }

	  if (uGrpSub.scan_ptr < mBase.last_msg) {
	    bbs.cursub = uGrpSub.index;
	    console.putmsg(green + uGrpSub.name + yellow + ">\n");

	    while (uGrpSub.scan_ptr < mBase.last_msg) {
		//read that shit
		var tmpPtr = uGrpSub.scan_ptr, done = false;

		this.dispMsg(mBase, ++tmpPtr, true);
		this.read_cmd.rcChoice(mBase, tmpPtr);
		anyhits = true;

		return;	//what is this for again?
	    }
	  }

	  try {
	    mBase.close();
	  } catch (e) {
	    console.putmsg("\nUnable to close " + uGrpSub.name +
		": " + e.message + "\n");
	    //ouah: you can read above, right?
	    return -2;
	  }
	 }
	}

	if (!anyhits) {
	  //console.putmsg(yellow + ". . .\n");
	  bbs.cursub = 1;
	}
    },
    read_cmd : {
        rcMenu : "\n" + green + high_intensity +
          "<?> help         <a>gain           <A>gain (no More" +
	  "prompt)\n" +
          "<b>ack           <D>elete msg      <e>nter msg\n" +
          "<E>nter (upload) <h>elp            <i>nfo (forum)\n" +
          "<n>ext           <p>rofile author  <s>top\n" +
          "<w>ho's online   <x>press msg      <X>press on/off\n\n",

        rcChoice : function(base, ndx) {
          var uchoice = console.getkey();
          var valid = false;
          var hollaBack = 0;    //can be used to switch dir, etc

          while (!valid) {
            switch (uchoice) {
                case '?':
                case 'h':
                  console.putmsg(rcMenu);
                  break;
                case 'a':
                case 'A':
                case 'b':
                case 'D':
                case 'i':
                case 'p':
                case 'w':
                case 'x':
                case 'X':
                case 'E':
                  //dispMsg();  //how to pass parameters?
                  console.putmsg("\nI'm too dumb yet, just wait\n");
                  break;
                case 's':
                  valid = true; hollaBack = 1;
                  console.putmsg("Stop\n");
		  return hollaBack;
                  break;
                case 'e':
                  valid = true;
                  console.putmsg(green + high_intensity +
                        "Enter message\n\n");
                  addMsg(base, false);  //not an upload
                  break;
                default:
		  console.putmsg(normal + yellow + "Invalid choice\n");
		  console.putmsg(this.mprompt);
		  uchoice = console.getkey();
                  break;
            }

          //write the prompt again here, durrr; other flow control
          //issues, as well, here probably
          }

        return hollaBack;
        }
    }
}
