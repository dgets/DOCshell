/*
 * dmbase.js
 *
 * by: Damon Getsman
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
    //msg_base methods
    handler : function(choice) {
        //which way do we go with this?
        switch (choice) {
          case 'n':     //read new
            this.newScan();
            console.putmsg("\n\nJust give me a sign . . .");
            console.getkey();
            break;
          case 'k':     //list scanned bases
            this.listKnown();
            break;
          case 'e':     //enter a normal message
            this.addMsg(user.cursub, false);
            break;
          default:
            if (debugging)
              console.putmsg("\nNot handled yet . . .\n\n");
            break;
        }

    },
    listKnown : function() {
        console.putmsg("\n\n" + green + high_intensity);

        //we can fuck with multi-columns later
        for (uMsgGrp in msg_area.grp_list) {
          if (debugging) {
		console.putmsg(uMsgGrp.description + "\n\n");
	  }
          for each (uGrpSub in uMsgGrp.sub_list) {
                console.putmsg("\t" + uMsgGrp.name + ": " +
                  uGrpSub.description + "\n");
          }
        }

        console.putmsg("\n");
    },
    dispMsg : function(base, ptr, breaks) {
        if (breaks != false) { 
	  breaks = true;
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
    addMsg : function(base, upload) {
        if (!upload) {
          var nao = new Date(), mTxt = new Array(String),
              mLn = new Array();

          var ndx = 0, lNdx = 0, done = false;
	  var debugging = false;
	  //note, this is only removing debugging in the local method

          //obviously date is only showing the day # [fix]
          console.putmsg("\n" + magenta + high_intensity +
                nao.getDate().toString() + green + " from " +
                cyan + user.alias + "\n" + green);

          //should we include a subject in the DOC clone?
	  //working with a generic one for now; get Neuro's input on how
	  //to do it best with the actual format later
          do {
            if ((mLn[ndx] = console.getkey()) == '\t') {        //tab
                if ((ndx + 5) >= 79) {
                  if (debugging) {
                    console.putmsg(red + "entry dbg1:" + normal);
		  }
                  ndx = 0;

                  for (var x = 0; x < mLn.length; x++) {
                    mTxt[lNdx] += mLn[x];
		  }
                  lNdx++;

                  console.putmsg("\n");
                  break;
                } else {
                  mLn += "     ";       //not sure about this
                  ndx += 5;
                  console.putmsg("     ");
                }
            } else if (mLn[ndx] == '\r') {      //newline
                if (ndx == 0) {
                  done = true;
                }

                ndx = 0;

                //same as above; set w/loop
                for (var x = 0; x < mLn.length; x++) {
                  mTxt[lNdx] += mLn[x];
		}
		mTxt[lNdx++] += '\n';

                console.putmsg("\n");

                if (debugging) {	//why is this duplicated below?
                  console.putmsg(red + "entry dbg3:\t")
                  console.putmsg("lNdx: " + lNdx + normal + "\n");
                        if (done) {
                          console.putmsg(red + "Debugging output:\n");
			  for (var x = 0; x < lNdx; x++) 
			    console.putmsg(x + ": " + mTxt[x] + "\n");
                        }
                }
            } else if (mLn[ndx] == '\b') {      //backspace
                if (ndx == 0) {
			break;
		}

		ndx--;
                console.putmsg("\b");
            } else {    //other conditions for ctrl keys should be here
                if ((ndx != 0) && ((ndx % 79) == 0) && 
		    (mLn[ndx] != ' ')) {
                  //this is broken --DEBUG-- (fixed nao?)
                  var lastWS, tmpStr;

		  //this might require array initialization before reuse
		  //for the next line of input at main message loop
		  for (var x = 79; mLn[x] != ' '; x--) {
		    lastWS = x;
		  }

                  if (debugging) {
                    console.putmsg(red + "entry dbg4:" + normal);
		  }

                  tmpStr = mLn.toString().substring(lastWS, 
						    (mLn.length - 1));
                  for (var ouah = 0; ouah < (mLn.length - lastWS);
                       ouah++) {
                        console.putmsg('\b');
		  }
                  //note there still needs to be a check for nonbroken
                  //line entries; not sure what that'll do heah

                  mLn.length = lastWS;
                  ndx = 0;
                  mTxt[lNdx++] = mLn;
                  mTxt[lNdx] = tmpStr;
                }

                console.putmsg(mLn[ndx++]);
            }
          } while (done != true);

	  //create the message for writing
	  var mHdr = {
		'from'		:	user.alias,
		'to'		:	"All",	//cheat for now
		'subject'	:	"dDOC Posting"	//cheat for now
	  }
	  var dMB = new MsgBase(base);

	  try {
	    dMB.open();
	  } catch (e) {
	    console.putmsg(red + "Error opening: " + high_intensity +
		base + normal + "\n");
	    log("dDOC err opening: " + base + "; " + e.message);
	    return -1;
	  }

	  var catMTxt = "";
	  for (var ouah in mTxt) {
	    if (debugging) {
		console.putstr(red + "ouah: " + ouah + "\n" + normal);
	    }
	    catMTxt += (mTxt[ouah].toString() + "\n");
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

        } else {
          console.putmsg("\nUnable to handle message upload yet\n");
          return -2;
        }

        //entry completion menu
        console.putmsg("\nMessage entry completed\nFalling through, " +
                       "Not Implemented Yet\n");
    },
    newScan : function() {
        console.putmsg(yellow + high_intensity + " Goto ");
        //don't forget to finish off this vestigial functionality

        //let us reinvent the fucking wheel
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

            if (debugging) {
		console.putmsg("Opening " + uGrpSub.name + "\n");
	    }

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

            while (uGrpSub.scan_ptr < mBase.last_msg) {
                //commence the jigglin'
                var tmpPtr = uGrpSub.scan_ptr;

                /*
                var mHdr = mBase.get_msg_header(tmpPtr);
                var mBody = mBase.get_msg_body(tmpPtr);

                console.putmsg(magenta + high_intensity + mHdr.date +
                        green + " from " + cyan + mHdr.from + "\n\n" +
                        green);
                console.putmsg(mBody);  //this may need to have fmting
                                        //fixes for vdoc emulation
                console.putmsg(yellow + high_intensity + "\n" +
                        "[" + uGrpSub.name + "> msg #" + tmpPtr +
                        " (" + (mBase.last_msg - tmpPtr) + 
			" remaining)]" +
                        cyan + "Read cmd - > ");
                */
                this.dispMsg(mBase, tmpPtr, true);
                switch (this.read_cmd.rcChoice(mBase, tmpPtr)) {
                  case '1':
                    tmpPtr++;
                    break;
                  default:
                    if (debugging) {
			console.putmsg("\nNot implemented\n");
		    }
                    break;
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
                  break;
                case 'e':
                  valid = true;
                  console.putmsg(green + high_intensity +
                        "Enter message\n\n");
                  addMsg(base, false);  //not an upload
                  break;
                default:
                  if (debugging) console.putmsg("wtF-f-f\n");
                  break;
            }

          //write the prompt again here, durrr; other flow control
          //issues, as well, here probably
          }

        return hollaBack;
        }
    }
}
