/* rudimentary DOC interface; utilizing OO implementation nao */
/*
 * by: Damon Getsman
 * started: 18aug14
 * finished:
 *
 * a slightly more organized attempt to emulate the DOC shell from
 * within Synchronet's SSJS libraries and functionality
 */

//pseudo-globals
const debugging = true, excuse = "\n\nNot so fast . . .\n\n";

//a few easier hooks for the ctrl-a codes
const ctrl_a = "\1";
const green = ctrl_a + "g", yellow = ctrl_a + "y", blue = ctrl_a + "b",
        white = ctrl_a + "w", red = ctrl_a + "r", cyan = ctrl_a + "c",
        magenta = ctrl_a + "m", high_intensity = ctrl_a + "h";

var stillAlive = true;

docIface = {
  //top level menu
  //menu properties
  menu :  green + high_intensity +
       //$ctrl_a + "g" + "\n" + "<A>\tSysop commands\n" +
       "\n\n<B>\tChange eXpress beeps\n<b>\tRead forum backward\n" +
       "<C>\tConfig menu\n<D>\tchange Doing field\n" +
       "<^E>\tEnter message with header\n<e>\tenter message normally" +
       "\n<E>\tenter (upload)\n<f>\tread forum forward\n" +
       "<F>\tshow Fortune\n<G>\tGoto next room\n" +
       "<Q>\tAsk a question of a guide\n<i>\tforum information\n" +
       "<j>\tjump to a room name/number\n<k>\tknown rooms list\n" +
       "<l>\tlogout\n<n>\tread new msgs\n<o>\tread old msgs reverse" +
       "\n<p>\tprofile user\n<P>\tprofile user (full info)\n" +
       "<s>\tskip room\n<S>\tskip to\n<t>\tCurrent time\n" +
       "<u>\tungoto last room\n<v>\texpress -1\n<w>\tWho's online?\n" +
       "<W>\tshort wholist\n<x>\tsend eXpress message\n" +
       "<X>\ttoggle eXpress status\n<^X>\tcheck old X messages\n" +
       "<y>\tyell\n<z>\tzaproom\n<0-9>\tquickX\n<#>\tReadroom by " +
       "number\n<->\tread last n messages\n<%>\ttoggle guideflag " +
       "status\n<@>\taidelist\n<\">\tquote Xes to Sysop\n\n",
  dprompt : yellow + high_intensity + 
	msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].description
 	+ "> ",

  //menu methods
  getChoice : function() {
	return (console.getkey());
  },
  doMainMenu : function() {
	console.putmsg(this.menu);
  },

  //message base menu
  msg_base : {
    //properties
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
         + " remaining)] " + green + high_intensity +
         "Read cmd -> ",

    //methods
    handler : function(choice) {
	//which way do we go with this?
	switch (choice) {
	  case 'n':	//read new
	    /* bbs.scan_subs();	 * wut?  this is going to have to
				 * be re-implemented assuming no
				 * easy strings replacement per
				 * command shell */
	    this.newScan();
	    console.putmsg("\n\nJust give me a sign . . .");
	    console.getkey();
	    break;
	  case 'k':	//list scanned bases
	    this.listKnown();
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
	for each (uMsgGrp in msg_area.grp_list) {
	  if (debugging) console.putmsg(uMsgGrp.description + "\n\n");
	  for each (uGrpSub in uMsgGrp.sub_list) {
		console.putmsg("\t" + uMsgGrp.name + ": " +
		  uGrpSub.description + "\n");
	  }
	}

	console.putmsg("\n");
    },
    dispMsg : function(base, ptr, breaks) {
	if (breaks != false) breaks = true;

	//try/catch this
        var mHdr = base.get_msg_header(ptr);
        var mBody = base.get_msg_body(ptr);

	if (breaks) {
          console.putmsg(magenta + high_intensity + mHdr.date +
                green + " from " + cyan + mHdr.from + "\n\n" +
                green);
          console.putmsg(mBody);  //this may need to have formatting
                                  //fixes for vdoc emulation
          console.putmsg(yellow + high_intensity + "\n" +
                "[" + uGrpSub.name + "> msg #" + ptr +
                " (" + (base.last_msg - ptr) + " remaining)] " +
                cyan + "Read cmd -> ");
	}
    },
    addMsg : function(base, upload) {
	if (!upload) {
	  if (debugging) console.putmsg("\nentered addMsg()\n");

	  var nao = new Date();
	  var mTxt, ndx = 0, lNdx = 1;

	  console.putmsg(magenta + high_intensity + nao.getDate() +
		green + " from " + cyan + User.alias + "\n\n" +
		green);

	  do {
	    mTxt[ndx++] = console.getkey();
	    if (((lNdx % 80) == 0) && ((mTxt[ndx] != ' ') &&
		 (mTxt[ndx] != '\t') && (mTxt[ndx] != '\n')) {
		//wordwrap time
		

	} else {
	  console.putmsg("\nUnable to handle message upload yet\n");
	  return -1;
	}
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

	    if (debugging) console.putmsg("Opening " +
		uGrpSub.name + "\n");

	    try {
		mBase.open();
	    } catch (e) {
		console.putmsg("\nUnable to open " +
		  uGrpSub.name + ": " + e.message + "\n");
		//we really need to find the appropriate way to fail
		//here
		return -1;
	    }

	    if (debugging)
		console.putmsg("scan_ptr: " + uGrpSub.scan_ptr +
		  "\t\tlast: " + mBase.last_msg + "\n");

	    while (uGrpSub.scan_ptr < mBase.last_msg) {
		//commence the jigglin'
		var tmpPtr = uGrpSub.scan_ptr;

		/*
		var mHdr = mBase.get_msg_header(tmpPtr);
		var mBody = mBase.get_msg_body(tmpPtr);

		console.putmsg(magenta + high_intensity + mHdr.date +
			green + " from " + cyan + mHdr.from + "\n\n" +
			green);
		console.putmsg(mBody);	//this may need to have formatting
					//fixes for vdoc emulation
		console.putmsg(yellow + high_intensity + "\n" +
			"[" + uGrpSub.name + "> msg #" + tmpPtr +
			" (" + (mBase.last_msg - tmpPtr) + " remaining)] " +
			cyan + "Read cmd - > ");
		*/
		this.dispMsg(mBase, tmpPtr, true);
		switch (this.read_cmd.rcChoice(mBase, tmpPtr)) {
		  case '1':
		    tmpPtr++;
		    break;
		  default:
		    if (debugging) console.putmsg("\nNot implemented\n");
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
	  "<?> help         <a>gain           <A>gain (no More prompt)\n" +
	  "<b>ack           <D>elete msg      <e>nter msg\n" +
	  "<E>nter (upload) <h>elp            <i>nfo (forum)\n" +
	  "<n>ext           <p>rofile author  <s>top\n" +
	  "<w>ho's online   <x>press msg      <X>press on/off\n\n",

	rcChoice : function(base, ndx) {
	  var uchoice = console.getkey();
	  var valid = false;
	  var hollaBack = 0;	//can be used to switch dir, etc

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
		  //dispMsg();	//how to pass parameters?
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
		  addMsg(base, false);	//not an upload
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
}

var uchoice;

/* to the main program loop */
while (stillAlive) {
	console.putmsg(docIface.dprompt);

	uchoice = docIface.getChoice();
	//poor aliasing
	if (uchoice == ' ') uchoice = 'n';

	switch (uchoice) {
		//top menu
		case '?' :
		  docIface.doMainMenu();
		  break;
		//message base entry commands
		case 'b':
		case 'e':
		case 'E':
		case 'r':
		case 'n':
		case 'o':
		case '-':
		  docIface.msg_base.handler(uchoice);
		  break;
		//other msg base shit
		//list known
		case 'k':
		  docIface.msg_base.listKnown();
		  break;
		//logout
		case 'l':
		  if (debugging)
		    console.putmsg("\n\nExiting: " + excuse);
		  stillAlive = false;
		  break;
		default:
		  console.putmsg(excuse);
		  break;
	}
}

