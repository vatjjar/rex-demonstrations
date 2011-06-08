print(" --- Loading Knon core.");
/* knon game core
triggers (String[]) : list of buttons to be pressed by name raw*/
function KnonCore(triggers,overtriggers){
	this.briks = [];
	this.boulet = new MeshBounds("geom-boulet"); // ---- bullet
	this.support = new MeshBounds("geom-kn_support"); // --- canon support
	this.canon = new MeshBounds("geom-kn_canon"); // ---- canon body
	this.varname = createClassVarName("KnonCore");
	eval("var "+this.varname+" = this;");
	this.scoreDisp = new KnonDisp();
	//-------- 
	this.knonRot = [0,0,0];
	this.knonSpeed = 15;
	print("server.IsRunning()="+server.IsRunning());
	// --------------- add button to be pressed by name raw
	this.addTrigger = function(name){
	
		print("addTrigger '"+name+"' ");
		print("      => "+scene.GetEntityByNameRaw(name).name);
		
		eval("scene.GetEntityByNameRaw(\""+name+"\").Action(\"MousePress\").Triggered.connect(function(){"+this.varname+".reactor(\""+name+"\");});");
	};
	this.addOverTrigger = function(name){
		print("addTrigger '"+name+"' ");
		print("      => "+scene.GetEntityByNameRaw(name).name);
		
		eval("scene.GetEntityByNameRaw(\""+name+"\").Action(\"MouseHover\").Triggered.connect(function(){"+this.varname+".reactor(\""+name+"\");});");
	};
	// ---------------- react on trigger  "MousePress" event
	this.reactor = function(name){
		
		print("KnonCore react on '"+name+"'.");
		if(name=="geom-kn_fire"){ // ---------- trows bullet
			if(this.scoreDisp.bullets>0 && !this.scoreDisp.reload){
				this.scoreDisp.bullets--;
				var krot = YTr.deg2rad(this.canon.getRot());
				//ball speed
				var vshoot = [0,0,17];
				
				var xr =  YTr.rotatorX(krot[0]);
				var zr =  YTr.rotatorZ(krot[2]);
				var fvek = zr.transform(xr.transform(vshoot));
				print("shoot : rot="+this.canon.getRot()+" __ "+krot+" fvek="+fvek);
				this.boulet.mesh.rigidbody.mass = 50;
				
				// calls this.fire_bullet_SERVER on server side
				var datasStr = "var vk = ["+fvek+"];var caller = "+this.varname+";";
				me.Exec(2, "KnonFireRequest", datasStr); 
				
				this.scoreDisp.reload = true;
			}else{
			}
			
		}else if(name=="geom-kn_left"){ // ------- turn canon left
			this.knonRot = [0,0,this.knonSpeed];
		}else if(name=="geom-kn_right"){ // ------- turn canon right
			this.knonRot = [0,0,-this.knonSpeed];
		}else if(name=="geom-kn_top"){ // ------------- turn canon up
			this.knonRot = [-this.knonSpeed,0,0];
		}else if(name=="geom-kn_down"){ // ------------ turn canon down
			this.knonRot = [this.knonSpeed,0,0];
		}else if(name=="geom-kn_reload"){ // ----------- scene parametters reinit
			if(this.scoreDisp.bullets>0){
				this.boulet.mesh.rigidbody.mass = 0;
				this.scoreDisp.reload = false;
				this.boulet.reset();
			}
		}else if(name=="geom-kn_reset"){ // ----------- scene parametters reinit
			this.briks_on();
			this.boulet.mesh.rigidbody.mass = 0;
			this.boulet.reset();
			this.scoreDisp.reset();
		}
	};
	// ------------------------- reset bricks to initial coordinates and set mass
	this.briks_on = function(){
		for(var i=0;i<48;i++){
		//var ps = this.briks[i].mesh.rigidbody;
			this.briks[i].reset();
			this.briks[i].mesh.rigidbody.mass = 1;
		}
	};
	// ---------------------- anim refreshing
	this.fire = new YButton("geom-kn_reload");
	this.anim = function(frametime){
		var scor = 0;
		for(var i=0;i<48;i++){
			var pos = this.briks[i].getPos();
			if(this.briks[i].r_pos[2] - pos[2] >10)scor++;
		}
		this.scoreDisp.setScore(scor);
		scene.GetEntityByNameRaw("geom-kn_fire").placeable.visible = !this.scoreDisp.reload;
		scene.GetEntityByNameRaw("geom-kn_reload").placeable.visible = this.scoreDisp.bullets>0;
		
		this.support.incrRot(	[0,0,this.knonRot[2]*frametime]	);
		this.canon.incrRot(	[this.knonRot[0]*frametime,0,this.knonRot[2]*frametime]	);
		this.knonRot = [0,0,0];
		//print("this.fire="+this.fire.isDown);
	};
	// -------------------------------------------------------------------------- server side
	this.fire_bullet_SERVER = function(datasStr){
		eval(datasStr);
		caller.boulet.mesh.rigidbody.SetLinearVelocity(YTr.toVector3df(vk));
	};
	if (server.IsRunning()){
		me.Action("KnonFireRequest").Triggered.connect(this.fire_bullet_SERVER);
	}
		//********************
		//scene.ActionTriggered(scene,"KnonFireRequest",[""],2);
		// => crashes down tundra : Tundra_v1.0.5-server-20110428-030605-3892-3520.dmp
		//********************
		//printObj(scene,"scene");
	// -------------------------------------------------------------------------- init parametters
	// ------------------ triggers
	for(var i=0;i<triggers.length;i++)this.addTrigger(triggers[i]);
	// ------------------ overtriggers
	for(var i=0;i<overtriggers.length;i++)this.addOverTrigger(overtriggers[i]);
	// ------------------ briks
	for(var i=0;i<48;i++){
		var nam = "geom-Brik"+(i<9?"0":"")+(i+1);
		var mb = new MeshBounds(nam);
		mb.r_pos = [ mb.r_pos[0]*1.05, mb.r_pos[1] , mb.r_pos[2]*1.05 ];
		// collision type
		mb.mesh.rigidbody.shapeType = 0;
		this.briks.push(mb);
	}
	// ------------------ canon
	this.canon.r_rot = [0,0,0];//scene error correction
	this.canon.reset();
	//this.canon.mesh.placeable.visible = false;
	// ------------------ bullet
	this.boulet.r_pos[2]+=-0.5;
}
//------------------------------------------------ score display
engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");
function KnonDisp(){
	this.text = "";
	this.score = 0;
	this.bullets = 0;
	this.reload = true;
	
	this.label = new QLabel();
	this.label.indent = 10;
	this.label.text = "";
	this.label.resize(200,50);
	this.label.setStyleSheet("QLabel {background-color: transparent; font-size: 16px; }");

	this.proxy = new UiProxyWidget(this.label);
	try{
		uiservice.AddProxyWidgetToScene(this.proxy);
	}catch(e){
		ui.AddProxyWidgetToScene(this.proxy);
	}
	this.proxy.x = 50;
	this.proxy.y = 30;
	this.proxy.windowFlags = 0;
	this.proxy.visible = false;
	
	this.setScore = function(score){
		this.score = score;
		this.refresh();
	};
	this.refresh = function(){
		this.label.text = "bullets : "+(this.bullets?this.bullets:"out of ammo.")+"\nscore : "+this.score+
						((this.reload||!this.bullets)?"\nRELOAD":"");
	};
	this.reset = function(){
		this.score = 0;
		this.bullets = 3;
		this.reload = false;
   	    this.proxy.visible = true;
		this.refresh();
	};
}
	/* "MouseHoverIn" "MouseHoverOut" "MousePress" "MouseScroll" "MouseHover" */
