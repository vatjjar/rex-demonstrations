//!ref: local://wt_deer.mesh
//!ref: local://wt_deer.skeleton

/*
action = { time: 8, name: "WalkForward", type: "Walk_1-38", maxTime: 38, minTime: 1, loop: true };
action = { time: 8, name: "WalkForward", type: "Run-1-15", maxTime: 8, minTime: 1, loop: true };
action = { time: 8, name: "Stand", type: "Stand_1-260", maxTime: 15, minTime: 1, loop: true };
*/

function startanim() {
    return me.animationcontroller.EnableAnimation("Stand_1-260", true);
}

function update(dt) {
    if(startanim()) {
        print("simpledeer.js: succeeded in startanim()");
        frame.Updated.disconnect(update);
        return;
    }
    print("X");
}

if (!startanim()) {
    print("simpledeer.js failed to start anim at start, trying again later..");
    frame.Updated.connect(update);
}
