import SwiftUI

struct TopStatusView: View {
    let mode: ScanMode
    let phase: AnalysisPhase
    let onBack: () -> Void

    private var content: (badge: String, title: String, detail: String, color: Color) {
        switch phase {
        case .idle:
            return mode == .targetProduct
                ? ("ONE PRIMARY PRODUCT", "Aim at one item", "The crosshair selects it; the full frame provides context.", ShopStyle.green)
                : ("MULTIPLE PRODUCTS", "Fit the whole area", "Include all visible products and labels in the frame.", ShopStyle.green)
        case .analyzing:
            return ("ANALYZING", mode == .targetProduct ? "Looking at the product…" : "Looking across the area…", "This usually takes only a moment.", .orange)
        case .reportReady:
            return ("ANALYZED", "Report ready", "Opening the complete report…", ShopStyle.green)
        case .failure(let message):
            return ("TRY AGAIN", "Analysis unavailable", message, ShopStyle.error)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Button(action: onBack) {
                    Label("Modes", systemImage: "chevron.left")
                        .labelStyle(.titleAndIcon)
                }
                .font(.subheadline.bold())
                .foregroundStyle(ShopStyle.green)
                .accessibilityIdentifier("back-to-scan-modes")
                Spacer()
                Text(mode.title).font(.headline)
                Spacer()
                Color.clear.frame(width: 58, height: 1)
            }
            HStack(alignment: .top, spacing: 12) {
                Text(content.badge)
                    .font(.caption.bold())
                    .foregroundStyle(.black)
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .background(content.color, in: RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 3) {
                    Text(content.title).font(.headline)
                    Text(content.detail)
                        .font(.subheadline).foregroundStyle(.secondary)
                        .lineLimit(3)
                }
            }
        }
        .padding(.horizontal, 22).padding(.top, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.black)
    }
}
