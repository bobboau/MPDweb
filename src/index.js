/*\
|****************************************************************************************************************
|* 
|* MPDweb
|* 
|* an AJAX based MPD client optomized for smart phones
|* developed with the open source Sencha Touch ( http://www.sencha.com/products/touch/ ) Rich Web App framework
|* currently only works under webkit based browsers
|* fortunately the vast majority of smartphone browsers are webkit based
|* 
|****************************************************************************************************************
\*/


/******\
|* 
|* Main setup function, sets up the controls of the app and initalises all the event handelers, and finaly starts the poller
|* There is a popup form interface for manageing playlists defined initialy before the 'main' interface which at it's highest level is a TabPannel, all of the tabs are defined in seperate files.
|* 
\******/
var tabpanel = null;

Ext.setup({
    icon: 'icon.png',
    tabletStartupScreen: 'tablet_startup.png',
    phoneStartupScreen: 'phone_startup.png',
    glossOnIcon: false,
    onReady: function() {

	//application globals
	var play_button = null;
	var playlist_list = null;
	var library_list = null;

	var playlist_manager = Ext.create({id:'playlist_manager', xtype:'playlist_management_form'});




	/*\
	|* main tab structure
	|* setup the main controls of the application
	\*/
        tabpanel = new Ext.TabPanel({
		//we want the main navigation on the bottom (closer to the thumbs)
            tabBar: {
                dock: 'bottom',
                layout: {
 			type: 'hbox',
			pack: 'center'
                }
            },
		//this is the whole interface, fill up the screen
            fullscreen: true,
            ui: 'light',
	    animScroll: false,
		layout: {
			type: 'card',
			pack: 'center'
		},
            cardSwitchAnimation: {
                type: 'slide',
                cover: true
            },


	/*\
	|* here are the tabs
	\*/
            items: [



		/*\
		|********************
		|* Controller tab
		|* funnest tab in the app, allows you to do such esoteric things as start playing a song, stop playing a song, change the volume or skip that MP3 of the Inquasition Song from History of the World: Part One that you got cause it was catchy and you thought i was funny at the time but you really don't want to listen to it very often but you still don't want to get rid of it cause it _is_ a funny song, you just don't get many opertunities to play it
		|* this will be the most used tab of the whole app so it had better look good and it better 'work'
		|********************
		\*/
		{id:'controller_tab', xtype:'controller_tab'},



		/*\
		|********************
		|* Playlist tab
		|* this is where the user goes when they want to remove a song from the current playlist, to load a preset playlist or to save the current playlist for later usage
		|********************
		\*/
		{id:'playlist_tab', xtype:'playlist_tab'},



		/*\
		|********************
		|* Library tab
		|* here the user can look through all of the files they have in MPD and send some of them off to the current playlist, 
		|* or tell MPD to play a song without having to worry about if it is in a playlist at all. directory listing allow the user to
		|* find the song they want without haveing to scroll through over nine thousand songs
		|********************
		\*/
		{id:'library_tab', xtype:'library_tab'},



		/*\
		|********************
		|* settings tab
		|* a place for the less commonly accessed features of MPD, things like random replay, repete, crossfadeing can be configured here
		|********************
		\*/
		{id:'settings_tab', xtype:'settings_tab'}]
        });



        Ext.getCmp('library_list').on('leafitemtap', function(subList, subIdx, el, e, detailCard) {
            var ds = subList.getStore(),
                r  = ds.getAt(subIdx);

            Ext.Ajax.request({
                url: './update.php?get=songs',
		params:{
			find:encodeURI(r.get('file'))
		},
                success: function(response) {
			var songs = Ext.decode(response.responseText);
			songs = songs['songs'];
			var html = '';
			for(var i = 0; i<songs.length; i++){
				var song = songs[i];
				if(song.title == '')
					song.title = song.file;
				html += '<h1 style="padding:10px;border-bottom-style:solid;font-size:50%;color:#000;">'+song.Title+'</h1>';
			}
			var disp = Ext.get('add_songs_display_'+r.get('file'))
			disp.setHTML(html);
                },
                failure: function(msg) {
                    detailCard.setValue("Loading failed.");
                }
            });
        });	

	

	/******\
	|* 
	|* Polling
	|*
	|* If only websockets was widely available at the time I was writing this...
	|* The only way to keep MPDweb up to date with the server is for the client to constaintly ask "anything new yet? anything new yet? anything new yet?"
	|* This is not the best possible implementation, but Commet is hard enough to do when you have the right tools and all I have to work with here is PHP.
	|* Because this app is intended to have one (local network) server with at most half a dozen (local network) clients (I would bet this almost never gets two active users, 
	|* except when the one guy who owns the server is trying to show it off to his friends) this should not have to scale much, so polling should work well for what we are doing here.
	|* 
	|* Now, even though we are dealing with the local network and a small number of clients we still don't want to go nuts with huge amounts of data flying around,
	|* we are going to have bad enough latency issues without dumping every bit of info MPD might know about multiple times a second. so we need a way to figure out what needs to be 
	|* updated and update only that. the answer? take the major components, perform an MD5 hash on their concatenated values and then send those hashes to the server, the server performs 
	|* the same operation on it's data set and if the data is the same then the MD5s should be the same, if one of them is different the server will respond with the updated data, 
	|* which then gets sent to the correct store.
	\******/



	/*\
	|* this function performs one poll operation, then once it completes it makes any needed updates, then it set's it's self up to be called some fraction of a second later
	\*/
	function poll() {


		/*\
		|* turns a data store into a ...keyvaluekeyvalue... concatonated string
		\*/
		function data_concat(data){
			var ret = '';
			var records = data.getRange();
			var count = records.length;

			for(var i = 0; i<count; i++){
				var record = records[i].data;
				var keys = [];
				for(key in record){
					keys.push(key);
				}
				keys.sort();
				for(var j = 0; j<keys.length; j++){
					var key = keys[j];
					var value = record[key];
					if(value !== '' && value !== null)
						ret+=key+value;
				}
			}

			return ret;
		}

		var playlist_store = Ext.getStore('playlist');

		//if the store has no hash made up make one
		//the player is always in need of updates, so dont waist time on calculating that
		if(!playlist_store.md5)
			playlist_store.md5 = MD5(data_concat(playlist_store));

		Ext.Ajax.request({
			url: './update.php?get=playlist|player',
			success: function(response){ 

				try{
					//make any needed updates
					var updates = Ext.decode(response.responseText);

					//if a store needed updates then update it and recalculate it's new hash
					if(updates.playlist){
						playlist_store.loadData(updates.playlist, false);
						playlist_store.md5 = MD5(data_concat(playlist_store));
					}
					if(updates.player){
						var playback = updates.player.playback;
						var seek_slider = Ext.getCmp('seek_slider');
						var volume_slider = Ext.getCmp('volume_slider');
						var play_button = Ext.getCmp('play_button');
						var settings_random = Ext.getCmp('settings_random');
						var settings_repeat = Ext.getCmp('settings_repeat');
						var settings_crossfade = Ext.getCmp('settings_crossfade');

						if(!playback)//sainity values
							playback = {Title:"", Artist:"", Time:1};
						Ext.get('current_playing_song_title').setHTML(playback.Title);
						Ext.get('current_playing_song_artist').setHTML(playback.Artist);
						volume_slider.updated_action = true;
						volume_slider.setValue(updates.player.volume);
						volume_slider.updated_action = false;
						seek_slider.updated_action = true;
						seek_slider.maxValue = parseFloat(playback.Time);
						seek_slider.setValue(parseFloat(updates.player.time));
						seek_slider.updated_action = false;

						if(updates.player.state == "play"){
							play_button.setText('Pause');
							play_button.setIcon('img/pause.png');
						}else{
							play_button.setText('Play');
							play_button.setIcon('img/play.png');
						}

						settings_random.updated_action = true;
						if(updates.player.random == 1)
							settings_random.check();
						else
							settings_random.uncheck();
						settings_random.updated_action = false;

						settings_repeat.updated_action = true;
						if(updates.player.repeat == 1)
							settings_repeat.check();
						else
							settings_repeat.uncheck();
						settings_repeat.updated_action = false;

						settings_crossfade.updated_action = true;
						settings_crossfade.setValue(updates.player.xfade);
						settings_crossfade.updated_action = false;
					}
				}
				catch(err){
					alert("Error: "+err.description);
				}

				//try again
				setTimeout(function(){poll();}, 500);
			},
			failure: function(response){
				//try again
				setTimeout(function(){poll();}, 500);
			},
			params:{
				playlist:playlist_store.md5
			}
		});
	}


	/*\
	|********************
	|* Start the Poller!
	|********************
	\*/
	poll();

    }
});





























//need this to check if any changes are on the server without transmitting a gargantuane amount of data

/**
*
*  MD5 (Message-Digest Algorithm)
*  http://www.webtoolkit.info/
*
**/
 
var MD5 = function (string) {
 
	function RotateLeft(lValue, iShiftBits) {
		return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
	}
 
	function AddUnsigned(lX,lY) {
		var lX4,lY4,lX8,lY8,lResult;
		lX8 = (lX & 0x80000000);
		lY8 = (lY & 0x80000000);
		lX4 = (lX & 0x40000000);
		lY4 = (lY & 0x40000000);
		lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
		if (lX4 & lY4) {
			return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		}
		if (lX4 | lY4) {
			if (lResult & 0x40000000) {
				return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
			} else {
				return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
			}
		} else {
			return (lResult ^ lX8 ^ lY8);
		}
 	}
 
 	function F(x,y,z) { return (x & y) | ((~x) & z); }
 	function G(x,y,z) { return (x & z) | (y & (~z)); }
 	function H(x,y,z) { return (x ^ y ^ z); }
	function I(x,y,z) { return (y ^ (x | (~z))); }
 
	function FF(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function GG(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function HH(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function II(a,b,c,d,x,s,ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};
 
	function ConvertToWordArray(string) {
		var lWordCount;
		var lMessageLength = string.length;
		var lNumberOfWords_temp1=lMessageLength + 8;
		var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
		var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
		var lWordArray=Array(lNumberOfWords-1);
		var lBytePosition = 0;
		var lByteCount = 0;
		while ( lByteCount < lMessageLength ) {
			lWordCount = (lByteCount-(lByteCount % 4))/4;
			lBytePosition = (lByteCount % 4)*8;
			lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
			lByteCount++;
		}
		lWordCount = (lByteCount-(lByteCount % 4))/4;
		lBytePosition = (lByteCount % 4)*8;
		lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
		lWordArray[lNumberOfWords-2] = lMessageLength<<3;
		lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
		return lWordArray;
	};
 
	function WordToHex(lValue) {
		var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
		for (lCount = 0;lCount<=3;lCount++) {
			lByte = (lValue>>>(lCount*8)) & 255;
			WordToHexValue_temp = "0" + lByte.toString(16);
			WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
		}
		return WordToHexValue;
	};
 
	function Utf8Encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	};
 
	var x=Array();
	var k,AA,BB,CC,DD,a,b,c,d;
	var S11=7, S12=12, S13=17, S14=22;
	var S21=5, S22=9 , S23=14, S24=20;
	var S31=4, S32=11, S33=16, S34=23;
	var S41=6, S42=10, S43=15, S44=21;
 
	string = Utf8Encode(string);
 
	x = ConvertToWordArray(string);
 
	a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
 
	for (k=0;k<x.length;k+=16) {
		AA=a; BB=b; CC=c; DD=d;
		a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
		d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
		c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
		b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
		a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
		d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
		c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
		b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
		a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
		d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
		c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
		b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
		a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
		d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
		c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
		b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
		a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
		d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
		c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
		b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
		a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
		d=GG(d,a,b,c,x[k+10],S22,0x2441453);
		c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
		b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
		a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
		d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
		c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
		b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
		a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
		d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
		c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
		b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
		a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
		d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
		c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
		b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
		a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
		d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
		c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
		b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
		a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
		d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
		c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
		b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
		a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
		d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
		c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
		b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
		a=II(a,b,c,d,x[k+0], S41,0xF4292244);
		d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
		c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
		b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
		a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
		d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
		c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
		b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
		a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
		d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
		c=II(c,d,a,b,x[k+6], S43,0xA3014314);
		b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
		a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
		d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
		c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
		b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
		a=AddUnsigned(a,AA);
		b=AddUnsigned(b,BB);
		c=AddUnsigned(c,CC);
		d=AddUnsigned(d,DD);
	}
 
	var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
 
	return temp.toLowerCase();
}
