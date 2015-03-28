// login.js

// Login module for Synchronet BBS v3.1

// $Id: login.js,v 1.9 2014/03/08 04:46:00 rswindell Exp $

load("sbbsdefs.js");

if((options=load("modopts.js","login")) == null)
	options={email_passwords: true};

// The following 2 lines are only required for "Re-login" capability
bbs.logout();
system.node_list[bbs.node_num-1].status = NODE_LOGON;

var guest = system.matchuser("guest");

//load("loadfont.js", "-P", system.data_dir + "VERT.FNT");

for(var c=0; c<10; c++) {

	// The "node sync" is required for sysop interruption/chat/etc.
	bbs.nodesync();

	// Display login prompt
	console.print("\r\n\1n\1h\1cEnter \1wYo Self-Taken Name");
	if(!(bbs.node_settings&NM_NO_NUM))
		console.print("\1c or \1wNumber");
	if(!(system.settings&SYS_CLOSED))
		console.print("\1c or '\1yNew\1c'");
	if(guest)
		console.print("\1c or '\1yGuest\1c'");
	console.print("\r\nNN:\b\b\bLogin: \1w");

	// Get login string
	var str;
	if(bbs.rlogin_name.length)
		print(str=bbs.rlogin_name);
	else
		str=console.getstr(/* maximum user name length: */ LEN_ALIAS
						 , /* getkey/str mode flags: */ K_UPRLWR | K_TAB | K_ANSI_CPR);
	truncsp(str);
	if(!str.length) // blank
		continue;

	// New user application?
	if(str.toUpperCase()=="NEW") {
	   if(bbs.newuser()) {
		   bbs.logon();
		   exit();
	   }
	   continue;
	}
	// Continue normal login (prompting for password)
	// modified by Khelair for usage w/ddoc2
	if(bbs.login(str, "\1n\1c\1hPW:\b\b\bPassword: \1w")) {
		//check to see if we're a ddoc user, skip interactive if so
		if (user.command_shell.toUpperCase() == "DDOC") {
		  exit();
		} else {
		  bbs.logon();
		  exit();
		}
	}
	console.clearkeybuffer();	// Clear pending input (e.g. mistyped system password)
	bbs.rlogin_name='';		// Clear user/login name (if supplied via protocol)
	if(options && options.email_passwords) {
		var usernum = system.matchuser(str);
		if(usernum) {
			var u = new User(usernum);
			if(!(u.settings&(USER_DELETED|USER_INACTIVE))
				&& u.security.level < 90
				&& netaddr_type(u.netmail) == NET_INTERNET
				&& !console.noyes("Did you forget your password")) {
				console.print("\1n\1c\1hPlease confirm your Internet e-mail address: \1y");
				var email_addr = console.getstr(LEN_NETMAIL);
				if(email_addr.toLowerCase() == u.netmail.toLowerCase()) {

					var msgbase = new MsgBase("mail");
					if(msgbase.open()==false)
						alert(log(LOG_ERR,"!ERROR " + msgbase.last_error));
					else {
						var hdr = { to: u.alias,
									to_net_addr: u.netmail, 
									to_net_type: NET_INTERNET,
									from: system.operator, 
									from_ext: "1", 
									subject: system.name + " user account information"
						};

						var msgtxt = "Your user account information was requested on " + system.timestr() + "\r\n";
						msgtxt += "by " + client.host_name + " [" + client.ip_address +"] via " + 
							client.protocol + " (TCP port " + client.port + "):\r\n\r\n";

						msgtxt += "Account Number: " + u.number + "\r\n";
						msgtxt += "Created: " + system.timestr(u.stats.firston_date) + "\r\n";
						msgtxt += "Last on: " + system.timestr(u.stats.laston_date) + "\r\n";
						msgtxt += "Connect: " + u.host_name + " [" + u.ip_address + "]" +
										" via " + u.connection + "\r\n";
						msgtxt += "Password: " + u.security.password + "\r\n";

						if(msgbase.save_msg(hdr, msgtxt))
							console.print("\r\n\1n\1h\1yAccount information e-mailed to: \1w" + u.netmail + "\r\n");
						else
							alert(log(LOG_ERR,"!ERROR " + msgbase.last_error + "saving bulkmail message"));

						msgbase.close();
					}
					continue;
				}
				alert(log(LOG_WARNING,"Incorrect e-mail address: " + email_addr));
			}
		}
	}
	// Password failure counts as 2 attempts
	c++;
}

// Login failure
bbs.hangup();