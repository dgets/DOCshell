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

roomRecords = {
  //--++==**properties**==++--
  userDir: system.data_dir + "user/",
  settingsFilename: "docrooms",
  maxInfoLines: 160,
 
  //--++==**methods**==++--

  defaultSettings : function() {
	//basically just for new/undefined rooms
	var settings = {
	  moderator : "none set",
	  info : []
	}
},
userRoomSettings = {
	//this will include more than just zapped rooms for now, but we're
	//just going to handle that for the time being
	var roomList = {
	  zrooms : []
	}
}

