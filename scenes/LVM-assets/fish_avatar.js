engine.ImportExtension('qt.core');
engine.ImportExtension('qt.gui');

engine.IncludeFile("local://vector.js");
engine.IncludeFile("local://class.js");


var FishAvatar = Class.extend({
    init: function(user) {
        this.user_ = user;
        this.userID_ = user.GetConnectionID();
                
        var avatarEntityName = 'FishAvatar_' + user.GetConnectionID();
        this.entity_ = scene.CreateEntityRaw(scene.NextFreeId(), ['EC_Script', 'EC_Placeable', 'EC_RigidBody', 'EC_Mesh', 'EC_AnimationController', 'EC_VolumeTrigger']);     
        
        this.entity_.SetName(avatarEntityName);
        this.entity_.SetDescription(user.GetProperty('username'));
        
        // Controller Script
        var script = this.entity_.GetComponentRaw('EC_Script');
        script.type = 'js';
        script.runOnLoad = true;
        var r = script.scriptRef;
        r.ref = 'local://fish_avatar_controller.js'; 
        script.scriptRef = r;
         
        var placeable = this.entity_.placeable;
        var mesh      = this.entity_.mesh;
        var rigidbody = this.entity_.rigidbody;
        
        var transform = placeable.transform;
        var pos = new Vector3df();
        pos.x = 2.0;
        pos.y = 0.5;
        pos.z = 10.0;    
        
        transform.pos = pos;
        placeable.transform = transform;
    
        var m = mesh.meshRef;
        m.ref = 'local://anchovy.mesh';
        mesh.meshRef = m;
        m = mesh.skeletonRef;
        m.ref = 'local://anchovy.skeleton';
        mesh.skeletonRef = m;
        
        var materials = mesh.meshMaterial;  
        materials = ['local://anchovy.material'];
        mesh.meshMaterial = materials;
        
        var meshTm = mesh.nodeTransformation;
        meshTm.rot.z = 90;
        mesh.nodeTransformation = meshTm;
        
        var sizeVec = new Vector3df();
        sizeVec.z = 1.0;
        sizeVec.x = 1.0;
        sizeVec.y = 1.0;
        rigidbody.mass = 3;
        rigidbody.linearFactor = new Vector3df();
        rigidbody.angularFactor = new Vector3df();
        rigidbody.shapeType = 0; 
        rigidbody.size = sizeVec;
        var zeroVec = new Vector3df();
        rigidbody.angularFactor = zeroVec;
        rigidbody.Activate();
        
        scene.EmitEntityCreatedRaw(this.entity_);
    },
    
    getPos: function() {
        var pl = this.entity_.placeable;
        var tm = pl.transform;
        // print('avatar getPos');
        return tm.pos;
    },
    
    distanceTo: function(pos) {
        var d = GetDistance(pos, this.getPos());
        // print('avatar distanceTo: '+d);
        return d;
    },
    
    getID: function() {
        return this.userID_;
    },
        
    die: function() {
        this.entity_.Exec(7, 'Remove');
    },
    
    removeEntity: function() {
        scene.RemoveEntityRaw(this.entity_.id);
    },
});

