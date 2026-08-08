import SwiftUI

struct TargetProductReportScreen: View {
    let report: TargetProductReport
    let scanAgain: () -> Void
    let backToModes: () -> Void

    var body: some View {
        GeometryReader { proxy in
            VStack(spacing: 0) {
                ReportHeader(backTitle: "Target", title: "Product Report", back: scanAgain)
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        ReportStatus()
                        VStack(alignment: .leading, spacing: 7) {
                            Text(report.productName).font(.largeTitle.bold())
                            Text(report.summary).font(.subheadline).foregroundStyle(.secondary)
                        }
                        conclusionCard
                        reportSection("What AI Shop observed") {
                            ReportBulletList(items: report.visibleEvidence)
                        }
                        reportSection("Missing information") {
                            if report.missingInformation.isEmpty {
                                Text("No missing information identified.")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            } else {
                                ReportBulletList(items: report.missingInformation)
                            }
                        }
                    }
                    .frame(width: max(proxy.size.width - 36, 0), alignment: .leading)
                    .padding(.vertical, 18)
                }
                ReportActions(
                    primaryTitle: "Analyze another product",
                    scanAgain: scanAgain,
                    backToModes: backToModes
                )
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
            .background(Color.black)
        }
        .background(Color.black.ignoresSafeArea())
    }

    private var conclusionCard: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: report.conclusion.symbol)
                .font(.headline.bold())
                .foregroundStyle(.black)
                .frame(width: 30, height: 30)
                .background(report.conclusion.color, in: Circle())
            VStack(alignment: .leading, spacing: 5) {
                Text("BUY DECISION").font(.caption2.bold()).foregroundStyle(report.conclusion.color)
                Text(report.conclusion.title).font(.headline)
                Text(report.conclusionReason).font(.subheadline).foregroundStyle(.secondary)
                Text("\(report.confidence.displayName) confidence")
                    .font(.caption.bold()).foregroundStyle(report.confidence.color)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(report.conclusion.color.opacity(0.10), in: RoundedRectangle(cornerRadius: 16))
        .overlay { RoundedRectangle(cornerRadius: 16).stroke(report.conclusion.color.opacity(0.28)) }
    }

    private func reportSection<Content: View>(
        _ title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.headline)
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ShopStyle.panel, in: RoundedRectangle(cornerRadius: 16))
    }
}
