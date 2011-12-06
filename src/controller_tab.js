/*\
|********************
|* Controller tab
|* funnest tab in the app, allows you to do such esoteric things as start playing a song, stop playing a song, change the volume or skip that MP3 of the Inquasition Song from History of the World: Part One that you got cause it was catchy and you thought i was funny at the time but you really don't want to listen to it very often but you still don't want to get rid of it cause it _is_ a funny song, you just don't get many opertunities to play it
|* this will be the most used tab of the whole app so it had better look good and it better 'work'
|********************
\*/

Ext.reg('controller_tab', Ext.extend(Ext.Container, {
        title: 'Controller',
	xtype:'container',
        id: 'tab3',
        iconCls: 'arrow_right',
        cls: 'controller_panel',
	width: '100%',
	monitorOrientation:true,
	listeners: {
		orientationchange: {//change the orientation of the main split in this tab so the two main parts are next to each other rather than on top of each other
			fn: function(me, orientation){
				if(me.last_orient != orientation){
					setTimeout(function(){
						if(orientation == 'landscape'){
							me.layout.orientation = 'horizontal';
						}else{
							me.layout.orientation = 'vertical';
						}
						setTimeout(function(){
							me.doComponentLayout();
						}, 100);
						me.last_orient = orientation;
					}, 100);
				}
			}
		}
	},
	layout: {
		type: (Ext.getOrientation()=='landscape')?'hbox':'vbox',
		align: 'stretch'
	},
	items:
	[
		new Ext.Container({
			flex:1,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:
			[
				{
					flex: 4,
					bodyStyle:'padding:15px;',
					id:'controller_now_playing_song_title',
					html:'<h1 id="current_playing_song_title">Song Title</h1><h3 id="current_playing_song_artist" style="font-size:50%;">Artist</h3>'
				},
				{	//this is a small list of the currently playing songs, this allows the user to scroll through the current playlist and nab the song they want without haveing to switch tabs or go through a search proccess
					xtype : 'list',
					flex: 7,
					title: 'Current Playlist',
					itemTpl : '{Title}<div style="font-size:50%;">{Artist}</div>',
					grouped : false,
					indexBar: false,
					multiSelect: false,
					store: 'playlist',
					listeners: {
						itemtap: {
							fn: function(list, idx){
								Ext.Ajax.request({//send the request with the new time
									url: './action.php?action=change_song',
									params:{
										song_idx:list.store.getAt(idx).data.Pos
									}
								});
								setTimeout(function(){list.deselect(idx);},100);
							}
						}
					}
				}
			]
		}),
		new Ext.Container({
			flex:1,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:
			[
				new Ext.Container({
					flex:4,
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items:
					[
						{xtype: 'spacer'},
						new Ext.Container({
							flex:30,
							layout: {
								type: 'vbox',
								align: 'stretch'
							},
							items:
							[
								{	//the stop button
									xtype: 'button',
									text : 'Stop',
									icon: 'img/blank.png',
									flex:3,
									listeners: {
										click: {
											element: 'el',
											fn: function(){ 
												Ext.Ajax.request({
													url: './action.php?action=stop'
												});
											}
										}
									}
								},
								{xtype: 'spacer'},
								{	//skip back to the last song that was playing
									xtype: 'button',
									text : 'Prev',
									icon: 'img/rewind.png',
									flex:3,
									listeners: {
										click: {
											element: 'el',
											fn: function(){ 
												Ext.Ajax.request({
													url: './action.php?action=back'
												});
											}
										}
									}
								}
							]
						}),
						{xtype: 'spacer'},
						new Ext.Container({
							flex:30,
							layout: {
								type: 'vbox',
								align: 'stretch'
							},
							items:
							[
								{	//play button, probly the most importaint button in the whole app
									id: 'play_button',
									xtype: 'button',
									text : 'Play',
									icon: 'img/play.png',
									flex:3,
									listeners: {
										click: {
											element: 'el',
											fn: function(){ 
												Ext.Ajax.request({
													url: './action.php?action=play'
												});
											}
										}
									}
								},
								{xtype: 'spacer'},
								{	//skip, move on to the next song
									xtype: 'button',
									text : 'Skip',
									icon: 'img/fforward.png',
									flex:3,
									listeners: {
										click: {
											element: 'el',
											fn: function(){ 
												Ext.Ajax.request({
													url: './action.php?action=skip'
												});
											}
										}
									}
								}
							]
						}),
						{xtype: 'spacer'}
				
					]
				}),
				{
					flex:1,
					cls:'label',
					html:'Seek'
				},
				{	//seek bar, lets the user set the point in the song that is currently playing
					id:'seek_slider',
					xtype:'sliderfield',
					flex:2,
					hideLabel:true,
					width: 200,
					value: 50,
					increment: 1,
					minValue: 0,
					maxValue: 1000,
					//layoutOnOrientationChange:true,
					listeners: {
						change: {
							fn: function(slider, thumb, newValue, oldValue){
								//oh, why couldnt they add some way to tell if this was a user generated change
								if(this.initted && !this.updated_action){
									Ext.Ajax.request({//send the request with the new time
										url: './action.php?action=set_seek',
										params:{
											time:(newValue)
										}
									});
								}
								this.initted = true;
							}
						}
					}
				},
				{
					flex:1,
					cls:'label',
					html:'Volume'
				},
				{	//volume bar, lets the user change the volume
					id:'volume_slider',
					xtype:'sliderfield',
					flex:2,
					hideLabel:true,
					width: 200,
					value: 0,
					increment: 1,
					minValue: 0,
					maxValue: 100,
					//layoutOnOrientationChange:true,
					listeners: {
						change: {
							fn: function(slider, thumb, newValue, oldValue){
								//oh, why couldnt they add some way to tell if this was a user generated change
								if(this.initted && !this.updated_action){
									Ext.Ajax.request({//send the request with the new volume
										url: './action.php?action=set_volume',
										params:{
											volume:newValue
										}
									});
								}
								this.initted = true;
							}
						}
					}
				}
			]
		})

	]
	
}));
