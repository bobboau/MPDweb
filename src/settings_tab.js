/*\
|********************
|* Settings tab
|* for changing some of the MPD server's less often changed settings
|********************
\*/


Ext.reg('settings_tab', Ext.extend(Ext.form.FormPanel, {

        title: 'Settings',
        iconCls: 'settings',
        cls: 'settings_panel',
	width: '100%',
	layout: {
		type: 'vbox',
		align: 'stretch'
	},
	items:
	[
		
		{
			flex:1,
			html: 'Settings',
			bodyStyle:'padding:15px;',
			
		},
		{
			label:'Random',
			labelAlign:'left',
			labelWidth:'50%',
			id:'settings_random',
			xtype:'checkboxfield',
			listeners: {
				check: {
					//element: 'el',
					fn: function(){
						if(this.initted && !this.updated_action){
							Ext.Ajax.request({
								url: './action.php?action=set_random',
								params:{
									value:1
								}
							});
						}
						this.initted = true;
					}
				},
				uncheck: {
					//element: 'el',
					fn: function(){
						if(this.initted && !this.updated_action){
							Ext.Ajax.request({
								url: './action.php?action=set_random',
								params:{
									value:0
								}
							});
						}
						this.initted = true;
					}
				}
			}
		},
		{
			label:'Repeat',
			labelAlign:'left',
			labelWidth:'50%',
			id:'settings_repeat',
			xtype:'checkboxfield',
			listeners: {
				check: {
					//element: 'el',
					fn: function(){
						if(this.initted && !this.updated_action){
							Ext.Ajax.request({
								url: './action.php?action=set_repeat',
								params:{
									value:1
								}
							});
						}
						this.initted = true;
					}
				},
				uncheck: {
					//element: 'el',
					fn: function(){
						if(this.initted && !this.updated_action){
							Ext.Ajax.request({
								url: './action.php?action=set_repeat',
								params:{
									value:0
								}
							});
						}
						this.initted = true;
					}
				}
			}
		},
		{
			label:'Crossfade',
			labelAlign:'top',
			labelWidth:'100%',
			id:'settings_crossfade',
			xtype:'spinnerfield',
			minValue: 0,
			incrementValue: 1,
			cycle: false,
			listeners: {
				spin: {
					fn: function(me, new_val){
						//oh, why couldnt they add some way to tell if this was a user generated change
						if(this.initted && !this.updated_action){
							Ext.Ajax.request({
								url: './action.php?action=set_crossfade',
								params:{
									value:new_val
								}
							});
						}
						this.initted = true;
					}
				}
			}
		}
		
	]
}));
