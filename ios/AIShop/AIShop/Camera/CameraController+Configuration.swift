import AVFoundation

extension CameraController {
    func requestPermissionAndStart() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            configureAndRun()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted { self?.configureAndRun() }
                else { self?.publishAuthorization(.denied) }
            }
        case .denied, .restricted:
            publishAuthorization(.denied)
        @unknown default:
            publishAuthorization(.unavailable)
        }
    }

    func configureAndRun() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            if !self.isConfigured {
                guard self.configureSession() else {
                    self.publishAuthorization(.unavailable)
                    return
                }
            }
            if !self.session.isRunning { self.session.startRunning() }
            self.publishAuthorization(.ready)
        }
    }

    private func configureSession() -> Bool {
        session.beginConfiguration()
        defer { session.commitConfiguration() }
        session.sessionPreset = .photo
        guard
            let device = AVCaptureDevice.default(
                .builtInWideAngleCamera, for: .video, position: .back
            ),
            let input = try? AVCaptureDeviceInput(device: device),
            session.canAddInput(input), session.canAddOutput(photoOutput)
        else { return false }
        session.addInput(input)
        session.addOutput(photoOutput)
        isConfigured = true
        return true
    }
}
