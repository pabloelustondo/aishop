import SwiftUI

struct AreaScanReportScreen: View {
    let report: AreaScanReport
    let scanAgain: () -> Void
    let backToModes: () -> Void

    var body: some View {
        GeometryReader { proxy in
            VStack(spacing: 0) {
                ReportHeader(backTitle: "Area", title: "Area Report", back: scanAgain)
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        ReportStatus()
                        VStack(alignment: .leading, spacing: 7) {
                            Text(productCountTitle)
                                .font(.largeTitle.bold())
                                .lineLimit(1)
                                .minimumScaleFactor(0.75)
                            Text(report.summary).font(.subheadline).foregroundStyle(.secondary)
                        }
                        countBadges
                        identifiedProducts
                        if !report.uncertainItems.isEmpty { uncertainItems }
                    }
                    .frame(width: max(proxy.size.width - 36, 0), alignment: .leading)
                    .padding(.vertical, 18)
                }
                ReportActions(
                    primaryTitle: "Scan another area",
                    scanAgain: scanAgain,
                    backToModes: backToModes
                )
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
            .background(Color.black)
        }
        .background(Color.black.ignoresSafeArea())
    }

    private var productCountTitle: String {
        let count = report.identifiedProducts.count
        return "\(count) product\(count == 1 ? "" : "s") found"
    }

    private var countBadges: some View {
        HStack {
            badge("\(report.identifiedProducts.count) identified", color: ShopStyle.green)
            badge("\(report.uncertainItems.count) uncertain", color: .yellow)
        }
    }

    private var identifiedProducts: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Identified products").font(.headline).padding(.bottom, 8)
            ForEach(report.identifiedProducts.indices, id: \.self) { index in
                productRow(index: index, product: report.identifiedProducts[index])
                if index < report.identifiedProducts.count - 1 { Divider() }
            }
        }
        .padding(16)
        .background(ShopStyle.panel, in: RoundedRectangle(cornerRadius: 16))
    }

    private var uncertainItems: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Needs another look").font(.headline)
            ForEach(report.uncertainItems.indices, id: \.self) { index in
                let item = report.uncertainItems[index]
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.description).font(.subheadline.bold())
                    Text(item.reason).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.yellow.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
    }

    private func productRow(index: Int, product: IdentifiedProduct) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(index + 1)").font(.caption.bold())
                .frame(width: 24, height: 24)
                .overlay { RoundedRectangle(cornerRadius: 6).stroke(ShopStyle.border) }
            VStack(alignment: .leading, spacing: 5) {
                Text(product.name).font(.subheadline.bold())
                Text(product.visibleEvidence.joined(separator: " · "))
                    .font(.caption).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
            Text(product.confidence.displayName)
                .font(.caption2.bold()).foregroundStyle(product.confidence.color)
        }
        .padding(.vertical, 10)
    }

    private func badge(_ text: String, color: Color) -> some View {
        Text(text).font(.caption.bold()).foregroundStyle(color)
            .padding(.horizontal, 10).padding(.vertical, 7)
            .background(color.opacity(0.09), in: Capsule())
            .overlay { Capsule().stroke(color.opacity(0.30)) }
    }
}
