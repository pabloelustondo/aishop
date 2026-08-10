import SwiftUI

struct AuthScreen: View {
    @ObservedObject var session: AuthSession
    @State var mode: Mode = .signIn
    @State var email = ""
    @State var password = ""

    enum Mode { case signIn, signUp }

    var body: some View {
        VStack(spacing: 16) {
            Text("AI SHOP").font(.headline).tracking(2).foregroundStyle(.secondary)
            Text(mode == .signIn ? "Sign in" : "Create your account").font(.largeTitle.bold())
            TextField("Email", text: $email)
                .textContentType(.emailAddress).keyboardType(.emailAddress)
                .autocapitalization(.none).textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("auth-email")
            SecureField("Password", text: $password)
                .textContentType(mode == .signIn ? .password : .newPassword)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("auth-password")
            if let message = session.errorMessage {
                Text(message).font(.footnote).foregroundStyle(ShopStyle.error)
            }
            primaryButton
            Button("Continue with Google") { Task { await signInWithGoogle() } }
                .buttonStyle(.bordered)
                .disabled(session.phase == .authenticating)
            footer
        }
        .padding(28)
        .background(Color.black.ignoresSafeArea())
    }

    private var primaryButton: some View {
        Button(mode == .signIn ? "Sign In" : "Create Account") { Task { await submit() } }
            .buttonStyle(.borderedProminent).tint(ShopStyle.green)
            .disabled(session.phase == .authenticating || email.isEmpty || password.isEmpty)
            .accessibilityIdentifier("auth-submit")
    }
}
