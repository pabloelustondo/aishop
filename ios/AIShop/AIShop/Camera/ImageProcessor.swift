import UIKit

enum ImageProcessor {
    static func uploadJPEG(from data: Data, maxDimension: CGFloat = 1_600) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        let longest = max(image.size.width, image.size.height)
        guard longest > maxDimension else {
            return image.jpegData(compressionQuality: 0.72)
        }

        let scale = maxDimension / longest
        let size = CGSize(
            width: image.size.width * scale,
            height: image.size.height * scale
        )
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
        return resized.jpegData(compressionQuality: 0.72)
    }
}
