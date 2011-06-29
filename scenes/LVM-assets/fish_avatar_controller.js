// !ref: local://fish_game_hud.ui

engine.ImportExtension('qt.core');
engine.ImportExtension('qt.gui');

engine.IncludeFile("local://vector.js");
engine.IncludeFile("local://class.js");

const MOUSE_SENSITIVITY_X = 0.1;
const MOUSE_SENSITIVITY_Y = 0.05;
const DASH_DURATION = 1.0;
const DASH_COOLDOWN = 4.0;
const TURNING_SPEED = 40.0;
const MAX_SPEED = 4.0;
// const MAX_STEER = 0.5;

const WATER_DELTA = 0.05;
const TERRAIN_DELTA = 0.05;

const ACCELERATION = 3.0;

var FishAvatarController = Class.extend({
    init: function() {
        this.placeable_ = me.placeable;
        this.mesh_      = me.mesh;
        this.rigidbody_ = me.rigidbody;
        
        // Player client only
        this.fishCamera_= null;

        //eating gamelogic. on client now to save net bandwidth
        this.eating_ = null; //one entity at a time, or null if none
        
        // Updated only in server
        this.direction_ = new Vector3df();
        this.dashing_   = false;
        this.canDash_   = true;
        this.speed_     = 0;
        this.waterLevel_= null;
        this.terrain_   = null;
        
        me.Action("Remove").Triggered.connect(this, this.remove);
        
        this.myAvatar_ = false;
        
        //eating detection with a volumetrigger
        /* enabled only for the client-only mouth entity now
        var rigidbody = me.rigidbody;
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

        var volumetrigger = me.volumetrigger;
        volumetrigger.EntityEnter.connect(this.onEntityEnter);
        volumetrigger.EntityLeave.connect(this.onEntityLeave);
        */
        
        if(server.IsRunning()) {
            this.serverInit();
            // me.Action("Remove").Triggered.connect(this, this.remove);
        }
        else if(me.GetName() == 'FishAvatar_'+client.GetConnectionID()) {
            this.myAvatar_ = true;
            this.playerClientInit();
            
        }
        else { 
            this.otherClientInit();
        }
    },
    
    remove: function() {
        if(this.myAvatar_) {
            if(this.fishCamera_) {
                scene.RemoveEntityRaw(this.fishCamera_.id);
                this.fishCamera_ = null;
            }
            var avatarCamera = scene.GetEntityByNameRaw('AvatarCamera');
            if (avatarCamera.HasComponent('EC_OgreCamera')) {
                var camera = avatarCamera.GetComponentRaw('EC_OgreCamera');
                camera.SetActive();
            }
      
            var fishGameEntity = scene.GetEntityByNameRaw('FishGame');
            fishGameEntity.Exec(2, 'StopGame',client.GetConnectionID());
        }

	this.hideGui();
    },
    
    // Removes fish camera and and activates human avatar camera
    // removeCamera: function() {
    //     if(this.fishCamera_) {
    //         scene.RemoveEntityRaw(this.fishCamera_.id);
    //         this.fishCamera_ = null;
    //     }
    //     var avatarCamera = scene.GetEntityByNameRaw('AvatarCamera');
    //     if (avatarCamera.HasComponent('EC_OgreCamera')) {
    //         var camera = avatarCamera.GetComponentRaw('EC_OgreCamera');
    //         camera.SetActive();
    //     }
    // },
    
    serverInit: function() {
        // Connect actions
        me.Action("Move").Triggered.connect(this, this.serverHandleMove);
        me.Action("Stop").Triggered.connect(this, this.serverHandleStop);
        me.Action("Rotate").Triggered.connect(this, this.serverHandleRotate);
        me.Action("StopRotate").Triggered.connect(this, this.serverHandleStopRotate);
        me.Action("Dash").Triggered.connect(this, this.serverHandleDash);
        
        me.Action("MouseLookX").Triggered.connect(this, this.serverHandleMouseX);
        me.Action("MouseLookY").Triggered.connect(this, this.serverHandleMouseY);
        
        
        // Set water level and terrain
        //var waterEntity = scene.GetEntitiesWithComponent('EC_WaterPlane')[0];
        var waterEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_WaterPlane')[0]);
        if (waterEntity) {
            this.waterLevel_ = waterEntity.waterplane.position.z;
        }
        else
            throw 'No water found';

        var terrainEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_Terrain')[0]);
        if(terrainEntity)
            this.terrain_ = terrainEntity.GetComponentRaw('EC_Terrain');
        else
            throw 'No terrain found';
            
        
        this.serverUpdateAnimationState();
        frame.Updated.connect(this, this.serverUpdate);
    },
    
    serverUpdate: function(dt){
        var placeable = this.placeable_;
        var rigidbody = this.rigidbody_;
        var transform = placeable.transform;
        
        // Turn
        if(this.direction_.y != 0) {
            var rot = new Vector3df();
            rot.z = TURNING_SPEED*this.direction_.y*dt;
            rigidbody.Rotate(rot);
        }
    
        // Move
        if(this.direction_.x != 0) {
            if(!this.dashing_ && this.speed_ < MAX_SPEED)
                this.speed_ += ACCELERATION*dt;
            else if(!this.dashing_ && this.speed_ > MAX_SPEED)
                this.speed_ -= ACCELERATION*dt;
            else if(this.dashing_)
                this.speed_ += ACCELERATION*2*dt;
            
        }
        else {
            this.speed_ -= ACCELERATION*dt;
        }
        if(this.speed_ < 0)
            this.speed_ = 0;
        
        var velocity = new Vector3df();
        velocity.x = this.speed_;
        
        var delta = VectorMult(velocity, dt);
        delta = placeable.GetRelativeVector(delta);
        
        var newPos = VectorSum(transform.pos, delta);
        var posOnMap = this.terrain_.GetPointOnMap(newPos);
            
        // Stay in water    
        if(newPos.z > this.waterLevel_ - WATER_DELTA)
            newPos.z = this.waterLevel_ - WATER_DELTA;
        else if(newPos.z < posOnMap.z + TERRAIN_DELTA)
            newPos.z = posOnMap.z + TERRAIN_DELTA;
            
        if(this.waterLevel_ > posOnMap.z + WATER_DELTA)
        {
            transform.pos = newPos;
            placeable.transform = transform;    
        }
        
        this.updateAnimation();
    },
    
    serverUpdateAnimationState: function() {
        var animationcontroller = me.animationcontroller;
        
        if(this.direction_.y > 0) {
            animationcontroller.animationState = 'turn left';
        }
        else if(this.direction_.y < 0) {
            animationcontroller.animationState = 'turn right';
        }
        
        else if(this.direction_.x > 0 && !this.dashing_) {
            animationcontroller.animationState = 'move';
        }
        else if(this.direction_.x > 0 && this.dashing_) {
            animationcontroller.animationState = 'dash';
        }
        else {
            animationcontroller.animationState = 'idle';
        }  
    },
    
    serverHandleMove: function(param) {
        if (param == "forward" && this.direction_.x != 1) {
            this.direction_.x = 1;
            this.serverUpdateAnimationState();
        }
    },
    
    serverHandleStop: function(param) {
        if (param == "forward" && this.direction_.x == 1) {
            this.direction_.x = 0;
            this.serverUpdateAnimationState();
        }
    },
    
    serverHandleRotate: function(param) {
        if(param == "left" && this.direction_.y != 1)
            this.direction_.y = 1;
        else if(param == "right" && this.direction_.y != -1)
            this.direction_.y = -1;
        else
            return;
        this.serverUpdateAnimationState();
    },
    
    serverHandleStopRotate: function(param) {
        if(param == "left" && this.direction_.y == 1)
            this.direction_.y = 0;
        else if(param == "right" && this.direction_.y == -1)
            this.direction_.y = 0;
        else
            return;
        this.serverUpdateAnimationState()
    },
    
    serverHandleDash: function() {
        if(this.canDash_) {
            this.dashing_  = true;
            this.canDash_  = false;
                
            var dashDuration = frame.DelayedExecute(DASH_DURATION);
            var me = this;
            dashDuration.Triggered.connect(function() {
                me.dashing_ = false;
                me.serverUpdateAnimationState();
            });
            
            var dashCooldown = frame.DelayedExecute(DASH_COOLDOWN);
            dashCooldown.Triggered.connect(function() {
                me.canDash_ = true;
            });
            this.serverUpdateAnimationState();
        }
    },
    
    serverHandleMouseX: function(param) {
        var move = parseInt(param);
        var rigidbody = this.rigidbody_;
        var rotateVec = new Vector3df();
        rotateVec.z = -MOUSE_SENSITIVITY_X * move;
        rigidbody.Rotate(rotateVec);
    },
    
    serverHandleMouseY: function(param) {
        var move = parseInt(param);
        var rigidbody = this.rigidbody_;
        var placeable = this.placeable_;
        
        var rotateVec = new Vector3df();
        
        rotateVec.y = -MOUSE_SENSITIVITY_Y * move;
        rigidbody.Rotate(rotateVec);
        
        var tm = placeable.transform;
        if(tm.rot.y > 20)
            tm.rot.y = 20;
        else if(tm.rot.y < -20)
            tm.rot.y = -20;
        else
            return;
        
        // Limit rot
        placeable.transform = tm;
    },
    
    serverHandleDie: function() {
        
    },
    
    playerClientInit: function() {        
        // Create a nonsynced inputmapper
        var inputmapper = me.GetOrCreateComponentRaw("EC_InputMapper", 2, false);
        inputmapper.contextPriority = 101;
        inputmapper.takeMouseEventsOverQt = true;
        inputmapper.modifiersEnabled = false;
        inputmapper.executionType = 2; // Execute actions on server
    
        inputmapper.RegisterMapping("W", "Move(forward)", 1);
        inputmapper.RegisterMapping("A", "Rotate(left)", 1);
        inputmapper.RegisterMapping("D", "Rotate(right))", 1);
    
        inputmapper.RegisterMapping("W", "Stop(forward)", 3);
        inputmapper.RegisterMapping("A", "StopRotate(left)", 3);
        inputmapper.RegisterMapping("D", "StopRotate(right))", 3);
        
        inputmapper.RegisterMapping("Space", "Dash()", 1);
        inputmapper.RegisterMapping("Space", "Dash()", 3);
        
        // Create fishcamera
        this.fishCamera_ = scene.CreateEntityRaw(scene.NextFreeIdLocal(), ['EC_OgreCamera', 'EC_Placeable']);
        this.fishCamera_.SetName("FishCamera");
        this.fishCamera_.SetTemporary(true);
        
        var camera    = this.fishCamera_.ogrecamera;
        var placeable = this.fishCamera_.placeable;
    
        camera.AutoSetPlaceable();
        camera.SetActive();
        
        // Create localonly 'mouth' for eating checks
        this.mouth_ = scene.CreateEntityRaw(scene.NextFreeIdLocal(), ['EC_RigidBody', 'EC_VolumeTrigger', 'EC_Placeable']);
        this.mouth_.SetName("FishMouth");
        this.mouth_.SetTemporary(true);
        var rigidbody = this.mouth_.rigidbody;
        var sizeVec = new Vector3df();
        sizeVec.z = 1.0;
        sizeVec.x = 1.0;
        sizeVec.y = 1.0;
        rigidbody.mass = 1;
        rigidbody.linearFactor = new Vector3df();
        rigidbody.angularFactor = new Vector3df();
        rigidbody.shapeType = 0; 
        rigidbody.size = sizeVec;
        var zeroVec = new Vector3df();
        rigidbody.angularFactor = zeroVec;
        rigidbody.Activate();

        var volumetrigger = this.mouth_.volumetrigger;        
        volumetrigger.EntityEnter.connect(this.onEntityEnterMouth);
        volumetrigger.EntityLeave.connect(this.onEntityLeaveMouth);    
        
        frame.Updated.connect(this, this.playerClientUpdate);
        frame.Updated.connect(this, this.updateAnimation);
        
        //game logic
        this.score_ = 0;
        this.clientCreateHUD();

        //radar hud
        engine.IncludeFile("local://fish_game_radar.js"); //creates the radar which updates itself
    },
    
    otherClientInit: function() {
        frame.Updated.connect(this, this.updateAnimation);
    },
    
    playerClientUpdate: function(dt) {
        player.mouth_.placeable.transform = me.placeable.transform;
        if (player.eating_ != null) {
            //this.eating_.capacity--;
            player.score_++;
            if (true) { //this.eating_.capacity < 0) {
                print("food exhausted!");
                //this.eating_.remove(); //doesn't remove from 
                scene.RemoveEntityRaw(player.eating_.id);
            }
            print("SCORE: " + player.score_); 
        }
        
        player.playerClientUpdateFishCamera();
    },
    
    playerClientUpdateFishCamera: function() {
        if(!this.fishCamera_)
            throw 'FishCamera not set';
            
        var cameraentity = this.fishCamera_;

        var cameraplaceable = cameraentity.placeable;
        var avatarplaceable = me.placeable;
    
        var cameratransform = cameraplaceable.transform;
        var avatartransform = avatarplaceable.transform;
        var offsetVec = new Vector3df();
        offsetVec.x = -0.2; // camera distance
        offsetVec = avatarplaceable.GetRelativeVector(offsetVec);
        cameratransform.pos = VectorSum(avatartransform.pos, offsetVec);
        // Note: this is not nice how we have to fudge the camera rotation to get it to show the right things
        cameratransform.rot.x = 90 - avatartransform.rot.y;
        cameratransform.rot.z = avatartransform.rot.z - 90;
    
        cameraplaceable.transform = cameratransform;
    },
    
    updateAnimation: function() {
        var animationcontroller = me.animationcontroller;
        if(animationcontroller == null)
            return;
            
        var state = animationcontroller.animationState;
        //print(state);
        if(state == 'idle' || state == 'move') {
            if(animationcontroller.IsAnimationActive('Turn Left'))
                animationcontroller.StopAnim('Turn Left', 0.2);
            if(animationcontroller.IsAnimationActive('Turn Right'))
                animationcontroller.StopAnim('Turn Right', 0.2);
                
            if(!animationcontroller.IsAnimationActive('swim', false))
                animationcontroller.EnableAnimation('swim', true, 0.2);      
        }
        
        else if(state == 'turn left') {
            if(animationcontroller.IsAnimationActive('swim'))
                animationcontroller.StopAnim('swim', 0.2);
            if(!animationcontroller.IsAnimationActive('Turn Left'))
                animationcontroller.EnableAnimation('Turn Left', true, 0.2);    
        }
        
        else if(state == 'turn right') {
            if(animationcontroller.IsAnimationActive('swim'))
                animationcontroller.StopAnim('swim', 0.2);
            if(!animationcontroller.IsAnimationActive('Turn Right'))
                animationcontroller.EnableAnimation('Turn Right', true, 0.2);
        }
        
        else if(state == 'dash') {
            if(!animationcontroller.IsAnimationActive('Acceleration', false)) {
                animationcontroller.EnableAnimation('Acceleration', false, 0.1, false);
                //animationcontroller.SetAnimationNumLoops('Acceleration', 3);
            }
            //animationcontroller.SetAnimationWeight('swim', 1.2);
            //animationcontroller.SetAnimationSpeed('swim', 1.7);
        }
    },
    
    //for the synced fish av - can be later used on server for cheating 
    onEntityEnter: function(ent) {
        print("onEntityEnter: " + ent.id + " : " + ent.name);
        /*if (player.eating_ == null && ent.name.substring(6, 0).toLowerCase() == "school") {
            print("eating " + ent.id + " : " + ent.name);
            player.eating_ = ent;
        }*/
    },
    
    onEntityLeave: function(ent) {
        print("onEntityLeave: " + ent.id + " : " + ent.name);
        /*if (player.eating_ != null && player.eating_.id == ent.id) { //identity check didn't work - qtscript makes separate objects of things that wrap the same qobject? (unlike pythonqt)
            print("stopped eating " + ent.id + " : " + ent.name);
            player.eating_ = null;
        }*/
    },

    onEntityEnterMouth: function(ent) {
        //print("MOUTH onEntityEnter: " + ent.id + " : " + ent.name);
        if (player.eating_ == null && ent.name.substring(7, 0).toLowerCase() == "school_") {
            print("eating " + ent.id + " : " + ent.name);
            player.eating_ = ent; 
        }
    },
    
    onEntityLeaveMouth: function(ent) {
        //print("MOUTH onEntityLeave: " + ent.id + " : " + ent.name);
        if (player.eating_ != null && player.eating_.id == ent.id) { //identity check didn't work - qtscript makes separate objects of things that wrap the same qobject? (unlike pythonqt)
            print("stopped eating " + ent.id + " : " + ent.name);
            player.eating_ = null;
        }
    },

    //GUI STUFF
    clientCreateHUD: function() {
        // Creates a game hud.

        var file ="local://fish_game_hud.ui";
        
        this.hudWidget_ = ui.LoadFromFile(file, false);
        if (this.hudWidget_ == null) {
            print("FishAvatarController: LoadFromFile ui-file:" + file + " failed.");
            return;
        }

        this.lcdTimeDisplay_ = findChild(this.hudWidget_, "lcdTime");
        if (this.lcdTimeDisplay_ == null) {
            print("FishAvatarController: Did not find time display");
            return;
        }
        var butExit = findChild(this.hudWidget_, "butExit");

        if (butExit == null) {
            print("FishAvatarController: Did not find exit button");
            return;
        }

        butExit.clicked.connect(this, this.remove);

        this.scoreLayout_ = findChild(this.hudWidget_, "scoreLayout");
        if ( this.scoreLayout_ == null )
        {
            print("FishAvatarController: Did not find scoreLayout");
            return;
        }

        var proxy = ui.AddWidgetToScene(this.hudWidget_);
        this.hudWidget_.setStyleSheet("QWidget#" + this.hudWidget_.objectName + "{background-color: transparent;}");
        // No window borders.
        proxy.windowFlags = 0;

        var gscene = ui.GraphicsScene();
        gscene.sceneRectChanged.connect(this, this.OnWindowSizeChanged);
        this.hudWidget_.resize(gscene.width(), 115);
        this.hudWidget_.move(0, 10);

        proxy.ToggleVisibility();
        // Set up time limit, tweak end game little bit before then display time.
        //frame.DelayedExecute(this.gameTime_ - 1).Triggered.connect(this, this.ExitGame);
    },

    OnWindowSizeChanged: function() {
        if ( this.hudWidget_ != null )
        {
            var gscene = ui.GraphicsScene();
            this.hudWidget_.resize(gscene.width(), 115);
            this.hudWidget_.move(0, 10);
        }
    },

    hideGui: function() {
	if (this.hudWidget_) {
	    this.hudWidget_.hide();
	    this.hudWidget_ = null;
	}
        this.lcdTimeDisplay_ = null;
        this.scoreLayout_ = null;
        
        // Show main right panel
        var e = scene.GetEntityByNameRaw("MainHud");
	e.Exec(1, "ShowMainUI");
    },

});

var player = new FishAvatarController();