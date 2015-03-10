/*
 * by: Damon Getsman
 * contributing/refactoring also by: @Ntwitch (github.com)
 * started: 26Jan15
 * alpha phase: 28Feb15
 * beta phase:
 * finished:
 *
 * This file is for any of the functionality that I still need to work on that
 * will rely on per-room record keeping, settings, etc.  Functionality such as
 * room info, zapped rooms, etc, will be handled from within this particular
 * code snippet.
 */

roomData = {
  //properites
  userDir : system.data_dir + "user/",

  //sub-objects
  roomRecords : {
    //--++==**properties**==++--
    //userDir : system.data_dir + "user/",
    //just access this.userDir from nao on
    roomSettingsFilename : "docrooms",
    maxInfoLines: 160,
 
    //--++==**methods**==++--

    defaultSettings : function() {
	//basically just for new/undefined rooms
	var settings = {
	  moderator : "none set",
	  info : []
	}
    }
  },
  userRoomSettings : {
	//this will include more than just zapped rooms for now, but we're
	//just going to handle that for the time being
	userRoomSettingsFilename : "userrooms",

	defaultSettings : function() {
		var roomList = {
		  zRooms : []
		}
	}
  },
  fileIO : {
    //getting and setting the different shit above
    //--++==**properties**==++--
    roomRecFilename : this.userDir + 
		      roomRecords.roomSettingsFilename,
    userZapRecFilename : this.userDir + 
			 userRoomSettings.userRoomSettingsFilename,

    //--++==**methods**==++--
    snagRoomInfoBlob : function() {
	var roomInfoFile = new File(roomData.userDir + 
		roomData.roomRecords.roomSettingsFilename);
	var chunky;

	if (!file_exists(roomInfoFile.name)) {
	  //create a dummy file
	} else {
	  try {
	    roomInfoFile.open("r");
	  } catch (e) {
	    roomInfoFile.close();
	    throw new dDocException("Exception opening " + roomInfoFile.name,
		e.message, 1);
	  }

	  if (roomInfoFile == null || !roomInfoFile.is_open) {
	    if (userSettings.debug.file_io) {
		console.putmsg(red + "Unable to open roomInfoFile\n");
	    }
	    throw new dDocException("Exception w/roomInfoFile", 
		"Unable to open roomInfoFile (despite good return)", 2);
	  }

	  roomInfoFile = userRecords.userDataIO.stripComments(roomInfoFile);

	  try {
	    chunky = roomInfoFile.read();	//watch out for max len here
	  } catch (e) {
	    if (userSettings.debug.file_io) {
		console.putmsg(yellow + "Unable to read roomInfoFile\n");
	    }
	    throw new dDocException("Exception reading roomInfoFile",
		"Unable to do roomInfoFile.read(): " + e.message, 3);
	  } finally {
	    roomInfoFile.close();
	  }

	  if ((chunky == null) || (chunky.length < 30)) {
	    throw new dDocException("Exception: blob too small/null",
		"blob null or length < 30", 4);
	  }

	  chunky = JSON.parse(chunky);

	  //any more testing here?
	  return chunky;

	}
  }

}

