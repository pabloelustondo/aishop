import AVFoundation

extension CameraController: AVCapturePhotoCaptureDelegate {
    func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        let result: Result<Data, Error>
        if let error {
            result = .failure(error)
        } else if
            let original = photo.fileDataRepresentation(),
            let jpeg = ImageProcessor.uploadJPEG(from: original)
        {
            result = .success(jpeg)
        } else {
            result = .failure(CameraError.capture)
        }
        finishCapture(result)
    }
}
