/*\
|********************
|* Library tab
|* here the user can look through all of the files they have in MPD and send some of them off to the current playlist, 
|* or tell MPD to play a song without having to worry about if it is in a playlist at all. directory listing allow the user to
|* find the song they want without haveing to scroll through over nine thousand songs
|********************
\*/


Ext.reg('library_tab', Ext.extend(Ext.Container, {

	title: 'Library',
	iconCls: 'bookmarks',
	cls: 'library_panel',
	width: '100%',
	layout: {
		type: 'vbox',
		align: 'stretch'
	},
	items:
	[
		
		{
			flex:1,
			html: 'Library',
			bodyStyle:'padding:15px;',
			
		},
		new Ext.NestedList({	//the list control that has every song that MPD knows about
			id : 'library_list',
			flex: 5,
			ui  : 'small',
			//fullscreen: true,
			displayField: 'name',
			// add a / for folder nodes in title/back button
			getTitleTextTpl: function() {
				return '{name}<tpl if="leaf !== true">/</tpl>';
			},
			// add a / for folder nodes in the list
			getItemTextTpl: function() {
				return '<h2 style="font-size:70%;">{name}<tpl if="leaf !== true">/</tpl></h2>';
			},
			getDetailCard: function(record, parentRecord) {
				return new Ext.Container({
					layout: {
						type: 'vbox',
						align: 'center'
					},
					items:[
						{	//the button that adds the selected song(s) to the playlist
							xtype: 'button',
							text : 'Add to Playlist',
							ui  : 'small',
							listeners: {
								click: {
									element: 'el',
									fn: function(){

										//get the list of songs and pack it as a JSON encoded string
									    	Ext.Ajax.request({
											url: './update.php?get=songs',
											params:{
												find:encodeURI(record.id)
											},
											success: function(response) {
												var songs = Ext.decode(response.responseText);
												songs = songs['songs'];
												var list = [];
												for(var i = 0; i<songs.length; i++){
													list.push(songs[i].file);
												}
												Ext.Ajax.request({//send the request with the new time
													url: './action.php?action=add_songs',
													params:{
														songs:Ext.encode(list)
													},
													success: function(response){
														Ext.getCmp('library_list').onBackTap();
													}

												});

											}
										})
									}
								}
							}
						},
						new Ext.Container({
							layout: {
								type: 'card',
								align: 'center'
							},
							flex:1,
							scroll:'vertical',
							ui:'small',
							html:'<div id="add_songs_display_'+record.id+'">Loading...</div>'
						})

					]
				})
			},
			store: 'library'
		})				
	]
}));
