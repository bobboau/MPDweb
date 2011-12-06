/*\
|* manage playlist form
|* allows the user to save the current playlist load a previusly saved playlist or delete previusly saved playlist
\*/
Ext.reg('playlist_management_form', Ext.extend(Ext.form.FormPanel, {
	autoRender: true,
	floating: true,
	modal: true,
	centered: true,
	hideOnMaskTap: false,
	url: './action.php?action=save_playlist',
	items: [
		{
			xtype : 'list',
			id : 'playlist_manager_list',
			title: 'Current Playlist',
			itemTpl : '{playlist}',
			grouped : false,
			indexBar: false,
			multiSelect: true,
			simpleSelect:true,
			width: 300,
			store : 'playlists'
		}
	],
	dockedItems:
	[{	//the buttons at the top of the form
		xtype: 'toolbar',
		dock: 'top',
		items: [
	                {	//hides the form and does nothing
	                    text: 'Back',
	                    ui: 'back',
	                    handler: function() {
	                        Ext.getCmp('playlist_manager').hide();
	                    }
	                },
			{xtype: 'spacer'},
	                {	//deletes the selected playlist(s)
				text: 'Delete Selected',
				ui: 'decline',
				handler: function() {
					var records = Ext.getCmp('playlist_manager_list').getSelectedRecords();
					if(records.length < 1)
						return;
					var playlists = [];
					var playlist_names = '';
					for(var i = 0; i<records.length; i++){
						playlists.push(records[i].data.playlist);
						if(i>0)playlist_names += ', ';
						playlist_names += records[i].data.playlist;
					}

					Ext.Msg.confirm("Confirmation", "Are you sure you want to permanently delete ("+playlist_names+")?", function(btn){
						if(btn != 'yes')
							return;

						Ext.Ajax.request({//send the request with the selected playlists encoded in a JSON string
							url: './action.php?action=delete_playlist',
							params:{
								playlists:Ext.encode(playlists)
							},
							success: function(msg){
								Ext.getStore('playlists').load();
							},
							failure: function(msg){
								alert( 'Deleteing of playlist failed: '+msg.reason+"\nparameters: "+msg.parameters );
							}
						});
					})
				}
			}
		]},
		{	//the buttons at the bottom of the form
		xtype: 'toolbar',
		dock: 'bottom',
		items: [
	                {	//sends the server a message to save the current playlist with the name selected, will only work with one item selected
	                    text: 'Save as',
	                    ui: 'confirm',
	                    handler: function() {
					//use the selected name
					var records = Ext.getCmp('playlist_manager_list').getSelectedRecords();
					if(records.length < 1){
						alert('You need to have 1 play list selected to save as, if you don\'t have any selected then I won\'t know which one you want to overwrite');
					}else if(records.length > 1){
						alert('You need to have 1 play list selected to save as, if you have more than one selected I don\'t know which one you want me to overwrite');
					}else{
						//we have one and only one selected record, send it
						Ext.Msg.confirm("Confirmation", "Are you sure you want to overwrite '"+records[0].data.playlist+"'?", function(btn){
							if(btn != 'yes')
								return;

							Ext.Ajax.request({//send the request with the selected playlists encoded in a JSON string
								url: './action.php?action=save_playlist',
								params:{
									playlist:records[0].data.playlist
								},
								success: function(msg){
									Ext.getStore('playlists').load();
								},
								failure: function(msg){
									alert( 'saveing of playlist failed: '+msg.reason+"\nparameters: "+msg.parameters );
								}
							});
						});
					}
				}
	                },
	                {	//prompts user for new name and saves
				text: 'Save New',
				ui:'action',
				handler: function() {
					Ext.Msg.prompt('Playlist', 'Please enter a name you want to save the current playlist as:', function(btn, text) {
						if(btn != 'cancel'){
							Ext.Ajax.request({//send the request with the selected playlists encoded in a JSON string
								url: './action.php?action=save_playlist',
								params:{
									playlist:text
								},
								success: function(msg){
									Ext.getStore('playlists').load();
								},
								failure: function(msg){
									alert( 'saveing of playlist failed: '+msg.reason+"\nparameters: "+msg.parameters );
								}
							});
						}
					});
				}
	                },
			{xtype: 'spacer'},
	                {	//replace the current playlist with the playlist(s) specified
	                    text: 'Load Selected',
	                    ui: 'confirm',
	                    handler: function() {

					var records = Ext.getCmp('playlist_manager_list').getSelectedRecords();
					if(records.length < 1)
						return;
					var playlists = [];
					for(var i = 0; i<records.length; i++){
						playlists.push(records[i].data.playlist);
					}

					Ext.Ajax.request({//send the request with the selected playlists encoded in a JSON string
						url: './action.php?action=load_playlist',
						params:{
							playlist:Ext.encode(playlists)
						},
						success: function(msg){
							Ext.getStore('playlists').load();
						},
						failure: function(msg){
							alert( 'saveing of playlist failed: '+msg.reason+"\nparameters: "+msg.parameters );
						}
					});
	                    }
	                }

		]
	}]



}));
