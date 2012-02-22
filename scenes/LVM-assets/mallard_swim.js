// Animation controller

function MallardSwim(entity, comp)
{
         print("mallardswim");
    this.entity = entity;
    frame.DelayedExecute(10.0).Triggered.connect(this, "StartAnimation");
}

MallardSwim.prototype.StartAnimation = function() {
         print("mallardswim");
    this.entity.Exec(7, "StopAllAnims", "0.5");
    this.entity.Exec(7, "PlayLoopedAnim", "Swim", "0.5");
}
