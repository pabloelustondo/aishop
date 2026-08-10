import SwiftUI
import UIKit

extension AuthScreen {
    var footer: some View {
        VStack(spacing: 8) {
            Button(mode == .signIn ? "Create an account" : "Have an account? Sign in") {
                mode = mode == .signIn ? .signUp : .signIn
            }
            if mode == .signIn {
                Button("Forgot password?") { Task { await session.resetPassword(email: email) } }
                    .disabled(email.isEmpty)
            }
        }
        .font(.footnote).buttonStyle(.plain).foregroundStyle(ShopStyle.green)
    }

    func submit() async {
        if mode == .signIn { await session.signIn(email: email, password: password) }
        else { await session.signUp(email: email, password: password) }
    }

    func signInWithGoogle() async {
        guard let root = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene }).first?.windows.first?.rootViewController
        else { return }
        await session.signInWithGoogle(presenting: root)
    }
}
