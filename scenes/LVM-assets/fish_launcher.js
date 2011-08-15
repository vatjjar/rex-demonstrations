/// This is a script which is set to some visible entity. If this is clicked by user it launch the anchovy game

// !ref: local://osprey_controls.ui
// !ref: local://quit_ON.png
// !ref: local://quit_OFF.png

engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");

var widget_ = null;
var sizeX_ = 200;
var sizeY_ = 200;
var launchSizeX_;
var launchSizeY_;

/*function showui() {
    var file = "local://osprey_game_launch.ui";

    if (widgetLaunch_ == null) {
        widgetLaunch_ = uiservice.LoadFromFile(file, false);

        if (widgetLaunch_ == null) {
            print("FishLauncher: LoadFromFile ui-file:" + file + " failed.");
            return;
        }

        // Orginal size.
        launchSizeX_ = widgetLaunch_.width;
        launchSizeY_ = widgetLaunch_.height;

        var butStart = findChild(widgetLaunch_, "Start");
        var butExit = findChild(widgetLaunch_, "Exit");
     
        if (butStart == null || butExit == null) {
            print("FishLauncher: Did not find exit and start buttons from ui-file.");
            return;
        }

        butStart.clicked.connect(ShowControls);
        butExit.clicked.connect(Exit);

        var proxy = uiservice.AddWidgetToScene(widgetLaunch_);

        // No window borders.
        proxy.windowFlags = 0;

        var gscene = ui.GraphicsScene();
        gscene.sceneRectChanged.connect(OnWindowSizeChanged);

        widgetLaunch_.move(gscene.width() / 2.0 - launchSizeX_ / 2.0, gscene.height() / 2.0 - launchSizeY_ / 2.0);

        proxy.ToggleVisibility();
    }
    else {
        var gscene = ui.GraphicsScene();
        widgetLaunch_.move(gscene.width() / 2.0 - launchSizeX_ / 2.0, gscene.height() / 2.0 - launchSizeY_ / 2.0);
        widgetLaunch_.show();
    }
}*/

function LaunchGame() {
    //showui();

    // Hide main right panel
    var e = scene.GetEntityByNameRaw("MainHud");
    e.Exec(1, "HideMainUI");    

    e = scene.GetEntityByNameRaw("FishGame");
    e.Exec(2, "LaunchGame");
}

function OnWindowSizeChanged() {
    // Reposition the widget
    if (widget_ != null) {
        var gscene = ui.GraphicsScene();
        widget_.move(gscene.width() / 2.0 - sizeX_ / 2.0, gscene.height() / 2.0 - sizeY_ / 2.0);
    }

}

function Closed() {
    widget_.hide();  
    LaunchGame();
}

me.Action("MousePress").Triggered.connect(LaunchGame);