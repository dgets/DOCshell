/*
 * dperuser.js
 *
 * by: Damon Getsman
 * contributing/rewrites also by: @Ntwitch (github.com)
 * started: 26Jan15
 * alpha phase: 28Feb15
 * beta phase:
 * finished:
 *
 * This file is for any of the functionality that I still need to work on that
 * will rely on per-user records.  IE: Zapped rooms/known rooms, user 'i'nfo,
 * etc.  I'll need to run through some of the issues on github and find out
 * which areas, exactly, will need to have functionality here worked with, 
 * other than those bits that I remember.
 */

var debugging = false;

userRecords = {
    //information that would be stored in 'i'nfo and 'p'rofile on a DOC style
    //BBS system

    //	----++++****====userRecords properties====****++++----
    userDir: system.data_dir + "user/",
    settingsFilename: "docusers",
    maxInfoLines: 5,
    doingChars: 55,
    //	----++++****====userRecord methods====****++++----

    //	----++++****====userRecord sub-objects====****++++----
    /*
     * Default settings object.  Alias set, all debugging options false.
     */
    defaultSettings: function (userid) {
	var settings = {
	    alias: "",
	    info: [],
	    doing: "",
	    confined: true,
	    debug: {
		flow_control: false,
		message_posting: false,
		message_scan: false,
		instant_messaging: false,
		navigation: false,
		file_io: false,
		misc: false
	    }
	};
	var tmpUser = new User(userid);

	// alias isn't really required, but it makes the JSON readable
	settings.alias = tmpUser.alias;

	return settings;
    },
    userDataIO: {
	//pulling or pushing the information stored in the user profile/info

	//	---++++****====userDataIO methods====****++++----
	/*
	 * summary:
	 *	finds the point where the comment header stops and data begins
	 * infile:
	 *	the currently open data file to read
	 * returns:
	 *	the file object with the pointer located at the point where
	 *	data begins
	 * throws:
	 *	dDocException:InvalidArguments if infile is null or not open
	 */
	stripComments: function (infile) {
	    var line;

	    if (infile == null || !infile.is_open) {
		throw new docIface.dDocException("InvalidArguments",
		      "stripComments: infile must be not null and open", -1);
	    }

	    while (!infile.eof) {
		try {
		    line = infile.readln();
		    if (line == null) {
			if (infile.eof) {
			    line = "";
			} else {
		            throw new docIface.dDocException("ReadError",
			          "stripComments: line was null", -1);
			}
		    }
		} catch (e) {
		    console.putmsg(yellow + "Exception reading file: " +
			  e.toString() + "\n");
		    return null;
		}
		line = line.trim();
		if (line.length === 0 || line.charAt(0) === '#') continue;

		break;
	    }

	    // We have reached the first line of
	    // actual data, or we have reached EOF without finding data.
	    if (infile.eof)
	        return infile;
	    
	    // we're already 1 line past where we need to be.
	    // back up the length of the line we just read, plus one linefeed.
	    infile.position -= (line.length + "\n".length);
	    if (infile.position < 0) infile.position = 0;

	    return infile;
	},
	/*
	 * summary:
	 *	method loads the dDoc-specific settings file
	 * returns:
	 *	the per-user settings sub-object
	 *	logs an error and returns null on failure
	 */
	loadSettingsBlob: function () {
	    var settingsFile = new File(userRecords.userDir
		  + userRecords.settingsFilename);
	    var blob;

	    if (!file_exists(settingsFile.name)) {
		this.openFileWrap(settingsFile, "w");
		// TODO: write default comment header here
		settingsFile.writeln(
		      "   #\n   # This is a simple test header to test " +
		      "comment skipping.\n   #");
		settingsFile.close();
	    }
	    settingsFile = this.openFileWrap(settingsFile, "r");
	    if (settingsFile == null || !settingsFile.is_open) {
		console.putmsg(red + "Unable to open " + userRecords.userDir
		      + userRecords.settingsFilename + "\n");
		throw new dDocException("Unable to open " + 
			userRecords.userDir + userRecords.settingsFilename,
			"Can't open user records!", 1);
		//return null;
	    }

	    settingsFile = this.stripComments(settingsFile);

	    try {
		blob = settingsFile.read();
	    } catch (e) {
		console.putmsg(yellow + "Exception reading DDOC settings: "
		      + e.toString() + "\n");
		throw new dDocException("Err: " + e.toString(), "Exception" +
			" reading dDoc settings", 2);
		//return null;
	    } finally {
		settingsFile.close();
	    }

	    if ((blob == null) || (blob.length < 2)) {
		throw new dDocException("Exception: blob too small",
			"blob null or length < 2", 3);
		//return null;
	    }
	    
	    blob = JSON.parse(blob);

	    return blob;
	},
	/*
	 * summary:
	 *	loads the settings JSON, and picks out the user from
	 *	the user number
	 * userid:
	 *	synchronet user number to load
	 * returns:
	 *	the current user's settings object
	 *	if no settings for the current user are found, it returns a
	 *	settings object with all debugging options defaulting to false
	 */
	loadSettings: function (userid) {
	    var blob = this.loadSettingsBlob();
	    var tmpUser = new User(userid);

	    if (debugging) {
		console.putmsg("Searching user settings for "
		      + tmpUser.alias + "\n");
	    }

	    // Tricky conditional to detect an empty but not null object
	    // for before we have anything in the JSON
	    if (blob == null
	        || (Object.getOwnPropertyNames(blob).length === 0)
		|| (blob[userid.toString()] == null)) {
		  if (debugging) {
		   console.putmsg("No user found, returning default settings" +
		    ".\n");
		  }
		  return new userRecords.defaultSettings(userid);
	    }

	    return blob[userid.toString()];
	},
	/*
	 * summary:
	 *	Saves the per-user settings to the DDOC settings file.
	 */
	saveSettings: function (userid, settings) {
	    var json = this.loadSettingsBlob();
	    var outfile = new File(userRecords.userDir
		  + userRecords.settingsFilename);

	    if (json === null)
		json = JSON.parse("{}");

	    // Update and stringify JSON
	    json[userid.toString()] = settings;
	    json = JSON.stringify(json, null, 2);  // Pretty print!

	    // cut off the file at the end of the comments and
	    // write the new JSON
	    outfile = this.openFileWrap(outfile, "r+");
	    outfile = this.stripComments(outfile);
	    outfile.truncate(outfile.position);
	    outfile.write(json);
	    outfile.close();
	},
	/*
	 * summary:
	 *	method is a wrapper for opening a file of any particular
	 *	mode; serves as a wrapper for the try/catch shit to not
	 *	be so redundant in code
	 * fname:
	 *	filename/path to open
	 * mode:
	 *	Synchronet API's mode specification for File.open()
	 * return:
	 *	Returns null for error, open file object for success
	 */
	openFileWrap: function (fObj, mode) {
	    try {
		fObj.open(mode);
	    } catch (e) {
		console.putmsg(red + "In openFileWrap():\n");
		console.putmsg(red + e.toString() + "\n");
		fObj.close();
		throw new dDocException("Exception in openFileWrap", 
			e.toString(), 1);
		//return null;
	    }

	    return fObj;
	}
    },
    userDataUI: {
	//pushing/pulling output from the user (sorry, I can't stop using that
	//terminology now)

	//	  ----++++****====userDataUI methods====****++++----
        profileUser : function (uname) {
            var profileeSettings = { };
            var unum, uObj;

            if ((unum = system.matchuser(uname)) == 0) {
                console.putmsg(yellow + high_intensity + "User " + green +
                  uname + " was not found!\n");
                throw new dDocException("profileUser() Exception",
                    "Unable to locate " + uname, 1);
            }

            profileeSettings = userRecords.userDataIO.loadSettings(unum);
            uObj = new User(unum);

            console.putmsg(cyan + high_intensity + uObj.alias + "\n" +
                yellow + high_intensity + uObj.address + "\n" +
                uObj.location + "\n");

            if (profileeSettings == null) { //that is the error condition, no?
                console.putmsg(yellow + high_intensity + "User has not set up" +
                    " profile information yet\n\n");
            } else {
                console.putmsg(high_intensity + green + "Doing: " + cyan +
                    profileeSettings.doing + "\n\n");
                for each (var infoLine in profileeSettings.info) {
                    console.putmsg(green + high_intensity + infoLine + "\n");
                }
                console.putmsg("\n");
            }
        },
	/*
	 * summary:
	 *	obtains a new list of lines of text to utilize as the
	 *	info field from the user
	 * returns:
	 *	this (up to 5 line) array of user info text
	 */
	getInfo: function () {
	    var uInp = [], cntr = 0;

	    console.putmsg(green + high_intensity + "\nEnter a description " +
		  ", up to 5 lines\n\n");

	    while (uInp.length < userRecords.maxInfoLines) {
		console.putmsg(green + high_intensity + ">");
		uInp[cntr] = console.getstr(null, 77);

		if (uInp[cntr] == "") {
		    uInp.pop();
		    break;
		}
		cntr++;
	    }

	    return uInp;
	},
	/*
	 * summary:
	 *	Asks the user for a new doing message
	 * returns:
	 *	String value of the new doing message
	 */
	getDoing: function() {
	    var doing = "";
	    
	    console.putmsg(green + high_intensity
		  + "Enter a new doing for yourself.\n> ");
	    doing = console.getstr(null, userRecords.doingChars);
	    
	    return doing;
	},
	/*
	 * summary:
	 *	queries the user for whether or not they want the true
	 *	or false value set on each debugging option; security
	 *	level checking will have to be put in here at some point
	 *	before beta deployment
	 * userid:
	 *	synchronet user number of the user whose debug flags
	 *	are being set
	 * TODO:
	 *	connect this function with a sysop settings menu somewhere
	 *	so that sysops can set their own and others' debugging options
	 */
	queryDebugSettings: function (userid) {
	    var tmpSettings = userRecords.userDataIO.loadSettings(userid);
	    var availableOpts = (new userRecords.defaultSettings(user.number)).debug;
	    var opt, done = false;

	    console.putmsg(yellow + high_intensity +
		  "Oont nao vhe vhill set " +
		  system.username(userid) + "'s debugging options.\n\n");

	    while (!done) {
	        for (opt in availableOpts) {
		    //so yeah this can be taken care of a lot more efficiently :|
		    if (console.yesno("Would you like to help debugging " +
			   opt)) {
			tmpSettings.debug[opt] = true;
		    }
		}

		if (console.noyes("Do you need to go through these again")) {
		    done = true;
		}

	    }
	    userRecords.userDataIO.saveSettings(userid, tmpSettings);
	    return tmpSettings;
	},
	displayDebugFlags: function (userid) {
	    var flags = Object.keys(
	        userRecords.userDataIO.loadSettings(userid).debug);

	    for each (opt in flags) {
		console.putmsg(yellow + "Flag: " + high_intensity + opt +
		      normal + yellow + "\t\tValue: " +
		      high_intensity + userSettings.debug[opt] + "\n");
	    }
	},
	displayInfo: function (userid) {
	    var info = userRecords.userDataIO.loadSettings(userid).info;
	    var i;

	    for (i = 0; i < info.length; i += 1) {
		console.putmsg(info[i] + "\n");
	    }
	}

    }

},
userConfig = {
    //'c'onfig menu stuph

    //	----++++****====userConfig properites====****++++----
    cMenu: "\n<a>ddress\t\t<c>lient\t<f>lag" +
	  "\n<h>elp\t\t\t<i>nfo\t\t<o>ptions\n<p>asswd\t\t<q>uit\t\t" +
	  "<r>eminder\n<s>ecret\t\t<t>erm\t\te<x>press\n<z>apall\n\n",
    cConfPrompt: "\nChange config -> ",
    //	----++++****====userConfig methods====****++++----
    /*
     * summary:
     *	menu choice response for user configuration options
     */
    reConfigure: function () {
	var stillAlahv = true, uResponse = null;


	while (stillAlahv) {
	    console.putmsg(yellow + high_intensity + this.cConfPrompt);
	    uResponse = console.getkey();

	    switch (uResponse) {
		case 'i':
		    //change user info
		    userSettings.info = userRecords.userDataUI.getInfo();
		    try {
			userRecords.userDataIO.saveSettings(user.number,
			      userSettings);
			// next line will not execute if there is an exception
			// while saving
			console.putmsg(green + high_intensity + "User info " +
			      "updated.\n\n");
		    } catch (e) {
			console.putmsg(red + "Exception saving settings: "
			      + e.toString() + "\n");
		    }
		    break;
		case 'q':
		case ' ':
		    //quit out of here
		    stillAlahv = false;
		    break;
		case '?':
		    //help--derp
		    console.putmsg(green + high_intensity + this.cMenu);
		    break;
		default:
		    console.putmsg(excuse);
		    break;
	    }

	}

    }

}
