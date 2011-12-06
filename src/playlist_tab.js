/*\
|********************
|* Playlist tab
|* this is where the user goes when they want to remove a song from the current playlist, to load a preset playlist or to save the current playlist for later usage
|********************
\*/

Ext.reg('playlist_tab', Ext.extend(Ext.Container, {
        title: 'Playlist',
        iconCls: 'action',
        cls: 'playlist_panel',
	width: '100%',
	layout: {
		type: 'vbox',
		align: 'stretch'
	},
	items:
	[
		
		{
			flex:1,
			html: 'Play List',
			bodyStyle:'padding:15px;',
			
		},
		new Ext.Container({
			layout: {
				type: 'hbox',
				align: 'center'
			},
			items:
			[
				{	//the button that launches the form that lets the user load a saved playlist
					xtype: 'button',
					text : 'Manage Playlists',
					flex:1,
					listeners: {
						click: {
							element: 'el',
							fn: function(){
								Ext.getCmp('playlist_manager').show();
							}
						}
					}
				}
			]
		}),
		playlist_list = new Ext.List({	//the list of songs in the current playlist, allows the user to select multiple songs so they can remove them if they so desire
			flex: 5,
			itemTpl : '{Title}<div style="font-size:50%;">{Artist}</div>',
			grouped : false,
			indexBar: false,
			multiSelect: true,
			simpleSelect:true,
			store: 'playlist'
		}),
		new Ext.Container({
			layout: {
				type: 'hbox',
				align: 'center'
			},
			items:
			[
				{	//the button that removes the selected song(s)
					xtype: 'button',
					text : 'Clear',
					flex:1,
					listeners: {
						click: {
							element: 'el',
							fn: function(){

								
								Ext.Ajax.request({//send the request with the new time
									url: './action.php?action=clear_playlist'
								});
							}
						}
					}
				},
				{	//the button that removes the selected song(s)
					xtype: 'button',
					text : 'Remove',
					flex:1,
					listeners: {
						click: {
							element: 'el',
							fn: function(){

								//get the list of songs and pack it as a JSON string send it to the server to be removed
								var records = playlist_list.getSelectedRecords();
								if(records.length < 1)
									return;
								var songs = [];
								for(var i = 0; i<records.length; i++){
									songs.push(records[i].data.Id)
								}
								Ext.Ajax.request({//send the request with the new time
									url: './action.php?action=remove_songs',
									params:{
										songs:Ext.encode(songs)
									}
								});
							}
						}
					}
				}

			]
		}),

		
	]
}));
