// Animation controller

function StartAnimation() {
    me.Exec(7, "StopAllAnims", "0.5");
    me.Exec(7, "PlayLoopedAnim", "Swim 1-19", "0.5");
}

frame.DelayedExecute(1.0).Triggered.connect(StartAnimation);