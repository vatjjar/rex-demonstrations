print(" --- Loading YTools");
//-------------------------------------------- Tools ------------------------------------------
/* clone class structure like 'extends' c++ keyword
!!! use at class construct begining !!!
ex : 
function father(args){ ................................}
function son(args){
	xtends( this , new father(args) );
	........
}
*/
function xtends(target,source){
	for(var pt in source){
		if(source[pt]!=null){
			if(source[pt].join){
				target[pt]=[];	xtends(target[pt],source[pt]);
			}else if(typeof(source[pt])=="object" && !source.name){
				target[pt]={};	xtends(target[pt],source[pt]);}
			else if(typeof(source[pt])=="number")target[pt]=0+source[pt];
			else if(typeof(source[pt])=="string")target[pt]=""+source[pt];
			else target[pt]=source[pt];
		}
	}
};
// creates automaticly a free var name
function createClassVarName(prefix){
	var n = 0;var current = true;var vnam = "";
	//while(typeof(current)!="undefined"){
	while(current){
		var nstr = "000000000"+(n++);
		nstr = nstr.substring(nstr.length-9);
		vnam = prefix+"_"+nstr;
//		print("try varname "+vnam);
		try{	eval("current = "+vnam+";");	}catch(e){current=false;};
	}return vnam;
}
/*------------------ Object explorer
helps exploring native naali objects potential
	obj (mixed): object to explore
	depth (int): default==1. structure exploration depth. value < 1 is considered as infinite.
*/
function printObj(obj,objName,depth){
	var _depth = typeof(depth)=="number" ? depth : 1;
	var _name = typeof(objName)=="string" ? objName : "parsedObject";
	if(_depth<1) _depth = -2;
	
	var iter = function(obj,name,dpth,level){
		var prefix = "\n"; for(var i=0;i<level;i++)prefix+= "__";prefix+= " ";
		var pst = "";
		if( (dpth<0 || dpth>level) && (obj.join || typeof(obj)=="object")){
			for(var i in  obj) pst+=iter(obj[i],i,dpth,level+1);
			pst = "{"+pst+"\n}";
		}else{
			pst+= typeof(obj)=="string" ? "\""+obj+"\"" : obj;
		}
		return prefix+name+" = "+pst;
	}
	print(iter(obj,_name,_depth,0));
}/* */

/* ------------------------------------------ bounds
Handle mesh bounds.
 	mesh (string/object) : entity or entity name.
*/
function MeshBounds(mesh){
	this.mesh = typeof(mesh)=="string" ? scene.GetEntityByNameRaw(mesh) : mesh;
	// ---------- returns float[3] current position.
	this.getPos = function(){
		var tr = this.mesh.placeable.transform;
		return [tr.pos.x,tr.pos.y,tr.pos.z];
	};
	// ---------- sets current position.
	// f3d (float[3]) : position to set
	this.setPos = function(f3d){
		var tr = this.mesh.placeable.transform;
		tr.pos.x=f3d[0];tr.pos.y=f3d[1];tr.pos.z=f3d[2];
		this.mesh.placeable.transform = tr;
	};
	// ---------- position increment.
	// f3d (float[3]) : position to increment
	this.incrPos = function(f3d){
		var tr = this.mesh.placeable.transform;
		tr.pos.x+=f3d[0];tr.pos.y+=f3d[1];tr.pos.z+=f3d[2];
		this.mesh.placeable.transform = tr;
	};
	// ---------- return float[3] position vector from this to other meshbounds.
	this.posTo = function(meshbounds){
		return YTr.vDiff(this.getPos(),meshbounds.getPos());
	};
	
	// ---------- returns float[3] current rotation.
	this.getRot = function(){
		var tr = this.mesh.placeable.transform;
		return [tr.rot.x,tr.rot.y,tr.rot.z];
	};
	// ---------- sets current rotation.
	// f3d (float[3]) : rotation to set.
	this.setRot = function(f3d){
		var tr = this.mesh.placeable.transform;
		tr.rot.x=f3d[0];tr.rot.y=f3d[1];tr.rot.z=f3d[2];
		this.mesh.placeable.transform = tr;
	};
	// ---------- rotation increment.
	// f3d (float[3]) : rotation to increment
	this.incrRot = function(f3d){
		var tr = this.mesh.placeable.transform;
		tr.rot.x+=f3d[0];tr.rot.y+=f3d[1];tr.rot.z+=f3d[2];
		this.mesh.placeable.transform = tr;
	};
	// ---------- return float[3] rotation vector from this to other meshbounds.
	this.rotTo = function(meshbounds){
		return YTr.vDiff(this.getRot(),meshbounds.getRot());
	};
	// reset mesh to default bounds
	this.reset = function(){
		this.setPos(this.r_pos);
		this.setRot(this.r_rot);
	};
	// set default mesh bounds
	this.r_pos = this.getPos();
	this.r_rot = this.getRot();
}

var YTr = {
	//create empty tranformation matrix
	empty : function(){return [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];},
	//create identity tranformation matrix
	identity : function(){return [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];},
	// convert float or float[3] value(s) from 180° to PI base.
	deg2rad : function(value){
		return typeof(value)=="number" ? value*Math.PI/180 :
			 [YTr.deg2rad(value[0]) , YTr.deg2rad(value[1]) , YTr.deg2rad(value[2])];
	},
	// convert float or float[3] value(s) from PI to 180° base.
	rad2deg : function(value){
		return typeof(value)=="number" ? value*180/Math.PI :
			 [YTr.rad2deg(value[0]) , YTr.rad2deg(value[1]) , YTr.rad2deg(value[2])];
	},
	// return float[3] vectors addition : f3d_1 + f3d_2.
	vAdd : function(f3d_1,f3d_2){
		var result = [];
		for(var i=0;i<Math.min(f3d_1.length,f3d_2.length);i++)result[i]=f3d_2[i] + f3d_1[i]
		return result;
	},
	// return float[3] vectors difference : f3d_2 - f3d_1.
	vDiff : function(f3d_1,f3d_2){
		var result = [];
		for(var i=0;i<Math.min(f3d_1.length,f3d_2.length);i++)result[i] = f3d_2[i] - f3d_1[i]
		return result;
	},
	// return multiplyed float[3] vector.
	// factor(float / float[3]) multiplyer
	vMult : function(f3d,factor){
		if(typeof(factor)=="number")return YTr.vMult(f3d,[factor,factor,factor]);
		var result = [];
		for(var i=0;i<Math.min(f3d_1.length,f3d_2.length);i++)result[i]=	f3d[i] * factor[i]
		return result;
	},
	// return float[3] vector distance.
	vLen : function(f3d){
		return Math.pow(f3d[0]*f3d[0] + f3d[1]*f3d[1] + f3d[2]*f3d[2] , 0.5 );
	},
	// ------- formats conversions : Vector3df <=> float[3]
	toVector3df : function(f3d){
		var v = new Vector3df();
		v.x = f3d[0];v.y = f3d[1];v.z = f3d[2];
		return v;
	},
	fromVector3df : function(v){		return [v.x,v.y,v.z];	},
	// ----------- create rotation Matrix3d for 'index' axis
	rotatorI : function(angle,index){
		var m = new Matrix3d();
		for(var i=0;i<3;i++){
			for(var j=0;j<3;j++){
				if(i!=index && j!=index){
					if(i==j){
						m.matrix[i][j] = Math.cos(angle);
					}else if( (i==2 && j==1) || (i==0 && j==2) || (i==1 && j==0) ){
						m.matrix[i][j] = - Math.sin(angle);
					}else{
						m.matrix[i][j] = Math.sin(angle);
					}
				}
			}
		}
		return m;
	},
	// ----------- create rotation Matrix3d for X axis
	rotatorX : function(angle){		return YTr.rotatorI(angle,0);	},
	// ----------- create rotation Matrix3d for Y axis
	rotatorY : function(angle){		return YTr.rotatorI(angle,1);	},
	// ----------- create rotation Matrix3d for Z axis
	rotatorZ : function(angle){		return YTr.rotatorI(angle,2);	}
	
	/*rotatorXYZ : function(angleX,angleY,angleZ){
		if(typeof(angleX)!="number") return YTr.rotatorXYZ(angleX[0],angleX[1],angleX[2]);
		return YTr.rotatorX(angleX).combinaison(YTr.rotatorY(angleY).combinaison(YTr.rotatorZ(angleZ)));
	}*/
};
/* tranformation matrix model 
	matrix (float[4][4] / null) : default transformation matrix.
		default is identity if matrix is null.
*/
function Matrix3d(matrix){
	this.matrix = matrix ? matrix : YTr.identity();
	// create conbinaison of this and an other matrix. (this*other).
	this.combinaison = function(matrix3d){
		var result = YTr.empty();
		for(var i=0;i<4;i++)	for(var j=0;j<4;j++)
				for(var k=0;k<4;k++)	result[i][j]+= this.matrix[k][j] * matrix3d.matrix[i][k];
		return new Matrix3d(result);
	};
	// combine this with an other matrix
	this.combineWith = function(matrix3d){
		var result = this.combinaison(matrix3d);
		for(var i=0;i<4;i++)	for(var j=0;j<4;j++)	this.matrix[k][j] = result.matrix[i][j];
	};
	// return tranformation of a f3d (float[3] or float[4]) vector, 
	this.transform = function(f3d){
		var result = []; for(var i=0;i<f3d.length;i++)result[i]=0;
		for(var i=0;i<f3d.length;i++)	for(var j=0;j<f3d.length;j++)	result[j]+= f3d[i] * this.matrix[i][j];
		return result;
	};
	
}
/*	--------------------------------------------------
	------------------------------------------ buttons 
	--------------------------------------------------
	this section main purpose is trying to catch the 'MouseRelease'	event. */
var Buttons = {
	buttons : [],
	auto_add : function(ybutton){// do not use : called by YButton on construct 
		var varname = "Buttons.buttons["+Buttons.buttons.length+"]";
		Buttons.buttons.push(ybutton);
		return varname;
	},
	init : function(){
		var iContext = input.RegisterInputContext("kanon-game", 100).get();
		var commands = ["MouseLeftPressed","MouseLeftReleased"];
		for(var i in commands)
			eval("iContext."+commands[i]+".connect(function(evt){ Buttons.reactor(evt,\""+commands[i]+"\");})");
		//printObj(mic,"context");
	},
	reactor : function(evt,command){
		var raycastResult = renderer.RayCast(evt.x, evt.y);
		print(" - Buttons reactor : "+raycastResult.entity);
		if(raycastResult.entity==null)return null;
		for(var i in Buttons.buttons){
			if(raycastResult.entity.name == Buttons.buttons[i].mesh.name){
				Buttons.buttons[i].private_mouse_reactor(evt,command);
			}
		}
	}
}
Buttons.init();
function YButton(mesh){
	this.varname = Buttons.auto_add(this);
	this.mesh = typeof(mesh)=="string" ? scene.GetEntityByNameRaw(mesh) : mesh;
	this.isOver = false;
	this.isDown = false;
	this.private_mouse_reactor = function(evt,command){
		print(" - YButton command="+command);
		if( command == "MousePressed" ){
			this.isDown = true;
		}else if( command == "MouseReleased" ){
			this.isDown = false;
		}else if( command == "MouseHoverIn" ){
			this.isOver = true;
		}else if( command == "MouseHoverOut" ){
			this.isOver = false;
		}
	};
	//var commands = ["MouseHover","MouseHoverIn","MouseHoverOut"];
	var commands = ["MouseHoverIn","MouseHoverOut","MouseRelease","MousePress"];
	for(var i in commands)
		eval("this.mesh.Action(\""+commands[i]+"\").Triggered.connect(function(evt){"+this.varname+".private_mouse_reactor(evt,\""+commands[i]+"\");});");
}
/* "MouseHoverIn" "MouseHoverOut" "MousePress" "MouseScroll" "MouseHover" */