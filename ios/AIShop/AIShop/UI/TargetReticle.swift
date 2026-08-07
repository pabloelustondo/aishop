import SwiftUI

struct TargetReticle: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 12)
            .stroke(ShopStyle.green, lineWidth: 2)
            .frame(width: 150, height: 150)
            .accessibilityHidden(true)
    }
}
