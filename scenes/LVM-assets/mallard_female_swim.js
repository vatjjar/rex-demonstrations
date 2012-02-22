// Animation controller

function MallardFemaleSwim(entity, comp)
{
         print("mallardfemaleswim");
    this.entity = entity;
    frame.DelayedExecute(10.0).Triggered.connect(this, "StartAnimation");
}

MallardFemaleSwim.prototype.StartAnimation = function() {
         print("mallardfemaleswimstartan");
    this.entity.Exec(7, "StopAllAnims", "0.5");
    this.entity.Exec(7, "PlayLoopedAnim", "Swim 1-19", "0.5");
}
