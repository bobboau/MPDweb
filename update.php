<?PHP

//produces a concatanated version of the passed data
function get_sig($dump, $sort_key=null){
	$ret = '';
	if($sort_key){
		class cComp{
			function __construct($key){$this->sort_key = $key;}
			function __invoke($a, $b){return $a[$this->sort_key]<$b[$this->sort_key] ? -1 : 1;}  
			var $sort_key;
		};
		usort($dump, new cComp($sort_key));
	}
	foreach($dump as $song){
		ksort($song);
		foreach($song as $key=>$value){
			$ret.=$key.$value;
		}
	}
	return ($ret);
}



//builds a nested data tree out of the returned value from $MPD->Database->getAllInfo()
//it is structured to model the file directory higherarchy
function make_nested($info){

	$node = isset($_REQUEST['node']) ? $_REQUEST['node'] : 'root';
		
	$return = array();
	array_push($return, array("file"=>$node.'/', "name"=>'<div style="background-color:rgb(230,230,240)">All Contained Items</div>', "leaf"=>true));
	
	//return just the directories
	if($node == 'root'){		
		$dirs = $info['directory'];
		
		//get only the root level directories
		foreach($dirs as $dir){
			if(strpos($dir, '/') !== false){//if the directory has any separators in it then it is not a root level directory
				continue;
			}
			array_push($return, array("file"=>$dir, "name"=>$dir));
		}

		$files = $info['file'];
		//get only the root level files
		foreach($files as $file){
			if(strpos($file['file'], '/') !== false){
				continue;
			}
			array_push($return, array("file"=>$file['file'], "name"=>$file['Title'], "leaf"=>true));
		}

	}else{
		//see if there are subdirectories
		$dirs = $info['directory'];
		foreach($dirs as $dir){
			if(strpos($dir, $node) === 0){//if the directory name starts with the node id
				//get the directory with the node id removed from the begining
				$dir = substr($dir, strlen($node)+1);
				if(strpos($dir, '/') !== false || strlen($dir) < 1){//if the directory has any separators in it then it is below the node's level
					continue;			//if this was the directory that formed the parent node then the string would be 0 length, we don't want a null directory
				}
				
				//then push this directory into the return array, prepend the parent node to it
				array_push($return, array("file"=>$node.'/'.$dir, "name"=>$dir));
			}
		}

		$files = $info['file'];
		//get any files in this directory
		foreach($files as $file){
			if(strpos($file['file'], $node) === 0){//if the file name starts with the node id
				//get the file name with the node id removed from the begining
				$file_name = substr($file['file'], strlen($node)+1);
				if(strpos($file_name, '/') !== false){//if the file name has any separators in it then it is below the node's level
					continue;
				}
				$title = (!isset($file['Title']) || $file['Title'] == '')?$file_name:$file['Title'];
				//then push this file into the return array, prepend the parent node to it
				array_push($return, array("file"=>$file['file'], "name"=>$title, "leaf"=>true));
			}
		}
		
	}

	return $return;

}











require_once 'Net/MPD.php';



//make sure we do not cache this page ever
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Fri, 28 May 1982 00:00:00 GMT');
header('Content-type: application/json');



//get the MDP interface
$MPD = new Net_MPD();


//default to returning the current playlist the library and the player status
$get_playlist = true;
$get_library = true;
$get_player = true;
$get_playlists = false;
$get_songs = false;

//if we were told what was wanted only get that
if(isset($_GET['get'])){

	//default everything to false
	$get_playlist = false;
	$get_library = false;
	$get_player = false;
	$get_playlists = false;
	$get_songs = false;

	//figure out what we wanted
	$get = explode('|',$_GET['get']);
	foreach($get as $option){
		switch($option){
			case 'playlist':
				$get_playlist = true;
			break;
			case 'library':
				$get_library = true;
			break;
			case 'player':
				$get_player = true;
			break;
			case 'songs':
				$get_songs = true;
			break;
			case 'playlists':
				$get_playlists = true;
			break;
		}
	}
}

//default these to null, only find them if they are needed
$client_playlist_hash = null;
$client_library_hash = null;

//grab the hashes that the client gave us
if($get_playlist && isset($_POST['playlist']))
	$client_playlist_hash = $_POST['playlist'];

if($get_library && isset($_POST['library']))
	$client_library_hash = $_POST['library'];




//get our info

if($get_playlist || $get_player){ //player needs this info
	$server_playlist = $MPD->Playlist->getPlaylistInfo();

	foreach($server_playlist as  &$song){
		if(!isset($song['Title']) || $song['Title'] == ''){
			$title = explode('/', $song['file']);
			$song['Title'] = $title[count($title)-1];
		}
	}	
}

if($get_library)
	$server_library = $MPD->Database->getAllInfo();

if($get_player){
	$server_player = $MPD->Common->getStatus();
	if(isset($server_player['song']))
		$server_player['playback'] = $server_playlist[$server_player['song']];
	else
		$server_player['playback'] = 'no song';
}

if($get_playlists){
	$server_playlists = $MPD->Playlist->getPlaylists();
	foreach($server_playlists as &$item){
		$item = array('playlist'=>$item);
	}
}

if($get_songs){
	$song_search = isset($_REQUEST['find']) ? $_REQUEST['find'] : '';
	$song_search = urldecode($song_search);
	$server_songs = $MPD->Database->find(array('file' => $song_search));
	foreach($server_songs as  &$song){
		if(!isset($song['Title']) || $song['Title'] == ''){
			$title = explode('/', $song['file']);
			$title = $title[count($title)-1];
			$song['Title'] = $title;
		}
	}
}



$server_playlist_hash = null;
$server_library_hash = null;

//figure out what our hashes should be
if($get_playlist && $client_playlist_hash)
	$server_playlist_hash = MD5(get_sig($server_playlist));

if($get_library && $client_library_hash)
	$server_library_hash = MD5(get_sig($server_library, 'file'));




//array of data that needs to be updated on the client
$updates = array();

//if their hash is different than ours send them the right data
if($get_playlist)
	if((!$client_playlist_hash && !$server_playlist_hash) || $client_playlist_hash != $server_playlist_hash){
		$updates['playlist'] = $server_playlist;
	}

if($get_library)
	if((!$client_library_hash && !$server_library_hash) || $client_library_hash != $server_library_hash){
		$updates['library'] = make_nested($server_library);
	}

if($get_player)
	$updates['player'] = $server_player;

if($get_playlists)
	$updates['playlists'] = $server_playlists;

if($get_songs)
	$updates['songs'] = $server_songs;

/*
$updates['MD5s'] = array('playlist'=>$server_playlist_hash, 'library'=>$server_library_hash, 'player'=>$server_player_hash);
$updates['params'] = $_POST;
*/

$updates['success']=true;

//encode it and send it back
echo json_encode($updates);

?>
