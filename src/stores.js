

/******\
|* 
|* Models, these are used to define the format of the data in the stores which are defined below
|* these are not as importaint as they would be in a normal database backed application because they are not representing database fields
|* 
\******/




/*\
|* model defining a directory
|* this is used to define the library directory structure
\*/
Ext.regModel('Dir', 
{
	idProperty: 'file',
	fields: [
		{name:"name",	type:"text"}, //displaid name
		{name:"file",	type:"text"}  //file system name
						//these will differ at leaves were the name will be the song title and the file will be the file name
	]
});

/*\
|* model defining a song
|* this is used to define the current playlist and library leafs
\*/
Ext.regModel('Song', 
{
	idProperty: 'Id',
	fields: [
		{name:'file', 	type:'string'},
		{name:'Time', 	type:'string'},
		{name:'Artist',	type:'string'},
		{name:'Composer',type:'string'},
		{name:'Title', 	type:'string'},
		{name:'Album', 	type:'string'},
		{name:'Track', 	type:'string'},
		{name:'Genre', 	type:'string'},
		{name:'Disc', 	type:'string'},
		{name:'Name', 	type:'string'},
		{name:'Date', 	type:'string'},
		{name:'Pos', 	type:'number',	useNull:true},
		{name:'Id', 	type:'number',	useNull:true}
	]
});





/*\
|* model defining a saved playlist
|* note that playlists are the file names of the playlist MPD does not provide access to the contents of the playlist files
\*/
Ext.regModel('Playlists', 
{
	fields: [
		{name:'playlist', 	type:'string'}
	]
});














/******\
|* 
|* the stores, these are intermediary caches of data, 
|* the cool thing is when you update them they automaticaly update the controls that are subscribed to them
|* YAY observer patern!
|* 
\******/



/*\
|* Store for the big list of all songs
|* this store should only load the data needed when it is needed, which is good cause it is gargantuan
\*/

Ext.StoreMgr.register(new Ext.data.TreeStore({
	storeId : 'library',
	model  : 'Dir',
	proxy: {
		type: 'ajax',
		url : './update.php?get=library',
		reader: {
		    type: 'tree',
		    root: 'library'
		}
	},
	autoLoad: false

}))





/*\
|* store used by the loading and saveing dialogs
|* lists all exsisting saved playlists
\*/

Ext.StoreMgr.register(new Ext.data.JsonStore({
	storeId : 'playlists',
	model  : 'Playlists',
	sorters: 'playlist',

	proxy: {
		type: 'ajax',
		url : './update.php?get=playlists',
		reader: {
		    type: 'json',
		    root: 'playlists'
		}
	},
	autoLoad: true

}));






/*\
|* store used to hold the state of the current playlist
\*/

Ext.StoreMgr.register(new Ext.data.JsonStore({
	storeId : 'playlist', 
	model  : 'Song',
	sorters: 'Pos',

	proxy: {
		type: 'ajax',
		url : './update.php?get=playlist',
		reader: {
		    type: 'json',
		    root: 'playlist'
		}
	},
	autoLoad: true

}));



