// When this script is runned
// 1. Create new osprey (avatar), set person who touched stone to control it.

engine.IncludeFile("local://osprey_avatar.js");

if (server.IsRunning()) {

    // In case that player disconnect..
    server.UserDisconnected.connect(Disconnect);
}

// All "game" objects are saved here.
var current_osprey_avatars_ = [];

function StartGame() {
    if (server.IsRunning()) {

        // Currently because of UI - bug we define that only one player can play Osprey-game.
        if (current_osprey_avatars_.length > 0) {
            
            var client = server.GetActionSender();
            
            // Assure that client has ui in valid state:
            
            var ids = scene.GetEntityIdsWithComponent("EC_Name");
            for (var i = 0; i < ids.length; ++i) {

                var e = scene.GetEntityRaw(ids[i]);
                if (e.GetComponentRaw("EC_Name").name == "MainHud") {
                    e.Exec(4, "ShowMainUIOnClient", client.GetConnectionID());
                }
            }
            return;
        }   
        
        // User connection, defines which client did start game.
        var user = server.GetActionSender();
        
        // Position where avatar will be spawned.
        
        //TODO Define position randomly?
        var position = new Vector3df;
        position.x = -2.0;
        position.y = -4.72;
        position.z = 9.0;
            
        // Populate game area with fishes
        //TODO
        
        // Creates new osprey avatar to given position. Sets given user to control it.
        var player = new OspreyAvatar(user, position);

        // When game starts, hide our avatar from scene.
        var avatarName = "Avatar" + user.GetConnectionID();
        scene.GetEntityByNameRaw(avatarName).Exec(7,"HideEntity");
        
		// Remove focus. This fixes a bug that Qt scene eats keyboard release events. 
        me.Exec(4, "RemoveFocus");
		
        // Save game.
        current_osprey_avatars_.push(player);

        
    }
  
}

function StopGame(id) {

    if (server.IsRunning()) {
        for (var i = 0; i < current_osprey_avatars_.length; ++i) {
            if (current_osprey_avatars_[i].GetID() == id) {
                // Removes object from scene.
                current_osprey_avatars_[i].Remove();
                // Removes player from avatar list.
                current_osprey_avatars_.splice(i, 1);
              
                var avatarName = "Avatar" + id;
                scene.GetEntityByNameRaw(avatarName).Exec(7, "ShowEntity");
                
                // If there exist watersplass effects created by this user remove them..
                var name = "WaterSplass_" + id;

                var ids = scene.GetEntityIdsWithComponent("EC_Name");
                for (var i = 0; i < ids.length; ++i) {

                    var e = scene.GetEntityRaw(ids[i]);
                    if (e.GetComponentRaw("EC_Name").name == name) {
                        scene.RemoveEntityRaw(ids[i]);
                    }
                }
                
            
            
            }
        }

    }
  
}
// This runned only in server..
function Disconnect(id, us) {
    for (var i = 0; i < current_osprey_avatars_.length; ++i) {
        if (current_osprey_avatars_[i].GetID() == id) {
            // Removes object from scene.
            current_osprey_avatars_[i].Remove();
            // Removes player from avatar list.
            current_osprey_avatars_.splice(i, 1);

            // If there exist watersplass effects created by this user remove them..
            var name = "WaterSplass_" + id;

            var ids = scene.GetEntityIdsWithComponent("EC_Name");
            for (var i = 0; i < ids.length; ++i) {

                var e = scene.GetEntityRaw(ids[i]);
                if (e.GetComponentRaw("EC_Name").name == name) {
                    scene.RemoveEntityRaw(ids[i]);
                }
            }
           
        }
    }
}

function RemoveFocus() {

    var gscene = ui.GraphicsScene();

    if (gscene != null && gscene.hasFocus()) {
        gscene.clearFocus();
    }
   
}


me.Action("LaunchGame").Triggered.connect(StartGame);
me.Action("StopGame").Triggered.connect(StopGame);
