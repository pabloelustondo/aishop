import SwiftUI

extension CameraScreen {
    func prepareCamera() {
        camera.onPhoto = handlePhoto
        updateCamera(for: scenePhase)
    }

    func updateCamera(for phase: ScenePhase) {
        if phase == .active {
            camera.start()
        } else {
            camera.stop()
        }
    }
}
