import SwiftUI

struct TargetReticle: View {
    var body: some View {
        ZStack {
            Rectangle().fill(ShopStyle.green).frame(width: 110, height: 3)
            Rectangle().fill(ShopStyle.green).frame(width: 3, height: 110)
            Circle().stroke(ShopStyle.green, lineWidth: 3).frame(width: 18, height: 18)
            Circle().fill(ShopStyle.green).frame(width: 5, height: 5)
        }
            .accessibilityHidden(true)
    }
}

struct AreaGuide: View {
    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            let length: CGFloat = 42
            Path { path in
                path.move(to: CGPoint(x: 0, y: length)); path.addLine(to: .zero); path.addLine(to: CGPoint(x: length, y: 0))
                path.move(to: CGPoint(x: width - length, y: 0)); path.addLine(to: CGPoint(x: width, y: 0)); path.addLine(to: CGPoint(x: width, y: length))
                path.move(to: CGPoint(x: width, y: height - length)); path.addLine(to: CGPoint(x: width, y: height)); path.addLine(to: CGPoint(x: width - length, y: height))
                path.move(to: CGPoint(x: length, y: height)); path.addLine(to: CGPoint(x: 0, y: height)); path.addLine(to: CGPoint(x: 0, y: height - length))
            }
            .stroke(ShopStyle.green, style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
        }
        .accessibilityHidden(true)
    }
}
