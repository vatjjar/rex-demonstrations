engine.ImportExtension('qt.core');
engine.ImportExtension('qt.gui');

engine.IncludeFile("vector.js");
engine.IncludeFile("class.js");


var FishAvatar = Class.extend({
    init: function(user) {
        this.user_ = user;
        this.userID_ = user.GetConnectionID();
                
        var avatarEntityName = 'FishAvatar_' + user.GetConnectionID();
        this.entity_ = scene.CreateEntity(scene.NextFreeId(), ['EC_Script', 'EC_Placeable', 'EC_RigidBody', 'EC_Mesh', 'EC_AnimationController', 'EC_VolumeTrigger']);     
        
        this.entity_.SetName(avatarEntityName);
        this.entity_.SetDescription(user.GetProperty('username'));
        
        // Controller Script
        var script = this.entity_.GetComponent('EC_Script');
        script.type = 'js';
        script.runOnLoad = true;
        var r = script.scriptRef;
        r.ref = 'fish_avatar_controller.js'; 
        script.scriptRef = r;
         
        var placeable = this.entity_.placeable;
        var mesh      = this.entity_.mesh;
        var rigidbody = this.entity_.rigidbody;
        
        var transform = placeable.transform;
        var pos = new float3(2.0, 0.5, 10.0);
        
        transform.pos = pos;
        placeable.transform = transform;
    
        var m = mesh.meshRef;
        m.ref = 'anchovy.mesh';
        mesh.meshRef = m;
        m = mesh.skeletonRef;
        m.ref = 'anchovy.skeleton';
        mesh.skeletonRef = m;
        
        var materials = mesh.meshMaterial;  
        materials = ['anchovy.material'];
        mesh.meshMaterial = materials;
        
        var meshTm = mesh.nodeTransformation;
        meshTm.rot.z = 90;
        mesh.nodeTransformation = meshTm;
        
        var sizeVec = new float3(1,1,1);
        rigidbody.mass = 3;
        rigidbody.linearFactor = new float3(0,0,0);
        rigidbody.angularFactor = new float3(0,0,0);
        rigidbody.shapeType = 0; 
        rigidbody.size = sizeVec;
        var zeroVec = new float3(0,0,0);
        rigidbody.angularFactor = zeroVec;
        rigidbody.Activate();
        
        scene.EmitEntityCreated(this.entity_);
    },
    
    getPos: function() {
        var pl = this.entity_.placeable;
        var tm = pl.transform;
        // print('avatar getPos');
        return tm.pos;
    },
    
    distanceTo: function(pos) {
		return this.getPos().Distance(pos);
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

