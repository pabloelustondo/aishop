import SwiftUI

struct ScanModeSelectionScreen: View {
    let selectMode: (ScanMode) -> Void
    @EnvironmentObject private var session: AuthSession

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("AI SHOP").font(.headline).tracking(2)
                Spacer()
                Button("Sign out") { session.signOut() }
                    .font(.caption).foregroundStyle(ShopStyle.green)
                    .accessibilityIdentifier("sign-out")
            }
            .padding(.bottom, 28)

            Text("Choose a scan").font(.largeTitle.bold())
            Text("How do you want AI Shop to look at the scene?")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 6)
                .padding(.bottom, 24)

            ScanModeButton(mode: .targetProduct, icon: "scope",
                detail: "Aim at one product while keeping its surrounding context.",
                selectMode: selectMode)
            ScanModeButton(mode: .areaScan, icon: "square.grid.2x2",
                detail: "Look across a shelf or display and identify many products.",
                selectMode: selectMode)

            VStack(spacing: 6) {
                Text("One clear purpose per camera page")
                Text(AppVersion.current)
                    .accessibilityIdentifier("app-version")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity)
            .fixedSize(horizontal: false, vertical: true)
            .layoutPriority(1)
            .padding(.top, 18)
            Spacer()
        }
        .padding(.horizontal, 24)
        .padding(.top, 22)
        .background(Color.black.ignoresSafeArea())
    }
}
