
/// Osprey Avatar class. Defines osprey game player avatar.

engine.IncludeFile("class.js");
engine.ImportExtension("qt.core");

var OspreyAvatar = Class.extend({
    init: function(user, position) {

        // Creates osprey avatar entity and sets it name and description.
        print("OspreyAvatar START");
        
        this.entity_ = scene.CreateEntity(scene.NextFreeId(), ["EC_Script", "EC_Placeable", "EC_AnimationController", "EC_Mesh"]);
        this.entity_.SetName("Osprey_" + user.GetConnectionID());
        this.entity_.SetDescription(user.GetProperty("username"));

        this.userID_ = user.GetConnectionID();

        // Set mesh to correct state.

        var meshComp = this.entity_.mesh;
        var meshRef = meshComp.meshRef;
        meshRef.ref = "Osprey.mesh";
        meshComp.meshRef = meshRef;
        var skeletorRef = meshComp.skeletonRef;
        skeletorRef.ref = "Osprey.skeleton";
        meshComp.skeletonRef = skeletorRef;
        
        var materials = meshComp.meshMaterial;  
        materials = ["leathers.002.material", "body.001.material"];
        meshComp.meshMaterial = materials;

        // Change mesh rotation so that we look from avatar camera behind of osprey.      
        var trans = meshComp.nodeTransformation;
        trans.rot.z = 90;
        meshComp.nodeTransformation = trans;


        var script = this.entity_.script;
        script.type = "js";
        script.runOnLoad = true;
        var r = script.scriptRef;
        //r.ref = "./jsmodules/apitest/osprey_game_avatar.js";
        r.ref = "osprey_avatar_controller.js";
        script.scriptRef = r;

        var placeable = this.entity_.placeable;

        var transform = placeable.transform;

        transform.pos.x = position.x;
        transform.pos.y = position.y;
        transform.pos.z = position.z;

        placeable.transform = transform;

        scene.EmitEntityCreated(this.entity_);
        print("OspreyAvatar END");
        //frame.DelayedExecute(1.0).Triggered.connect(this, this.CreateController);
        //this.entity_.Exec(7, "CreateController", user);
    },

    GetID: function() {
        return this.userID_
    },

    Remove: function() {
        scene.RemoveEntityRaw(this.entity_.id);
    },
    /*
    CreateController: function()
    {
        //print("Run OspreyAvatar: CreateController..to userID: " + this.userID_);
        this.entity_.Exec(7, "CreateController",  this.userID_);
    },
    */

}
);

