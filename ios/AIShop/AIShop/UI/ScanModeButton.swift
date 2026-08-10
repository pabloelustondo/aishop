import SwiftUI

struct ScanModeButton: View {
    let mode: ScanMode
    let icon: String
    let detail: String
    let selectMode: (ScanMode) -> Void

    var body: some View {
        Button { selectMode(mode) } label: {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title3.bold())
                    .foregroundStyle(ShopStyle.green)
                    .frame(width: 38, height: 38)
                    .background(ShopStyle.panel, in: RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 5) {
                    Text(mode.title)
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                    Text(detail).font(.subheadline).foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.headline.bold()).foregroundStyle(ShopStyle.green)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(ShopStyle.card, in: RoundedRectangle(cornerRadius: 20))
            .overlay {
                RoundedRectangle(cornerRadius: 20).stroke(ShopStyle.border, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
        .padding(.bottom, 14)
        .accessibilityIdentifier(mode == .targetProduct
            ? "scan-mode-target-product"
            : "scan-mode-area-scan")
    }
}
