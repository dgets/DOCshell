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
	msg_menu = 

} else {
	console.print("\n\nHouston we got a fahkin' problem\n\n");
}

bbs.ddoc.do_main_prompt = function {
	top_prompt = yellow + high_intensity +
		user.cursub + "> ";

	cmd = console.inkey();
	return cmd;
}

bbs.ddoc.do_main_function = function {
	switch (cmd) {
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
	  case 'e':  //Enter message normally
		

bbs.ddoc.main_menu = function {
	console.print(top_menu);
	do_main_prompt();

