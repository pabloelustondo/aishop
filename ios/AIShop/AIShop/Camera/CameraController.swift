import AVFoundation
import Foundation

final class CameraController: NSObject, ObservableObject {
    let session = AVCaptureSession()
    let photoOutput = AVCapturePhotoOutput()
    let sessionQueue = DispatchQueue(label: "ai.shop.camera.session")
    @Published private(set) var authorization: CameraAuthorization = .unknown
    @Published private(set) var isCapturing = false
    var onPhoto: ((Result<Data, Error>) -> Void)?
    var isConfigured = false

    func start() {
        requestPermissionAndStart()
    }

    func stop() {
        sessionQueue.async { [weak self] in
            guard self?.session.isRunning == true else { return }
            self?.session.stopRunning()
        }
    }

    func capture() {
        guard authorization == .ready, isConfigured, !isCapturing else { return }
        isCapturing = true
        sessionQueue.async { [weak self] in
            guard let self else { return }
            let settings = AVCapturePhotoSettings(
                format: [AVVideoCodecKey: AVVideoCodecType.jpeg]
            )
            self.photoOutput.capturePhoto(with: settings, delegate: self)
        }
    }

    func publishAuthorization(_ value: CameraAuthorization) {
        DispatchQueue.main.async { self.authorization = value }
    }

    func finishCapture(_ result: Result<Data, Error>) {
        DispatchQueue.main.async {
            self.isCapturing = false
            self.onPhoto?(result)
        }
    }
}
