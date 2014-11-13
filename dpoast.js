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
    //properites
    sprompt : high_intensity + yellow + "<A>" + green + "bort " +
         yellow + "<C>" + green + "ontinue " + yellow + "<P>" + 
         green + "rint " + yellow + "<S>" + green + "ave " + yellow +
         "<X>" + green + "press -> ",

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
          done = true;
          console.putmsg("\n" + sprompt);
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
                break;
            case 'X':   //message express
                console.putmsg(red + "Implementing Xpress here " +
                                "later\n");
                done = false;
                break;
          }
        } while ((!done) || ((uc != 'A') && (uc != 'C') && (uc != 'P')
&&
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
         */
    addMsg : function(base, upload) {
        /*
         * NOTE: This method is way too big and needs to be chopped the
         * fuck up in order to make this more readable and more reusable
         */
        var mTxt = new Array();
        var lNdx = 0, done = false;
        var uchoice;

        //var debugging = false;        //only for local here

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
                case 'A':       //abort
                  done = true;
                  break;
                case 'C':       //continue
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
    mWrite : function(txtArray, mBase) {
          //create the message for writing
          var mHdr = {
                'from'          :       user.alias,
                'to'            :       "All",  //cheat for now
                'subject'       :       "dDOC Posting"  //cheat for now
          }
          var dMB = new MsgBase(mBase);
          var debugging = false;        //locally, of course

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
    }
}

