import SwiftUI
import UIKit

struct CameraUnavailableView: View {
    let authorization: CameraAuthorization

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "camera.fill").font(.largeTitle)
            Text(title).font(.headline)
            Text(detail)
                .font(.subheadline).multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            if authorization == .denied {
                Button("Open Settings") {
                    guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
                    UIApplication.shared.open(url)
                }
                .buttonStyle(.borderedProminent).tint(ShopStyle.green)
            }
        }
        .padding(28)
    }

    private var title: String {
        switch authorization {
        case .denied: return "Camera access is off"
        case .unavailable: return "Camera unavailable"
        default: return "Preparing camera…"
        }
    }

    private var detail: String {
        switch authorization {
        case .denied:
            return "Allow camera access in Settings to analyze a product."
        case .unavailable:
            return "AI Shop could not find or prepare a rear camera on this device."
        default:
            return "AI Shop needs the rear camera to capture a product."
        }
    }
}
