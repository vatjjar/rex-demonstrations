engine.IncludeFile("guard.js");
engine.IncludeFile("schoolwanderer.js");
engine.IncludeFile("fish_avatar.js");

var guardsCount = 4;
var guards = [];
var schools = [];
var avatars = [];

me.Action('LaunchGame').Triggered.connect(createAvatar);
me.Action('StopGame').Triggered.connect(stopGame);

if(!client.IsConnected()) {
    startGame();

    server.UserDisconnected.connect(handleUserDisconnect);
}

function startGame() {
    if(client.IsConnected())
        return;
        
    frame.Updated.connect(updateFishGame);
    
    var pos = new float3(-11, 18, 6);

    for (var i = 0; i < 1; i++) {
        var guard = createGuard('Guard', pos);
        guards.push(guard);
    }
    
    //for (var i = 0; i < 5; i++) {
    var i = 1;
    var school = createSchool('School_'+i, pos);
    schools.push(school);
    //}
}

function OnScriptDestroyed() {
    print("Fish game: Removing guards.."); 
    for(var i = 0; i < guards.length; ++i) {
        guards[i].remove();
    }
    print("Fish game: Removing schools.."); 
    for(var i = 0; i < schools.length; ++i) {
        schools[i].remove();
    }
    
    print("Fish game: Removing players"); 
    for(var i = 0; i < avatars.length; ++i) {
        stopGame(avatars[i].getID());
    }
    print(".. done removals.");
}

function updateFishGame(dt) {
    //print('avatars: '+avatars.length);
}

function createGuard(name, pos) {
    var guardEntity = scene.CreateEntity(scene.NextFreeId(), ['EC_Placeable', 'EC_RigidBody', 'EC_Mesh', 'EC_AnimationController', 'EC_Script']);
    guardEntity.SetName(name);
    guardEntity.SetTemporary(true); 
    scene.EmitEntityCreated(guardEntity);
    var guard = new Guard(guardEntity, pos);
    return guard;
}

function createSchool(name, pos) {
    var schoolEntity = scene.CreateEntity(scene.NextFreeId(), ['EC_Placeable', 'EC_Mesh', 'EC_Script']); //, 'EC_RigidBody']);
    schoolEntity.SetTemporary(true);
    schoolEntity.SetName(name);
    scene.EmitEntityCreated(schoolEntity);
    
    //the clientside code to run the multiple particle systems inside the school
    var script = schoolEntity.script;
    script.type = "js";
    script.runOnLoad = true;
    var r = script.scriptRef;
    r.ref = "school_clientside.js";
    script.scriptRef = r;

    var school = new School(schoolEntity, pos); //the server side AIWanderer for the whole school
    return school;
}

function createAvatar() {
    // User connection, defines which client did start game.
    var user = server.GetActionSender();
    var avatarName = 'Avatar' + user.GetConnectionID();
    scene.GetEntityByName(avatarName).Exec(7,'HideEntity');
    var avatar = new FishAvatar(user);
    print('anchovy avatar created');
    avatars.push(avatar);
}

function stopGame(id) {
    var avatarName = 'Avatar'+id;
    for(var i = 0; i < avatars.length; ++i) {
        if(avatars[i].getID() == id) {
            avatars[i].removeEntity();
            avatars.splice(i, 1);
            break;
        }
    }

    var playerav = scene.GetEntityByName(avatarName);
    if (playerav) {
        playerav.Exec(7, 'ShowEntity');
        print("showing avatar entity for client that stopped playing:" + avatarName);
    }
    
    print("Player left fish game ok " + id);
}

function handleUserDisconnect(connectionID, user) {
    stopGame(connectionID, false);
}
