<?php

echo '<center><img src="../img/loader.gif" width="50" style="margin-top:20px"></center>';

include("./asana/asana.php");
$asana = new Asana("j07VM9P.1o5ZVOf8jt2iO6Mid9jLrIzg"); // Your API Key, you can get it in Asana
$workspace = "1460337572497";

$finalJSON = '{ "users":';

$usersURL = "https://app.asana.com/api/1.0/workspaces/".$workspace."/users";

// Get users data
$ch = curl_init( $usersURL );
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); 
curl_setopt($ch, CURLOPT_USERPWD, "j07VM9P.1o5ZVOf8jt2iO6Mid9jLrIzg:");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_HTTPHEADER, array("Content-Type: application/json"));
$usersResults = curl_exec($ch); // Getting jSON result string
$usersResults = getDataFromUsersJSON($usersResults);
$finalJSON = $finalJSON.$usersResults;

// Get projects data
$projectsResult = $asana->getProjectsInWorkspace($workspace, $archived = false);
$finalProjectsJson = '[';

// Get tasks data
$projectsJson = json_decode($projectsResult);
foreach ($projectsJson->data as $project){
	$finalProjectsJson = $finalProjectsJson.' { "name":"'.str_replace('"','&quot;',$project->name).'", "id":'.$project->id.', "tasks": ';
	$tasks = $asana->getProjectTasks($project->id);
	$finalProjectsJson = $finalProjectsJson.getDataFromTasksJSON($tasks).'},';
}
$finalProjectsJson = $finalProjectsJson.']';
$finalJSON = $finalJSON.', "projects":'.$finalProjectsJson;
$finalJSON = $finalJSON." }";
$finalJSON = str_replace('},]','}]',$finalJSON);
$finalJSON = str_replace('],]',']]',$finalJSON);
$finalJSON = str_replace('},}','}}',$finalJSON);

echo "<br><br><h1 style='font-family:Helvetica; font-size:16px; text-align:center'>Asana data captured successfully.</h1>";

$file = '../data/data.json';
$handle = fopen($file, 'w');

fwrite($handle, $finalJSON);
fclose($handle);

function getDataFromUsersJSON($jsonString) {
	$final = str_replace('{"data":[',"[",$jsonString);
	$final = str_replace(']}',"]",$final);
	return $final;
}

function getDataFromTasksJSON($jsonString) {
	$final = str_replace('{"data":[',"[",$jsonString);
	$final = str_replace('}]}]}',"}]}]",$final);
	return $final;
}

?>

