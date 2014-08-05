/* rudimentary DOC menu */
/* 
   by: Khelair/Damon Getsman
   started: 23jul14 23:47
   finished:

   Just an attempt at emulating the Dave's Own version of Citadel (DOC)
   in Synchronet's loadable routines in order to help make the place a bit
   friendlier for any utopian/eschwan/etc users that might decide to come
   by, even though the prospects seem unlikely.  At least it'll teach me
   the Synchronet JavaScript internal libraries and give me some moar
   practical experience w/JS.
*/

var cmd, skill, top_menu, msg_menu;	/* command keystroke, skill level
					   (novice, xpert, sysop), top lvl
					   menu string, msg menu string */
var top_prompt, msg_prompt;
var curbase = new MsgBase(0);	//change this to reflect saved room l8r

//a few easier hooks for the ctrl-a codes
const ctrl_a = "\1";
const green = ctrl_a + "g", yellow = ctrl_a + "y", blue = ctrl_a + "b",
	white = ctrl_a + "w", red = ctrl_a + "r", cyan = ctrl_a + "c",
	magenta = ctrl_a + "m", high_intensity = ctrl_a + "h";

//testing
const debugging = true;
const excuse_string = "\n\nNot so fast . . .\n\n\n";
	
//let's just set skill level to novice and get that working before we start to
//try to fuck with anything else here

skill = 0;

/* 
 * okay, fwiw, I know that this isn't the most maintainable way to handle
 * this right now, but fuggit, I'll move it into an init routine later
 * on, I just want to get this rolling as soon as possible, first
 */

if (skill == 0) {
	top_menu = green + high_intensity +
	   //$ctrl_a + "g" + "\n" + "<A>\tSysop commands\n" +
	   "<B>\tChange eXpress beeps\n<b>\tRead forum backward\n" +
	   "<C>\tConfig menu\n<D>\tchange Doing field\n" +
	   "<^E>\tEnter message with header\n<e>\tenter message normally" +
	   "\n<E>\tenter (upload)\n<f>\tread forum forward\n" +
	   "<F>\tshow Fortune\n<G>\nGoto next room\n" +
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
	   "status\n<@>\taidelist\n<\">\tquote Xes to Sysop\n\n";
	msg_menu = green + high_intensity + "<?> help\t\t" +
	   "<a>gain\t\t<A>gain (no More prompt)\n<b>ack\t\t<D>" +
	   "elete msg\t<e>nter msg\n<E>nter (upload)\t<h>elp\t\t\t" +
	   "<i>nfo (forum)\n<n>ext\t\t<p>rofile author\t<s>top\n" +
	   "<w>ho's online\t<x>press msg\t<X>press on/off\n\n";

} else {
	console.print("\n\nHouston we got a fahkin' problem\n\n");
}

bbs.ddoc.do_main_prompt = function {
	top_prompt = yellow + high_intensity +
		user.cursub + "> ";

	return console.inkey();
}

bbs.ddoc.do_main_function = function {
	switch (cmd) {
	  case '?':  //main menu
		cmd = console.ddoc.main_menu();
		break;
	  case 'B':  //toggle xpress beeps
		if (xpress_beeps) {
			xpress_beeps = false;
		} else { 
			xpress_beeps = true; 
		}
		break;
	  /* case 'b':  //read forum backwards
		//yeah in a bit
		console.print(excuse_string);
		break; */
	  case 'C':  //Config menu
		bbs.ddoc.config.menu();
		break;
	  /*case 'D':  //change Doing field
		console.print(excuse_string);
		break;
	  case '\5': //Enter message with header
		console.print(excuse_string); */
	  //case 'e':  //Enter message normally
	  case 'E':  //upload message (text upload)
		bbs.ddoc.do_msg_upload();
		break;

}

//menu methods
bbs.ddoc.do_top_menu = function {
	console.print(top_menu);
	cmd = do_main_prompt();
	return cmd;
}

bbs.ddoc.do_msg_menu = function {
	console.print(msg_menu);
	cmd = do_msg_prompt();
	return cmd;
}

bbs.ddoc.do_msg_prompt = function {
	console.print(yellow + high_intensity + user.cursub + "> msg #" +
		msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].scan_ptr + 
		" (" +
		(msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].max_msgs -
		msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].scan_ptr)
		+ " remaining)] " + green + high_intensity + 
		"Read cmd -> ";

	return console.inkey();
}

//DOC only message methods
bbs.ddoc.do_msg_upload = function {
	console.print(green + high_intensity +
		"Hit Y to upload a message or N to enter a " +
		"message normally (Y/N) -> ";

	cmd = console.inkey();
	if (cmd != 'Y') {
		return -1;
	} else {
		var msg_buf, tmp;

		//all of this is going to have to be determined at the 
		//start of the message entry, not ad libbed on the fly
		console.print("(Use control-D to end!)\n\n" +
			magenta + high_intensity +
			system.datestr() + " " + system.timestr() +
			green + high_intensity +
			" from " + cyan + high_intensity +
			user.alias() + "\n" + green + high_intensity);

		tmp = console.inkey();
		while (tmp != '\4') {
			msg_buf += tmp;
			//add echoing if needed, of course
		}

		console.print(yellow + high_intensity + "<A>" +
			cyan + high_intensity + "bort " + yellow +
			high_intensity + "<C>" + cyan + high_intensity +
			"ontinue " + yellow + high_intensity + "<P>" +
			cyan + high_intensity + "rint " + yellow +
			high_intensity + "<S>" + cyan + high_intensity +
			"save " + yellow + high_intensity + "<X>" +
			cyan + high_intensity + "press -> ";

		cmd = console.inkey();
		//durrrrrr switch case to all caps for most of this
		switch (cmd.toUpperCase()) {
			case 'A':
				console.print(red + high_intensity +
				  "Abort: " + green + high_intensity +
				  "are you sure? ");

				cmd = console.inkey();
				if ((cmd == 'y') || (cmd = 'Y')) {
				  return -1;
				} else {
				  //return to message
				  //hint: need to modularize
				  console.print(excuse_string);
				  return -1;
				}
				break;
			case 'C':
				console.print(green + high_intensity +
				  "Continue...\n");
				//return to modular text input again
				console.print(excuse_string);
				break;
			case 'P':  //modularize
				console.print(green + high_intensity +
				  "Print formatted\n\n");

		}
	}
}

bbs.ddoc.init = function {
	var cmd, skill, top_menu,      // command keystroke, skill level
		msg_menu;              // (novice, xpert, sysop), top lvl
	                               // menu string, msg menu string 
	var top_prompt, msg_prompt;

	var curbase = new MsgBase(0);   //change this to reflect saved room

	//a few easier hooks for the ctrl-a codes
	const ctrl_a = "\1";
	const green = ctrl_a + "g", yellow = ctrl_a + "y", blue = ctrl_a + 
		"b", white = ctrl_a + "w", red = ctrl_a + "r", cyan = 
		ctrl_a + "c", magenta = ctrl_a + "m", high_intensity =
		ctrl_a + "h";

}

