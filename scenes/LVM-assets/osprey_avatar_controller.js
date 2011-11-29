engine.IncludeFile("local://class.js");

engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");
// Asset dependency chain.

// !ref: local://osprey_game_hud.ui
// !ref: local://osprey_nest_controller.js
// !ref: local://fishOFF.png
// !ref: local://fishON.png

//NOTE: had to remove those as they break headless mode alltogether 
//- stop this script from loading there. possibly breaks the effect for clients
// NOT: local://watersplash.particle
// NOT: local://watersplash_drops.particle
// NOT: local://watersplash_hispeed.particle


var OspreyController = Class.extend({
    init: function(server) {
        this.IsServer_ = server;

        // Are used to define motion can be -1,0,1
        this.motionStateX_ = 0;
        this.motionStateY_ = 0;

        // Contains current animation.
        this.currentAnimation_ = null;
        this.lastAnimation_ = null;

        this.ownAvatar_ = false;
        this.ospreyCameraHeight_ = 4.0;

        //this.ospreyCameraDistance_ = 8.0;
        this.ospreyCameraDistance_ = 6.0;

        this.speed_ = 2.0;
        this.acceleration_ = 0.25;
        this.angularSpeed_ = 1.5;

        this.minSpeed_ = 1.2;
        this.maxSpeed_ = 8.0;

        // Max orientation angle -45 to 45 when mesh is rotated.
        this.maxTurningAngle_ = 45;

        /// Max height, relative to terrain or waterplane. 
        this.maxHeight_ = 75.0;
        this.heightDelta_ = 3.0;

        // How much above land/ocean must be before we can dive.
        this.minDiveDelta_ = 8.0;
        this.dive_acceleration_ = 9.81;
        this.dive_speed_ = 0;
        // How fast osprey in glide mode goes down:
        this.glide_speed_z_ = 0;
        this.glide_acceleration_ = 4.81;
        // Max speed in dive-mode.
        this.maxDiveSpeed_ = 20.0;

        this.angle_ = 0;
        this.deltaDiffAngle_ = 5;

        // Angle which defines when camera angle has reached rotation end in dive.
        this.deltaDive_ = 2;

        // How much above land/ocean we must be always. 
        this.waterDelta_ = 1.5;
        this.terrainDelta_ = 5.0;
        // This defines how much above ocean we start (in diving) to run catch-fish animation.
        this.diveWaterDelta_ = 1.0;
        // Valid only in server side.
        this.carryingFish_ = false;
        // Valid only in client side.
        this.fishMesh_ = null;
        // Valid only in server side.
        this.fishes_ = [];
        // Valid only in server side. Not-squared-lenght. 
        this.fishCatchDistance_ = 5*5;

        // These are used when we use catch fish animation.
        this.catchAnimationRunTime_ = 3;
        this.catchAnimationStopTime_ = 0;

        this.planToDiveAnimationRunTime_ = 1;
        this.planToDiveAnimationStopTime_ = 0;

        this.particleEffectsRunTime_ = 2.0;
        // Player connection ID, this is for server side.
        this.playerID_ = null;
        this.waterParticleEntity_ = [];
        this.particleLimitter_ = 4;

        // Default cam rotation over x-axis.
        //this.avatarCamRotDefaultX_ = 85.0;
        this.avatarCamRotDefaultX_ = 60.0;
        this.diveHeightRelation_ = (this.ospreyCameraHeight_) / this.avatarCamRotDefaultX_;

        var terrain_entity = scene.GetEntity(scene.GetEntityIdsWithComponent("EC_Terrain")[0]);
        if (terrain_entity != null && typeof (terrain_entity) != "undefined") {
            this.terrain_ = terrain_entity.terrain;
        }
        else
            this.terrain_ = null;

        var ids = scene.GetEntityIdsWithComponent("EC_WaterPlane");
        this.waterPlaneComponents_ = [];
        for (var i = 0; i < ids.length; ++i) {
            var entity = scene.GetEntity(ids[i]);
            this.waterPlaneComponents_.push(entity.waterplane);
        }

        this.waterPlane_ = null;

        // Game hud widget
        this.hudWidget_ = null;
        // Shows how much time is left.
        this.lcdTimeDisplay_ = null;
        this.scoreLayout_ = null;
      
        //if ( !this.isServer_)
        //{
        //    print("If this is not a server my constructor of client: " + client.GetConnectionID());
        //    print("timeleft is: " + this.timeLeft_);
        //}
        this.timeLeft_ = new QTime;
        this.gameTime_ = 120; // secs.
        this.timeLeft_ = this.timeLeft_.addSecs(this.gameTime_);
        this.rowIndex_ = 0;
        this.columnIndex_ = 0;

        // Nest where fish needs to be returned, valid only in client
        this.currentNest_ = null;

        this.animationController_ = me.animationcontroller;
        
        // Create rigid body and volume trigger for nest index 1 and 2
        this.CreateNestTargets();
        
        if (server) {
            // Only server side controller reacts for movement commands.
            me.Action("Move").Triggered.connect(this, this.SetMoveState);
            me.Action("Stop").Triggered.connect(this, this.SetStopState);
            
            /*
            var ids = scene.GetEntityIdsWithComponent("EC_Name");
            for (var i = 0; i < ids.length; ++i) {

                var e = scene.GetEntityRaw(ids[i]);
                if (e.GetComponentRaw("EC_Name").name == "OspreyGame_Fish") {
                    this.fishes_.push(e);
                }
            } */  
        }
        
        else {
            if (me.name == "Osprey_" + client.GetConnectionID()) {
                debug.Log("own osprey" + client.GetConnectionID());
                this.ownAvatar_ = true;
                this.CreateInputMapper();
                this.CreateAvatarCamera();
                this.CreateHUD();
            }
        }
    },
    // Function creates for target nests rigid body and volume triggers. 
    CreateNestTargets : function()
    {
        
/*        for ( var index = 1; index < 3; ++index)
        {
            var nestName = "ospreynest.00" + index;
            var nest = scene.GetEntityByNameRaw(nestName);
            if ( nest == null )
            {
                print("OspreyAvatarController: CreateNestTargets, did not find a nest: " + nestName);
                continue;
                
            }
            
           // Create volume and rigid body for nest.
           var rigidbody = nest.GetOrCreateComponentRaw("EC_RigidBody");
           
           var currentSize = rigidbody.size;
           currentSize.x = 10.0;
           currentSize.y = 10.0;
           currentSize.z = 40.0;
           rigidbody.size = currentSize;
           
           var volume = nest.GetOrCreateComponentRaw("EC_VolumeTrigger");
         
         }*/
   
    },


    /// Returns first water plane which top/below our point is. 
    /// If it is top of any watercubes function will return null - object.

    GetWaterPlane: function(transformation) {

        var waterPlane = null;
        for (var i = 0; i < this.waterPlaneComponents_.length; ++i) {

            var comp = this.waterPlaneComponents_[i];
            if (comp.IsTopOrBelowWaterPlane(transformation.pos)) {
                waterPlane = comp;
                break;
            }
        }

        this.waterPlane_ = waterPlane;
        return waterPlane;

    },

    /// Returns distance from water plane which top/below our osprey is. Note if we are not top of any water plane function will
    /// return null.

    GetDistanceToWaterPlane: function(transformation) {
        var plane = this.GetWaterPlane(transformation);
        if (plane != null) {
            return plane.GetDistanceToWaterPlane(transformation.pos);
        }

        return null;
    },

    // Returns distance to terrain.
    // @param transform is transform object in world coordinate system.

    GetDistanceToTerrain: function(transformation) {

        if (this.terrain_ == null)
            return 0;

        return this.terrain_.GetDistanceToTerrain(transformation.pos);
    },

    SetAnimation: function() {

        var animation = "Plane_1-204";
        /*
        Catch_1-85
        Dive_1-54
        Flap_1-8
        Plane to Dive_1-34
        Plane_1-204
        */
        if (this.motionStateX_ == 1) {
            /// Going forward
            animation = "Flap_1-8";
        }
        else if (this.motionStateX_ == -1) {
            // Dive
            //animation = "Plane to Dive_1-34";
            animation = "Dive_1-54";
            this.planToDiveAnimationStopTime_ = frame.GetWallClockTime() + this.planToDiveAnimationRunTime_;
        }
        else if (this.motionStateY_ == 1 || this.motionStateY_ == -1) {
            // Turn right or left
            animation = "Plane_1-204";

        }

        if (this.motionStateX_ == 2) {
            animation = "Catch_1-85";
        }


        if (this.currentAnimation_ != animation) {

            this.lastAnimation_ = this.currentAnimation_;
            this.currentAnimation_ = animation;
        }

        this.animationController_.animationState = animation;

    },

    SetMoveState: function(action) {

        if (action == "forward") {
            this.motionStateX_ = 1;
        }
        else if (action == "dive") {
            // We can dive only if we are height enough
            var tm = me.placeable.transform;

            distanceToTerrain = this.GetDistanceToTerrain(tm);
            distanceToWaterPlane = this.GetDistanceToWaterPlane(tm);

            if (distanceToWaterPlane == null || distanceToTerrain == null)
                return;

            if (distanceToWaterPlane < distanceToTerrain) {
                // Above water plane
                if (distanceToWaterPlane > this.minDiveDelta_)
                    this.motionStateX_ = -1;
                //else
                //    print("Cannot dive not enough height!!!");

            }
            else {
                // Above terrain
                if (distanceToTerrain > this.minDiveDelta_)
                    this.motionStateX_ = -1;
                //else
                //    print("Cannot dive not enough height!!!");

            }

        }
        else if (action == "right") {
            this.motionStateY_ = 1;
        }
        else if (action == "left") {
            this.motionStateY_ = -1;
        }

        this.SetAnimation();

    },


    SetStopState: function(action) {

        if ((action == "forward") && (this.motionStateX_ == 1)) {
            this.motionStateX_ = 0;
        }
        else if ((action == "dive") && (this.motionStateX_ == -1)) {
            this.motionStateX_ = 0;
        }
        else if ((action == "right") && (this.motionStateY_ == 1)) {
            this.motionStateY_ = 0;
        }
        else if ((action == "left") && (this.motionStateY_ == -1)) {
            this.motionStateY_ = 0;
        }

        this.SetAnimation();

    },

    CreateHUD: function() {

        // Creates a game hud.

        var file ="local://osprey_game_hud.ui";
        
        this.hudWidget_ = ui.LoadFromFile(file, false);
        if (this.hudWidget_ == null) {
            print("OspreyAvatarController: LoadFromFile ui-file:" + file + " failed.");
            return;
        }

        this.lcdTimeDisplay_ = findChild(this.hudWidget_, "lcdTime");
        if (this.lcdTimeDisplay_ == null) {
            print("OspreyAvatarController: Did not find time display");
            return;
        }
        var butExit = findChild(this.hudWidget_, "butExit");

        if (butExit == null) {
            print("OspreyAvatarController: Did not find exit button");
            return;
        }

        butExit.clicked.connect(this, this.ExitGame);

        this.scoreLayout_ = findChild(this.hudWidget_, "scoreLayout");
        if ( this.scoreLayout_ == null )
        {
            print("OspreyAvatarController: Did not find scoreLayout");
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
        frame.DelayedExecute(this.gameTime_ - 1).Triggered.connect(this, this.ExitGame);

    },

    ExitGame: function() {

        this.hudWidget_.hide();
        this.hudWidget_ = null;
        this.lcdTimeDisplay_ = null;
        this.scoreLayout_ = null;
        
        this.RemoveNestNote();
        
        //Find own avatar in scene, and activate its camera, for just in case we do this in this order. 

        var avatarCamera = scene.GetEntityByNameRaw("AvatarCamera");
        if (avatarCamera.HasComponent("EC_OgreCamera")) {
            var camera = avatarCamera.GetComponentRaw("EC_OgreCamera");
            camera.SetActive();
        }
        else {
            print("Did not find camera Avatar camera!!");

        }

        // Remove Osprey Camera
        scene.RemoveEntityRaw(scene.GetEntityByNameRaw("OspreyAvatarCamera").id); //XXX \todo: assumes single player!

        //Send message to server to stop game. 

        var gameName = "OspreyGame";
        var gameEntity = scene.GetEntityByNameRaw(gameName);
        if (gameEntity != null) {
            gameEntity.Exec(2, "StopGame", client.GetConnectionID());
        }
        
        // Show main right panel
        
        var ids = scene.GetEntityIdsWithComponent("EC_Name");
        for (var i = 0; i < ids.length; ++i) {

            var e = scene.GetEntityRaw(ids[i]);
            if (e.GetComponentRaw("EC_Name").name == "MainHud") {
                e.Exec(1, "ShowMainUI");
            }
        }

    },

    OnWindowSizeChanged: function() {

        if ( this.hudWidget_ != null )
        {
            var gscene = ui.GraphicsScene();
            this.hudWidget_.resize(gscene.width(), 115);
            this.hudWidget_.move(0, 10);
        }
    },


    CreateInputMapper: function() {

        // Create a nonsynced inputmapper

        var inputmapper = me.GetOrCreateComponentRaw("EC_InputMapper", 2, false);

        inputmapper.contextPriority = 103;
        //inputmapper.takeMouseEventsOverQt = true;
        inputmapper.takeKeyboardEventsOverQt = true;
        inputmapper.modifiersEnabled = false;
        inputmapper.executionType = 2; // Execute actions on server
        inputmapper.keyrepeatTrigger = false;

        inputmapper.RegisterMapping("W", "Move(forward)", 1);
        inputmapper.RegisterMapping("S", "Move(dive)", 1);
        inputmapper.RegisterMapping("A", "Move(left)", 1);
        inputmapper.RegisterMapping("D", "Move(right))", 1);

        inputmapper.RegisterMapping("W", "Stop(forward)", 3);
        inputmapper.RegisterMapping("S", "Stop(dive)", 3);
        inputmapper.RegisterMapping("A", "Stop(left)", 3);
        inputmapper.RegisterMapping("D", "Stop(right)", 3);

    },

    CreateAvatarCamera: function() {


        if (scene.GetEntityByNameRaw("OspreyAvatarCamera") != null)
            return;

        var cameraentity = scene.CreateEntityRaw(scene.NextFreeIdLocal());
        cameraentity.SetName("OspreyAvatarCamera");
        cameraentity.SetTemporary(true);

        var camera = cameraentity.GetOrCreateComponentRaw("EC_OgreCamera");
        var placeable = cameraentity.GetOrCreateComponentRaw("EC_Placeable");

        camera.AutoSetPlaceable();
        camera.SetActive();

        // Set initial position
        this.UpdateOspreyAvatarCamera();


    },

    Update: function(frameTime) {
        if (!this.IsServer_ && this.ownAvatar_) {
            // On client adjust camera position.
            this.UpdateOspreyAvatarCamera(frameTime);
            // Updates time left display.
            this.UpdateTimeLeft(frameTime);

            if (this.playerID_ == null) {
                // This is quite hackish way to transfer connection id, but we need to fix a bug that if osprey game player leaves from game and 
                // there exist water splass effects running which we want to clean away.
                me.Exec(2, "PlayerID", client.GetConnectionID());
                this.playerID_ = client.GetConnectionID();
            }

        }
        else if (this.IsServer_) {

            // On server run correct animation, and move & rotate osprey mesh.

            if (this.animationController_ == null)
                return;
	    
            var animation = this.animationController_.animationState;

            // If we are running special animation catch-fish we end it if it has run too long.
            if (animation != null && animation == "Catch_1-85" && this.catchAnimationStopTime_ <= frame.GetWallClockTime()) {
                // If we are still doing catch animation --> change it to new.
                if (this.motionStateX_ == 2)
                    this.motionStateX_ = 1;

                //print("Stop catch-fish-animation");        
                this.SetAnimation();
                animation = this.animationController_.animationState;
            }

            /*
            if ( animation != null && animation == "Plane to Dive_1-34" && this.planToDiveAnimationStopTime_ <= frame.GetWallClockTime() )
            {
            // Change animation from plan to dive to dive.
               
            this.animationController_.animationState = "Dive_1-54";
            animation = this.animationController_.animationState;
                
            }
            */


            if (animation != "" && animation != null && !this.animationController_.IsAnimationActive(animation)) {
                me.Exec(7, "StopAllAnims", "0.25");
                me.Exec(7, "PlayLoopedAnim", animation, "0.25");
            }

            // Moves osprey to new location.
            this.MoveOsprey(frameTime);
        }


    },

    UpdateTimeLeft: function(frameTime) {

        if (this.lcdTimeDisplay_ != null) {
            this.timeLeft_ = this.timeLeft_.addMSecs(-frameTime * 1000.0);
            var text = this.timeLeft_.toString("mm:ss");
            //this.lcdTimeDisplay_.display(text);
            this.lcdTimeDisplay_.setText(text);
        }

    },

    UpdateOspreyAvatarCamera: function(frameTime) {


        var cameraentity = scene.GetEntityByNameRaw("OspreyAvatarCamera");

        if (cameraentity == null)
            return;

        var cameraplaceable = cameraentity.placeable;
        var avatarplaceable = me.placeable;

        var cameratransform = cameraplaceable.transform;
        var avatartransform = avatarplaceable.transform;
        var offsetVec = new Vector3df();
        offsetVec.x = -this.ospreyCameraDistance_;
        offsetVec.z = this.ospreyCameraHeight_;
        offsetVec = avatarplaceable.GetRelativeVector(offsetVec);

        // Note: this is not nice how we have to fudge the camera rotation to get it to show the right things

        var animcontroller = me.animationcontroller;

        if (animcontroller.IsAnimationActive("Plane to Dive_1-34")) {

            /// Here we try to make smooth camera drive so that dive animation looks nice in client side.
            cameratransform.rot.z = avatartransform.rot.z - 90;

            if (Math.abs(cameratransform.rot.x) < this.deltaDive_) {
                cameratransform.rot.x = 0;
                cameratransform.pos.z = avatartransform.pos.z + (this.avatarCamRotDefaultX_ - cameratransform.rot.x) * this.diveHeightRelation_;
            }
            else {
                cameratransform.rot.x -= (180 / Math.PI * this.angularSpeed_ * frameTime) % 360
                cameratransform.pos.z = avatartransform.pos.z + (this.avatarCamRotDefaultX_ - cameratransform.rot.x) * this.diveHeightRelation_;
            }


            cameratransform.pos.x = avatartransform.pos.x + (offsetVec.x / this.avatarCamRotDefaultX_) * cameratransform.rot.x;
            cameratransform.pos.y = avatartransform.pos.y + (offsetVec.y / this.avatarCamRotDefaultX_) * cameratransform.rot.x;
            //cameratransform.pos.y = avatartransform.pos.y + (offsetVec.y / this.avatarCamRotDefaultX_) * cameratransform.rot.y;

        }
        else {


            cameratransform.rot.x = this.avatarCamRotDefaultX_;
            cameratransform.rot.z = avatartransform.rot.z - 90;

            cameratransform.pos.x = avatartransform.pos.x + offsetVec.x;
            cameratransform.pos.y = avatartransform.pos.y + offsetVec.y;
            cameratransform.pos.z = avatartransform.pos.z + offsetVec.z;
        }

        cameraplaceable.transform = cameratransform;

    },

    MoveOsprey: function(frameTime) {
        return;
        var tm = me.placeable.transform;

        if (this.motionStateY_ == 1) {

            // Turn right

            this.angle_ = this.angle_ - this.angularSpeed_ * frameTime;

            tm.rot.z = (180 / Math.PI * this.angle_) % 360;


            var r = (180 / Math.PI * (this.angularSpeed_ * frameTime));
            tm.rot.x = (tm.rot.x + r) % 360;

            if (tm.rot.x > this.maxTurningAngle_)
                tm.rot.x = this.maxTurningAngle_;

        }

        if (this.motionStateY_ == -1) {

            // Turn left.

            this.angle_ = this.angle_ + this.angularSpeed_ * frameTime;

            tm.rot.z = (180 / Math.PI * this.angle_) % 360;

            var r = (180 / Math.PI * (this.angularSpeed_ * frameTime));
            tm.rot.x = (tm.rot.x - r) % 360;

            if (Math.abs(tm.rot.x) > this.maxTurningAngle_)
                tm.rot.x = -this.maxTurningAngle_;


        }

        if (this.motionStateX_ == 1) {

            // Go forward, get speed and go higher

            this.speed_ = this.speed_ + this.acceleration_ * frameTime;

            // There exist a speed limit.
            if (this.speed_ > this.maxSpeed_)
                this.speed_ = this.maxSpeed_;

            tm.pos.z += frameTime * this.speed_;

            if (this.motionStateY_ == 0 && tm.rot.x != 0) {
                if (Math.abs(tm.rot.x) < this.deltaDiffAngle_)
                    tm.rot.x = 0;
                else {
                    var r = (180 / Math.PI * (this.angularSpeed_ * frameTime));
                    if (tm.rot.x > 0)
                        tm.rot.x = (tm.rot.x - r) % 360;
                    else
                        tm.rot.x = (tm.rot.x + r) % 360;

                }


            }


            // Reset dive speed
            if (this.dive_speed_ != 0)
                this.dive_speed_ = 0;

            // Reset glide downward speed    
            if (this.glide_speed_z_ != 0)
                this.glide_speed_z_ = 0;

        }


        if (this.motionStateX_ == 0) {

            // Go forward and lose height, lose forward speed (little bit)

            this.speed_ = this.speed_ - 0.2 * this.acceleration_ * frameTime;
            this.glide_speed_z_ += this.glide_acceleration_ * frameTime

            if (this.glide_speed_z_ > this.maxDiveSpeed_)
                this.glide_speed_z_ = this.maxDiveSpeed_;

            if (this.speed_ < this.minSpeed_) {
                // Speed too low start to get more speed.
                this.motionStateX_ = 1;
                this.SetAnimation();
            }

            if (this.motionStateY_ == 0 && tm.rot.x != 0) {
                if (Math.abs(tm.rot.x) < this.deltaDiffAngle_)
                    tm.rot.x = 0;
                else {
                    var r = (180 / Math.PI * (this.angularSpeed_ * frameTime));

                    if (tm.rot.x > 0)
                        tm.rot.x = (tm.rot.x - r) % 360;
                    else
                        tm.rot.x = (tm.rot.x + r) % 360;


                }

            }

            // Reset dive speed.
            if (this.dive_speed_ != 0)
                this.dive_speed_ = 0;

            tm.pos.z -= frameTime * this.glide_speed_z_;

        }

        if (this.motionStateX_ == -1) {

            // Dive.
            this.dive_speed_ = this.dive_speed_ + this.dive_acceleration_ * frameTime;

            if (this.dive_speed_ < this.maxDiveSpeed_)
                this.dive_speed_ = this.maxDiveSpeed_;

            tm.pos.z -= frameTime * this.dive_speed_;

            if (Math.abs(tm.rot.x) < this.deltaDiffAngle_)
                tm.rot.x = 0;
            else {
                var r = (180 / Math.PI * (this.angularSpeed_ * frameTime));

                if (tm.rot.x > 0)
                    tm.rot.x = (tm.rot.x - r) % 360;
                else
                    tm.rot.x = (tm.rot.x + r) % 360;


            }

        }

        if (this.motionStateX_ == 2) {

            // When osprey starts catch fish animation, we slow it speed very much. 
            this.speed_ = this.speed_ - 5.0 * this.acceleration_ * frameTime;

            // There exist a speed min.
            if (this.speed_ < this.minSpeed_)
                this.speed_ = this.minSpeed_;

            var distanceToWaterPlane = this.GetDistanceToWaterPlane(tm);

            // Next lines are little bit intresting. 
            /// 1. If our animation is running, and we are below water plane, we try to heavily get up 
            /// 2. If our animation is running (just started) and we are above force our bird to go partial "under water". 

            if (distanceToWaterPlane < 0) {
                tm.pos.z += this.speed_ * frameTime;
                // Ok we have now go at least once below water, so set dive speed to zero, so that next time as we run this code we do not drop z position anymore.
                if (this.dive_speed_ != 0)
                    this.dive_speed_ = 0;


            }
            else {

                if (distanceToWaterPlane < this.diveWaterDelta_) {
                    //print("Catch fish, state that animation is started but our osprey is not yet near water..");
                    tm.pos.z -= frameTime * this.dive_speed_;

                }
            }


            if (distanceToWaterPlane < 0 || distanceToWaterPlane < (this.diveWaterDelta_ - 0.5)) {
                if (!(this.particleLimitter_ % 4)) {
                    this.RunWaterParticleEffects(tm);
                    this.particleLimitter_ = 1;
                }
                else
                    this.particleLimitter_ += 1;

            }
        }



        tm.pos.x += frameTime * this.speed_ * Math.cos(this.angle_);
        tm.pos.y += frameTime * this.speed_ * Math.sin(this.angle_);

        // Now check that is our osprey too low. 
        var distanceToTerrain = this.GetDistanceToTerrain(tm);
        var distanceToWaterPlane = this.GetDistanceToWaterPlane(tm);

        if (distanceToWaterPlane != null
            && distanceToWaterPlane > 0
            && distanceToTerrain > distanceToWaterPlane) {

            // We are above of water plane.
            if (this.motionStateX_ == -1) {
                /// We are diving.   
                if (distanceToWaterPlane < this.diveWaterDelta_) {


                    // Did we hit to fish ? 
                    //print("Did we catch fish (above water plane) ???");

                    if (this.CatchFish(tm)) {

                        //if (distanceToWaterPlane < (this.diveWaterDelta_ - 0.5 ))
                        this.RunWaterParticleEffects(tm);

                        // Run special catch-fish animation.
                        this.motionStateX_ = 2;
                        this.catchAnimationStopTime_ = frame.GetWallClockTime() + this.catchAnimationRunTime_;
                        this.SetAnimation();
                    }
                    else {
                        // Did not catch fish, stop diving start new move. 
                        //if (distanceToWaterPlane < (this.diveWaterDelta_ - 0.5 ))
                        this.RunWaterParticleEffects(tm);

                        this.motionStateX_ = 0;
                        // Get more height.
                        tm = this.AiMove(tm, distanceToTerrain, distanceToWaterPlane);
                    }
                }
            }
            else if (distanceToWaterPlane < this.waterDelta_) {
                // We are too low. Start to get some height.
                tm = this.AiMove(tm, distanceToTerrain, distanceToWaterPlane);
            }

            // Clamp that we do not go too high.
            if (distanceToWaterPlane > 0 && (this.maxHeight_ - distanceToWaterPlane) < 0) {
                tm.pos.z -= this.speed_ * frameTime;
            }


        }
        else if (distanceToWaterPlane != null
                  && distanceToWaterPlane > 0
                  && distanceToTerrain < distanceToWaterPlane) {

            /// We are above of land.


            if (distanceToTerrain < this.terrainDelta_) {

                // We are too low, start to get more height.

                if (this.motionStateX_ == -1) {
                    // If we are diving stop diving (we are above terrain)
                    this.motionStateX_ = 0;
                }

                tm = this.AiMove(tm, distanceToTerrain, distanceToWaterPlane);


            }

            // Clamp that we do not go too high.
            if (distanceToTerrain > 0 && (this.maxHeight_ - distanceToTerrain) < 0) {
                tm.pos.z -= this.speed_ * frameTime;
            }


        }

        // Ok we have now moved z to new position, check that we did not fail (sanity..)

        distanceToTerrain = this.GetDistanceToTerrain(tm);
        distanceToWaterPlane = this.GetDistanceToWaterPlane(tm);

        if (distanceToTerrain < 0 || (distanceToWaterPlane != null && distanceToWaterPlane < 0)) {

            // Force flying.
            if (this.motionStateX_ == 0) {
                this.motionStateX_ = 1;
                this.SetAnimation();

            }
            else if (this.motionStateX_ == -1 && distanceToWaterPlane < 0) {
                // We have come so fast down that our in dive-mode so that our osprey is below water plane.  
                if (this.CatchFish(tm)) {
                    this.RunWaterParticleEffects(tm);

                    // Run special catch-fish animation.
                    this.motionStateX_ = 2;
                    this.catchAnimationStopTime_ = frame.GetWallClockTime() + this.catchAnimationRunTime_;

                    this.SetAnimation();
                }
                else {

                    this.RunWaterParticleEffects(tm);
                    this.motionStateX_ = 0;
                    // Get more height.
                    tm = this.AiMove(tm, distanceToTerrain, distanceToWaterPlane);
                }


            }
            else {
                if (distanceToTerrain < 0) {
                    // We are below terrain... do heavy stuff..
                    tm.pos.z += Math.abs(distanceToTerrain) + 0.1;
                }
                //else
                //print("Not below terrain but something strange..: " + this.motionStateX_ );
            }


        }

        // Check that is our position inside of target nest.
        if ( this.carryingFish_ )
        {
            if( this.currentNest_ != null && this.currentNest_.HasComponent("EC_VolumeTrigger") )
            {
                var volume = this.currentNest_.GetComponentRaw("EC_VolumeTrigger");
                if ( volume.IsInsideVolume(tm.pos) )
                {
                    me.Exec(7,"FishScore", this.playerID_);
                    this.carryingFish_ = false;
                    this.currentNest_ = null;
                    
                }
                
            }
        }
        
        me.placeable.transform = tm;

    },

    CatchFish: function(tm) {
        // Currently always find fish...
        // Fish bones :
        /*
        Head
        Spine_4
        branchia_L
        fin_L
        fin_R
        Tail
        Mouth
        branchia_R
        Spine_3
        Spine_2
        Spine_1
        */

        // Osprey bones:
        /*
        leath_2-1_L
        leath_5-1_L
        leath_1-1_R
        head-leath_1.001
        hook1_R
        hook1_L
        leath_1-1_L
        head-leath_1
        leath_5-1_R
        leath_2-1_R
        Wings3_R
        hook2_L
        leath_3-2_R
        Wings1_R
        Wings2_R
        leath_3-1_R
        Wings3_L
        spine1
        tail
        spine2
        leath_3-1_L
        Wings2_L
        leath_2-2_R
        leath_3-2_L
        hook2_R
        head
        leath_6-2_R
        leath_6-1_L
        leath_1-2_L
        leath_2-2_L
        Wings1_L
        leath_1-2_R
        leath_6-2_L
        leath_6-1_R
        leg2_L
        leath_4-2_L
        tail_leather_R
        neck
        leath_4-1_R
        leg1_R
        leath_5-2_L
        leg1_L
        leath_5-2_R
        leath_4-1_L
        leg2_R
        leath_4-2_R
        tail_leather_L
        
        */

    
        // Deal if fish is set, cannot catch another before old is returned to nest..
        
        if (!this.carryingFish_) {
         
           // Search through all fish entities that are we enough close to "catch" fish.
           
           var fishPos = new Vector3df;
           var d = null;
           var ospreyPos = tm.pos;
           var fish = null;
           
           for (var i = 0; i < this.fishes_.length; ++i)
           {
                fishPos = this.fishes_[i].placeable.transform.pos;
                d  = (fishPos.x - ospreyPos.x)*(fishPos.x - ospreyPos.x) + (fishPos.y - ospreyPos.y) * (fishPos.y - ospreyPos.y) + (fishPos.z - ospreyPos.z)* (fishPos.z - ospreyPos.z);
                if ( d  < this.fishCatchDistance_) 
                {
                    fish = this.fishes_[i];
                    break;    
                }   
           }
       
            if ( fish != null )
            {
                this.carryingFish_ = true;
                var fishID = fish.id;
                me.Exec(7, "FishCatched", fishID, this.playerID_);
                // Create target nest where fish is needed to bring.
                this.CreateTargetNest() ;
                return true;
            }
        }
        //print("Cannot set fish mesh because there exist allready fish ...");
        return false;
    },

    AddScore : function(playerID)
    {   
        // Only in client side, remove nest note. Add to ui one point.
        if (!this.IsServer_  && this.ownAvatar_ && client.GetConnectionID() == playerID)
        {
            this.RemoveNestNote();
            if ( this.scoreLayout_ != null )
            {
                var fishAsset = asset.GetAsset("local://fishON.png").get();
                
                var fishFileName = fishAsset.DiskSource();
                var image = new QPixmap(fishFileName);
             
                var index = this.columnIndex_ + (this.rowIndex_ * 5)+1;
                var name = "fish_" + index;
                var fishWidget = findChild(this.hudWidget_, name);
                if (fishWidget == null )
                {
                    var label = new QLabel;
                    label.setPixmap(image);
                    this.scoreLayout_.addWidget(label, this.rowIndex_, this.columnIndex_);
                    label.show();
                }
                else
                {
                    fishWidget.setPixmap(image);
                }
                
                /// Magic we want five icons to one row.
                if ( this.columnIndex_ > 5 )
                {
                    this.columnIndex_ = 0;
                    this.rowIndex_ += 1;     
                }  
                else
                    this.columnIndex_ +=1;
                    
                this.scoreLayout_.setEnabled(true);
               
            }
        }
    },

    RemoveNestNote : function()
    {
       var name = "NestNote_" + this.playerID_;
       
       // If there all ready exist a note --> Remove it!
       var tmpObj = scene.GetEntityByNameRaw(name);
       if ( tmpObj !=null )
       {    
            //Remove old.
            scene.RemoveEntityRaw(tmpObj.id);
       }
    
    },
    
    /// Creates on client nest note. 
    CreateNestNote : function(id, playerID)
    {
       if ( !this.ownAvatar_ || client.GetConnectionID() != playerID)
            return;
       
       // Create local entity which has particle effect and it tells player where to return fish..
       var name = "NestNote_" + this.playerID_;
       
       // If there all ready exist a note --> Remove it!
       var tmpObj = scene.GetEntityByNameRaw(name);
       if ( tmpObj !=null )
       {    
            //Remove old.
            scene.RemoveEntityRaw(tmpObj.id);
       }
      
       var nest = scene.GetEntityRaw(id);
       if ( nest == null )
       {
            print("OspreyAvatarController: Nest object id: " + id + " was null");
            return;
       }
       this.currentNest_ = nest; 
      
       // Create note only in client 
       
       if (!this.IsServer_ )
       {
            // Create new one.
            var entity = scene.CreateEntityRaw(scene.NextFreeIdLocal(),["EC_Name", "EC_Placeable", "EC_Script"],2,false);
            entity.SetTemporary(true);
            entity.SetName(name);


            if ( nest.HasComponent("EC_Placeable") )
            {
                var transform = nest.placeable.transform;
                
                // Create note on nest.
                
                var meshComp = entity.GetOrCreateComponentRaw("EC_Mesh", 2, false);
                var meshRef = meshComp.meshRef;
                meshRef.ref = "local://gold_osprey_statue.mesh";
                meshComp.meshRef = meshRef;
                
                var skeletorRef = meshComp.skeletonRef;
                skeletorRef.ref = "local://gold_osprey_statue.skeleton";
                meshComp.skeletonRef = skeletorRef;

                var materials = meshComp.meshMaterial;  
                materials = ["local://m_gold_osprey.material"];
                meshComp.meshMaterial = materials;
                
                // Add rotate script to mesh..
                
                var script = entity.script;
                script.type = "js";
                script.runOnLoad = true;
                var r = script.scriptRef;

                r.ref = "local://osprey_nest_controller.js";
                script.scriptRef = r;
                entity.script = script;
                
                var tm = entity.placeable.transform;
                tm.pos.x = transform.pos.x;
                tm.pos.y = transform.pos.y;
                // Mesh is created 2 meter above nest.
                tm.pos.z = transform.pos.z+2;
                entity.placeable.transform = tm;

                scene.EmitEntityCreated(entity,2);

                
            }
            else {
            
                print("OspreyAvatarController: Nest did not have placeable..");
                return
            }
       }
    
    },

    // Creates target nest where user needs to bring catched fish.
    
    CreateTargetNest : function()
    {
        
       // Choose randomly nest which is used as place to return fish.
       var index = Math.round(Math.random())+1;
       var nestName = "ospreynest.00" + index;
      
       var nest = scene.GetEntityByNameRaw(nestName);
       
       if ( nest == null )
       {
            print("OspreyAvatarController: did not find a nest: " + nestName);
            return;
       }
       
       this.currentNest_ = nest; 
     
       me.Exec(4,"CreateNestNote", nest.id, this.playerID_); 
       
    },

    AiMove: function(tm, distanceToTerrain, distanceToWaterPlane) {

        // Currently do not to anything else then start forward flying...

        if (this.motionStateX_ == 0) {
            this.motionStateX_ = 1;
            this.SetAnimation();
        }


        return tm;

    },

    StopWaterParticleEffects: function() {
        if (this.waterParticleEntity_.lenght != 0) {
            var id = this.waterParticleEntity_.pop().id;

            scene.RemoveEntityRaw(id);

        }
    },

    SetPlayerID: function(id) {
        this.playerID_ = id;
    },

    RunWaterParticleEffects: function(trans) {

        var entity = scene.CreateEntityRaw(scene.NextFreeId(), ["EC_Placeable"]);
        var name = "WaterSplass_" + this.playerID_;
        entity.SetName(name);
        this.waterParticleEntity_.push(entity);

        var parOne = entity.GetOrCreateComponentRaw("EC_ParticleSystem", "1");
        var parRef = parOne.particleRef;
        parRef.ref = "local://watersplash.particle";
        parOne.particleRef = parRef;

        var parTwo = entity.GetOrCreateComponentRaw("EC_ParticleSystem", "2");
        parRef.ref = "local://watersplash_drops.particle";
        parTwo.particleRef = parRef;

        var parThree = entity.GetOrCreateComponentRaw("EC_ParticleSystem", "2");
        parRef.ref = "local://watersplash_hispeed.particle";
        parThree.particleRef = parRef;

        var tm = entity.placeable.transform;
        tm.pos.x = trans.pos.x;
        tm.pos.y = trans.pos.y;
        tm.pos.z = trans.pos.z;
        entity.placeable.transform = tm;

        scene.EmitEntityCreated(entity);

        frame.DelayedExecute(this.particleEffectsRunTime_).Triggered.connect(this, this.StopWaterParticleEffects);

    },

    SetFish: function(id, playerID) {
        
        //if ( !this.isServer_ && client.GetConnectionID() != playerID)
        //    return;
        
        // Fish entity.
        var entity = scene.GetEntityRaw(id);
        if ( entity.HasComponent("EC_Mesh") && this.fishMesh_ == null )
        {
             var fishMesh = entity.GetComponentRaw("EC_Mesh");
           
             fishMesh.AttachMeshToBone(me.GetComponentRaw("EC_Mesh"), "hook1_R");
             
             var tm = fishMesh.nodeTransformation;
         
             tm.scale.x = 0.1;
             tm.scale.y = 0.1;
             tm.scale.z = 0.1;
             tm.rot.x = 180;
             fishMesh.nodeTransformation = tm;
             
             this.fishMesh_ = fishMesh;
        }
    },

    RemoveFish: function(playerID) {
        
        if ( !this.isServer_ && client.GetConnectionID() != playerID)
                return;
        
        if ( this.fishMesh_ != null )
        {
            this.fishMesh_.DetachMeshFromBone();
            this.fishMesh_ = null;
        }
    },

});

// We want to create connection before we create controller
me.Action("PlayerID").Triggered.connect(SetPlayerID);
me.Action("FishCatched").Triggered.connect(SetFishMeshOn);
me.Action("FishScore").Triggered.connect(SetScore);
me.Action("CreateNestNote").Triggered.connect(CreateNestNote);
//me.Action("CreateController").Triggered.connect(CreateController);

// Create correct instance and connect it frame update loop.

var controller_ = null;

if ( server != null && server.IsRunning() )
    {
      
        controller_ = new OspreyController(true);
    }
    else
    {
       controller_ = new OspreyController(false);
    }


/*
function CreateController(userId)
{
 
    if ( server != null && server.IsRunning() )
    {
        print("Create controller to server..");
        controller_ = new OspreyController(true);
    }
    else if ( userId == client.GetConnectionID() )
    {
        print("Create controller for userID: " + userId + " Our id is : " + client.GetConnectionID());
        controller_ = new OspreyController(false);
    }
}
*/

function SetPlayerID(id)
{
    if ( controller_ != null )
        controller_.SetPlayerID(id);
}

function SetFishMeshOn(fishID, playerID)
{
    if ( controller_ != null )
    {
        controller_.SetFish(fishID, playerID);
        //controller_.CreateTargetNest();
    }
}

function SetScore(playerID)
{
    if ( controller_ != null )
    {
        controller_.RemoveFish(playerID);
        controller_.AddScore(playerID);
    }
        
}

function CreateNestNote(id, playerID)
{
    if ( controller_ != null && !server.IsRunning() )
        {
            controller_.CreateNestNote(id, playerID);
        }
   
}

function Update(frameTime) {
    if ( controller_ != null ) {
        controller_.Update(frameTime);
    }
    else {
	//print('o');
    }
}

frame.Updated.connect(Update);

