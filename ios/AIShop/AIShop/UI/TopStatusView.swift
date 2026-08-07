import SwiftUI

struct TopStatusView: View {
    let phase: AnalysisPhase

    private var content: (badge: String, title: String, detail: String, color: Color) {
        switch phase {
        case .idle:
            return ("READY", "Point at a product", "Take a photo for a short analysis.", ShopStyle.green)
        case .analyzing:
            return ("ANALYZING", "Looking at the product…", "This usually takes only a moment.", .orange)
        case .result(let message):
            return ("ANALYZED", "Product analysis", message, ShopStyle.green)
        case .failure(let message):
            return ("TRY AGAIN", "Analysis unavailable", message, ShopStyle.error)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("AI SHOP").font(.headline).tracking(2)
                Spacer()
                Text("Camera assistant").font(.caption).foregroundStyle(.secondary)
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
