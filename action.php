<?PHP

/*
 * AJAX wraper script for the Net_MPD class
 * this script is for makeing changes to the MPD server, changing the song, setting the mode to play or stop, playlist manipulation, etc
 * note this is expected to be run from a secure environment and it does not interface with an actual database
 * so standard security measures are not as importaint, things like SQL injection are impossible because there is no SQL to inject into
 * this is NOT intended to be open to an unsecure network, it is intended to be operated from behind a secure firewall or a VPN tunnel
 * the action performed is in $_GET all perameters should be in $_POST
 */


/*
 * this returns JSON data, lets give it the right header
 */
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Fri, 28 May 1982 00:00:00 GMT');
header('Content-type: application/json');

/*
 * get the MDP object
 */

require_once('Net/MPD.php');

$MPD = new Net_MPD();

/*
 * first sanity check, an action needs to be defined, if it is not then this script will not know what to do
 */

if(!isset($_GET['action'])){
	echo '{"success": false, "reason":"no action defined"}';
}else{

	/*
	 * NET_MPD will throw errors so we need to catch them and report the failure
	 */

	try{

		/*
		 * this is fairly straight forward, map the action to the code that implements it
		 */

		switch($_GET['action']){


			/*
			 * play the current song
			 */
			case 'play':
				//if the state is 'stop' then we need to use play, otherwise we use pause
				$state = $MPD->Common->getStatus();
				$song = $state['song'];
				$state = $state['state'];

				//if passed a song to play, play that song
				if(isset($_POST['id'])){
					$MPD->Playback->playId($_POST['id']);
				}else if($state == 'stop'){
					//we must specify a song or it will default to the first in the list
					$MPD->Playback->play($song);
				}else{
					$MPD->Playback->pause();
				}
				echo '{"success": true}';
			break;



			/*
			 * stop the current song
			 */
			case 'stop':
				$MPD->Playback->stop();
				echo '{"success": true}';
			break;



			/*
			 * play the next song
			 */
			case 'skip':
				$MPD->Playback->nextSong();
				echo '{"success": true}';
			break;



			/*
			 * play the song before the current one
			 */
			case 'back':
				$MPD->Playback->previousSong();
				echo '{"success": true}';
			break;



			/*
			 * save the current playlist to the passed name
			 */
			case 'save_playlist':
				//MPD does not support overwriteing of playlists, so if one exsists already we need to delete it
				$playlists = $MPD->Playlist->getPlaylists();
				foreach($playlists as &$playlist){
					if($playlist == $_POST['playlist'])
						$MPD->Playlist->deletePlaylist($playlist);

				}
				//now we should be able to save the playlist
				$MPD->Playlist->savePlaylist($_POST['playlist']);
				echo '{"success": true}';
			break;



			/*
			 * set the volume
			 */
			case 'set_volume':
				$vol = (int)$_POST['volume'];
				if($vol<0)$vol=0;
				if($vol>100)$vol=100;
				$MPD->Playback->setVolume($vol);
				echo '{"success": true}';
			break;



			/*
			 * seek to the specified playback point
			 */
			case 'set_seek':
				$song = $MPD->Common->getStatus();
				$song = $song['song'];
				$MPD->Playback->seek((int)$song, (int)$_POST['time']);
				echo '{"success": true}';
			break;




			/*
			 * change the currently playing song to the song passed
			 */
			case 'change_song':
				$MPD->Playback->play((int)$_POST['song_idx']);
				echo '{"success": true}';
			break;




			/*
			 * remove the passed songs from the playlist
			 */
			case 'remove_songs':
				$songs = json_decode($_POST['songs']);
				foreach($songs as $song){
					$MPD->Playlist->deleteSongId($song);
				}
				echo '{"success": true}';
			break;



			/*
			 * clear theplaylist
			 */
			case 'clear_playlist':
				$MPD->Playlist->clear();
			break;



			/*
			 * delete playlists given by name
			 */
			case 'delete_playlist':
				$playlists = json_decode($_POST['playlists']);
				foreach($playlists as $playlist){
					$MPD->Playlist->deletePlaylist($playlist);
				}
				echo '{"success": true}';
			break;



			/*
			 * add the passed songs to the playlist
			 */
			case 'add_songs':
				$songs = json_decode($_POST['songs']);
				foreach($songs as $song){
					$MPD->Playlist->addSong($song);
				}
				echo '{"success": true}';
			break;



			/*
			 * set the random play state
			 */
			case 'set_random':
				$val =$_POST['value'];
				if($val<0)$val=0;
				if($val>1)$val=1;
				$MPD->Playback->random($val);
				echo '{"success": true}';
			break;



			/*
			 * set the repeat play state
			 */
			case 'set_repeat':
				$val =$_POST['value'];
				if($val<0)$val=0;
				if($val>1)$val=1;
				$MPD->Playback->repeat($val);
				echo '{"success": true}';
			break;



			/*
			 * set the crossfade play state
			 */
			case 'set_crossfade':
				$val = $_POST['value'];
				if($val<0)$val=0;
				$MPD->Playback->setCrossfade($val);
				echo '{"success": true}';
			break;



			/*
			 * load the passed playlists as the current one
			 * optional parameter 'append' should be set to true if you do not want to erase what is in the current playlist
			 */
			case 'load_playlist':
				//when the playlist changes MPD stops playback, but the user never tells it to do this, 
				//so lets work arround this by telling it to play after changeing if it was playing before
				$was_playing = $MPD->Common->getStatus();
				$was_playing = $was_playing['state'] == 'play';

				//MPD default behaviour is to append
				if(!isset($_POST['append']) || !$_POST['append']){
					$MPD->Playlist->clear();
				}

				
				$playlists = json_decode($_POST['playlist']);
				foreach($playlists as $playlist){
					//load the actual playlist
					$MPD->Playlist->loadPlaylist($playlist);
				}

				//play the music if it was playing before
				if($was_playing)
					$MPD->Playback->play();

				//return success
				echo '{"success": true}';
			break;



			/*
			 * handle unhandeled actions
			 */
			default:
				echo '{"success": false, "reason":"unrecognised action", "parameters":"';
				foreach($_POST as $key => $value){
					echo '['.$key.' => '.$value.']';
				}
				echo '"}';
		}



	} catch (Exception $e) {

		/*
		 * send a nicely formatted error responce
		 * add all info we might have gotten from NET_MPD
		 */

		$error = $MPD->Common->getErrorData();
	
		echo '{"success": false, "reason":"'.$e->getMessage().' | ';
		foreach($error as $key => $value){
			echo '['.$key.' => '.$value.']';
		}
		echo '", "parameters":"';
		foreach($_POST as $key => $value){
			echo '['.$key.' => '.$value.']';
		}
		echo '"}';
	}
}
?>
