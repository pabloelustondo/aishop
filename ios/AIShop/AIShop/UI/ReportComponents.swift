import SwiftUI

struct ReportHeader: View {
    let backTitle: String
    let title: String
    let back: () -> Void

    var body: some View {
        HStack {
            Button(action: back) {
                Label(backTitle, systemImage: "chevron.left")
            }
            .font(.subheadline.bold())
            .foregroundStyle(ShopStyle.green)
            Spacer()
            Text(title).font(.headline)
            Spacer()
            Color.clear.frame(width: 66, height: 1)
        }
        .padding(.horizontal, 18)
        .frame(height: 58)
        .background(Color.black)
    }
}

struct ReportActions: View {
    let primaryTitle: String
    let scanAgain: () -> Void
    let backToModes: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            Button(primaryTitle, action: scanAgain)
                .font(.headline)
                .foregroundStyle(.black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(ShopStyle.green, in: RoundedRectangle(cornerRadius: 14))
            Button("Back to modes", action: backToModes)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 18)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(Color.black)
    }
}

struct ReportStatus: View {
    var body: some View {
        Label("ANALYSIS COMPLETE", systemImage: "circle.fill")
            .font(.caption2.bold())
            .tracking(1.2)
            .foregroundStyle(ShopStyle.green)
    }
}

struct ReportBulletList: View {
    let items: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(items.indices, id: \.self) { index in
                HStack(alignment: .top, spacing: 9) {
                    Circle().fill(ShopStyle.green).frame(width: 5, height: 5).padding(.top, 7)
                    Text(items[index]).font(.subheadline).foregroundStyle(.secondary)
                }
            }
        }
    }
}

extension AnalysisConfidence {
    var displayName: String { rawValue.capitalized }

    var color: Color {
        switch self {
        case .high: ShopStyle.green
        case .medium: .yellow
        case .low: .orange
        }
    }
}

extension BuyingConclusion {
    var title: String {
        switch self {
        case .goodBuy: "Good buy"
        case .badBuy: "Bad buy"
        case .insufficientEvidence: "Need more evidence"
        }
    }

    var color: Color {
        switch self {
        case .goodBuy: ShopStyle.green
        case .badBuy: ShopStyle.error
        case .insufficientEvidence: .yellow
        }
    }

    var symbol: String {
        switch self {
        case .goodBuy: "checkmark"
        case .badBuy: "xmark"
        case .insufficientEvidence: "exclamationmark"
        }
    }
}
